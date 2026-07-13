import {
  AbsoluteFill,
  Img,
  Sequence,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import { Watermark } from '../../components/Watermark'
import type { ResolvedMatch, ResolvedSlide } from './fetch'

export type WorldCupBirthdaysReelProps = {
  slides: ResolvedSlide[]
  latestChapter: number | null
} & Record<string, unknown>

// Instagram Reel: 1080×1920, 9:16, 30 fps.
const SANS = 'system-ui, -apple-system, sans-serif'
const GOLD = '#fbbf24'
const PITCH = '#34d399'

// Segment lengths (frames @ 30fps): a bracket intro, one reveal per
// semifinalist, then a CTA outro.
const INTRO_FRAMES = 84
const PAIR_FRAMES = 96
const RECAP_FRAMES = 132
const OUTRO_FRAMES = 84

export function totalFramesFor(matchCount: number): number {
  return INTRO_FRAMES + matchCount * PAIR_FRAMES + RECAP_FRAMES + OUTRO_FRAMES
}

// ── Small marks (emoji render poorly in headless stills, so we draw them) ──
function Trophy({ size = 40, color = GOLD }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M7 4h10v5a5 5 0 0 1-10 0V4Z" fill={color} />
      <path
        d="M7 5H4.5A1.5 1.5 0 0 0 3 6.5C3 8.5 4.5 10 7 10M17 5h2.5A1.5 1.5 0 0 1 21 6.5C21 8.5 19.5 10 17 10"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
      />
      <path
        d="M12 14v3m-3 3h6m-5 0c0-1.5 1-2 2-2s2 .5 2 2"
        stroke={color}
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

function Cake({ size = 34, color = '#14071f' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path d="M4 21h16v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6Z" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
      <path
        d="M4 17c1.6 0 1.6 1.2 3.2 1.2S8.8 17 10.4 17s1.6 1.2 3.2 1.2S15.2 17 16.8 17 18.4 18.2 20 18.2"
        stroke={color}
        strokeWidth="1.6"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 13V9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="6.5" r="1.4" fill={color} />
    </svg>
  )
}

// ── Portraits ─────────────────────────────────────────────────────────────
function PlayerPortrait({
  url,
  position,
  flagUrl,
  size,
}: {
  url: string
  position: string
  flagUrl: string
  size: number
}) {
  const flagW = Math.round(size * 0.42)
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '6px solid rgba(255,255,255,0.95)',
          background: 'rgba(0,0,0,0.45)',
          boxShadow: '0 16px 42px rgba(0,0,0,0.55)',
        }}
      >
        <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position }} />
      </div>
      <Img
        src={flagUrl}
        style={{
          position: 'absolute',
          right: -8,
          bottom: 4,
          width: flagW,
          height: Math.round((flagW * 2) / 3),
          objectFit: 'cover',
          borderRadius: 8,
          border: '3px solid rgba(255,255,255,0.95)',
          boxShadow: '0 6px 16px rgba(0,0,0,0.5)',
        }}
      />
    </div>
  )
}

function CharPortrait({ url, name, size }: { url: string | null; name: string; size: number }) {
  const initials = name
    .split(/\s+/)
    .filter((w) => !/^d\.?$/i.test(w))
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
        border: `6px solid ${GOLD}`,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.3,
        fontWeight: 900,
        color: GOLD,
        boxShadow: '0 16px 42px rgba(0,0,0,0.55)',
      }}
    >
      {url ? (
        <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }} />
      ) : (
        <span>{initials}</span>
      )}
    </div>
  )
}

// ── Intro: a diamond bracket — two semifinals converging on "× One Piece" ───
// Corrected matchups: France vs Spain (top), England vs Argentina (bottom).
function IntroBracket({ matches }: { matches: ResolvedMatch[] }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const titleIn = spring({ frame, fps, config: { damping: 16, stiffness: 110 } })

  // Geometry (px on the 1080×1920 canvas).
  const CHIP_W = 430
  const CHIP_H = 156
  const LEFT_X = 56
  const RIGHT_X = 1080 - 56 - CHIP_W // 594
  const LEFT_CX = LEFT_X + CHIP_W / 2 // 271
  const RIGHT_CX = RIGHT_X + CHIP_W / 2 // 809
  const TOP_CY = 610
  const BOT_CY = 1360
  const NODE_CX = 540
  const NODE_CY = 985
  const NODE_R = 118
  const TOP_RAIL = 778
  const BOT_RAIL = 1192

  // Each semifinal pair, placed by team so the matchup is explicit.
  const byTeam = (team: string) => matches.find((m) => m.team === team)
  const LAYOUT: { team: string; cx: number; x: number; cy: number; dir: number; delay: number }[] = [
    { team: 'France', cx: LEFT_CX, x: LEFT_X, cy: TOP_CY, dir: -1, delay: 8 },
    { team: 'Spain', cx: RIGHT_CX, x: RIGHT_X, cy: TOP_CY, dir: 1, delay: 13 },
    { team: 'England', cx: LEFT_CX, x: LEFT_X, cy: BOT_CY, dir: -1, delay: 18 },
    { team: 'Argentina', cx: RIGHT_CX, x: RIGHT_X, cy: BOT_CY, dir: 1, delay: 23 },
  ]

  const lineDraw = interpolate(frame, [30, 52], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const nodeIn = spring({ frame: frame - 44, fps, config: { damping: 12, stiffness: 150 } })

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #0fa855 0%, #1450a0 36%, #a032d6 70%, #2c0f47 100%)',
        fontFamily: SANS,
        color: '#fff',
      }}
    >
      {/* Title */}
      <div
        style={{
          position: 'absolute',
          top: 96,
          left: 60,
          right: 60,
          textAlign: 'center',
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * -40}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 30,
            letterSpacing: 8,
            color: GOLD,
            textTransform: 'uppercase',
            fontWeight: 800,
          }}
        >
          <Trophy size={34} /> World Cup 2026
        </div>
        <div style={{ fontSize: 88, fontWeight: 900, lineHeight: 0.98, letterSpacing: -3, marginTop: 10 }}>
          SEMIFINALISTS
        </div>
        <div style={{ fontSize: 38, fontWeight: 700, color: 'rgba(255,255,255,0.9)', marginTop: 8 }}>
          × One Piece · <span style={{ color: GOLD }}>Birthday Twins</span>
        </div>
      </div>

      {/* Bracket connector lines */}
      <svg
        width={1080}
        height={1920}
        style={{ position: 'absolute', top: 0, left: 0 }}
        strokeDasharray={2400}
        strokeDashoffset={(1 - lineDraw) * 2400}
      >
        <g stroke="rgba(255,255,255,0.55)" strokeWidth={4} fill="none" strokeLinecap="round">
          {/* top pair → rail → node */}
          <path d={`M${LEFT_CX} ${TOP_CY + CHIP_H / 2} V${TOP_RAIL}`} />
          <path d={`M${RIGHT_CX} ${TOP_CY + CHIP_H / 2} V${TOP_RAIL}`} />
          <path d={`M${LEFT_CX} ${TOP_RAIL} H${RIGHT_CX}`} />
          <path d={`M${NODE_CX} ${TOP_RAIL} V${NODE_CY - NODE_R}`} />
          {/* node → rail → bottom pair */}
          <path d={`M${NODE_CX} ${NODE_CY + NODE_R} V${BOT_RAIL}`} />
          <path d={`M${LEFT_CX} ${BOT_RAIL} H${RIGHT_CX}`} />
          <path d={`M${LEFT_CX} ${BOT_CY - CHIP_H / 2} V${BOT_RAIL}`} />
          <path d={`M${RIGHT_CX} ${BOT_CY - CHIP_H / 2} V${BOT_RAIL}`} />
        </g>
      </svg>

      {/* Player chips */}
      {LAYOUT.map((slot) => {
        const m = byTeam(slot.team)
        if (!m) return null
        const chipIn = spring({ frame: frame - slot.delay, fps, config: { damping: 15, stiffness: 120 } })
        return (
          <div
            key={slot.team}
            style={{
              position: 'absolute',
              left: slot.x,
              top: slot.cy - CHIP_H / 2,
              width: CHIP_W,
              height: CHIP_H,
              display: 'flex',
              alignItems: 'center',
              gap: 20,
              padding: '0 22px 0 18px',
              borderRadius: 28,
              background: 'rgba(0,0,0,0.36)',
              border: '2px solid rgba(255,255,255,0.3)',
              boxShadow: '0 10px 28px rgba(0,0,0,0.42)',
              opacity: chipIn,
              transform: `translateX(${(1 - chipIn) * slot.dir * 160}px)`,
            }}
          >
            <PlayerPortrait url={m.playerImageUrl} position={m.playerImagePosition} flagUrl={m.flagUrl} size={112} />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 36, fontWeight: 800, lineHeight: 1.04 }}>{m.player}</div>
              <div style={{ fontSize: 24, fontWeight: 600, color: 'rgba(255,255,255,0.75)', marginTop: 6 }}>
                {m.team}
              </div>
            </div>
          </div>
        )
      })}

      {/* VS badges between each semifinal pair */}
      {[TOP_CY, BOT_CY].map((cy, i) => {
        const vsIn = spring({ frame: frame - 30 - i * 4, fps, config: { damping: 12, stiffness: 160 } })
        return (
          <div
            key={cy}
            style={{
              position: 'absolute',
              left: NODE_CX - 40,
              top: cy - 40,
              width: 80,
              height: 80,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.95)',
              color: '#14071f',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 30,
              fontWeight: 900,
              letterSpacing: 1,
              boxShadow: '0 8px 22px rgba(0,0,0,0.45)',
              transform: `scale(${vsIn})`,
              zIndex: 4,
            }}
          >
            VS
          </div>
        )
      })}

      {/* Center node */}
      <div
        style={{
          position: 'absolute',
          left: NODE_CX - NODE_R,
          top: NODE_CY - NODE_R,
          width: NODE_R * 2,
          height: NODE_R * 2,
          borderRadius: '50%',
          background: GOLD,
          color: '#14071f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 6,
          boxShadow: '0 16px 38px rgba(0,0,0,0.55)',
          transform: `scale(${nodeIn})`,
          zIndex: 3,
        }}
      >
        <Trophy size={54} color="#14071f" />
        <div style={{ fontSize: 26, fontWeight: 900, letterSpacing: 1, textAlign: 'center', lineHeight: 1 }}>
          ONE
          <br />
          PIECE
        </div>
      </div>

      {/* Bottom teaser */}
      <div
        style={{
          position: 'absolute',
          bottom: 150,
          left: 60,
          right: 60,
          textAlign: 'center',
          fontSize: 36,
          fontWeight: 600,
          lineHeight: 1.35,
          color: 'rgba(255,255,255,0.92)',
          opacity: interpolate(frame, [56, 72], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        Each one has a One Piece character
        <br />
        born on the <span style={{ color: GOLD, fontWeight: 800 }}>exact same day.</span>
      </div>
    </AbsoluteFill>
  )
}

// ── One semifinalist reveal: player ← meets → One Piece twin ────────────────
function Pips({ total, index }: { total: number; index: number }) {
  return (
    <div style={{ display: 'flex', gap: 12, justifyContent: 'center', marginTop: 16 }}>
      {Array.from({ length: total }).map((_, i) => (
        <div
          key={i}
          style={{
            width: i === index ? 40 : 14,
            height: 14,
            borderRadius: 999,
            background: i === index ? GOLD : 'rgba(255,255,255,0.35)',
          }}
        />
      ))}
    </div>
  )
}

function PairingScene({ match, index, total }: { match: ResolvedMatch; index: number; total: number }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const pIn = spring({ frame, fps, config: { damping: 16, stiffness: 110 } })
  const cIn = spring({ frame: frame - 6, fps, config: { damping: 16, stiffness: 110 } })
  const badgeIn = spring({ frame: frame - 22, fps, config: { damping: 12, stiffness: 150 } })
  const detailIn = interpolate(frame, [30, 48], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  const bg = `linear-gradient(165deg, ${match.theme} 0%, #3a1560 56%, #23103b 100%)`
  const COL_W = 344
  const P = 290

  return (
    <AbsoluteFill
      style={{
        background: bg,
        fontFamily: SANS,
        color: '#fff',
        padding: '120px 48px 150px',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Kicker + progress */}
      <div style={{ textAlign: 'center' }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 26,
            letterSpacing: 5,
            textTransform: 'uppercase',
            fontWeight: 800,
            color: 'rgba(255,255,255,0.9)',
          }}
        >
          <Trophy size={30} color="#fff" /> Semifinalist {index + 1} of {total}
        </div>
        <Pips total={total} index={index} />
      </div>

      {/* Centered content block (portraits → birthday → detail) */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      {/* Portraits — player meets twin */}
      <div
        style={{
          display: 'flex',
          alignItems: 'flex-start',
          justifyContent: 'center',
          gap: 8,
        }}
      >
        {/* Player column */}
        <div
          style={{
            width: COL_W,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: pIn,
            transform: `translateX(${(1 - pIn) * -380}px)`,
          }}
        >
          <PlayerPortrait url={match.playerImageUrl} position={match.playerImagePosition} flagUrl={match.flagUrl} size={P} />
          <div style={{ fontSize: 42, fontWeight: 900, marginTop: 22, textAlign: 'center', lineHeight: 1 }}>
            {match.player}
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: 'rgba(255,255,255,0.8)', marginTop: 8, textAlign: 'center' }}>
            {match.team} · {match.playerRole}
          </div>
        </div>

        {/* Center cake join */}
        <div
          style={{
            alignSelf: 'center',
            marginTop: -40,
            width: 92,
            height: 92,
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
          <Cake size={48} />
        </div>

        {/* Character column */}
        <div
          style={{
            width: COL_W,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            opacity: cIn,
            transform: `translateX(${(1 - cIn) * 380}px)`,
          }}
        >
          <CharPortrait url={match.characterImageUrl} name={match.characterName} size={P} />
          <div style={{ fontSize: 42, fontWeight: 900, marginTop: 22, textAlign: 'center', lineHeight: 1 }}>
            {match.characterName}
          </div>
          <div style={{ fontSize: 26, fontWeight: 600, color: GOLD, marginTop: 8, textAlign: 'center' }}>
            {match.characterRole}
          </div>
        </div>
      </div>

      {/* Shared birthday */}
      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 56, transform: `scale(${badgeIn})` }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 18,
            background: GOLD,
            color: '#14071f',
            borderRadius: 999,
            padding: '20px 44px',
            boxShadow: '0 14px 34px rgba(0,0,0,0.45)',
          }}
        >
          <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
            <span style={{ fontSize: 22, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.75 }}>
              Same birthday
            </span>
            <span style={{ fontSize: 58, fontWeight: 900, letterSpacing: -0.5, marginTop: 6 }}>{match.birthday}</span>
          </div>
        </div>
      </div>

      {/* Detail */}
      <div
        style={{
          marginTop: 72,
          fontSize: 38,
          fontWeight: 500,
          lineHeight: 1.42,
          textAlign: 'center',
          color: 'rgba(255,255,255,0.95)',
          opacity: detailIn,
          transform: `translateY(${(1 - detailIn) * 24}px)`,
        }}
      >
        {match.detail}
      </div>
      </div>
    </AbsoluteFill>
  )
}

// ── Recap: the same diamond bracket, now with each One Piece twin attached to
// the outer side of its player card (above the top pair, below the bottom). ──
function RecapCard({
  x,
  top,
  w,
  h,
  portrait,
  title,
  subtitle,
  subtitleColor,
  enter,
}: {
  x: number
  top: number
  w: number
  h: number
  portrait: React.ReactNode
  title: string
  subtitle: string
  subtitleColor: string
  enter: number
}) {
  return (
    <div
      style={{
        position: 'absolute',
        left: x,
        top,
        width: w,
        height: h,
        display: 'flex',
        alignItems: 'center',
        gap: 18,
        padding: '0 20px 0 16px',
        borderRadius: 26,
        background: 'rgba(0,0,0,0.36)',
        border: '2px solid rgba(255,255,255,0.28)',
        boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
        opacity: enter,
        transform: `scale(${0.9 + enter * 0.1})`,
      }}
    >
      {portrait}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: 30, fontWeight: 800, lineHeight: 1.02 }}>{title}</div>
        <div style={{ fontSize: 22, fontWeight: 700, color: subtitleColor, marginTop: 5 }}>{subtitle}</div>
      </div>
    </div>
  )
}

function RecapBracket({ matches }: { matches: ResolvedMatch[] }) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const titleIn = spring({ frame, fps, config: { damping: 16, stiffness: 110 } })

  const CARD_W = 452
  const CARD_H = 112
  const PORT = 84
  const LEFT_X = 40
  const RIGHT_X = 1080 - 40 - CARD_W // 588
  const LEFT_CX = LEFT_X + CARD_W / 2 // 266
  const RIGHT_CX = RIGHT_X + CARD_W / 2 // 814

  // Vertical anchors: character on the outer edge, player on the inner (toward
  // the node), a date pill in the gap between them.
  const TOP_CHAR = 306
  const TOP_PLAYER = 466
  const TOP_PILL = 445
  const BOT_PLAYER = 1360
  const BOT_CHAR = 1520
  const BOT_PILL = 1499

  const NODE_CX = 540
  const NODE_CY = 973
  const NODE_R = 100
  const TOP_RAIL = 728
  const BOT_RAIL = 1216

  const lineDraw = interpolate(frame, [34, 56], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
  const nodeIn = spring({ frame: frame - 48, fps, config: { damping: 12, stiffness: 150 } })

  const SLOTS: {
    team: string
    x: number
    cx: number
    charTop: number
    playerTop: number
    pillY: number
    delay: number
  }[] = [
    { team: 'France', x: LEFT_X, cx: LEFT_CX, charTop: TOP_CHAR, playerTop: TOP_PLAYER, pillY: TOP_PILL, delay: 8 },
    { team: 'Spain', x: RIGHT_X, cx: RIGHT_CX, charTop: TOP_CHAR, playerTop: TOP_PLAYER, pillY: TOP_PILL, delay: 13 },
    { team: 'England', x: LEFT_X, cx: LEFT_CX, charTop: BOT_CHAR, playerTop: BOT_PLAYER, pillY: BOT_PILL, delay: 18 },
    { team: 'Argentina', x: RIGHT_X, cx: RIGHT_CX, charTop: BOT_CHAR, playerTop: BOT_PLAYER, pillY: BOT_PILL, delay: 23 },
  ]

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #0fa855 0%, #1450a0 36%, #a032d6 70%, #2c0f47 100%)',
        fontFamily: SANS,
        color: '#fff',
      }}
    >
      {/* Header */}
      <div
        style={{
          position: 'absolute',
          top: 74,
          left: 60,
          right: 60,
          textAlign: 'center',
          opacity: titleIn,
          transform: `translateY(${(1 - titleIn) * -30}px)`,
        }}
      >
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 26,
            letterSpacing: 6,
            color: GOLD,
            textTransform: 'uppercase',
            fontWeight: 800,
          }}
        >
          <Trophy size={30} /> The Full Bracket
        </div>
        <div style={{ fontSize: 66, fontWeight: 900, lineHeight: 1, letterSpacing: -2, marginTop: 8 }}>
          Birthday Twins
        </div>
      </div>

      {/* Connector lines */}
      <svg
        width={1080}
        height={1920}
        style={{ position: 'absolute', top: 0, left: 0 }}
        strokeDasharray={2400}
        strokeDashoffset={(1 - lineDraw) * 2400}
      >
        <g stroke="rgba(255,255,255,0.5)" strokeWidth={4} fill="none" strokeLinecap="round">
          <path d={`M${LEFT_CX} ${TOP_PLAYER + CARD_H} V${TOP_RAIL}`} />
          <path d={`M${RIGHT_CX} ${TOP_PLAYER + CARD_H} V${TOP_RAIL}`} />
          <path d={`M${LEFT_CX} ${TOP_RAIL} H${RIGHT_CX}`} />
          <path d={`M${NODE_CX} ${TOP_RAIL} V${NODE_CY - NODE_R}`} />
          <path d={`M${NODE_CX} ${NODE_CY + NODE_R} V${BOT_RAIL}`} />
          <path d={`M${LEFT_CX} ${BOT_RAIL} H${RIGHT_CX}`} />
          <path d={`M${LEFT_CX} ${BOT_PLAYER} V${BOT_RAIL}`} />
          <path d={`M${RIGHT_CX} ${BOT_PLAYER} V${BOT_RAIL}`} />
        </g>
      </svg>

      {/* Slots: character + player + date */}
      {SLOTS.map((slot) => {
        const m = matches.find((x) => x.team === slot.team)
        if (!m) return null
        const enter = spring({ frame: frame - slot.delay, fps, config: { damping: 15, stiffness: 130 } })
        return (
          <div key={slot.team}>
            <RecapCard
              x={slot.x}
              top={slot.charTop}
              w={CARD_W}
              h={CARD_H}
              enter={enter}
              portrait={<CharPortrait url={m.characterImageUrl} name={m.characterName} size={PORT} />}
              title={m.characterName}
              subtitle={m.arcTag}
              subtitleColor={GOLD}
            />
            <RecapCard
              x={slot.x}
              top={slot.playerTop}
              w={CARD_W}
              h={CARD_H}
              enter={enter}
              portrait={
                <PlayerPortrait url={m.playerImageUrl} position={m.playerImagePosition} flagUrl={m.flagUrl} size={PORT} />
              }
              title={m.player}
              subtitle={m.team}
              subtitleColor="rgba(255,255,255,0.75)"
            />
            <div
              style={{
                position: 'absolute',
                left: slot.cx,
                top: slot.pillY,
                transform: `translate(-50%, -50%) scale(${enter})`,
                display: 'inline-flex',
                alignItems: 'center',
                gap: 8,
                background: GOLD,
                color: '#14071f',
                borderRadius: 999,
                padding: '6px 16px',
                fontSize: 24,
                fontWeight: 800,
                whiteSpace: 'nowrap',
                boxShadow: '0 6px 16px rgba(0,0,0,0.4)',
                zIndex: 6,
              }}
            >
              <Cake size={22} /> {m.birthday}
            </div>
          </div>
        )
      })}

      {/* Center node */}
      <div
        style={{
          position: 'absolute',
          left: NODE_CX - NODE_R,
          top: NODE_CY - NODE_R,
          width: NODE_R * 2,
          height: NODE_R * 2,
          borderRadius: '50%',
          background: GOLD,
          color: '#14071f',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: 4,
          boxShadow: '0 16px 38px rgba(0,0,0,0.55)',
          transform: `scale(${nodeIn})`,
          zIndex: 3,
        }}
      >
        <Trophy size={48} color="#14071f" />
        <div style={{ fontSize: 24, fontWeight: 900, letterSpacing: 1, textAlign: 'center', lineHeight: 1 }}>
          ONE
          <br />
          PIECE
        </div>
      </div>

      {/* Footer */}
      <div
        style={{
          position: 'absolute',
          bottom: 140,
          left: 60,
          right: 60,
          textAlign: 'center',
          fontSize: 34,
          fontWeight: 700,
          color: 'rgba(255,255,255,0.9)',
          opacity: interpolate(frame, [60, 78], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
        }}
      >
        Same day, <span style={{ color: GOLD }}>different seas.</span>
      </div>
    </AbsoluteFill>
  )
}

function Outro() {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()
  const inSpring = spring({ frame, fps, config: { damping: 16, stiffness: 110 } })
  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(160deg, #0fa855 0%, #1450a0 36%, #a032d6 70%, #2c0f47 100%)',
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
      <div style={{ opacity: inSpring, transform: `translateY(${(1 - inSpring) * 40}px)` }}>
        <div
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 28,
            letterSpacing: 8,
            color: PITCH,
            textTransform: 'uppercase',
            fontWeight: 800,
            marginBottom: 22,
          }}
        >
          <Trophy size={32} color={PITCH} /> The Final
        </div>
        <div style={{ fontSize: 108, fontWeight: 900, lineHeight: 1.02, letterSpacing: -3 }}>
          Whose
          <br />
          birthday twin
          <br />
          wins?
        </div>
        <div style={{ marginTop: 40, fontSize: 38, fontWeight: 500, lineHeight: 1.4, color: 'rgba(255,255,255,0.94)' }}>
          Four icons, four characters,
          <br />
          four shared birthdays.
        </div>
        <div
          style={{
            marginTop: 52,
            display: 'inline-block',
            background: 'rgba(0,0,0,0.4)',
            border: `3px solid ${GOLD}`,
            borderRadius: 26,
            padding: '22px 44px',
            fontSize: 46,
            fontWeight: 800,
            color: GOLD,
          }}
        >
          onepieceofdata.com
        </div>
        <div style={{ marginTop: 26, fontSize: 28, fontWeight: 600, color: 'rgba(255,255,255,0.72)' }}>
          Follow for more One Piece data.
        </div>
      </div>
    </AbsoluteFill>
  )
}

export function WorldCupBirthdaysReel({ slides }: WorldCupBirthdaysReelProps) {
  const matches = slides.filter((s): s is ResolvedMatch => s.kind === 'match')
  if (matches.length === 0) return <AbsoluteFill style={{ background: '#000' }} />

  return (
    <AbsoluteFill style={{ background: '#23103b' }}>
      <Sequence durationInFrames={INTRO_FRAMES}>
        <IntroBracket matches={matches} />
      </Sequence>
      {matches.map((m, i) => (
        <Sequence key={m.player} from={INTRO_FRAMES + i * PAIR_FRAMES} durationInFrames={PAIR_FRAMES}>
          <PairingScene match={m} index={i} total={matches.length} />
        </Sequence>
      ))}
      <Sequence from={INTRO_FRAMES + matches.length * PAIR_FRAMES} durationInFrames={RECAP_FRAMES}>
        <RecapBracket matches={matches} />
      </Sequence>
      <Sequence from={INTRO_FRAMES + matches.length * PAIR_FRAMES + RECAP_FRAMES}>
        <Outro />
      </Sequence>
      <Watermark bottom={40} color="rgba(255,255,255,0.7)" />
    </AbsoluteFill>
  )
}
