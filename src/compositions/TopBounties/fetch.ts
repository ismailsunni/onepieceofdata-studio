import { supabase } from '../../lib/supabase'

export interface BountyMember {
  id: string
  name: string
  imageUrl: string | null
}

// One rank in the leaderboard. Usually a single member, but a rank can be
// shared — seven characters sit at exactly ฿3,000,000,000 — so a rank holds
// every member at that bounty rather than arbitrarily picking one.
export interface BountyEntry {
  rank: number
  bounty: number
  members: BountyMember[]
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

// The highest bounties, collapsed into `rankCount` distinct-amount ranks.
// Members sharing a bounty share a rank (competition ranking).
export async function fetchTopBounties(rankCount = 10): Promise<BountyEntry[]> {
  // Over-fetch so the ranks at the cut-off (esp. the big ฿3.0B tie) are whole.
  const { data, error } = await supabase
    .from('character')
    .select('id, name, bounty')
    .not('bounty', 'is', null)
    .order('bounty', { ascending: false })
    .limit(rankCount * 6)

  if (error) throw error

  // Group by bounty value, preserving descending order of first appearance.
  const groups = new Map<number, { id: string; name: string }[]>()
  const order: number[] = []
  for (const r of data ?? []) {
    const bounty = r.bounty as number
    if (!groups.has(bounty)) {
      groups.set(bounty, [])
      order.push(bounty)
    }
    groups.get(bounty)!.push({ id: String(r.id), name: r.name ?? 'Unknown' })
  }

  const topValues = order.slice(0, rankCount)

  return Promise.all(
    topValues.map(async (bounty, i) => {
      const raw = groups
        .get(bounty)!
        .slice()
        .sort((a, b) => a.name.localeCompare(b.name))
      const members = await Promise.all(
        raw.map(async (m) => ({
          id: m.id,
          name: m.name,
          imageUrl: (await imageExists(characterImageUrl(m.id)))
            ? characterImageUrl(m.id)
            : null,
        }))
      )
      return { rank: i + 1, bounty, members }
    })
  )
}
