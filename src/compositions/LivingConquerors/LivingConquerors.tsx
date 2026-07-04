import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { LivingConquerorRow } from './fetch'
import { formatBerry } from '../../lib/format'
import { SITE } from '../../components/Watermark'

const SANS = 'system-ui, -apple-system, sans-serif'
const GOLD = '#fbbf24'

export type LivingConquerorsProps = {
  rows: LivingConquerorRow[]
  latestChapter: number | null
} & Record<string, unknown>

const TITLE_DURATION = 30
const ROW_STAGGER = 14

// Title holds big & centered (~0.4s), then rises into its header slot.
const CENTER_HOLD = 12
const TITLE_SETTLED = 42
const SETTLE = 24
// Short end hold (~1.3s) — reels loop, a long freeze reads as dead air.
const END_HOLD = 40

// Duration = title beat + every row staggered in (top-down) + a hold to read.
export function totalFramesFor(rowCount: number): number {
  const lastStart = TITLE_DURATION + Math.max(0, rowCount - 1) * ROW_STAGGER
  return lastStart + SETTLE + END_HOLD
}

const AVATAR = 96

export function LivingConquerors({
  rows,
  latestChapter,
}: LivingConquerorsProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleY = interpolate(frame, [CENTER_HOLD, TITLE_SETTLED], [640, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: Easing.inOut(Easing.cubic),
  })
  const titleScale = interpolate(
    frame,
    [CENTER_HOLD, TITLE_SETTLED],
    [1.4, 1],
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
          'linear-gradient(165deg, #1a1030 0%, #3b0764 48%, #0b0714 100%)',
        fontFamily: SANS,
        color: 'white',
        padding: '84px 52px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginTop: 8,
          marginBottom: 28,
          transform: `translateY(${titleY}px) scale(${titleScale})`,
        }}
      >
        <div
          style={{
            fontSize: 27,
            letterSpacing: 7,
            color: GOLD,
            textTransform: 'uppercase',
            fontWeight: 700,
            textShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        >
          Haoshoku · The King&apos;s Haki
        </div>
        <div
          style={{
            fontWeight: 800,
            marginTop: 8,
            lineHeight: 1.0,
            textShadow: '0 3px 14px rgba(0,0,0,0.45)',
          }}
        >
          <span style={{ fontSize: 78, display: 'block' }}>Conqueror&apos;s</span>
          <span
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: 3,
              color: GOLD,
              display: 'block',
              margin: '6px 0',
            }}
          >
            Haki — still standing
          </span>
          <span style={{ fontSize: 70, display: 'block' }}>Ranked by Bounty</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 15 }}>
        {rows.map((row, i) => {
          const rank = i + 1
          const isTop = i === 0
          // Top-down reveal: #1 (the crown) lands first.
          const rowStart = TITLE_DURATION + i * ROW_STAGGER
          const enter = spring({
            frame: frame - rowStart,
            fps,
            config: { damping: 14, stiffness: 120 },
          })
          const pop = isTop
            ? interpolate(frame - rowStart, [0, 10, 26], [0, 1, 0.45], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : 0

          return (
            <div
              key={row.id}
              style={{
                opacity: enter,
                transform: `translateY(${(1 - enter) * 34}px) scale(${0.96 + enter * 0.04})`,
                display: 'flex',
                alignItems: 'center',
                gap: 22,
                background: isTop
                  ? 'rgba(251,191,36,0.92)'
                  : 'rgba(255,255,255,0.14)',
                border: isTop
                  ? '3px solid #ffffff'
                  : '1px solid rgba(255,255,255,0.26)',
                boxShadow: isTop
                  ? `0 0 ${22 + pop * 46}px rgba(251,191,36,${0.5 + pop * 0.45})`
                  : '0 2px 10px rgba(0,0,0,0.14)',
                borderRadius: 20,
                padding: '14px 28px 14px 18px',
              }}
            >
              <div
                style={{
                  width: 58,
                  fontSize: 52,
                  fontWeight: 800,
                  color: isTop ? '#7c2d12' : '#ffffff',
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: isTop ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                {rank}
              </div>

              <Avatar
                imageUrl={row.imageUrl}
                name={row.name}
                ring={isTop ? '#7c2d12' : '#ffffff'}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: 46,
                    fontWeight: 700,
                    color: isTop ? '#1a0b02' : '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: isTop ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {row.name.replace(/_/g, ' ')}
                </div>
                {row.crew && (
                  <div
                    style={{
                      fontSize: 25,
                      color: isTop
                        ? 'rgba(41,15,2,0.75)'
                        : 'rgba(255,255,255,0.72)',
                      fontWeight: 600,
                      marginTop: 2,
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                      textShadow: isTop ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
                    }}
                  >
                    {row.crew}
                  </div>
                )}
              </div>

              <div
                style={{
                  fontSize: 44,
                  fontWeight: 800,
                  color: isTop ? '#7c2d12' : GOLD,
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: isTop ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                {formatBerry(row.bounty)}
              </div>
            </div>
          )
        })}
      </div>

      <Footer latestChapter={latestChapter} />
    </AbsoluteFill>
  )
}

function Footer({ latestChapter }: { latestChapter: number | null }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 40,
        left: 0,
        right: 0,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 4,
        fontFamily: SANS,
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          fontSize: 22,
          letterSpacing: '0.1em',
          fontWeight: 600,
          color: 'rgba(245,245,245,0.5)',
        }}
      >
        {SITE}
      </div>
      {latestChapter !== null && (
        <div
          style={{
            fontSize: 16,
            fontWeight: 500,
            letterSpacing: 2,
            color: 'rgba(245,245,245,0.38)',
          }}
        >
          alive as of ch. {latestChapter}
        </div>
      )}
    </div>
  )
}

function Avatar({
  imageUrl,
  name,
  ring,
}: {
  imageUrl: string | null
  name: string
  ring: string
}) {
  return (
    <div
      style={{
        width: AVATAR,
        height: AVATAR,
        borderRadius: AVATAR / 2,
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
        <span style={{ fontSize: AVATAR * 0.46, fontWeight: 800, color: '#fff' }}>
          {name.charAt(0)}
        </span>
      )}
    </div>
  )
}
