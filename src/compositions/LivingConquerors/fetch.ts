import { supabase } from '../../lib/supabase'

export interface LivingConquerorRow {
  id: string
  name: string
  bounty: number
  /** Defining crew/affiliation, for context on who they are. */
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

// A character may list several affiliations in an arbitrary order. Prefer a
// pirate crew (the identity most readers know them by), else fall back to the
// first listed group.
function pickCrew(groups: string[]): string | null {
  const trimmed = groups.map((g) => g.trim()).filter(Boolean)
  if (trimmed.length === 0) return null
  return trimmed.find((g) => /pirates/i.test(g)) ?? trimmed[0]
}

export async function fetchLatestChapter(): Promise<number | null> {
  const { data, error } = await supabase
    .from('chapter')
    .select('number')
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()
  if (error) throw error
  return data?.number ?? null
}

// Living wielders of Conqueror's (Haoshoku) Haki, ranked by bounty. The DB
// flags exactly 30 confirmed users via `haki_conqueror`; we keep only those
// still Alive with a confirmed bounty > 0 (the bounty-less legends — Rayleigh,
// Sengoku, Yamato, Imu — have no figure to rank on). Bounties tie at round
// numbers (three sit at ₿3.00B), so ties break by appearance count to surface
// the more prominent character first.
export async function fetchLivingConquerors(
  limit = 10
): Promise<LivingConquerorRow[]> {
  const { data, error } = await supabase
    .from('character')
    .select('id, name, bounty, appearance_count, status')
    .eq('haki_conqueror', true)
    .eq('status', 'Alive')
    .gt('bounty', 0)
    .order('bounty', { ascending: false })
    .limit(limit * 3)

  if (error) throw error

  const ranked = (data ?? [])
    .map((r) => ({
      id: String(r.id),
      name: r.name ?? 'Unknown',
      bounty: r.bounty ?? 0,
      appearances: r.appearance_count ?? 0,
    }))
    // Highest bounty first; within a tie, the more-appearing character wins.
    .sort((a, b) => b.bounty - a.bounty || b.appearances - a.appearances)
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
