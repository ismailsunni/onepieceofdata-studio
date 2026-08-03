import { Composition } from 'remotion'
import {
  TopBounties,
  TopBountiesProps,
  totalFramesFor as topBountiesFrames,
} from './compositions/TopBounties/TopBounties'
import { fetchTopBounties } from './compositions/TopBounties/fetch'
import {
  BountyNoFruit,
  totalFramesFor as bountyNoFruitFrames,
} from './compositions/BountyNoFruit/BountyNoFruit'
import { fetchBountyNoFruit } from './compositions/BountyNoFruit/fetch'
import {
  LowestBounties,
  totalFramesFor as lowestBountiesFrames,
} from './compositions/LowestBounties/LowestBounties'
import { fetchLowestBounties } from './compositions/LowestBounties/fetch'
import {
  EastBlueWeakest,
  EastBlueWeakestProps,
  totalFrames as eastBlueWeakestFrames,
} from './compositions/EastBlueWeakest/EastBlueWeakest'
import {
  fetchLatestChapter,
  fetchSeaCards,
} from './compositions/EastBlueWeakest/fetch'
import {
  TopSnubbed,
  totalFrames as topSnubbedFrames,
} from './compositions/TopSnubbed/TopSnubbed'
import { loadSnubbedSnapshot } from './compositions/TopSnubbed/fetch'
import {
  Top100Wishlist,
  SLIDE_WIDTH,
  SLIDE_HEIGHT,
} from './compositions/Top100Wishlist/Top100Wishlist'
import { loadWishlistSnapshot } from './compositions/Top100Wishlist/fetch'
import { First100Chapters } from './compositions/First100Chapters/First100Chapters'
import { loadFirst100Snapshot } from './compositions/First100Chapters/fetch'
import { VanishedPreSkip } from './compositions/VanishedPreSkip/VanishedPreSkip'
import { loadVanishedSnapshot } from './compositions/VanishedPreSkip/fetch'
import {
  AppearanceRace,
  totalFramesFor as appearanceRaceFrames,
} from './compositions/AppearanceRace/AppearanceRace'
import { loadAppearanceRaceSnapshot } from './compositions/AppearanceRace/fetch'
import {
  ArcLengthRanking,
  totalFramesFor as arcLengthRankingFrames,
} from './compositions/ArcLengthRanking/ArcLengthRanking'
import { loadArcRankingSnapshot } from './compositions/ArcLengthRanking/fetch'
import { WorldCupOnePiece } from './compositions/WorldCupOnePiece/WorldCupOnePiece'
import { loadWorldCupSnapshot } from './compositions/WorldCupOnePiece/fetch'
import { WorldCupBirthdays } from './compositions/WorldCupBirthdays/WorldCupBirthdays'
import { loadBirthdaysSnapshot } from './compositions/WorldCupBirthdays/fetch'
import {
  WorldCupBirthdaysReel,
  totalFramesFor as birthdaysReelFrames,
} from './compositions/WorldCupBirthdays/WorldCupBirthdaysReel'
import {
  LivingConquerors,
  totalFramesFor as livingConquerorsFrames,
} from './compositions/LivingConquerors/LivingConquerors'
import {
  fetchLivingConquerors,
  fetchLatestChapter as fetchLivingConquerorsChapter,
} from './compositions/LivingConquerors/fetch'
import { ConquerorsRoster } from './compositions/ConquerorsRoster/ConquerorsRoster'
import { loadConquerorsRosterSnapshot } from './compositions/ConquerorsRoster/fetch'
import {
  OldestCharacters,
  totalFramesFor as oldestCharactersFrames,
} from './compositions/OldestCharacters/OldestCharacters'
import { fetchOldestCharacters } from './compositions/OldestCharacters/fetch'
import {
  OnePieceBirthdays,
  SLIDE_WIDTH as birthdaysSlideWidth,
  SLIDE_HEIGHT as birthdaysSlideHeight,
} from './compositions/OnePieceBirthdays/OnePieceBirthdays'
import { loadOnePieceBirthdaysSnapshot } from './compositions/OnePieceBirthdays/fetch'
import {
  OneChapterWonders,
  totalFramesFor as oneChapterWondersFrames,
} from './compositions/OneChapterWonders/OneChapterWonders'
import { loadOneChapterWondersSnapshot } from './compositions/OneChapterWonders/fetch'
import {
  InheritedFruitsPart1,
  InheritedFruitsPart2,
  framesForPart as inheritedFruitsFrames,
} from './compositions/InheritedFruits/InheritedFruits'
import { loadInheritedFruitsSnapshot } from './compositions/InheritedFruits/fetch'

// Instagram Reels: 9:16 portrait, 1080x1920, 30fps.
const REEL_WIDTH = 1080
const REEL_HEIGHT = 1920
const REEL_FPS = 30

export function Root() {
  return (
    <>
      <Composition
        id="TopBounties"
        component={TopBounties}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={topBountiesFrames(10)}
        defaultProps={{ entries: [] }}
        calculateMetadata={async ({ props }) => {
          const entries = await fetchTopBounties(10)
          return {
            props: { ...props, entries },
            durationInFrames: topBountiesFrames(entries.length),
          }
        }}
      />

      <Composition
        id="BountyNoFruit"
        component={BountyNoFruit}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={bountyNoFruitFrames(10)}
        defaultProps={{ entries: [] }}
        calculateMetadata={async ({ props }) => {
          const entries = await fetchBountyNoFruit(10)
          return {
            props: { ...props, entries },
            durationInFrames: bountyNoFruitFrames(entries.length),
          }
        }}
      />

      <Composition
        id="LowestBounties"
        component={LowestBounties}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={lowestBountiesFrames(10)}
        defaultProps={{ rows: [] }}
        calculateMetadata={async ({ props }) => {
          const rows = await fetchLowestBounties(10)
          return {
            props: { ...props, rows },
            durationInFrames: lowestBountiesFrames(rows.length),
          }
        }}
      />

      <Composition
        id="EastBlueWeakest"
        component={EastBlueWeakest}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        // Placeholder; calculateMetadata sets the real duration once we know
        // how many sea cards came back.
        durationInFrames={REEL_FPS * 30}
        defaultProps={{ cards: [], latestChapter: null }}
        calculateMetadata={async ({ props }) => {
          const [cards, latestChapter] = await Promise.all([
            fetchSeaCards(),
            fetchLatestChapter(),
          ])
          return {
            props: { ...props, cards, latestChapter },
            durationInFrames: eastBlueWeakestFrames(cards.length),
          }
        }}
      />
      <Composition
        id="TopSnubbed"
        component={TopSnubbed}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={REEL_FPS * 18}
        defaultProps={{ rows: [], latestChapter: null }}
        calculateMetadata={async ({ props }) => {
          const { rows, throughChapter } = await loadSnubbedSnapshot(5)
          return {
            props: { ...props, rows, latestChapter: throughChapter },
            durationInFrames: topSnubbedFrames(rows.length),
          }
        }}
      />
      <Composition
        id="First100Chapters"
        component={First100Chapters}
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
        fps={1}
        durationInFrames={1}
        defaultProps={{ slides: [], latestChapter: null }}
        calculateMetadata={async ({ props }) => {
          const { slides, latestChapter } = await loadFirst100Snapshot()
          return {
            props: { ...props, slides, latestChapter },
            durationInFrames: Math.max(slides.length, 1),
          }
        }}
      />
      <Composition
        id="VanishedPreSkip"
        component={VanishedPreSkip}
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
        fps={1}
        durationInFrames={1}
        defaultProps={{ slides: [], latestChapter: null }}
        calculateMetadata={async ({ props }) => {
          const { slides, latestChapter } = await loadVanishedSnapshot()
          return {
            props: { ...props, slides, latestChapter },
            durationInFrames: Math.max(slides.length, 1),
          }
        }}
      />
      <Composition
        id="AppearanceRace"
        component={AppearanceRace}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={360}
        defaultProps={{ snapshot: null }}
        calculateMetadata={async ({ props }) => {
          const snapshot = await loadAppearanceRaceSnapshot()
          return {
            props: { ...props, snapshot },
            durationInFrames: appearanceRaceFrames(snapshot),
          }
        }}
      />
      <Composition
        id="ArcLengthRanking"
        component={ArcLengthRanking}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={490}
        defaultProps={{ snapshot: null }}
        calculateMetadata={async ({ props }) => {
          const snapshot = await loadArcRankingSnapshot()
          return {
            props: { ...props, snapshot },
            durationInFrames: arcLengthRankingFrames(snapshot),
          }
        }}
      />
      <Composition
        id="Top100Wishlist"
        component={Top100Wishlist}
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
        // Carousel: 1 frame per slide. Render with `npm run carousel`.
        fps={1}
        durationInFrames={1}
        defaultProps={{ slides: [], latestChapter: null }}
        calculateMetadata={async ({ props }) => {
          const { slides, latestChapter } = await loadWishlistSnapshot()
          return {
            props: { ...props, slides, latestChapter },
            durationInFrames: Math.max(slides.length, 1),
          }
        }}
      />
      <Composition
        id="WorldCupOnePiece"
        component={WorldCupOnePiece}
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
        // Carousel: 1 frame per slide. Render with `npm run carousel`.
        fps={1}
        durationInFrames={1}
        defaultProps={{ slides: [], latestChapter: null }}
        calculateMetadata={async ({ props }) => {
          const { slides, latestChapter } = await loadWorldCupSnapshot()
          return {
            props: { ...props, slides, latestChapter },
            durationInFrames: Math.max(slides.length, 1),
          }
        }}
      />
      <Composition
        id="WorldCupBirthdays"
        component={WorldCupBirthdays}
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
        // Carousel: 1 frame per slide. Render with `npm run carousel`.
        fps={1}
        durationInFrames={1}
        defaultProps={{ slides: [], latestChapter: null }}
        calculateMetadata={async ({ props }) => {
          const { slides, latestChapter } = await loadBirthdaysSnapshot()
          return {
            props: { ...props, slides, latestChapter },
            durationInFrames: Math.max(slides.length, 1),
          }
        }}
      />
      <Composition
        id="WorldCupBirthdaysReel"
        component={WorldCupBirthdaysReel}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={birthdaysReelFrames(4)}
        defaultProps={{ slides: [], latestChapter: null }}
        calculateMetadata={async ({ props }) => {
          const { slides, latestChapter } = await loadBirthdaysSnapshot()
          const matchCount = slides.filter((s) => s.kind === 'match').length
          return {
            props: { ...props, slides, latestChapter },
            durationInFrames: birthdaysReelFrames(matchCount),
          }
        }}
      />
      <Composition
        id="LivingConquerors"
        component={LivingConquerors}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={livingConquerorsFrames(9)}
        defaultProps={{ rows: [], latestChapter: null }}
        calculateMetadata={async ({ props }) => {
          const [rows, latestChapter] = await Promise.all([
            fetchLivingConquerors(10),
            fetchLivingConquerorsChapter(),
          ])
          return {
            props: { ...props, rows, latestChapter },
            durationInFrames: livingConquerorsFrames(rows.length),
          }
        }}
      />
      <Composition
        id="OldestCharacters"
        component={OldestCharacters}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={oldestCharactersFrames(10)}
        defaultProps={{ rows: [] }}
        calculateMetadata={async ({ props }) => {
          const rows = await fetchOldestCharacters(10)
          return {
            props: { ...props, rows },
            durationInFrames: oldestCharactersFrames(rows.length),
          }
        }}
      />
      <Composition
        id="OnePieceBirthdays"
        component={OnePieceBirthdays}
        width={birthdaysSlideWidth}
        height={birthdaysSlideHeight}
        fps={1}
        durationInFrames={1}
        defaultProps={{ moments: [] }}
        calculateMetadata={async ({ props }) => {
          const { moments } = await loadOnePieceBirthdaysSnapshot()
          return {
            props: { ...props, moments },
            // Cover + groups of three birthdays + closer.
            durationInFrames: Math.ceil(moments.length / 3) + 2,
          }
        }}
      />
      <Composition
        id="OneChapterWonders"
        component={OneChapterWonders}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={oneChapterWondersFrames(5)}
        defaultProps={{ questions: [], totalPoints: 0, correctCount: 0 }}
        calculateMetadata={async ({ props }) => {
          const snapshot = await loadOneChapterWondersSnapshot()
          return {
            props: { ...props, ...snapshot },
            durationInFrames: oneChapterWondersFrames(snapshot.questions.length),
          }
        }}
      />
      <Composition
        id="InheritedFruitsPart1"
        component={InheritedFruitsPart1}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={inheritedFruitsFrames(10, 1)}
        defaultProps={{ fruits: [] }}
        calculateMetadata={async ({ props }) => {
          const snapshot = await loadInheritedFruitsSnapshot()
          return {
            props: { ...props, ...snapshot },
            durationInFrames: inheritedFruitsFrames(snapshot.fruits.length, 1),
          }
        }}
      />
      <Composition
        id="InheritedFruitsPart2"
        component={InheritedFruitsPart2}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={inheritedFruitsFrames(10, 2)}
        defaultProps={{ fruits: [] }}
        calculateMetadata={async ({ props }) => {
          const snapshot = await loadInheritedFruitsSnapshot()
          return {
            props: { ...props, ...snapshot },
            durationInFrames: inheritedFruitsFrames(snapshot.fruits.length, 2),
          }
        }}
      />
      <Composition
        id="ConquerorsRoster"
        component={ConquerorsRoster}
        width={SLIDE_WIDTH}
        height={SLIDE_HEIGHT}
        fps={1}
        durationInFrames={1}
        defaultProps={{ slides: [], latestChapter: null }}
        calculateMetadata={async ({ props }) => {
          const { slides, latestChapter } = await loadConquerorsRosterSnapshot()
          return {
            props: { ...props, slides, latestChapter },
            durationInFrames: Math.max(slides.length, 1),
          }
        }}
      />
    </>
  )
}
