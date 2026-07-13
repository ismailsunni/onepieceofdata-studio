import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import { SITE } from '../../components/Watermark'
import type { ResolvedMatch, ResolvedSlide } from './fetch'

export type WorldCupBirthdaysProps = {
  slides: ResolvedSlide[]
  latestChapter: number | null
} & Record<string, unknown>

// IG carousel: 1080×1350 (4:5). One slide per frame at fps=1, so each
// `remotion still --frame=N` renders slide N as a PNG.
export const SLIDE_WIDTH = 1080
export const SLIDE_HEIGHT = 1350

const SANS = 'system-ui, -apple-system, sans-serif'
const GOLD = '#fbbf24' // brand gold — the One Piece accent
const PITCH = '#34d399' // football-green accent

// IG crops the carousel preview — keep critical content inside these insets.
const SAFE_TOP = 80
const SAFE_BOTTOM = 120
const SAFE_X = 72

function SlideFrame({
  children,
  background,
}: {
  children: React.ReactNode
  background: string
}) {
  return (
    <AbsoluteFill
      style={{
        background,
        fontFamily: SANS,
        color: 'white',
        paddingLeft: SAFE_X,
        paddingRight: SAFE_X,
        paddingTop: SAFE_TOP,
        paddingBottom: SAFE_BOTTOM,
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {children}
    </AbsoluteFill>
  )
}

// Generic gold trophy mark (not the FIFA emblem — that's trademarked).
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

// Simple birthday-cake mark for the shared-day badge (emoji render poorly in
// headless stills, so we draw it).
function Cake({ size = 34, color = '#14071f' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" style={{ flexShrink: 0 }}>
      <path
        d="M4 21h16v-6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v6Z"
        stroke={color}
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path d="M4 17c1.6 0 1.6 1.2 3.2 1.2S8.8 17 10.4 17s1.6 1.2 3.2 1.2S15.2 17 16.8 17 18.4 18.2 20 18.2" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M12 13V9" stroke={color} strokeWidth="1.8" strokeLinecap="round" />
      <circle cx="12" cy="6.5" r="1.4" fill={color} />
    </svg>
  )
}

function Footer({ index, total }: { index: number; total: number }) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 24,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 40,
        paddingRight: 40,
        fontFamily: SANS,
        textShadow: '0 1px 4px rgba(0,0,0,0.6)',
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: 3, color: 'rgba(255,255,255,0.7)' }}>
        {SITE}
      </div>
      <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: 2, color: 'rgba(255,255,255,0.6)' }}>
        {index + 1} / {total}
      </div>
    </div>
  )
}

const COVER_BG =
  'linear-gradient(150deg, #0fa855 0%, #1450a0 34%, #a032d6 68%, #3a1560 100%)'

function CoverSlide({
  kicker,
  title,
  subtitle,
  collage,
}: {
  kicker: string
  title: string
  subtitle: string
  collage: string[]
}) {
  const lines = title.split('\n')
  return (
    <AbsoluteFill
      style={{ background: COVER_BG, fontFamily: SANS, color: 'white', overflow: 'hidden' }}
    >
      <CoverCollage images={collage} />
      <AbsoluteFill
        style={{
          paddingLeft: SAFE_X,
          paddingRight: SAFE_X,
          paddingTop: SAFE_TOP,
          paddingBottom: SAFE_BOTTOM,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            textAlign: 'center',
          }}
        >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 14,
            fontSize: 28,
            letterSpacing: 10,
            color: GOLD,
            textTransform: 'uppercase',
            fontWeight: 800,
            marginBottom: 28,
          }}
        >
          <Trophy size={34} />
          {kicker}
        </div>
        <div
          style={{
            fontSize: 112,
            fontWeight: 900,
            lineHeight: 0.98,
            letterSpacing: -3,
            textShadow: '0 6px 30px rgba(0,0,0,0.45)',
          }}
        >
          {lines.map((line, i) => (
            <div key={i}>{line}</div>
          ))}
        </div>
        <div
          style={{
            marginTop: 30,
            height: 10,
            width: 260,
            borderRadius: 999,
            background: `linear-gradient(90deg, ${PITCH}, ${GOLD})`,
          }}
        />
        <div
          style={{
            marginTop: 38,
            fontSize: 37,
            fontWeight: 500,
            letterSpacing: 0.5,
            color: 'rgba(255,255,255,0.92)',
            lineHeight: 1.34,
            maxWidth: 880,
          }}
        >
          {subtitle}
        </div>
          <div
            style={{
              marginTop: 48,
              fontSize: 24,
              fontWeight: 700,
              letterSpacing: 5,
              textTransform: 'uppercase',
              color: 'rgba(255,255,255,0.7)',
            }}
          >
            Swipe →
          </div>
        </div>
      </AbsoluteFill>
    </AbsoluteFill>
  )
}

function CharPortrait({
  url,
  name,
  size,
}: {
  url: string | null
  name: string
  size: number
}) {
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
        border: `5px solid ${GOLD}`,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.3,
        fontWeight: 900,
        color: GOLD,
        boxShadow: '0 14px 38px rgba(0,0,0,0.55)',
        flexShrink: 0,
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

// A footballer's photo cropped into a circle, with the nation flag as a badge —
// the football-side mirror of the gold-ringed One Piece CharPortrait.
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
    <div style={{ position: 'relative', width: size, height: size, flexShrink: 0 }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          border: '5px solid rgba(255,255,255,0.92)',
          background: 'rgba(0,0,0,0.45)',
          boxShadow: '0 14px 38px rgba(0,0,0,0.55)',
        }}
      >
        <Img src={url} style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: position }} />
      </div>
      <Img
        src={flagUrl}
        style={{
          position: 'absolute',
          right: -6,
          bottom: 2,
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

// Faces scattered edge-to-edge behind the cover title — fixed positions so the
// render stays deterministic. Images cycle through the player/character collage.
function CoverCollage({ images }: { images: string[] }) {
  if (images.length === 0) return null
  // { x, y = centre as % of canvas; size = px; r = rotation° }
  const TILES = [
    { x: 9, y: 9, size: 250, r: -8 },
    { x: 40, y: 5, size: 200, r: 5 },
    { x: 74, y: 8, size: 290, r: 9 },
    { x: 95, y: 30, size: 220, r: -12 },
    { x: 3, y: 40, size: 220, r: 11 },
    { x: 68, y: 50, size: 250, r: -6 },
    { x: 24, y: 64, size: 230, r: 8 },
    { x: 90, y: 72, size: 250, r: -10 },
    { x: 50, y: 88, size: 210, r: 6 },
    { x: 11, y: 90, size: 210, r: -7 },
    { x: 74, y: 93, size: 200, r: 10 },
  ]
  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      {TILES.map((t, i) => (
        <div
          key={i}
          style={{
            position: 'absolute',
            left: `${t.x}%`,
            top: `${t.y}%`,
            width: t.size,
            height: t.size,
            marginLeft: -t.size / 2,
            marginTop: -t.size / 2,
            borderRadius: '50%',
            overflow: 'hidden',
            transform: `rotate(${t.r}deg)`,
            opacity: 0.3,
            border: '3px solid rgba(255,255,255,0.22)',
            boxShadow: '0 10px 30px rgba(0,0,0,0.4)',
          }}
        >
          <Img
            src={images[i % images.length]}
            style={{ width: '100%', height: '100%', objectFit: 'cover', objectPosition: 'top' }}
          />
        </div>
      ))}
      {/* Darken toward the centre so the title stays legible over the faces. */}
      <AbsoluteFill
        style={{
          background:
            'radial-gradient(ellipse at center, rgba(20,7,31,0.82) 0%, rgba(20,7,31,0.6) 45%, rgba(44,15,71,0.72) 100%)',
        }}
      />
    </AbsoluteFill>
  )
}

function MatchSlide({ slide }: { slide: ResolvedMatch }) {
  const bg = `linear-gradient(180deg, ${slide.theme} 0%, #4a1873 54%, #2c0f47 100%)`
  return (
    <SlideFrame background={bg}>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
        {/* ── Football half ─────────────────────────────────────── */}
        <div
          style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              fontSize: 25,
              letterSpacing: 4,
              textTransform: 'uppercase',
              fontWeight: 800,
              color: 'rgba(255,255,255,0.9)',
              marginBottom: 22,
            }}
          >
            <Trophy size={30} color="#ffffff" />
            World Cup 2026
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            <PlayerPortrait
              url={slide.playerImageUrl}
              position={slide.playerImagePosition}
              flagUrl={slide.flagUrl}
              size={240}
            />
            <div style={{ flex: 1, minWidth: 0 }}>
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 900,
                  lineHeight: 0.96,
                  letterSpacing: -2,
                  textShadow: '0 5px 22px rgba(0,0,0,0.4)',
                }}
              >
                {slide.player}
              </div>
              <div
                style={{
                  fontSize: 31,
                  fontWeight: 600,
                  color: 'rgba(255,255,255,0.82)',
                  marginTop: 10,
                }}
              >
                {slide.team} · {slide.playerRole}
              </div>
            </div>
          </div>
        </div>

        {/* ── Shared-birthday badge ─────────────────────────────── */}
        <div style={{ display: 'flex', justifyContent: 'center', margin: '6px 0 22px' }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 16,
              background: GOLD,
              color: '#14071f',
              borderRadius: 999,
              padding: '16px 34px',
              boxShadow: '0 12px 30px rgba(0,0,0,0.45)',
            }}
          >
            <Cake size={38} />
            <div style={{ display: 'flex', flexDirection: 'column', lineHeight: 1 }}>
              <span style={{ fontSize: 18, fontWeight: 800, letterSpacing: 3, textTransform: 'uppercase', opacity: 0.75 }}>
                Same birthday
              </span>
              <span style={{ fontSize: 40, fontWeight: 900, letterSpacing: -0.5, marginTop: 4 }}>
                {slide.birthday}
              </span>
            </div>
          </div>
        </div>

        {/* ── One Piece half ────────────────────────────────────── */}
        <div
          style={{
            flex: 1.18,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
            <div
              style={{
                fontSize: 21,
                letterSpacing: 4,
                textTransform: 'uppercase',
                fontWeight: 800,
                color: GOLD,
                whiteSpace: 'nowrap',
              }}
            >
              Meanwhile, in One Piece
            </div>
            <div style={{ flex: 1, height: 2, background: 'rgba(251,191,36,0.45)' }} />
          </div>

          <div style={{ display: 'flex', gap: 34, alignItems: 'center' }}>
            <div
              style={{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: 14,
                flexShrink: 0,
              }}
            >
              <CharPortrait url={slide.characterImageUrl} name={slide.characterName} size={300} />
              <div
                style={{
                  fontSize: 19,
                  letterSpacing: 2,
                  textTransform: 'uppercase',
                  fontWeight: 800,
                  color: '#14071f',
                  background: GOLD,
                  borderRadius: 999,
                  padding: '8px 20px',
                  textAlign: 'center',
                  maxWidth: 300,
                }}
              >
                {slide.characterRole}
              </div>
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 0.98, letterSpacing: -2 }}>
                {slide.characterName}
              </div>
              <div
                style={{
                  fontSize: 32,
                  fontWeight: 500,
                  lineHeight: 1.4,
                  color: 'rgba(255,255,255,0.94)',
                  marginTop: 16,
                }}
              >
                {slide.detail}
              </div>
              <div
                style={{
                  marginTop: 20,
                  display: 'inline-block',
                  fontSize: 22,
                  fontWeight: 700,
                  letterSpacing: 2,
                  color: 'rgba(255,255,255,0.65)',
                  background: 'rgba(255,255,255,0.1)',
                  border: '2px solid rgba(255,255,255,0.18)',
                  borderRadius: 999,
                  padding: '7px 20px',
                }}
              >
                {slide.arcTag}
              </div>
            </div>
          </div>
        </div>
      </div>
    </SlideFrame>
  )
}

function CloserSlide({
  kicker,
  title,
  question,
  handle,
}: {
  kicker: string
  title: string
  question: string
  handle: string
}) {
  return (
    <SlideFrame background={COVER_BG}>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          textAlign: 'center',
        }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 12,
            fontSize: 26,
            letterSpacing: 8,
            color: PITCH,
            textTransform: 'uppercase',
            fontWeight: 800,
            marginBottom: 24,
          }}
        >
          <Trophy size={32} color={PITCH} />
          {kicker}
        </div>
        <div
          style={{
            fontSize: 108,
            fontWeight: 900,
            lineHeight: 1.0,
            letterSpacing: -3,
            textShadow: '0 6px 30px rgba(0,0,0,0.45)',
          }}
        >
          {title.split('\n').map((l, i) => (
            <div key={i}>{l}</div>
          ))}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 38,
            fontWeight: 500,
            lineHeight: 1.4,
            color: 'rgba(255,255,255,0.94)',
            maxWidth: 860,
          }}
        >
          {question}
        </div>
        <div
          style={{
            marginTop: 52,
            background: 'rgba(0,0,0,0.4)',
            border: `3px solid ${GOLD}`,
            borderRadius: 26,
            padding: '22px 40px',
            fontSize: 44,
            fontWeight: 800,
            color: GOLD,
            letterSpacing: 1,
          }}
        >
          {handle}
        </div>
        <div
          style={{
            marginTop: 26,
            fontSize: 26,
            fontWeight: 600,
            letterSpacing: 1,
            color: 'rgba(255,255,255,0.72)',
          }}
        >
          Follow for more One Piece data.
        </div>
      </div>
    </SlideFrame>
  )
}

function renderSlide(slide: ResolvedSlide) {
  switch (slide.kind) {
    case 'cover':
      return (
        <CoverSlide
          kicker={slide.kicker}
          title={slide.title}
          subtitle={slide.subtitle}
          collage={slide.collage}
        />
      )
    case 'match':
      return <MatchSlide slide={slide} />
    case 'closer':
      return (
        <CloserSlide
          kicker={slide.kicker}
          title={slide.title}
          question={slide.question}
          handle={slide.handle}
        />
      )
  }
}

export function WorldCupBirthdays({ slides }: WorldCupBirthdaysProps) {
  const frame = useCurrentFrame()
  const idx = Math.min(frame, slides.length - 1)
  const slide = slides[idx]
  if (!slide) {
    return <AbsoluteFill style={{ background: '#000' }} />
  }
  return (
    <>
      {renderSlide(slide)}
      <Footer index={idx} total={slides.length} />
    </>
  )
}
