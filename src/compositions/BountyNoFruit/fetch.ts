import { supabase } from '../../lib/supabase'

export interface BountyMember {
  id: string
  name: string
  imageUrl: string | null
}

// One row in the leaderboard — exactly one character. Ties get one row each
// but share a rank (competition ranking): Dorry and Brogy both sit at
// ฿1,800,000,000, so both are rank 5 and the next distinct bounty is rank 7.
export interface BountyEntry {
  // Competition rank within this no-Devil-Fruit leaderboard — shared by ties.
  rank: number
  // Rank of this bounty among ALL characters, Devil Fruit users included —
  // so the audience can see how far the fruit users push these names down.
  overallRank: number
  bounty: number
  // Always a single-element array (kept as an array for the renderer's sake).
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

// The highest bounties among characters with NO Devil Fruit, emitted one row
// per character for ranks 1..`rankCount`. Characters sharing a bounty share a
// rank (competition ranking) — e.g. Dorry & Brogy both at ฿1.8B are both rank
// 5, so the next row is rank 7 and rank 11 falls outside a "top 10".
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

  // The first `rankCount` bounty groups are enough to cover every row ranked
  // `rankCount` or better — a tie only ever pushes ranks higher, never lower.
  const topValues = order.slice(0, rankCount)

  // Flatten the chosen bounty groups into one row per character, assigning a
  // shared competition rank to each group (so a 2-way tie at rank 5 makes the
  // next row rank 7). `seen` tracks how many rows precede each group.
  type Row = { rank: number; overallRank: number; bounty: number; id: string; name: string }
  const rows: Row[] = []
  let seen = 0
  for (const bounty of topValues) {
    const members = groups
      .get(bounty)!
      .slice()
      .sort((a, b) => a.name.localeCompare(b.name))
    const rank = seen + 1
    const overallRank = overallRankOf(bounty)
    for (const m of members) {
      rows.push({ rank, overallRank, bounty, id: m.id, name: m.name })
    }
    seen += members.length
  }

  // Keep only ranks 1..rankCount. A tie can spill a row past the cut-off —
  // e.g. with the ฿1.8B tie at 5, rank 11 (Oars Jr.) drops off a "top 10".
  const ranked = rows.filter((row) => row.rank <= rankCount)

  return Promise.all(
    ranked.map(async (row) => ({
      rank: row.rank,
      overallRank: row.overallRank,
      bounty: row.bounty,
      members: [
        {
          id: row.id,
          name: row.name,
          imageUrl: (await imageExists(characterImageUrl(row.id)))
            ? characterImageUrl(row.id)
            : null,
        },
      ],
    }))
  )
}
