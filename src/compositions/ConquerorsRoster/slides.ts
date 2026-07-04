// Editorial deck for the "Every Conqueror's Haki User" carousel. Each entry
// becomes one slide (PNG). Character lookups use `name` (matches
// `character.name` in Supabase); fetch.ts resolves portraits + bounties. If a
// name doesn't resolve, fetch.ts logs a warning and falls back to a placeholder.
//
// Roster source: `character.haki_conqueror = true` — exactly 30 confirmed
// users (a fully-populated boolean, 0 nulls), grouped here by faction.

export interface Member {
  /** Must match character.name in Supabase. */
  name: string
  /** Short epithet shown under the name. */
  epithet: string
  /**
   * CSS object-position for the circular crop. Defaults to 'top' (works for
   * head-and-shoulders portraits); override when the face sits lower in the
   * source panel (e.g. Imu).
   */
  crop?: string
}

export type SlideSpec =
  | {
      kind: 'cover'
      kicker: string
      title: string
      subtitle: string
      question: string
      /** Small caveat line, e.g. "Confirmed in-manga users only". */
      note?: string
      /** Engagement teaser, e.g. "2 of them will surprise you". */
      hook?: string
    }
  | {
      kind: 'context'
      kicker: string
      title: string
      blurb: string
      stats: { value: string; label: string }[]
      /** Gold callout teasing the odd-ones-out (revealed on the last slide). */
      highlight?: string
      footer?: string
    }
  | {
      kind: 'group'
      kicker: string
      title: string
      subtitle: string
      members: Member[]
    }
  | {
      kind: 'follow'
      kicker: string
      title: string
      subtitle: string
      handle: string
      /** Character to show as a shadowed "who's next?" silhouette. */
      teaserName?: string
      /** Caption under the silhouette. */
      teaserCaption?: string
    }

export const SLIDES: SlideSpec[] = [
  {
    kind: 'cover',
    kicker: 'Haoshoku · The King’s Haki',
    title: 'Every\nConqueror’s\nHaki User',
    subtitle:
      'All 30 wielders of the rarest Haki — the will of a true king — grouped by faction.',
    question: 'Who has the King’s will?',
    note: 'Confirmed in-manga users only',
    hook: '…and 3 of them will surprise you',
  },
  {
    kind: 'context',
    kicker: 'The Rarest Haki',
    title: 'Only 30 have it.',
    blurb:
      'Conqueror’s Haki can’t be trained into existence — you’re born with it. Across 1,000+ chapters, just 30 characters have been confirmed to wield it.',
    stats: [
      { value: '30', label: 'confirmed users' },
      { value: '0', label: 'sitting admirals' },
      { value: '4 / 5', label: 'of the Elders' },
    ],
    highlight:
      'Nearly all are kings, Emperors, their heirs, or old-world legends. But 3 wield it with no throne, no bloodline, and no legend behind them. (Swipe to the end.)',
    footer: 'Confirmed in-manga only — fan-speculated cases not counted.',
  },
  {
    kind: 'group',
    kicker: 'Faction 01',
    title: 'Kings',
    subtitle: 'Those who sit thrones — crowns, empires, and one Empty Throne.',
    members: [
      { name: 'Nerona Imu', epithet: 'King of the World', crop: '50% 54%' },
      { name: 'Harald', epithet: 'King of Elbaph' },
      { name: 'Boa Hancock', epithet: 'Pirate Empress' },
      { name: 'Donquixote Doflamingo', epithet: 'King of Dressrosa' },
      { name: 'Kouzuki Oden', epithet: 'Lord of Kuri' },
    ],
  },
  {
    kind: 'group',
    kicker: 'Faction 02',
    title: 'The Yonko',
    subtitle: 'The Emperors of the Sea — past and present.',
    members: [
      { name: 'Edward Newgate', epithet: 'Whitebeard' },
      { name: 'Kaidou', epithet: 'of the Beasts' },
      { name: 'Charlotte Linlin', epithet: 'Big Mom' },
      { name: 'Shanks', epithet: 'Red-Haired' },
      { name: 'Monkey D. Luffy', epithet: 'the Fifth Emperor' },
    ],
  },
  {
    kind: 'group',
    kicker: 'Faction 03',
    title: 'The World Government',
    subtitle: 'The Five Elders — four of the five wield it.',
    members: [
      { name: 'Jaygarcia Saturn', epithet: 'God of Science' },
      { name: 'Marcus Mars', epithet: 'God of Environment' },
      { name: 'Topman Warcury', epithet: 'God of Justice' },
      { name: 'Ethanbaron V. Nusjuro', epithet: 'God of Finance' },
    ],
  },
  {
    kind: 'group',
    kicker: 'Faction 04',
    title: 'Heirs to the Throne',
    subtitle: 'The children of kings and Emperors — born into the King’s will.',
    members: [
      { name: 'Portgas D. Ace', epithet: 'son of the Pirate King' },
      { name: 'Charlotte Katakuri', epithet: 'son of Big Mom' },
      { name: 'Yamato', epithet: 'child of Kaido' },
      { name: 'Loki', epithet: 'son of Harald' },
    ],
  },
  {
    kind: 'group',
    kicker: 'Faction 05 · Old Era',
    title: 'Legends',
    subtitle: 'The Pirate King’s crew and the ancients who came before.',
    members: [
      { name: 'Gol D. Roger', epithet: 'the Pirate King' },
      { name: 'Silvers Rayleigh', epithet: 'the Dark King' },
      { name: 'Scopper Gaban', epithet: 'of the Roger Pirates' },
      { name: 'Rocks D. Xebec', epithet: 'Captain of the Rocks' },
      { name: 'Joy Boy', epithet: 'the Ancient Warrior' },
    ],
  },
  {
    kind: 'group',
    kicker: 'Faction 05 · Old Era',
    title: 'Veterans',
    subtitle: 'The marines, the survivors, and the old rivals.',
    members: [
      { name: 'Monkey D. Garp', epithet: 'Hero of the Marines' },
      { name: 'Sengoku', epithet: 'the Buddha' },
      { name: 'Chinjao', epithet: 'the Drill' },
      { name: 'Douglas Bullet', epithet: 'the Demon Heir' },
    ],
  },
  {
    kind: 'group',
    kicker: 'Faction 06',
    title: 'The Self-Made',
    subtitle:
      'No crown, no bloodline, no legend — they forged the King’s will on their own.',
    members: [
      { name: 'Roronoa Zoro', epithet: 'Pirate Hunter' },
      { name: 'Eustass Kid', epithet: 'Captain Kid' },
      { name: 'Benn Beckman', epithet: 'Red Hair’s right hand' },
    ],
  },
  {
    kind: 'follow',
    kicker: 'One Piece of Data',
    title: 'Who’s next?',
    teaserName: 'Sanji',
    teaserCaption:
      'The Monster Trio’s last piece — will the cook awaken the King’s will too?',
    subtitle: 'Follow for weekly One Piece stats, rankings & charts.',
    handle: '@onepieceofdata',
  },
]
