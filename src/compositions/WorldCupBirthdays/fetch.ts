// The player ↔ character birthday pairings are hand-authored (see slides.ts),
// but each `match` slide is fronted by the One Piece character's portrait — so
// we hit Supabase to resolve those images, exactly like the WorldCupOnePiece
// carousel. As a safety check we also read each character's `birth` back and
// warn if the hand-authored pairing ever drifts from the database.
//
// Flags come from the flagcdn.com CDN (free; ISO 3166-1 alpha-2 codes, plus
// `gb-eng` for England). `latestChapter` stays null — the pairing is timeless.

import { supabase } from '../../lib/supabase'
import { SLIDES, type SlideSpec } from './slides'

export interface ResolvedMatch {
  kind: 'match'
  player: string
  team: string
  flagUrl: string
  playerRole: string
  playerImageUrl: string
  playerImagePosition: string
  theme: string
  birthday: string
  characterName: string
  characterRole: string
  characterImageUrl: string | null
  arcTag: string
  detail: string
}

export type ResolvedSlide =
  | {
      kind: 'cover'
      kicker: string
      title: string
      subtitle: string
      /** Player + character faces scattered behind the cover title. */
      collage: string[]
    }
  | ResolvedMatch
  | {
      kind: 'closer'
      kicker: string
      title: string
      question: string
      handle: string
    }

export interface BirthdaysSnapshot {
  slides: ResolvedSlide[]
  latestChapter: number | null
}

function flagUrl(code: string): string {
  return `https://flagcdn.com/w320/${code.toLowerCase()}.png`
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

interface CharRow {
  id: string
  name: string
  birth: string | null
}

/** name → { id, birth } for every character fronting a match slide. */
async function resolveCharacters(
  names: string[]
): Promise<Map<string, CharRow>> {
  const out = new Map<string, CharRow>()
  if (names.length === 0) return out
  const { data, error } = await supabase
    .from('character')
    .select('id, name, birth')
    .in('name', names)
  if (error) throw error
  for (const row of data ?? []) {
    out.set(row.name as string, {
      id: String(row.id),
      name: row.name as string,
      birth: (row.birth as string) ?? null,
    })
  }
  return out
}

/** "June 24" → "June 24th" — the ordinal form stored in the `birth` column. */
function ordinalBirth(birthday: string): string {
  const [, month, day] = birthday.match(/^(\w+)\s+(\d+)$/) ?? []
  if (!month || !day) return birthday
  const n = Number(day)
  const suffix =
    n % 10 === 1 && n !== 11
      ? 'st'
      : n % 10 === 2 && n !== 12
        ? 'nd'
        : n % 10 === 3 && n !== 13
          ? 'rd'
          : 'th'
  return `${month} ${day}${suffix}`
}

export async function loadBirthdaysSnapshot(): Promise<BirthdaysSnapshot> {
  const names = Array.from(
    new Set(
      SLIDES.flatMap((s) => (s.kind === 'match' ? [s.characterName] : []))
    )
  )
  const chars = await resolveCharacters(names)

  const slides: ResolvedSlide[] = await Promise.all(
    (SLIDES as SlideSpec[]).map(async (s): Promise<ResolvedSlide> => {
      // Cover gets its collage attached in a second pass below.
      if (s.kind === 'cover') return { ...s, collage: [] }
      if (s.kind !== 'match') return s
      const char = chars.get(s.characterName)

      // Guard: fail loudly if the hand-authored birthday ever disagrees with
      // the database, so a bad pairing can't quietly ship.
      const expected = ordinalBirth(s.birthday)
      if (char && char.birth && char.birth !== expected) {
        console.warn(
          `[WorldCupBirthdays] ${s.characterName}: slide says "${expected}" but DB says "${char.birth}"`
        )
      }

      const url = char ? characterImageUrl(char.id) : null
      return {
        kind: 'match',
        player: s.player,
        team: s.team,
        flagUrl: flagUrl(s.teamCode),
        playerRole: s.playerRole,
        playerImageUrl: s.playerImageUrl,
        playerImagePosition: s.playerImagePosition,
        theme: s.theme,
        birthday: s.birthday,
        characterName: s.characterName,
        characterRole: s.characterRole,
        characterImageUrl: url && (await imageExists(url)) ? url : null,
        arcTag: s.arcTag,
        detail: s.detail,
      }
    })
  )

  // Build the cover collage from every resolved face: player photo first, then
  // its birthday-twin's portrait, in slide order, so the grid reads as pairs.
  const collage = slides.flatMap((s) =>
    s.kind === 'match'
      ? [s.playerImageUrl, s.characterImageUrl].filter(
          (u): u is string => Boolean(u)
        )
      : []
  )
  for (const s of slides) {
    if (s.kind === 'cover') s.collage = collage
  }

  return { slides, latestChapter: null }
}
