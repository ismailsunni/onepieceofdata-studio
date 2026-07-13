// Editorial slide specs for the "World Cup Icons × One Piece — Birthday Twins"
// carousel.
//
// The premise: the four biggest icons of the 2026 World Cup semifinal picture
// each share their real-world birthday with a One Piece character. Every
// `match` slide pairs a footballer (nation flag + birthday) with the character
// born the same day, fronted by that character's portrait.
//
// Birthdays are the real players' dates of birth; each `characterName` is the
// One Piece character whose canonical SBS birthday (the `birth` column in the
// Supabase `character` table) is the exact same day. fetch.ts resolves the
// portrait. `teamCode` is an ISO 3166-1 code (or `gb-eng`) for the flag CDN.
// `theme` is the card's hero colour (the player's nation), which the gradient
// blends down into the One Piece purple.

export type SlideSpec =
  | {
      kind: 'cover'
      kicker: string
      title: string
      subtitle: string
    }
  | {
      kind: 'match'
      // ── Football side ───────────────────────────────
      player: string
      team: string
      teamCode: string
      playerRole: string
      /** Freely-licensed player photo (Wikimedia Commons, CC-BY-SA). */
      playerImageUrl: string
      /** CSS object-position for the circular crop. */
      playerImagePosition: string
      theme: string
      // ── The shared day ──────────────────────────────
      birthday: string // e.g. "June 24"
      // ── One Piece side ──────────────────────────────
      characterName: string
      characterRole: string
      arcTag: string
      detail: string
    }
  | {
      kind: 'closer'
      kicker: string
      title: string
      question: string
      handle: string
    }

export const SLIDES: SlideSpec[] = [
  {
    kind: 'cover',
    kicker: 'Birthday Twins',
    title: 'WORLD CUP\nICONS\n×\nONE PIECE',
    subtitle:
      'Four faces of the 2026 World Cup — and the One Piece character who blows out the candles on the exact same day.',
  },
  {
    kind: 'match',
    player: 'Kylian Mbappé',
    team: 'France',
    teamCode: 'fr',
    playerRole: 'Forward',
    playerImageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/9/95/Kylian_Mbappe_France_v_Senegal_16_June_2026-391_%28cropped%29.jpg/960px-Kylian_Mbappe_France_v_Senegal_16_June_2026-391_%28cropped%29.jpg',
    playerImagePosition: '50% 15%',
    theme: '#274bad',
    birthday: 'December 20',
    characterName: 'Charlotte Marnier',
    characterRole: 'Minister of Yeast',
    arcTag: 'Totto Land',
    detail:
      "Mbappé fronts a golden generation; Marnier was born into the biggest dynasty of all — the 13th daughter among Big Mom's 85-child Charlotte family.",
  },
  {
    kind: 'match',
    player: 'Lamine Yamal',
    team: 'Spain',
    teamCode: 'es',
    playerRole: 'Winger · wonderkid',
    playerImageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/c/c9/Lamine_Yamal_a_Xina_%282025%29.png',
    playerImagePosition: '50% 20%',
    theme: '#c8102e',
    birthday: 'July 13',
    characterName: 'Queen',
    characterRole: 'Beasts Pirates All-Star',
    arcTag: 'Wano',
    detail:
      'The teenage phenom shares his day with a ฿1.32B showman four decades his senior — Queen the Plague, the flashiest of Kaido’s three All-Stars.',
  },
  {
    kind: 'match',
    player: 'Harry Kane',
    team: 'England',
    teamCode: 'gb-eng',
    playerRole: 'Striker · captain',
    playerImageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/a/a3/Harry_Kane_England_v_Ghana_23_June_2026-219_%28cropped%29.jpg/960px-Harry_Kane_England_v_Ghana_23_June_2026-219_%28cropped%29.jpg',
    playerImagePosition: '50% 12%',
    theme: '#c1121f',
    birthday: 'July 28',
    characterName: 'Flapper',
    characterRole: 'Tontatta warrior',
    arcTag: 'Dressrosa',
    detail:
      "England's towering No.9 shares a birthday with one of the tiniest fighters around — Flapper, a Tontatta dwarf who fought in the battle for Dressrosa.",
  },
  {
    kind: 'match',
    player: 'Lionel Messi',
    team: 'Argentina',
    teamCode: 'ar',
    playerRole: 'Forward · the GOAT',
    playerImageUrl:
      'https://upload.wikimedia.org/wikipedia/commons/thumb/c/c8/Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg/960px-Leo_Messi_Argentina_v_Egypt_7_July_2026-1.jpg',
    playerImagePosition: '50% 18%',
    theme: '#3f7fd6',
    birthday: 'June 24',
    characterName: 'Ryuboshi',
    characterRole: 'Prince of Ryugu Kingdom',
    arcTag: 'Fish-Man Island',
    detail:
      "Football has its GOAT; the sea has its prince. Ryuboshi is the second son of the royal Neptune Family — an oarfish merman who'd rather sing than fight.",
  },
  {
    kind: 'closer',
    kicker: 'Same Day, Different Seas',
    title: 'Whose\nbirthday twin\nwins?',
    question:
      'Four icons, four characters, four shared birthdays. Which pairing is your favourite?',
    handle: 'onepieceofdata.com',
  },
]
