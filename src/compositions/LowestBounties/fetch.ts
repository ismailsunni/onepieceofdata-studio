import { supabase } from '../../lib/supabase'

export interface LowBountyRow {
  id: string
  name: string
  bounty: number
  /** Defining crew/affiliation, to identify the more obscure pirates. */
  crew: string | null
  imageUrl: string | null
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

// Straw Hat crew — counted as pirates even though their occupation field lists
// a day job (Chopper is "Doctor", Nami a "Navigator", etc.) rather than the
// word "Pirate".
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

// A character may list several affiliations in an arbitrary order. Prefer the
// canonical Straw Hat crew (so Chopper reads "Straw Hat Pirates", not the joke
// "Foxy Pirates"), then the first actual pirate crew, then whatever's first.
function pickCrew(groups: string[]): string | null {
  const trimmed = groups.map((g) => g.trim()).filter(Boolean)
  if (trimmed.length === 0) return null
  const straw = trimmed.find((g) => /^straw hat pirates$/i.test(g))
  if (straw) return straw
  return trimmed.find((g) => /pirates/i.test(g)) ?? trimmed[0]
}

function isPirate(id: string, occupation: string | null): boolean {
  if (STRAW_HAT_IDS.has(id)) return true
  if (typeof occupation !== 'string') return false
  // Match a pirate role, but not a bare "Pirate (former)" — that flags someone
  // (e.g. Jango) who has since become a Marine. Richer roles like "Pirate
  // Officer (former)" or "Pirate Captain (former)" still count.
  return /pirate(?!\s*\(former\))/i.test(occupation)
}

// The 10 *lowest* confirmed bounties among pirates. We require bounty > 0 so
// that "no bounty recorded" placeholders don't masquerade as the cheapest
// pirate, and keep only pirates (the occupation field is free-text, so we also
// allow-list the Straw Hats whose listed job isn't "Pirate"). Bounties tie at
// round numbers, so ties are broken by appearance count to surface the more
// recognizable character.
export async function fetchLowestBounties(limit = 10): Promise<LowBountyRow[]> {
  // Pirates are sparse among the very lowest bounties (Marines dominate), so
  // over-fetch generously before filtering, re-ranking, and slicing.
  const { data, error } = await supabase
    .from('character')
    .select('id, name, bounty, occupation, appearance_count')
    .gt('bounty', 0)
    .order('bounty', { ascending: true })
    .limit(limit * 15)

  if (error) throw error

  const ranked = (data ?? [])
    .filter((r) => isPirate(String(r.id), r.occupation ?? null))
    .map((r) => ({
      id: String(r.id),
      name: r.name ?? 'Unknown',
      bounty: r.bounty ?? 0,
      appearances: r.appearance_count ?? 0,
    }))
    // Lowest bounty first; within a tie, the more-appearing character wins.
    .sort((a, b) => a.bounty - b.bounty || b.appearances - a.appearances)
    .slice(0, limit)

  // Crew/affiliation for just the final rows. Ordered by group_name for a
  // deterministic pick (snapshots must be reproducible).
  const ids = ranked.map((r) => r.id)
  const { data: affs, error: affErr } = await supabase
    .from('character_affiliation')
    .select('character_id, group_name')
    .in('character_id', ids)
    .order('group_name', { ascending: true })
  if (affErr) throw affErr
  const groupsByChar = new Map<string, string[]>()
  for (const a of affs ?? []) {
    const cid = String(a.character_id)
    const list = groupsByChar.get(cid) ?? []
    list.push(String(a.group_name))
    groupsByChar.set(cid, list)
  }

  return Promise.all(
    ranked.map(async (r) => {
      const url = characterImageUrl(r.id)
      const exists = await imageExists(url)
      return {
        id: r.id,
        name: r.name,
        bounty: r.bounty,
        crew: pickCrew(groupsByChar.get(r.id) ?? []),
        imageUrl: exists ? url : null,
      }
    })
  )
}
