import { supabase } from '../../lib/supabase'
import { SLIDES, type SlideSpec } from './slides'

export interface ResolvedCharacter {
  id: string
  name: string
  imageUrl: string | null
  appearanceCount: number | null
  importanceTier: string | null
  occupation: string | null
}

export type ResolvedSlide =
  | {
      kind: 'cover'
      title: string
      subtitle: string
      kicker: string
    }
  | {
      kind: 'character'
      character: ResolvedCharacter
      headline: string
      pitch: string
    }
  | {
      kind: 'pair'
      characters: [ResolvedCharacter, ResolvedCharacter]
      groupName: string
      pitch: string
    }
  | {
      kind: 'group'
      characters: ResolvedCharacter[]
      groupName: string
      pitch: string
    }
  | {
      kind: 'honorable'
      characters: ResolvedCharacter[]
      title: string
      subtitle: string
    }
  | {
      kind: 'cta'
      kicker: string
      title: string
      url: string
    }

export interface WishlistSnapshot {
  slides: ResolvedSlide[]
  latestChapter: number | null
}

function characterImageUrl(id: string): string {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/character-images/${encodeURIComponent(id)}.png`
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
    if (s.kind === 'character') out.add(s.name)
    else if (s.kind === 'pair') s.names.forEach((n) => out.add(n))
    else if (s.kind === 'group') s.names.forEach((n) => out.add(n))
    else if (s.kind === 'honorable') s.names.forEach((n) => out.add(n))
  }
  return Array.from(out)
}

async function fetchByNames(
  names: string[]
): Promise<Map<string, ResolvedCharacter>> {
  if (names.length === 0) return new Map()
  const { data, error } = await supabase
    .from('character')
    .select('id, name, appearance_count, importance_tier, occupation')
    .in('name', names)
  if (error) throw error

  const byName = new Map<string, ResolvedCharacter>()
  for (const row of data ?? []) {
    byName.set(row.name as string, {
      id: String(row.id),
      name: (row.name as string) ?? 'Unknown',
      imageUrl: null,
      appearanceCount: (row.appearance_count as number | null) ?? null,
      importanceTier: (row.importance_tier as string | null) ?? null,
      occupation: (row.occupation as string | null) ?? null,
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

function placeholder(name: string): ResolvedCharacter {
  return {
    id: name,
    name,
    imageUrl: null,
    appearanceCount: null,
    importanceTier: null,
    occupation: null,
  }
}

function resolveOne(
  name: string,
  byName: Map<string, ResolvedCharacter>
): ResolvedCharacter {
  const hit = byName.get(name)
  if (hit) return hit
  console.warn(`[Top100Wishlist] no Supabase match for "${name}" — using placeholder`)
  return placeholder(name)
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

export async function loadWishlistSnapshot(): Promise<WishlistSnapshot> {
  const names = collectNames(SLIDES)
  const [byName, latestChapter] = await Promise.all([
    fetchByNames(names),
    fetchLatestChapter(),
  ])

  const slides: ResolvedSlide[] = SLIDES.map((s): ResolvedSlide => {
    switch (s.kind) {
      case 'cover':
        return { kind: 'cover', title: s.title, subtitle: s.subtitle, kicker: s.kicker }
      case 'cta':
        return { kind: 'cta', kicker: s.kicker, title: s.title, url: s.url }
      case 'character':
        return {
          kind: 'character',
          character: resolveOne(s.name, byName),
          headline: s.headline,
          pitch: s.pitch,
        }
      case 'pair':
        return {
          kind: 'pair',
          characters: [
            resolveOne(s.names[0], byName),
            resolveOne(s.names[1], byName),
          ],
          groupName: s.groupName,
          pitch: s.pitch,
        }
      case 'group':
        return {
          kind: 'group',
          characters: s.names.map((n) => resolveOne(n, byName)),
          groupName: s.groupName,
          pitch: s.pitch,
        }
      case 'honorable':
        return {
          kind: 'honorable',
          characters: s.names.map((n) => resolveOne(n, byName)),
          title: s.title,
          subtitle: s.subtitle,
        }
    }
  })

  return { slides, latestChapter }
}
