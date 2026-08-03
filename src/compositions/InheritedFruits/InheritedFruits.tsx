import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { FruitLink, FruitSuccessionEntry } from './fetch'
import { Watermark } from '../../components/Watermark'

export type InheritedFruitsProps = {
  fruits: FruitSuccessionEntry[]
  /** 1 or 2 — the list is too long for one reel, so it's split in half. */
  part?: 1 | 2
} & Record<string, unknown>

const SANS = 'system-ui, -apple-system, sans-serif'
const GOLD = '#fbbf24'

// Intro hook → one full-screen scene per fruit → CTA outro.
const INTRO_FRAMES = 66
const PAIR_FRAMES = 90
const OUTRO_FRAMES = 78

/** Fruits belonging to `part`, plus the index the part starts at overall. */
export function sliceForPart(
  fruits: FruitSuccessionEntry[],
  part: 1 | 2
): { slice: FruitSuccessionEntry[]; startIndex: number } {
  const split = Math.ceil(fruits.length / 2)
  return part === 1
    ? { slice: fruits.slice(0, split), startIndex: 0 }
    : { slice: fruits.slice(split), startIndex: split }
}

export function totalFramesFor(fruitCount: number): number {
  return INTRO_FRAMES + fruitCount * PAIR_FRAMES + OUTRO_FRAMES
}

export function framesForPart(totalFruits: number, part: 1 | 2): number {
  const split = Math.ceil(totalFruits / 2)
  return totalFramesFor(part === 1 ? split : totalFruits - split)
}

function bgFor(index: number): string {
  const PALETTE = [
    '#7c2d12, #7e22ce',
    '#0f766e, #1e40af',
    '#9d174d, #581c87',
    '#78350f, #7f1d1d',
    '#164e63, #4c1d95',
  ]
  return PALETTE[index % PALETTE.length]
}

function Skull({ size = 30, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M12 3C7.6 3 5 6 5 9.5c0 2 .9 3.3 1.8 4.3.4.4.7.9.7 1.5v1.2c0 .8.7 1.5 1.5 1.5h1v1.5a1 1 0 0 0 1 1h2a1 1 0 0 0 1-1V18h1c.8 0 1.5-.7 1.5-1.5v-1.2c0-.6.3-1.1.7-1.5.9-1 1.8-2.3 1.8-4.3C19 6 16.4 3 12 3Z"
        fill={color}
      />
      <circle cx="9" cy="10" r="1.6" fill="#14071f" />
      <circle cx="15" cy="10" r="1.6" fill="#14071f" />
    </svg>
  )
}

// ── Intro ────────────────────────────────────────────────────────────────
function Intro({ count, part }: { count: number; part: 1 | 2 }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const badge = spring({ frame, fps, config: { damping: 12, stiffness: 200 } })
  const title = spring({ frame: frame - 4, fps, config: { damping: 15, stiffness: 120 } })
  const sub = interpolate(frame, [16, 30], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const out = interpolate(frame, [INTRO_FRAMES - 10, INTRO_FRAMES], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(165deg, #7c2d12 0%, #7e22ce 55%, #1e1b4b 100%)',
        fontFamily: SANS,
        color: 'white',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 64px',
        opacity: out,
      }}
    >
      <div
        style={{
          transform: `scale(${interpolate(badge, [0, 1], [0.6, 1])})`,
          opacity: badge,
          marginBottom: 40,
          padding: '18px 40px',
          borderRadius: 999,
          background: GOLD,
          color: '#1e1b4b',
          fontSize: 36,
          fontWeight: 900,
          letterSpacing: 3,
        }}
      >
        WHEN THE USER DIES · PART {part}
      </div>
      <div
        style={{
          transform: `translateY(${interpolate(title, [0, 1], [50, 0])}px) scale(${interpolate(title, [0, 1], [0.85, 1])})`,
          opacity: title,
          fontSize: 100,
          fontWeight: 900,
          lineHeight: 1.02,
          color: GOLD,
          textShadow: '0 6px 30px rgba(0,0,0,0.4)',
        }}
      >
        {count} DEVIL FRUITS
        <br />
        EATEN TWICE
      </div>
      <div
        style={{
          opacity: sub,
          marginTop: 48,
          fontSize: 46,
          fontWeight: 600,
          lineHeight: 1.35,
          color: 'rgba(255,255,255,0.92)',
        }}
      >
        The fruit returns to the world —
        <br />
        someone always finds it again.
      </div>
    </AbsoluteFill>
  )
}

// ── One fruit, one full screen: from → to ───────────────────────────────
function Portrait({ link, size, ring }: { link: FruitLink; size: number; ring: string }) {
  const initials = link.name
    .split(/[\s_]+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `6px solid ${ring}`,
        background: 'rgba(0,0,0,0.45)',
        boxShadow: '0 16px 42px rgba(0,0,0,0.55)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
      }}
    >
      {link.imageUrl ? (
        <Img src={link.imageUrl} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
      ) : (
        <span style={{ fontSize: size * 0.32, fontWeight: 900, color: ring }}>{initials}</span>
      )}
    </div>
  )
}

function Pips({ total, index }: { total: number; index: number }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap', maxWidth: 760 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === index ? 44 : 16,
            height: 16,
            borderRadius: 999,
            background: i === index ? GOLD : 'rgba(255,255,255,0.35)',
          }}
        />
      ))}
    </div>
  )
}

function PairingScene({
  entry,
  index,
  total,
}: {
  entry: FruitSuccessionEntry
  index: number
  total: number
}) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const isFinale = index === total - 1

  const fromIn = spring({ frame, fps, config: { damping: 16, stiffness: 110 } })
  const toIn = spring({ frame: frame - 6, fps, config: { damping: 16, stiffness: 110 } })
  const badgeIn = spring({ frame: frame - 20, fps, config: { damping: 12, stiffness: 150 } })
  const noteIn = interpolate(frame, [30, 46], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })

  const [from0, from1] = bgFor(index).split(', ')

  return (
    <AbsoluteFill
      style={{
        background: `linear-gradient(165deg, ${from0} 0%, ${from1} 55%, #1e1b4b 100%)`,
        fontFamily: SANS,
        color: '#fff',
        padding: '90px 36px 140px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 34,
            letterSpacing: 5,
            textTransform: 'uppercase',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          <Skull size={36} /> Fruit {index + 1} of {total}
        </div>
        <div style={{ marginTop: 20, display: 'flex', justifyContent: 'center' }}>
          <Pips total={total} index={index} />
        </div>
      </div>

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-evenly' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'center', gap: 4 }}>
          <div
            style={{
              width: 430,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: fromIn,
              transform: `translateX(${(1 - fromIn) * -300}px)`,
            }}
          >
            <Portrait link={entry.from} size={380} ring="rgba(255,255,255,0.85)" />
            <div style={{ fontSize: 52, fontWeight: 800, marginTop: 24, textAlign: 'center', lineHeight: 1.05 }}>
              {entry.from.name.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginTop: 10 }}>
              first eater
            </div>
          </div>

          <div
            style={{
              alignSelf: 'center',
              marginTop: -60,
              width: 104,
              height: 104,
              borderRadius: '50%',
              background: GOLD,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: '0 12px 30px rgba(0,0,0,0.5)',
              flexShrink: 0,
              transform: `scale(${badgeIn})`,
              zIndex: 5,
            }}
          >
            <svg width="52" height="38" viewBox="0 0 28 20" fill="none">
              <path d="M2 10h22m0 0-7-7m7 7-7 7" stroke="#14071f" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>

          <div
            style={{
              width: 430,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              opacity: toIn,
              transform: `translateX(${(1 - toIn) * 300}px)`,
            }}
          >
            <Portrait link={entry.to} size={380} ring={GOLD} />
            <div style={{ fontSize: 52, fontWeight: 800, marginTop: 24, textAlign: 'center', lineHeight: 1.05 }}>
              {entry.to.name.replace(/_/g, ' ')}
            </div>
            <div style={{ fontSize: 32, fontWeight: 600, color: GOLD, marginTop: 10 }}>second eater</div>
          </div>
        </div>

        <div style={{ display: 'flex', justifyContent: 'center', transform: `scale(${badgeIn})` }}>
          <div
            style={{
              background: GOLD,
              color: '#14071f',
              borderRadius: 999,
              padding: '22px 52px',
              boxShadow: '0 14px 34px rgba(0,0,0,0.45)',
              textAlign: 'center',
            }}
          >
            <div style={{ fontSize: 28, fontWeight: 800, letterSpacing: 2, textTransform: 'uppercase', opacity: 0.75 }}>
              {entry.englishName}
            </div>
            <div style={{ fontSize: isFinale ? 72 : 62, fontWeight: 900, marginTop: 6, letterSpacing: -0.5 }}>
              {entry.fruitName}
            </div>
          </div>
        </div>

        <div
          style={{
            fontSize: 48,
            fontWeight: 500,
            lineHeight: 1.4,
            textAlign: 'center',
            color: 'rgba(255,255,255,0.95)',
            opacity: noteIn,
            transform: `translateY(${(1 - noteIn) * 20}px)`,
          }}
        >
          {entry.note}
        </div>
      </div>
    </AbsoluteFill>
  )
}

// ── Outro ────────────────────────────────────────────────────────────────
function Outro({ part }: { part: 1 | 2 }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const enter = spring({ frame, fps, config: { damping: 16, stiffness: 110 } })
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(165deg, #7c2d12 0%, #7e22ce 55%, #1e1b4b 100%)',
        fontFamily: SANS,
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 72px',
      }}
    >
      <div style={{ opacity: enter, transform: `translateY(${(1 - enter) * 40}px)` }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 34,
            letterSpacing: 6,
            color: GOLD,
            textTransform: 'uppercase',
            fontWeight: 800,
            marginBottom: 26,
          }}
        >
          <Skull size={38} /> {part === 1 ? 'Part 2 is up next' : 'Which one surprised you?'}
        </div>
        <div style={{ fontSize: 104, fontWeight: 900, lineHeight: 1.05, letterSpacing: -3 }}>
          {part === 1 ? (
            <>
              Bigger names
              <br />
              in Part 2.
            </>
          ) : (
            <>
              Some fruits
              <br />
              get a second life.
            </>
          )}
        </div>
        <div
          style={{
            marginTop: 48,
            display: 'inline-block',
            background: 'rgba(0,0,0,0.4)',
            border: `3px solid ${GOLD}`,
            borderRadius: 26,
            padding: '24px 48px',
            fontSize: 54,
            fontWeight: 800,
            color: GOLD,
          }}
        >
          onepieceofdata.com
        </div>
        <div style={{ marginTop: 30, fontSize: 34, fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>
          Follow for more One Piece data.
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function InheritedFruits({ fruits, part = 1 }: InheritedFruitsProps) {
  if (fruits.length === 0) return <AbsoluteFill style={{ background: '#000' }} />
  const { slice, startIndex } = sliceForPart(fruits, part)

  return (
    <AbsoluteFill style={{ background: '#1e1b4b' }}>
      <Sequence durationInFrames={INTRO_FRAMES}>
        <Intro count={fruits.length} part={part} />
      </Sequence>
      {slice.map((entry, i) => (
        <Sequence key={entry.fruitName} from={INTRO_FRAMES + i * PAIR_FRAMES} durationInFrames={PAIR_FRAMES}>
          <PairingScene entry={entry} index={startIndex + i} total={fruits.length} />
        </Sequence>
      ))}
      <Sequence from={INTRO_FRAMES + slice.length * PAIR_FRAMES}>
        <Outro part={part} />
      </Sequence>
      <Watermark bottom={40} color="rgba(255,255,255,0.7)" />
    </AbsoluteFill>
  )
}

export const InheritedFruitsPart1 = (props: InheritedFruitsProps) => (
  <InheritedFruits {...props} part={1} />
)
export const InheritedFruitsPart2 = (props: InheritedFruitsProps) => (
  <InheritedFruits {...props} part={2} />
)
