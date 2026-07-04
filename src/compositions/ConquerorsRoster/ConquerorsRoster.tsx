import { AbsoluteFill, Img, useCurrentFrame } from 'remotion'
import type { ResolvedCharacter, ResolvedSlide } from './fetch'
import { SITE } from '../../components/Watermark'
import { formatBerry } from '../../lib/format'

export type ConquerorsRosterProps = {
  slides: ResolvedSlide[]
  latestChapter: number | null
} & Record<string, unknown>

export const SLIDE_WIDTH = 1080
export const SLIDE_HEIGHT = 1350

const SANS = 'system-ui, -apple-system, sans-serif'

// Dark royal palette — deep purple/black with a gold "King's Haki" accent.
// Matches the LivingConquerors reel so the two posts read as a set.
const BG_GRADIENT =
  'radial-gradient(circle at 50% 34%, #3a1a63 0%, #1c0e34 46%, #08040f 100%)'
const ACCENT = '#fbbf24' // gold
const TEXT = '#ffffff'
const TEXT_MUTED = 'rgba(255,255,255,0.72)'
const TEXT_SOFT = 'rgba(255,255,255,0.5)'
const TILE_BG = 'rgba(255,255,255,0.07)'
const TILE_BORDER = 'rgba(251,191,36,0.28)'

const SAFE_TOP = 96
const SAFE_BOTTOM = 110
const SAFE_X = 72

function initials(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() ?? '')
    .join('')
}

function Avatar({
  character,
  size,
}: {
  character: ResolvedCharacter
  size: number
}) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        border: `3px solid ${ACCENT}`,
        background: 'rgba(0,0,0,0.25)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: size * 0.34,
        fontWeight: 800,
        color: ACCENT,
        boxShadow: '0 6px 20px rgba(0,0,0,0.4)',
        flexShrink: 0,
      }}
    >
      {character.imageUrl ? (
        <Img
          src={character.imageUrl}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: character.crop ?? 'top',
          }}
        />
      ) : (
        <span>{initials(character.name)}</span>
      )}
    </div>
  )
}

function SlideFrame({ children }: { children: React.ReactNode }) {
  return (
    <AbsoluteFill
      style={{
        background: BG_GRADIENT,
        fontFamily: SANS,
        color: TEXT,
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

function Kicker({ children }: { children: React.ReactNode }) {
  return (
    <div
      style={{
        fontSize: 22,
        letterSpacing: 6,
        color: ACCENT,
        textTransform: 'uppercase',
        fontWeight: 800,
      }}
    >
      {children}
    </div>
  )
}

function Footer({
  index,
  total,
  latestChapter,
}: {
  index: number
  total: number
  latestChapter: number | null
}) {
  return (
    <div
      style={{
        position: 'absolute',
        bottom: 28,
        left: 0,
        right: 0,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: 44,
        paddingRight: 44,
        fontFamily: SANS,
        pointerEvents: 'none',
        zIndex: 10,
      }}
    >
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 3, color: TEXT_MUTED }}>
        {SITE}
      </div>
      <div style={{ fontSize: 18, fontWeight: 700, letterSpacing: 2, color: TEXT_MUTED }}>
        {index + 1} / {total}
      </div>
      <div style={{ fontSize: 16, fontWeight: 600, letterSpacing: 1, color: TEXT_SOFT }}>
        {latestChapter !== null ? `ch. ${latestChapter}` : ''}
      </div>
    </div>
  )
}

function CoverSlide({
  kicker,
  title,
  subtitle,
  question,
  note,
  hook,
}: {
  kicker: string
  title: string
  subtitle: string
  question: string
  note?: string
  hook?: string
}) {
  return (
    <SlideFrame>
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
            fontSize: 24,
            letterSpacing: 6,
            color: ACCENT,
            textTransform: 'uppercase',
            fontWeight: 800,
            marginBottom: 28,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            fontSize: 132,
            fontWeight: 900,
            lineHeight: 0.98,
            letterSpacing: -3,
            color: TEXT,
            whiteSpace: 'pre-line',
            textShadow: '0 4px 24px rgba(0,0,0,0.5)',
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 40,
            fontSize: 38,
            fontWeight: 600,
            color: TEXT_MUTED,
            lineHeight: 1.35,
            maxWidth: 860,
          }}
        >
          {subtitle}
        </div>
        {note && (
          <div
            style={{
              marginTop: 20,
              fontSize: 22,
              fontWeight: 600,
              letterSpacing: 2,
              textTransform: 'uppercase',
              color: TEXT_SOFT,
            }}
          >
            {note}
          </div>
        )}
        <div
          style={{
            marginTop: 64,
            fontSize: 60,
            fontWeight: 800,
            letterSpacing: -1,
            color: ACCENT,
            lineHeight: 1.1,
          }}
        >
          {question}
        </div>
        {hook && (
          <div
            style={{
              marginTop: 24,
              fontSize: 34,
              fontWeight: 700,
              color: TEXT,
              lineHeight: 1.25,
              maxWidth: 820,
            }}
          >
            {hook}
          </div>
        )}
        <div
          style={{
            marginTop: 48,
            fontSize: 26,
            fontWeight: 700,
            letterSpacing: 4,
            textTransform: 'uppercase',
            color: TEXT_SOFT,
          }}
        >
          Swipe →
        </div>
      </div>
    </SlideFrame>
  )
}

function ContextSlide({
  kicker,
  title,
  blurb,
  stats,
  highlight,
  footer,
}: {
  kicker: string
  title: string
  blurb: string
  stats: { value: string; label: string }[]
  highlight?: string
  footer?: string
}) {
  return (
    <SlideFrame>
      <div style={{ textAlign: 'center' }}>
        <Kicker>{kicker}</Kicker>
        <div
          style={{
            fontSize: 92,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -2,
            marginTop: 12,
          }}
        >
          {title}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          gap: 44,
        }}
      >
        <div
          style={{
            fontSize: 34,
            fontWeight: 500,
            lineHeight: 1.4,
            color: TEXT_MUTED,
            textAlign: 'center',
            maxWidth: 880,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {blurb}
        </div>
        <div style={{ display: 'flex', gap: 22, justifyContent: 'center' }}>
          {stats.map((s) => (
            <div
              key={s.label}
              style={{
                flex: 1,
                background: TILE_BG,
                border: `2px solid ${TILE_BORDER}`,
                borderRadius: 24,
                padding: '30px 16px',
                textAlign: 'center',
              }}
            >
              <div
                style={{
                  fontSize: 72,
                  fontWeight: 900,
                  color: ACCENT,
                  lineHeight: 1,
                  fontVariantNumeric: 'tabular-nums',
                }}
              >
                {s.value}
              </div>
              <div
                style={{
                  marginTop: 14,
                  fontSize: 24,
                  fontWeight: 600,
                  color: TEXT_MUTED,
                  lineHeight: 1.2,
                }}
              >
                {s.label}
              </div>
            </div>
          ))}
        </div>
        {highlight && (
          <div
            style={{
              background: 'rgba(251,191,36,0.12)',
              border: `2px solid ${TILE_BORDER}`,
              borderRadius: 24,
              padding: '28px 34px',
              fontSize: 30,
              fontWeight: 700,
              lineHeight: 1.35,
              color: TEXT,
              textAlign: 'center',
              maxWidth: 900,
              marginLeft: 'auto',
              marginRight: 'auto',
            }}
          >
            {highlight}
          </div>
        )}
      </div>
      {footer && (
        <div
          style={{
            fontSize: 20,
            fontStyle: 'italic',
            color: TEXT_SOFT,
            textAlign: 'center',
          }}
        >
          {footer}
        </div>
      )}
    </SlideFrame>
  )
}

function CharacterTile({
  character,
  tile,
  nameSize,
}: {
  character: ResolvedCharacter
  tile: number
  nameSize: number
}) {
  const epithetSize = Math.max(16, nameSize - 12)
  return (
    <div
      style={{
        width: tile,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        gap: 10,
      }}
    >
      <Avatar character={character} size={tile} />
      <div
        style={{
          fontSize: nameSize,
          fontWeight: 800,
          textAlign: 'center',
          letterSpacing: -0.5,
          lineHeight: 1.08,
          maxWidth: tile + 30,
          color: TEXT,
        }}
      >
        {character.name}
      </div>
      <div
        style={{
          fontSize: epithetSize,
          fontWeight: 600,
          color: TEXT_MUTED,
          fontStyle: 'italic',
          lineHeight: 1.15,
          textAlign: 'center',
          maxWidth: tile + 30,
        }}
      >
        {character.epithet}
      </div>
      {character.bounty != null && character.bounty > 0 && (
        <div
          style={{
            fontSize: epithetSize,
            fontWeight: 800,
            color: ACCENT,
            fontVariantNumeric: 'tabular-nums',
            letterSpacing: 0.3,
          }}
        >
          {formatBerry(character.bounty)}
        </div>
      )}
    </div>
  )
}

function GroupSlide({
  kicker,
  title,
  subtitle,
  characters,
}: {
  kicker: string
  title: string
  subtitle: string
  characters: ResolvedCharacter[]
}) {
  const n = characters.length
  const cols = n <= 2 ? n : n === 4 ? 2 : 3
  const gap = n <= 4 ? 32 : 24
  const innerWidth = SLIDE_WIDTH - SAFE_X * 2
  const tile = Math.min(
    300,
    Math.floor((innerWidth - gap * (cols - 1)) / cols)
  )
  const nameSize = cols === 2 ? 40 : 32
  return (
    <SlideFrame>
      <div style={{ textAlign: 'center' }}>
        <Kicker>{kicker}</Kicker>
        <div
          style={{
            fontSize: 78,
            fontWeight: 900,
            lineHeight: 1.02,
            letterSpacing: -2,
            marginTop: 8,
            color: ACCENT,
          }}
        >
          {title}
        </div>
        <div
          style={{
            marginTop: 12,
            fontSize: 28,
            fontWeight: 500,
            lineHeight: 1.3,
            color: TEXT_MUTED,
            maxWidth: 860,
            marginLeft: 'auto',
            marginRight: 'auto',
          }}
        >
          {subtitle}
        </div>
      </div>
      <div
        style={{
          flex: 1,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          marginTop: 20,
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap,
            rowGap: gap + 8,
            justifyContent: 'center',
            alignItems: 'flex-start',
            maxWidth: cols * tile + (cols - 1) * gap,
          }}
        >
          {characters.map((c, i) => (
            <CharacterTile
              key={c.id + i}
              character={c}
              tile={tile}
              nameSize={nameSize}
            />
          ))}
        </div>
      </div>
    </SlideFrame>
  )
}

function MysteryAvatar({
  imageUrl,
  size,
}: {
  imageUrl: string | null
  size: number
}) {
  // Face sits in the upper third of the top-cropped portrait — cover it.
  const disc = size * 0.32
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <div
        style={{
          width: size,
          height: size,
          borderRadius: '50%',
          overflow: 'hidden',
          border: `4px solid ${ACCENT}`,
          background: '#0b0714',
          boxShadow: '0 8px 30px rgba(0,0,0,0.5)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {imageUrl && (
          <Img
            src={imageUrl}
            style={{
              width: '100%',
              height: '100%',
              objectFit: 'cover',
              objectPosition: 'top',
            }}
          />
        )}
      </div>
      {/* "?" disc over the face — identity teased, body still recognizable. */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '34%',
          transform: 'translate(-50%, -50%)',
          width: disc,
          height: disc,
          borderRadius: '50%',
          background: '#0b0714',
          border: `3px solid ${ACCENT}`,
          boxShadow: '0 4px 18px rgba(0,0,0,0.6)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          fontSize: disc * 0.66,
          fontWeight: 900,
          color: ACCENT,
          lineHeight: 1,
        }}
      >
        ?
      </div>
    </div>
  )
}

function FollowSlide({
  kicker,
  title,
  subtitle,
  handle,
  teaserImageUrl,
  teaserCaption,
}: {
  kicker: string
  title: string
  subtitle: string
  handle: string
  teaserImageUrl?: string | null
  teaserCaption?: string
}) {
  return (
    <SlideFrame>
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
            fontSize: 26,
            letterSpacing: 8,
            color: ACCENT,
            textTransform: 'uppercase',
            fontWeight: 800,
            marginBottom: 18,
          }}
        >
          {kicker}
        </div>
        <div
          style={{
            fontSize: 116,
            fontWeight: 900,
            lineHeight: 1,
            letterSpacing: -3,
            color: TEXT,
          }}
        >
          {title}
        </div>
        {teaserImageUrl !== undefined && (
          <div style={{ marginTop: 40 }}>
            <MysteryAvatar imageUrl={teaserImageUrl} size={300} />
          </div>
        )}
        {teaserCaption && (
          <div
            style={{
              marginTop: 26,
              fontSize: 34,
              fontWeight: 700,
              color: TEXT,
              lineHeight: 1.3,
              maxWidth: 800,
            }}
          >
            {teaserCaption}
          </div>
        )}
        <div
          style={{
            marginTop: 34,
            fontSize: 30,
            fontWeight: 600,
            color: TEXT_MUTED,
            lineHeight: 1.35,
            maxWidth: 820,
          }}
        >
          {subtitle}
        </div>
        <div
          style={{
            marginTop: 28,
            background: 'rgba(251,191,36,0.14)',
            border: `3px solid ${ACCENT}`,
            borderRadius: 999,
            padding: '16px 46px',
            fontSize: 48,
            fontWeight: 800,
            color: ACCENT,
            letterSpacing: 1,
          }}
        >
          {handle}
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
          question={slide.question}
          note={slide.note}
          hook={slide.hook}
        />
      )
    case 'context':
      return (
        <ContextSlide
          kicker={slide.kicker}
          title={slide.title}
          blurb={slide.blurb}
          stats={slide.stats}
          highlight={slide.highlight}
          footer={slide.footer}
        />
      )
    case 'group':
      return (
        <GroupSlide
          kicker={slide.kicker}
          title={slide.title}
          subtitle={slide.subtitle}
          characters={slide.characters}
        />
      )
    case 'follow':
      return (
        <FollowSlide
          kicker={slide.kicker}
          title={slide.title}
          subtitle={slide.subtitle}
          handle={slide.handle}
          teaserImageUrl={slide.teaserImageUrl}
          teaserCaption={slide.teaserCaption}
        />
      )
  }
}

export function ConquerorsRoster({
  slides,
  latestChapter,
}: ConquerorsRosterProps) {
  const frame = useCurrentFrame()
  const idx = Math.min(frame, slides.length - 1)
  const slide = slides[idx]
  if (!slide) return <AbsoluteFill style={{ background: '#0b0714' }} />
  return (
    <>
      {renderSlide(slide)}
      <Footer index={idx} total={slides.length} latestChapter={latestChapter} />
    </>
  )
}
