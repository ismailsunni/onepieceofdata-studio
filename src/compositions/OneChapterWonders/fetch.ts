import { supabase } from '../../lib/supabase'
import { hashId } from '../../lib/appearanceRace'

// "One-Chapter Wonders" game, "4 Options" mode. This reproduces the React
// site's arcQuizService logic (one-chapter character → its arc → 4 options)
// against Supabase, then replays a scripted 5-question round as a reel. The
// live game uses Math.random for selection/shuffle and Date.now for the timer;
// here everything is deterministic (hashId-seeded, scripted picks) so the same
// data always renders the same frames.

export interface ArcOption {
  arcId: string
  title: string
}

export interface OCWQuestion {
  id: string
  name: string
  imageUrl: string | null
  chapter: number
  correctArcId: string
  correctArcTitle: string
  tagline: string | null // curated "aha", revealed after the answer
  options: ArcOption[] // 4, deterministically ordered
  pickedArcId: string | null // the recorded player's choice (null = correct)
  timeLeft: number // seconds left when answered
  maxTime: number // seconds allowed (10 for options mode)
  isCorrect: boolean
  points: number
}

export interface OneChapterWondersSnapshot {
  questions: OCWQuestion[]
  totalPoints: number
  correctCount: number
}

// options mode: 10s per question; points = 1000 * timeLeft / maxTime.
const MAX_TIME = 10
function speedPoints(timeLeft: number): number {
  if (timeLeft <= 0) return 0
  return Math.round(1000 * (timeLeft / MAX_TIME))
}

// A curated, chronological round: arc-diverse one-chapter characters, each with
// a fan "aha" tagline shown only after the answer (before the pick it would
// give the arc away). Taglines are grounded in the character bio, except Lami,
// whose bio is empty — "Law's little sister" is established canon (Flevance
// flashback, ch762). `hit` is the recorded outcome, `timeLeft` how fast it was
// answered; the one deliberate miss (Lami) keeps the score honest.
const ROUND: { id: string; hit: boolean; timeLeft: number; tagline: string }[] = [
  { id: 'Gyoru', hit: true, timeLeft: 7.4, tagline: "Luffy's hometown fishmonger" },
  { id: 'Banchina', hit: true, timeLeft: 6.1, tagline: "Usopp's mother" },
  { id: 'Nefertari_Titi', hit: true, timeLeft: 5.2, tagline: "Vivi's mother — Arabasta's queen" },
  { id: 'Lami', hit: false, timeLeft: 4.3, tagline: "Law's little sister" },
  { id: 'Charlotte_Normande', hit: true, timeLeft: 8.0, tagline: "Big Mom's 38th daughter" },
]

function characterImageUrl(id: string): string {
  return `${process.env.SUPABASE_URL}/storage/v1/object/public/character-images/${encodeURIComponent(id)}.png`
}

async function imageExists(url: string): Promise<boolean> {
  try {
    return (await fetch(url, { method: 'HEAD' })).ok
  } catch {
    return false
  }
}

// Stable shuffle: order by hashId of (item key + seed).
function seededShuffle<T>(items: T[], key: (t: T) => string, seed: string): T[] {
  return [...items].sort((a, b) => hashId(key(a) + seed) - hashId(key(b) + seed))
}

export async function loadOneChapterWondersSnapshot(): Promise<OneChapterWondersSnapshot> {
  const [charsResult, arcsResult] = await Promise.all([
    supabase
      .from('character')
      .select('id, name, chapter_list, arc_list')
      .in('id', ROUND.map((r) => r.id)),
    supabase.from('arc').select('arc_id, title, start_chapter, end_chapter'),
  ])

  if (charsResult.error) throw charsResult.error
  if (arcsResult.error) throw arcsResult.error

  const arcs = (arcsResult.data ?? []).filter(
    (a): a is { arc_id: string; title: string; start_chapter: number; end_chapter: number } =>
      typeof a.arc_id === 'string' && typeof a.title === 'string'
  )
  const arcMap = new Map(arcs.map((a) => [a.arc_id, a]))
  const charById = new Map((charsResult.data ?? []).map((c) => [String(c.id), c]))

  const resolveArc = (arcList: string[] | null, chapter: number) => {
    const listed = arcList?.find((id) => arcMap.has(id))
    if (listed) return arcMap.get(listed)!
    return arcs.find((a) => chapter >= a.start_chapter && chapter <= a.end_chapter) ?? null
  }

  const questions: OCWQuestion[] = []
  for (const entry of ROUND) {
    const c = charById.get(entry.id)
    if (!c || !c.name || !c.chapter_list?.length) {
      throw new Error(`OneChapterWonders: character "${entry.id}" not found or has no chapters`)
    }
    const chapter = (c.chapter_list as number[])[0]
    const correct = resolveArc(c.arc_list as string[] | null, chapter)
    if (!correct) throw new Error(`OneChapterWonders: no arc for "${entry.id}"`)

    // 3 deterministic wrong arcs + the correct one, then a stable option order.
    const wrong = seededShuffle(
      arcs.filter((a) => a.arc_id !== correct.arc_id),
      (a) => a.arc_id,
      entry.id
    ).slice(0, 3)
    const options = seededShuffle(
      [correct, ...wrong].map((a) => ({ arcId: a.arc_id, title: a.title })),
      (o) => o.arcId,
      entry.id + '-opt'
    )

    // A wrong pick is the first option that isn't the correct arc — stable.
    const pickedArcId = entry.hit
      ? correct.arc_id
      : (options.find((o) => o.arcId !== correct.arc_id)?.arcId ?? null)
    const points = entry.hit ? speedPoints(entry.timeLeft) : 0

    const url = characterImageUrl(entry.id)
    questions.push({
      id: entry.id,
      name: c.name,
      imageUrl: (await imageExists(url)) ? url : null,
      chapter,
      correctArcId: correct.arc_id,
      correctArcTitle: correct.title,
      tagline: entry.tagline,
      options,
      pickedArcId,
      timeLeft: entry.timeLeft,
      maxTime: MAX_TIME,
      isCorrect: entry.hit,
      points,
    })
  }

  return {
    questions,
    totalPoints: questions.reduce((s, q) => s + q.points, 0),
    correctCount: questions.filter((q) => q.isCorrect).length,
  }
}
