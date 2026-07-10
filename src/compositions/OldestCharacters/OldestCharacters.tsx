import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { OldCharMember, OldCharRow } from './fetch'
import { Watermark } from '../../components/Watermark'

export type OldestCharactersProps = {
  rows: OldCharRow[]
} & Record<string, unknown>

const TITLE_DURATION = 28
const ROW_STAGGER = 15

// Title sits big and centered through CENTER_HOLD (~0.4s at 30fps), then slides
// up into its header slot (shrinking to normal size) by TITLE_SETTLED.
const CENTER_HOLD = 12
const TITLE_SETTLED = 40
const SETTLE = 24
// Short end hold (~1.3s) — reels loop, so a long freeze just reads as dead air.
const END_HOLD = 40

// Hard cap at 6s (180 frames @ 30fps) — mirrors LowestBounties. The natural
// tail runs longer and reads as dead air, so we trim to a tighter loop point.
const MAX_FRAMES = 180

// Reveal runs bottom-up (#N first, #1 last) so the eldest — Zunesha, walking
// for over a millennium — lands as the punchline. Duration = title + every row
// staggered in + a hold to read, clamped to MAX_FRAMES.
export function totalFramesFor(rowCount: number): number {
  const lastStart = TITLE_DURATION + Math.max(0, rowCount - 1) * ROW_STAGGER
  return Math.min(lastStart + SETTLE + END_HOLD, MAX_FRAMES)
}

// Join member names into one label: "A", "A & B", "A, B & C".
function joinNames(names: string[]): string {
  if (names.length <= 1) return names[0] ?? ''
  return `${names.slice(0, -1).join(', ')} & ${names[names.length - 1]}`
}

export function OldestCharacters({ rows }: OldestCharactersProps) {
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
          'linear-gradient(165deg, #0f2027 0%, #203a43 45%, #2c5364 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
        color: 'white',
        padding: '72px 56px',
      }}
    >
      <div
        style={{
          textAlign: 'center',
          marginTop: 12,
          marginBottom: 30,
          transform: `translateY(${titleY}px) scale(${titleScale})`,
        }}
      >
        <div
          style={{
            fontSize: 28,
            letterSpacing: 6,
            color: '#fde047',
            textTransform: 'uppercase',
            fontWeight: 700,
            textShadow: '0 2px 8px rgba(0,0,0,0.35)',
          }}
        >
          Ancient by the databooks
        </div>
        <div
          style={{
            fontWeight: 800,
            marginTop: 6,
            lineHeight: 1.0,
            textShadow: '0 3px 12px rgba(0,0,0,0.4)',
          }}
        >
          <span style={{ fontSize: 72, display: 'block' }}>The Oldest</span>
          <span
            style={{
              fontSize: 30,
              fontWeight: 600,
              letterSpacing: 3,
              color: '#fde047',
              display: 'block',
              margin: '4px 0',
            }}
          >
            characters in
          </span>
          <span style={{ fontSize: 72, display: 'block' }}>One Piece</span>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
        {rows.map((row, i) => {
          // i === 0 is the eldest (#1) and reveals last.
          const rank = i + 1
          const isOldest = i === 0
          const rowStart =
            TITLE_DURATION + (rows.length - 1 - i) * ROW_STAGGER
          const enter = spring({
            frame: frame - rowStart,
            fps,
            config: { damping: 14, stiffness: 120 },
          })
          // Gold pop when the eldest finally lands — flares bright, then settles
          // to a steady glow that holds through the end beat.
          const pop = isOldest
            ? interpolate(frame - rowStart, [0, 10, 26], [0, 1, 0.4], {
                extrapolateLeft: 'clamp',
                extrapolateRight: 'clamp',
              })
            : 0

          const multi = row.members.length > 1
          const nameLabel = joinNames(
            row.members.map((m) => m.name.replace(/_/g, ' '))
          )
          // Longer labels ("1,000+", "153–156") need a smaller figure to fit.
          const ageFontSize = row.ageLabel.length > 5 ? 36 : 48

          return (
            <div
              key={row.key}
              style={{
                opacity: enter,
                transform: `translateY(${(1 - enter) * 36}px) scale(${0.96 + enter * 0.04})`,
                display: 'flex',
                alignItems: 'center',
                gap: 24,
                background: isOldest
                  ? 'rgba(253,224,71,0.92)'
                  : 'rgba(255,255,255,0.16)',
                border: isOldest
                  ? '3px solid #ffffff'
                  : '1px solid rgba(255,255,255,0.28)',
                boxShadow: isOldest
                  ? `0 0 ${22 + pop * 44}px rgba(253,224,71,${0.5 + pop * 0.45})`
                  : '0 2px 10px rgba(0,0,0,0.12)',
                borderRadius: 22,
                padding: '16px 30px 16px 20px',
              }}
            >
              <div
                style={{
                  width: 62,
                  fontSize: 56,
                  fontWeight: 800,
                  color: isOldest ? '#0f2027' : '#ffffff',
                  textAlign: 'center',
                  fontVariantNumeric: 'tabular-nums',
                  textShadow: isOldest ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                {rank}
              </div>

              <AvatarCluster
                members={row.members}
                ring={isOldest ? '#0f2027' : '#ffffff'}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div
                  style={{
                    fontSize: multi ? 34 : 50,
                    fontWeight: 700,
                    color: isOldest ? '#0b141a' : '#ffffff',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    textShadow: isOldest ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
                  }}
                >
                  {nameLabel}
                </div>
                {isOldest && (
                  <div
                    style={{
                      fontSize: 26,
                      color: '#0f2027',
                      fontWeight: 700,
                      marginTop: 2,
                    }}
                  >
                    a full millennium on its feet
                  </div>
                )}
              </div>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'baseline',
                  gap: 6,
                  color: isOldest ? '#0b141a' : '#fde047',
                  textShadow: isOldest ? 'none' : '0 1px 4px rgba(0,0,0,0.3)',
                }}
              >
                <span
                  style={{
                    fontSize: ageFontSize,
                    fontWeight: 800,
                    fontVariantNumeric: 'tabular-nums',
                  }}
                >
                  {row.ageLabel}
                </span>
                <span style={{ fontSize: 24, fontWeight: 700 }}>yrs</span>
              </div>
            </div>
          )
        })}
      </div>

      <Watermark bottom={40} color="rgba(255,255,255,0.7)" />
    </AbsoluteFill>
  )
}

// One avatar for a solo row, or a tight overlapping cluster for a shared row.
function AvatarCluster({
  members,
  ring,
}: {
  members: OldCharMember[]
  ring: string
}) {
  const count = members.length
  const size = count === 1 ? 100 : count === 2 ? 84 : 72
  const overlap = size * 0.42

  return (
    <div style={{ display: 'flex', flexShrink: 0 }}>
      {members.map((m, idx) => (
        <div
          key={m.id}
          style={{
            width: size,
            height: size,
            borderRadius: size / 2,
            overflow: 'hidden',
            background: 'rgba(0,0,0,0.2)',
            boxShadow: `0 0 0 3px ${ring}`,
            marginLeft: idx === 0 ? 0 : -overlap,
            zIndex: count - idx,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {m.imageUrl ? (
            <Img
              src={m.imageUrl}
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
              {m.name.charAt(0)}
            </span>
          )}
        </div>
      ))}
    </div>
  )
}
