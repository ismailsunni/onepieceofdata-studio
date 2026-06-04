import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { BountyEntry } from './fetch'
import { formatBerry } from '../../lib/format'
import { Watermark } from '../../components/Watermark'

export type TopBountiesProps = {
  entries: BountyEntry[]
} & Record<string, unknown>

const TITLE_DURATION = 28
const ROW_STAGGER = 16

// Title sits big and centered through CENTER_HOLD (~0.5s at 30fps), then slides
// up into its header slot (shrinking to normal size) by TITLE_SETTLED.
const CENTER_HOLD = 15
const TITLE_SETTLED = 43
const SETTLE = 24
// Short end hold (~1.2s) — reels loop, so a long freeze just reads as dead air.
const END_HOLD = 36

// Reveal runs bottom-up (#N first, #1 last) so the biggest bounty lands last.
export function totalFramesFor(rowCount: number): number {
  const lastStart = TITLE_DURATION + Math.max(0, rowCount - 1) * ROW_STAGGER
  return lastStart + SETTLE + END_HOLD
}

const AVATAR = 92
const CLUSTER_AVATAR = 88
const CLUSTER_COLS = 4

export function TopBounties({ entries }: TopBountiesProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  // Title pops in big and centered (no fade), holds, then moves up while
  // shrinking to its normal header size as the rows fill in from below.
  const titleY = interpolate(frame, [CENTER_HOLD, TITLE_SETTLED], [800, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })
  const titleScale = interpolate(
    frame,
    [CENTER_HOLD, TITLE_SETTLED],
    [1.45, 1],
    {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.inOut(Easing.cubic),
    }
  )

  return (
    <AbsoluteFill
      style={{
        background:
          'linear-gradient(165deg, #f59e0b 0%, #dc2626 50%, #450a0a 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'white',
        padding: '72px 56px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 40,
          transform: `translateY(${titleY}px) scale(${titleScale})`,
        }}
      >
        <div
          style={{
            fontSize: 30,
            letterSpacing: 8,
            color: '#ffffff',
            textTransform: 'uppercase',
            fontWeight: 700,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          The most wanted
        </div>
        <div
          style={{
            fontSize: 76,
            fontWeight: 800,
            marginTop: 8,
            lineHeight: 1.02,
            textShadow: '0 3px 12px rgba(0,0,0,0.45)',
          }}
        >
          Top 10 Bounties
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        {entries.map((entry, i) => {
          // i === 0 is the highest bounty and reveals last — the climax.
          const isTop = i === 0
          const isTie = entry.members.length > 1
          const rowStart =
            TITLE_DURATION + (entries.length - 1 - i) * ROW_STAGGER
          const enter = spring({
            frame: frame - rowStart,
            fps,
            config: { damping: 14, stiffness: 120 },
          })
          const pop = isTop
            ? interpolate(frame - rowStart, [0, 8, 16], [0, 1, 0], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : 0

          return (
            <div
              key={entry.rank}
              style={{
                opacity: enter,
                transform: `translateX(${(1 - enter) * -60}px)`,
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                // Keep every row the same height — the tie row's small chips
                // shouldn't make it shorter than the portrait rows.
                minHeight: AVATAR,
                background: isTop
                  ? 'rgba(253,224,71,0.92)'
                  : 'rgba(255,255,255,0.16)',
                border: isTop
                  ? '3px solid #ffffff'
                  : '1px solid rgba(255,255,255,0.28)',
                boxShadow: isTop
                  ? `0 0 ${22 + pop * 44}px rgba(253,224,71,${0.5 + pop * 0.45})`
                  : '0 2px 10px rgba(0,0,0,0.12)',
                borderRadius: 22,
                padding: '14px 28px 14px 20px',
              }}
            >
              <div
                style={{
                  width: 58,
                  fontSize: 52,
                  fontWeight: 800,
                  color: isTop ? '#b45309' : '#ffffff',
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: isTop ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                {entry.rank}
              </div>

              {isTie ? (
                <Cluster members={entry.members} />
              ) : (
                <Avatar
                  imageUrl={entry.members[0].imageUrl}
                  name={entry.members[0].name}
                  ring={isTop ? '#b45309' : '#ffffff'}
                />
              )}

              <div style={{ flex: 1, minWidth: 0 }}>
                {isTie ? null : (
                  <>
                    <div
                      style={{
                        fontSize: 48,
                        fontWeight: 700,
                        color: isTop ? '#1a0606' : '#ffffff',
                        whiteSpace: 'nowrap',
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        textShadow: isTop
                          ? 'none'
                          : '0 1px 4px rgba(0,0,0,0.3)',
                      }}
                    >
                      {entry.members[0].name.replace(/_/g, ' ')}
                    </div>
                    {isTop && (
                      <div
                        style={{
                          fontSize: 25,
                          color: '#b45309',
                          fontWeight: 700,
                          marginTop: 2,
                        }}
                      >
                        the highest bounty in history
                      </div>
                    )}
                  </>
                )}
              </div>

              <div
                style={{
                  fontSize: 46,
                  fontWeight: 800,
                  color: isTop ? '#b45309' : '#fde047',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: isTop ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                {formatBerry(entry.bounty)}
              </div>
            </div>
          )
        })}
      </div>

      <Watermark bottom={40} color="rgba(255,255,255,0.75)" />
    </AbsoluteFill>
  )
}

function Avatar({
  imageUrl,
  name,
  ring,
  size = AVATAR,
}: {
  imageUrl: string | null
  name: string
  ring: string
  size?: number
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: size / 2,
        overflow: 'hidden',
        flexShrink: 0,
        background: 'rgba(0,0,0,0.2)',
        boxShadow: `0 0 0 3px ${ring}`,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {imageUrl ? (
        <Img
          src={imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'top',
          }}
        />
      ) : (
        <span
          style={{ fontSize: size * 0.46, fontWeight: 800, color: '#fff' }}
        >
          {name.charAt(0)}
        </span>
      )}
    </div>
  )
}

// Avatar grid for a shared rank (the ฿3.0B tie) — every member, wrapped over
// two rows so the card fills its height like a feature card.
function Cluster({ members }: { members: BountyEntry['members'] }) {
  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${CLUSTER_COLS}, ${CLUSTER_AVATAR}px)`,
        gap: 10,
      }}
    >
      {members.map((m) => (
        <Avatar
          key={m.id}
          imageUrl={m.imageUrl}
          name={m.name}
          ring="#ffffff"
          size={CLUSTER_AVATAR}
        />
      ))}
    </div>
  )
}
