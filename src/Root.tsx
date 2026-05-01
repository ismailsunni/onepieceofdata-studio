import { Composition } from 'remotion'
import { TopBounties, TopBountiesProps } from './compositions/TopBounties/TopBounties'
import { fetchTopBounties } from './compositions/TopBounties/fetch'

// Instagram Reels: 9:16 portrait, 1080x1920, 30fps.
const REEL_WIDTH = 1080
const REEL_HEIGHT = 1920
const REEL_FPS = 30

export function Root() {
  return (
    <>
      <Composition<TopBountiesProps>
        id="TopBounties"
        component={TopBounties}
        width={REEL_WIDTH}
        height={REEL_HEIGHT}
        fps={REEL_FPS}
        durationInFrames={REEL_FPS * 12}
        defaultProps={{ rows: [] }}
        calculateMetadata={async ({ props }) => {
          const rows = await fetchTopBounties(10)
          return { props: { ...props, rows } }
        }}
      />
    </>
  )
}
