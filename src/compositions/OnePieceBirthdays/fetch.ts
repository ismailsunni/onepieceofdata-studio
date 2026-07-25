import { supabase } from '../../lib/supabase'

export interface BirthdayMoment {
  birthday: number
  year: number
  chapter: number | null
  chapterTitle: string | null
  publishedOn: string | null
  arcTitle: string | null
}

export interface OnePieceBirthdaysSnapshot {
  moments: BirthdayMoment[]
}

const ANNIVERSARY_MONTH_DAY = '-07-22'
const FIRST_BIRTHDAY_YEAR = 1998
const LAST_BIRTHDAY_YEAR = 2026

function dateLabel(iso: string | null): string {
  if (!iso) return 'No chapter yet'
  const date = new Date(`${iso}T00:00:00Z`)
  return new Intl.DateTimeFormat('en', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(date)
}

export function formatPublishedOn(iso: string | null): string {
  return dateLabel(iso)
}

/**
 * A birthday means the manga's state on 22 July of that calendar year. We use
 * the last chapter published on or before that date, rather than an estimate.
 */
export async function loadOnePieceBirthdaysSnapshot(): Promise<OnePieceBirthdaysSnapshot> {
  const [chaptersResult, arcsResult] = await Promise.all([
    supabase.from('chapter').select('number, title, date').order('number'),
    supabase.from('arc').select('title, start_chapter, end_chapter'),
  ])

  if (chaptersResult.error) {
    throw new Error(`Failed to load chapters: ${chaptersResult.error.message}`)
  }
  if (arcsResult.error) {
    throw new Error(`Failed to load arcs: ${arcsResult.error.message}`)
  }

  const chapters = (chaptersResult.data ?? [])
    .filter(
      (row): row is { number: number; title: string | null; date: string } =>
        typeof row.number === 'number' && typeof row.date === 'string'
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.number - b.number)

  const arcs = (arcsResult.data ?? []).filter(
    (row): row is { title: string; start_chapter: number; end_chapter: number } =>
      typeof row.title === 'string' &&
      typeof row.start_chapter === 'number' &&
      typeof row.end_chapter === 'number'
  )

  return {
    moments: Array.from(
      { length: LAST_BIRTHDAY_YEAR - FIRST_BIRTHDAY_YEAR + 1 },
      (_, index) => {
        const birthday = index + 1
        const year = FIRST_BIRTHDAY_YEAR + index
        const cutoff = `${year}${ANNIVERSARY_MONTH_DAY}`
        let current: (typeof chapters)[number] | null = null
        for (const chapter of chapters) {
          if (chapter.date > cutoff) break
          current = chapter
        }
        const arc = current
          ? arcs.find(
              (candidate) =>
                current!.number >= candidate.start_chapter &&
                current!.number <= candidate.end_chapter
            )
          : null

        return {
          birthday,
          year,
          chapter: current?.number ?? null,
          chapterTitle: current?.title ?? null,
          publishedOn: current?.date ?? null,
          arcTitle: arc?.title ?? null,
        }
      }
    ),
  }
}
