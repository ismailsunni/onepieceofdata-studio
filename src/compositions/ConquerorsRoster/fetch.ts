import { supabase } from '../../lib/supabase'
import { SLIDES, type SlideSpec } from './slides'

export interface ResolvedCharacter {
  id: string
  name: string
  epithet: string
  bounty: number | null
  imageUrl: string | null
  /** CSS object-position for the circular crop (defaults to 'top'). */
  crop?: string
}

export type ResolvedSlide =
  | {
      kind: 'cover'
      kicker: string
      title: string
      subtitle: string
      question: string
      note?: string
      hook?: string
    }
  | {
      kind: 'context'
      kicker: string
      title: string
      blurb: string
      stats: { value: string; label: string }[]
      highlight?: string
      footer?: string
    }
  | {
      kind: 'group'
      kicker: string
      title: string
      subtitle: string
      characters: ResolvedCharacter[]
    }
  | {
      kind: 'follow'
      kicker: string
      title: string
      subtitle: string
      handle: string
      teaserName?: string
      teaserCaption?: string
      teaserImageUrl?: string | null
    }

export interface ConquerorsRosterSnapshot {
  slides: ResolvedSlide[]
  latestChapter: number | null
}

function characterImageUrl(id: string): string {
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
    if (s.kind === 'group') s.members.forEach((m) => out.add(m.name))
    else if (s.kind === 'follow' && s.teaserName) out.add(s.teaserName)
  }
  return Array.from(out)
}

interface CharacterRow {
  id: string
  name: string
  bounty: number | null
  imageUrl: string | null
}

async function fetchByNames(
  names: string[]
): Promise<Map<string, CharacterRow>> {
  if (names.length === 0) return new Map()
  const { data, error } = await supabase
    .from('character')
    .select('id, name, bounty')
    .in('name', names)
  if (error) throw error

  const byName = new Map<string, CharacterRow>()
  for (const row of data ?? []) {
    byName.set(row.name as string, {
      id: String(row.id),
      name: row.name as string,
      bounty: (row.bounty as number | null) ?? null,
      imageUrl: null,
    })
  }

  await Promise.all(
    Array.from(byName.values()).map(async (c) => {
      const url = characterImageUrl(c.id)
      if (await imageExists(url)) c.imageUrl = url
    })
  )

  return byName
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

function resolveMember(
  name: string,
  epithet: string,
  byName: Map<string, CharacterRow>,
  crop?: string
): ResolvedCharacter {
  const hit = byName.get(name)
  if (!hit) {
    console.warn(
      `[ConquerorsRoster] no Supabase match for "${name}" — using placeholder`
    )
    return { id: name, name, epithet, bounty: null, imageUrl: null, crop }
  }
  return {
    id: hit.id,
    name: hit.name,
    epithet,
    bounty: hit.bounty,
    imageUrl: hit.imageUrl,
    crop,
  }
}

export async function loadConquerorsRosterSnapshot(): Promise<ConquerorsRosterSnapshot> {
  const names = collectNames(SLIDES)
  const [byName, latestChapter] = await Promise.all([
    fetchByNames(names),
    fetchLatestChapter(),
  ])

  const slides: ResolvedSlide[] = SLIDES.map((s): ResolvedSlide => {
    switch (s.kind) {
      case 'cover':
        return { ...s }
      case 'context':
        return { ...s }
      case 'follow':
        return {
          ...s,
          teaserImageUrl: s.teaserName
            ? (byName.get(s.teaserName)?.imageUrl ?? null)
            : null,
        }
      case 'group':
        return {
          kind: 'group',
          kicker: s.kicker,
          title: s.title,
          subtitle: s.subtitle,
          characters: s.members.map((m) =>
            resolveMember(m.name, m.epithet, byName, m.crop)
          ),
        }
    }
  })

  return { slides, latestChapter }
}
