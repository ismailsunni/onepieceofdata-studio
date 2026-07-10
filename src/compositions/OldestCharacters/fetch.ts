import { supabase } from '../../lib/supabase'

export interface OldCharMember {
  id: string
  name: string
  imageUrl: string | null
}

export interface OldCharRow {
  /** Stable React key (character id, or the group key for a combined row). */
  key: string
  /** One character, or several sharing a row (a tie / an inseparable pair). */
  members: OldCharMember[]
  /** Formatted age: "160", a range "153–156", or an estimate "1,000+". */
  ageLabel: string
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

// Characters shown together on one row. Order here is the display order.
//  - The three 160-year-old giants tie exactly, so they collapse into one row.
//  - Oimo & Kashii are the inseparable Enies Lobby gate guardians; they differ
//    by three years, so their row shows the range.
const GROUPS: { key: string; ids: string[] }[] = [
  { key: 'giants-160', ids: ['Dorry', 'Brogy', 'Morley'] },
  { key: 'enies-gate-guards', ids: ['Oimo', 'Kashii'] },
]

// Round-hundred Void-Century ages that are canonical *estimates* ("over N
// years") rather than the precise databook ages everyone below carries. Shown
// with a trailing "+".
const APPROX_IDS = new Set(['Zunesha', 'Iron_Giant', 'Nerona_Imu'])

// Non-canon characters (game/movie-only) that leak into the age ranking. Lim
// is exclusive to the game One Piece Odyssey (her origin is Waford, an island
// that never appears in the manga), so she's dropped to keep the reel canon.
const EXCLUDE_IDS = new Set(['Lim'])

function ageLabel(ages: number[], approx: boolean): string {
  const fmt = (n: number) => n.toLocaleString('en-US')
  const min = Math.min(...ages)
  const max = Math.max(...ages)
  if (min !== max) return `${fmt(min)}–${fmt(max)}`
  return approx ? `${fmt(max)}+` : fmt(max)
}

// The oldest characters in One Piece by canonical age, collapsed into `limit`
// display rows. `is_likely_character` filters out scraping artefacts; ties are
// broken by appearance count. A few characters share a row (see GROUPS), which
// pulls more recognizable faces into the cut.
export async function fetchOldestCharacters(limit = 10): Promise<OldCharRow[]> {
  const { data, error } = await supabase
    .from('character')
    .select('id, name, age, appearance_count')
    .eq('is_likely_character', true)
    .not('age', 'is', null)
    .order('age', { ascending: false })
    // Over-fetch: grouping removes rows, so we need candidates past the limit.
    .limit(limit * 4)

  if (error) throw error

  const ranked = (data ?? [])
    .map((r) => ({
      id: String(r.id),
      name: r.name ?? 'Unknown',
      age: r.age ?? 0,
      appearances: r.appearance_count ?? 0,
    }))
    .filter((r) => !EXCLUDE_IDS.has(r.id))
    // Oldest first; within a tie, the more-appearing character wins.
    .sort((a, b) => b.age - a.age || b.appearances - a.appearances)

  const byId = new Map(ranked.map((r) => [r.id, r]))

  // Walk the ranked list in order, emitting each group once (when its first
  // member is reached) and everyone else as a solo row.
  const consumed = new Set<string>()
  type BuiltRow = { key: string; ids: string[]; ages: number[]; approx: boolean }
  const rows: BuiltRow[] = []
  for (const r of ranked) {
    if (consumed.has(r.id)) continue
    const group = GROUPS.find((g) => g.ids.includes(r.id))
    if (group) {
      const ids = group.ids.filter((id) => byId.has(id))
      ids.forEach((id) => consumed.add(id))
      rows.push({
        key: group.key,
        ids,
        ages: ids.map((id) => byId.get(id)!.age),
        approx: false,
      })
    } else {
      rows.push({
        key: r.id,
        ids: [r.id],
        ages: [r.age],
        approx: APPROX_IDS.has(r.id),
      })
    }
  }

  // Order rows by their oldest member, then keep the top `limit`.
  rows.sort((a, b) => Math.max(...b.ages) - Math.max(...a.ages))
  const top = rows.slice(0, limit)

  return Promise.all(
    top.map(async (row) => {
      const members = await Promise.all(
        row.ids.map(async (id) => {
          const url = characterImageUrl(id)
          const exists = await imageExists(url)
          return {
            id,
            name: byId.get(id)!.name,
            imageUrl: exists ? url : null,
          }
        })
      )
      return {
        key: row.key,
        members,
        ageLabel: ageLabel(row.ages, row.approx),
      }
    })
  )
}
