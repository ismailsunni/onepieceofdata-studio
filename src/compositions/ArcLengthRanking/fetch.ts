import { supabase } from '../../lib/supabase'

// Straw Hat crew — excluded so the per-arc headliner is an antagonist/ally
// rather than always being a crew member. Mirrors AppearanceRace.
const STRAW_HAT_IDS = new Set([
  'Monkey_D._Luffy',
  'Roronoa_Zoro',
  'Nami',
  'Usopp',
  'Sanji',
  'Tony_Tony_Chopper',
  'Nico_Robin',
  'Franky',
  'Brook',
  'Jinbe',
])

// Hand-picked headliners that override the "most appearances" pick — usually
// to surface the arc's antagonist rather than its most-present ally.
const HEADLINER_OVERRIDE: Record<string, { id: string; name: string }> = {
  Loguetown: { id: 'Smoker', name: 'Smoker' },
  'Drum Island': { id: 'Wapol', name: 'Wapol' },
  Arabasta: { id: 'Crocodile', name: 'Crocodile' },
  Jaya: { id: 'Bellamy', name: 'Bellamy' },
  Skypiea: { id: 'Enel', name: 'Enel' },
  'Enies Lobby': { id: 'Rob_Lucci', name: 'Rob Lucci' },
  'Post-Enies Lobby': { id: 'Monkey_D._Garp', name: 'Garp' },
  'Thriller Bark': { id: 'Gecko_Moria', name: 'Gecko Moria' },
  'Amazon Lily': { id: 'Boa_Hancock', name: 'Boa Hancock' },
  'Impel Down': { id: 'Magellan', name: 'Magellan' },
  Marineford: { id: 'Edward_Newgate', name: 'Whitebeard' },
  'Return to Sabaody': { id: 'Silvers_Rayleigh', name: 'Rayleigh' },
  'Whole Cake Island': { id: 'Charlotte_Linlin', name: 'Big Mom' },
  Zou: { id: 'Nekomamushi', name: 'Nekomamushi' },
  Levely: { id: 'Nefertari_Cobra', name: 'Cobra' },
  'Wano Country': { id: 'Kaidou', name: 'Kaido' },
}

export interface ArcCharacter {
  id: string
  name: string
  imageUrl: string | null
}

export interface ArcInfo {
  title: string
  startChapter: number
  endChapter: number
  /** Chapter count = end - start + 1. */
  length: number
  /** Most-appearing non-Straw-Hat character within the arc's chapters. */
  topChar: ArcCharacter | null
  /** The latest arc — still being serialized. */
  ongoing: boolean
}

export interface ArcRankingSnapshot {
  /** Arcs in publication order (start_chapter ascending). */
  arcs: ArcInfo[]
  /** Longest arc's chapter count — used for bar normalization. */
  maxLength: number
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

export async function loadArcRankingSnapshot(): Promise<ArcRankingSnapshot> {
  const [arcsRes, charsRes] = await Promise.all([
    supabase
      .from('arc')
      .select('title, start_chapter, end_chapter')
      .order('start_chapter', { ascending: true }),
    supabase.from('character').select('id, name, chapter_list'),
  ])

  if (arcsRes.error) {
    throw new Error(`Failed to fetch arcs: ${arcsRes.error.message}`)
  }
  if (charsRes.error) {
    throw new Error(`Failed to fetch characters: ${charsRes.error.message}`)
  }

  const rawArcs = (arcsRes.data ?? []).filter(
    (a): a is { title: string; start_chapter: number; end_chapter: number } =>
      typeof a.title === 'string' &&
      typeof a.start_chapter === 'number' &&
      typeof a.end_chapter === 'number'
  )

  const chars = (charsRes.data ?? []) as {
    id: string
    name: string | null
    chapter_list: number[] | null
  }[]

  // Tally each non-Straw-Hat character's appearances per arc in a single pass
  // over every appearance, then pick the headliner for each arc.
  const counts: Map<number, number>[] = rawArcs.map(() => new Map())
  for (let ci = 0; ci < chars.length; ci++) {
    const c = chars[ci]
    if (STRAW_HAT_IDS.has(c.id) || !c.chapter_list) continue
    for (const ch of c.chapter_list) {
      for (let ai = 0; ai < rawArcs.length; ai++) {
        const a = rawArcs[ai]
        if (ch >= a.start_chapter && ch <= a.end_chapter) {
          counts[ai].set(ci, (counts[ai].get(ci) ?? 0) + 1)
          break
        }
      }
    }
  }

  const topCharIndexPerArc = counts.map((m) => {
    let bestCi = -1
    let bestCount = 0
    for (const [ci, count] of m) {
      if (count > bestCount) {
        bestCount = count
        bestCi = ci
      }
    }
    return bestCi
  })

  // Pick each arc's headliner — a curated override wins, else the most-present
  // non-Straw-Hat character — then resolve its portrait image.
  const topChars: (ArcCharacter | null)[] = await Promise.all(
    rawArcs.map(async (arc, i) => {
      const override = HEADLINER_OVERRIDE[arc.title]
      const ci = topCharIndexPerArc[i]
      const id = override?.id ?? (ci >= 0 ? chars[ci].id : null)
      if (!id) return null
      const name =
        override?.name ?? (chars[ci].name ?? id).replace(/_/g, ' ')
      const url = characterImageUrl(id)
      const exists = await imageExists(url)
      return { id, name, imageUrl: exists ? url : null }
    })
  )

  const arcs: ArcInfo[] = rawArcs.map((a, i) => ({
    title: a.title,
    startChapter: a.start_chapter,
    endChapter: a.end_chapter,
    length: a.end_chapter - a.start_chapter + 1,
    topChar: topChars[i],
    // Latest arc (highest start chapter) is still being serialized.
    ongoing: i === rawArcs.length - 1,
  }))

  const maxLength = arcs.reduce((m, a) => Math.max(m, a.length), 1)

  return { arcs, maxLength }
}
