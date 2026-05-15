import { supabase } from '../../lib/supabase'
import { SLIDES, type SlideSpec } from './slides'

export interface ResolvedCharacter {
  id: string
  name: string
  imageUrl: string | null
  firstChapter: number | null
  lastChapter: number | null
  lastChapterDate: string | null
  lastArcTitle: string | null
}

export type ResolvedSlide =
  | { kind: 'cover'; kicker: string; title: string; subtitle: string; question: string }
  | {
      kind: 'stat_split'
      kicker: string
      title: string
      buckets: { num: number; label: string; desc: string }[]
      footer?: string
      callout?: { num: number; label: string }
    }
  | {
      kind: 'group'
      kicker: string
      title: string
      subtitle: string
      characters: ResolvedCharacter[]
    }
  | {
      kind: 'silent_list'
      kicker: string
      title: string
      subtitle: string
      entries: { character: ResolvedCharacter; label: string }[]
      footer?: string
    }
  | {
      kind: 'thanks'
      kicker: string
      title: string
      subtitle: string
      handle: string
      stillWaiting: ResolvedCharacter[]
    }

export interface First100Snapshot {
  slides: ResolvedSlide[]
  latestChapter: number | null
}

function characterImageUrl(id: string): string {
  // Storage filenames are ASCII (e.g. "Bell-mere.png"), so strip diacritics
  // before encoding — otherwise "Bell-mère" → "Bell-m%C3%A8re.png" 404s.
  const ascii = id.normalize('NFD').replace(/\p{Diacritic}/gu, '')
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/character-images/${encodeURIComponent(ascii)}.png`
}

async function imageExists(url: string): Promise<boolean> {
  try {
    const res = await fetch(url, { method: 'HEAD' })
    return res.ok
  } catch {
    return false
  }
}

function collectNames(slides: SlideSpec[]): string[] {
  const out = new Set<string>()
  for (const s of slides) {
    if (s.kind === 'group') s.names.forEach((n) => out.add(n))
    else if (s.kind === 'silent_list') s.names.forEach((n) => out.add(n))
    else if (s.kind === 'thanks') s.stillWaiting.forEach((n) => out.add(n))
  }
  return Array.from(out)
}

async function fetchByNames(
  names: string[]
): Promise<Map<string, ResolvedCharacter>> {
  if (names.length === 0) return new Map()
  const { data, error } = await supabase
    .from('character')
    .select('id, name, first_appearance, last_appearance, arc_list')
    .in('name', names)
  if (error) throw error

  const lastArcIdByCharId = new Map<string, string>()
  const byName = new Map<string, ResolvedCharacter>()
  for (const row of data ?? []) {
    const arcs = (row.arc_list as string[] | null) ?? null
    const lastArcId = arcs && arcs.length > 0 ? arcs[arcs.length - 1] : null
    if (lastArcId) lastArcIdByCharId.set(String(row.id), lastArcId)
    byName.set(row.name as string, {
      id: String(row.id),
      name: row.name as string,
      imageUrl: null,
      firstChapter: (row.first_appearance as number | null) ?? null,
      lastChapter: (row.last_appearance as number | null) ?? null,
      lastChapterDate: null,
      lastArcTitle: null,
    })
  }

  const arcIds = Array.from(new Set(lastArcIdByCharId.values()))
  if (arcIds.length > 0) {
    const { data: arcs, error: arcErr } = await supabase
      .from('arc')
      .select('arc_id, title')
      .in('arc_id', arcIds)
    if (arcErr) throw arcErr
    const titleByArcId = new Map<string, string>()
    for (const a of arcs ?? []) {
      titleByArcId.set(a.arc_id as string, a.title as string)
    }
    for (const c of byName.values()) {
      const arcId = lastArcIdByCharId.get(c.id)
      if (arcId) c.lastArcTitle = titleByArcId.get(arcId) ?? null
    }
  }

  const chapterNumbers = Array.from(
    new Set(
      Array.from(byName.values())
        .map((c) => c.lastChapter)
        .filter((n): n is number => n != null)
    )
  )
  if (chapterNumbers.length > 0) {
    const { data: chapters, error: chErr } = await supabase
      .from('chapter')
      .select('number, date')
      .in('number', chapterNumbers)
    if (chErr) throw chErr
    const dateByNumber = new Map<number, string>()
    for (const ch of chapters ?? []) {
      if (ch.date) dateByNumber.set(ch.number as number, ch.date as string)
    }
    for (const c of byName.values()) {
      if (c.lastChapter != null) {
        c.lastChapterDate = dateByNumber.get(c.lastChapter) ?? null
      }
    }
  }

  return byName
}

async function resolveImages(
  byName: Map<string, ResolvedCharacter>
): Promise<void> {
  await Promise.all(
    Array.from(byName.values()).map(async (c) => {
      const url = characterImageUrl(c.id)
      if (await imageExists(url)) c.imageUrl = url
    })
  )
}

function placeholder(name: string): ResolvedCharacter {
  return {
    id: name,
    name,
    imageUrl: null,
    firstChapter: null,
    lastChapter: null,
    lastChapterDate: null,
    lastArcTitle: null,
  }
}

function resolveOne(
  name: string,
  byName: Map<string, ResolvedCharacter>
): ResolvedCharacter {
  const hit = byName.get(name)
  if (hit) return hit
  console.warn(
    `[First100Chapters] no Supabase match for "${name}" — using placeholder`
  )
  return placeholder(name)
}

const MONTHS_SHORT = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
]

function formatMonthYear(iso: string | null): string {
  if (!iso) return '????'
  const d = new Date(iso)
  return `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`
}

function silentLabel(c: ResolvedCharacter): string {
  // Used by the "Truly Gone" slide — name silently followed by month/year and arc.
  const date = formatMonthYear(c.lastChapterDate)
  const arc = c.lastArcTitle ?? null
  return arc ? `${date} · ${arc}` : date
}

async function fetchLatestChapter(): Promise<number | null> {
  const { data, error } = await supabase
    .from('chapter')
    .select('number')
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.number ?? null
}

export async function loadFirst100Snapshot(): Promise<First100Snapshot> {
  const names = collectNames(SLIDES)
  const [byName, latestChapter] = await Promise.all([
    fetchByNames(names),
    fetchLatestChapter(),
  ])
  await resolveImages(byName)

  const slides: ResolvedSlide[] = SLIDES.map((s): ResolvedSlide => {
    switch (s.kind) {
      case 'cover':
        return { ...s }
      case 'stat_split':
        return { ...s }
      case 'group':
        return {
          kind: 'group',
          kicker: s.kicker,
          title: s.title,
          subtitle: s.subtitle,
          characters: s.names.map((n) => resolveOne(n, byName)),
        }
      case 'silent_list':
        return {
          kind: 'silent_list',
          kicker: s.kicker,
          title: s.title,
          subtitle: s.subtitle,
          footer: s.footer,
          entries: s.names.map((n) => {
            const c = resolveOne(n, byName)
            return { character: c, label: silentLabel(c) }
          }),
        }
      case 'thanks':
        return {
          kind: 'thanks',
          kicker: s.kicker,
          title: s.title,
          subtitle: s.subtitle,
          handle: s.handle,
          stillWaiting: s.stillWaiting.map((n) => resolveOne(n, byName)),
        }
    }
  })

  return { slides, latestChapter }
}
