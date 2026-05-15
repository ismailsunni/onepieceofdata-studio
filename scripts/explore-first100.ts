import { supabase } from '../src/lib/supabase'

interface Char {
  id: string
  name: string
  appearance_count: number | null
  first_appearance: number | null
  last_appearance: number | null
  importance_score: number | null
  importance_tier: string | null
  occupation: string | null
  origin_region: string | null
  arc_list: string[] | null
  saga_list: string[] | null
}

async function fetchChapterDates(): Promise<Map<number, string>> {
  const m = new Map<number, string>()
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('chapter')
      .select('number, date')
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    for (const r of data as Array<{ number: number; date: string | null }>) {
      if (r.date) m.set(r.number, r.date)
    }
    if (data.length < pageSize) break
    from += pageSize
  }
  return m
}

function dateYear(d: string | undefined | null): string {
  if (!d) return '????'
  return d.slice(0, 4)
}

async function fetchAll(): Promise<Char[]> {
  const all: Char[] = []
  const pageSize = 1000
  let from = 0
  while (true) {
    const { data, error } = await supabase
      .from('character')
      .select(
        'id, name, appearance_count, first_appearance, last_appearance, importance_score, importance_tier, occupation, origin_region, arc_list, saga_list'
      )
      .range(from, from + pageSize - 1)
    if (error) throw error
    if (!data || data.length === 0) break
    for (const r of data) all.push(r as Char)
    if (data.length < pageSize) break
    from += pageSize
  }
  return all
}

const EXCLUDE = new Set(['Pandaman'])

// Current chapter ~1181. Pick buckets.
const ACTIVE_THRESHOLD = 1150 // last_appearance >= this = "still active"
const VANISHED_THRESHOLD = 1100 // last_appearance < this = "long gone"

async function main() {
  const [all, chDates] = await Promise.all([fetchAll(), fetchChapterDates()])
  console.log(`Loaded ${chDates.size} chapter dates`)
  const first100 = all.filter(
    (c) =>
      !EXCLUDE.has(c.id) &&
      c.first_appearance != null &&
      c.first_appearance <= 100
  )

  console.log(`Total characters in DB: ${all.length}`)
  console.log(`Introduced in chapters 1–100: ${first100.length}`)

  const maxLast = Math.max(
    ...all.map((c) => c.last_appearance ?? 0).filter((n) => Number.isFinite(n))
  )
  console.log(`Max last_appearance in DB: ${maxLast}`)

  const active = first100.filter(
    (c) => (c.last_appearance ?? 0) >= ACTIVE_THRESHOLD
  )
  const recent = first100.filter(
    (c) =>
      (c.last_appearance ?? 0) >= VANISHED_THRESHOLD &&
      (c.last_appearance ?? 0) < ACTIVE_THRESHOLD
  )
  const vanished = first100.filter(
    (c) =>
      c.last_appearance != null && c.last_appearance < VANISHED_THRESHOLD
  )
  const noLast = first100.filter((c) => c.last_appearance == null)

  console.log(
    `\nBuckets (current arc ~1181):` +
      `\n  Still active   (last >= ${ACTIVE_THRESHOLD}): ${active.length}` +
      `\n  Recently gone  (${VANISHED_THRESHOLD}–${ACTIVE_THRESHOLD - 1}):    ${recent.length}` +
      `\n  Long vanished  (last < ${VANISHED_THRESHOLD}):  ${vanished.length}` +
      `\n  No last_appearance:                              ${noLast.length}`
  )

  // Tier breakdown
  const tiers: Record<string, number> = {}
  for (const c of first100) {
    const t = c.importance_tier ?? 'null'
    tiers[t] = (tiers[t] ?? 0) + 1
  }
  console.log(`\nImportance tier breakdown:`, tiers)

  // Show the long-vanished bucket — the most narrative-rich list
  console.log(`\n=== LONG VANISHED (last < ${VANISHED_THRESHOLD}) — sorted by appearance_count ===`)
  for (const c of vanished
    .sort((a, b) => (b.appearance_count ?? 0) - (a.appearance_count ?? 0))
    .slice(0, 40)) {
    console.log(
      `  ${c.name.padEnd(32)} first ch${String(c.first_appearance).padStart(3)} last ch${String(c.last_appearance).padStart(4)}  apps=${String(c.appearance_count ?? '?').padStart(4)}  tier=${c.importance_tier ?? '-'}`
    )
  }

  // Still active — surprises (low appearance count but recent)
  console.log(`\n=== STILL ACTIVE (last >= ${ACTIVE_THRESHOLD}) — sorted ASC by appearance count (surprise comebacks) ===`)
  for (const c of active
    .filter((c) => (c.appearance_count ?? 0) > 0)
    .sort((a, b) => (a.appearance_count ?? 0) - (b.appearance_count ?? 0))
    .slice(0, 20)) {
    console.log(
      `  ${c.name.padEnd(32)} first ch${String(c.first_appearance).padStart(3)} last ch${String(c.last_appearance).padStart(4)}  apps=${String(c.appearance_count ?? '?').padStart(4)}  tier=${c.importance_tier ?? '-'}`
    )
  }

  // Dead/no-last sample
  console.log(`\n=== NO LAST_APPEARANCE (sample of 20) ===`)
  for (const c of noLast.slice(0, 20)) {
    console.log(`  ${c.name.padEnd(32)} first ch${c.first_appearance}  apps=${c.appearance_count ?? '?'}`)
  }

  // FULL DUMP for copy review
  const byId = new Map(first100.map((c) => [c.id, c]))
  const lastArc = (c: Char) =>
    c.arc_list && c.arc_list.length ? c.arc_list[c.arc_list.length - 1] : '-'
  const lastSaga = (c: Char) =>
    c.saga_list && c.saga_list.length ? c.saga_list[c.saga_list.length - 1] : '-'
  const row = (c: Char) => {
    const lastCh = c.last_appearance
    const date = lastCh != null ? chDates.get(lastCh) : undefined
    return `  ${c.name.padEnd(28)} ch${String(lastCh).padStart(4)} (${dateYear(date)})  date=${(date ?? '????-??-??').padEnd(10)} saga=${lastSaga(c).padEnd(22)} arc=${lastArc(c).padEnd(28)} apps=${String(c.appearance_count ?? '?').padStart(4)} t=${c.importance_tier ?? '-'}`
  }

  console.log(`\n\n############# FULL ROSTER, ALL 122 #############`)
  console.log(`\n--- ALL STILL ACTIVE (last >= ${ACTIVE_THRESHOLD}), ${active.length} chars, by last_appearance desc ---`)
  for (const c of [...active].sort(
    (a, b) => (b.last_appearance ?? 0) - (a.last_appearance ?? 0)
  ))
    console.log(row(c))

  console.log(`\n--- ALL RECENTLY GONE (${VANISHED_THRESHOLD}–${ACTIVE_THRESHOLD - 1}), ${recent.length} chars, by last_appearance desc ---`)
  for (const c of [...recent].sort(
    (a, b) => (b.last_appearance ?? 0) - (a.last_appearance ?? 0)
  ))
    console.log(row(c))

  console.log(`\n--- ALL LONG VANISHED (last < ${VANISHED_THRESHOLD}), ${vanished.length} chars, by last_appearance asc (longest silence first) ---`)
  for (const c of [...vanished].sort(
    (a, b) => (a.last_appearance ?? 0) - (b.last_appearance ?? 0)
  ))
    console.log(row(c))

  // S/A tier highlights
  console.log(`\n--- S-TIER (${first100.filter((c) => c.importance_tier === 'S').length}) ---`)
  for (const c of first100
    .filter((c) => c.importance_tier === 'S')
    .sort((a, b) => (b.importance_score ?? 0) - (a.importance_score ?? 0)))
    console.log(row(c))

  console.log(`\n--- A-TIER (${first100.filter((c) => c.importance_tier === 'A').length}) ---`)
  for (const c of first100
    .filter((c) => c.importance_tier === 'A')
    .sort((a, b) => (b.importance_score ?? 0) - (a.importance_score ?? 0)))
    console.log(row(c))

  void byId
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
