// Editorial deck for the IG carousel. Each entry becomes one slide (PNG).
// Character lookups use `name` (matches `character.name` in Supabase). If a
// name doesn't resolve, fetch.ts logs a warning and the slide falls back to
// the supplied displayName + a placeholder portrait.

export type SlideSpec =
  | {
      kind: 'cover'
      title: string
      subtitle: string
      kicker: string
    }
  | {
      kind: 'character'
      name: string
      headline: string
      pitch: string
    }
  | {
      kind: 'pair'
      names: [string, string]
      groupName: string
      pitch: string
    }
  | {
      kind: 'group'
      names: string[]
      groupName: string
      pitch: string
    }
  | {
      kind: 'honorable'
      names: string[]
      title: string
      subtitle: string
    }
  | {
      kind: 'cta'
      kicker: string
      title: string
      url: string
    }

export const SLIDES: SlideSpec[] = [
  {
    kind: 'cover',
    kicker: 'WT100 2026 · Wishlist',
    title: 'Should Be in the\nTop 100',
    subtitle: 'Characters Oda drew. Fans forgot.',
  },
  {
    kind: 'pair',
    names: ["Kin'emon", 'Kouzuki Momonosuke'],
    groupName: 'The Heart of Wano',
    pitch:
      "Two arcs, a country freed, and the future Shogun. Wano without these two is just snow and swords.",
  },
  {
    kind: 'pair',
    names: ['Wapol', 'Foxy'],
    groupName: 'The Fun Enemies',
    pitch:
      "Drum's munching tyrant and the Slow-Slow trickster. Goofy villains who made arcs unforgettable.",
  },
  {
    kind: 'character',
    name: 'Hatchan',
    headline: 'East Blue to Fish-Man Island',
    pitch:
      "From Arlong's crew to a redeemed octopus chef across 1,000+ chapters. A Straw Hat ally before it was cool.",
  },
  {
    kind: 'character',
    name: 'Capone Bege',
    headline: 'The Fortress Supernova',
    pitch:
      "Mafia boss in a Castle-Castle body. Masterminded the Big Mom assassination plot — one of the most cunning Supernovas, and still snubbed.",
  },
  {
    kind: 'honorable',
    title: 'Honorable Mentions',
    subtitle: 'Belong to important groups — but not fan favourites.',
    names: [
      'Dorry',
      'Brogy',
      'Inuarashi',
      'Nekomamushi',
      'Queen',
      'Scratchmen Apoo',
      'Urouge',
      'Sengoku',
      'Sai',
      'Ideo',
      'Hajrudin',
      'Leo',
      'Orlumbus',
      'Crocus',
      'Wyper',
      'Morgans',
    ],
  },
  {
    kind: 'cta',
    kicker: 'WT100 2026 · Final Round',
    title: 'Vote for the snubbed.',
    url: 'onepiecewt100-2026.com',
  },
]
