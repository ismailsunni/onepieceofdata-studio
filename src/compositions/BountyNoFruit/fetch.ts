import { supabase } from '../../lib/supabase'

export interface BountyMember {
  id: string
  name: string
  imageUrl: string | null
}

// One rank in the leaderboard. Usually a single member, but a rank can be
// shared — Dorry and Brogy both sit at exactly ฿1,800,000,000 — so a rank
// holds every member at that bounty rather than arbitrarily picking one.
export interface BountyEntry {
  // Rank within this no-Devil-Fruit leaderboard (1..rankCount).
  rank: number
  // Rank of this bounty among ALL characters, Devil Fruit users included —
  // so the audience can see how far the fruit users push these names down.
  overallRank: number
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

// The set of character ids that are recorded as Devil Fruit users in the
// `character_devil_fruit` join table. Anyone in this set is excluded — this
// reel is about the monsters who got their bounty on raw skill alone.
async function fetchFruitUserIds(): Promise<Set<string>> {
  const { data, error } = await supabase
    .from('character_devil_fruit')
    .select('character_id')
  if (error) throw error
  return new Set((data ?? []).map((r) => String(r.character_id)))
}

// The highest bounties among characters with NO Devil Fruit, collapsed into
// `rankCount` distinct-amount ranks. Members sharing a bounty share a rank
// (competition ranking) — e.g. Dorry & Brogy both at ฿1.8B.
export async function fetchBountyNoFruit(rankCount = 10): Promise<BountyEntry[]> {
  const fruitUsers = await fetchFruitUserIds()

  // Over-fetch generously: we drop every Devil Fruit user, so we need a wide
  // window to still surface `rankCount` whole non-fruit ranks at the cut-off.
  const { data, error } = await supabase
    .from('character')
    .select('id, name, bounty')
    .not('bounty', 'is', null)
    .order('bounty', { ascending: false })
    .limit(rankCount * 20)

  if (error) throw error

  // Two passes over the same descending rows:
  //  - `allOrder`  → every distinct bounty value (fruit users included), so we
  //                  can report each entry's overall rank.
  //  - `groups`/`order` → non-fruit characters only, grouped by bounty value.
  const allOrder: number[] = []
  const seenAll = new Set<number>()
  const groups = new Map<number, { id: string; name: string }[]>()
  const order: number[] = []
  for (const r of data ?? []) {
    const bounty = r.bounty as number
    if (!seenAll.has(bounty)) {
      seenAll.add(bounty)
      allOrder.push(bounty)
    }
    if (fruitUsers.has(String(r.id))) continue
    if (!groups.has(bounty)) {
      groups.set(bounty, [])
      order.push(bounty)
    }
    groups.get(bounty)!.push({ id: String(r.id), name: r.name ?? 'Unknown' })
  }

  // Dense rank of a bounty value across the full leaderboard (1-based).
  const overallRankOf = (bounty: number) => allOrder.indexOf(bounty) + 1

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
      return { rank: i + 1, overallRank: overallRankOf(bounty), bounty, members }
    })
  )
}
