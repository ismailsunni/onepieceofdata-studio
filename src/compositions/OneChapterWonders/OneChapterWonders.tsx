import {
  AbsoluteFill,
  Easing,
  Img,
  interpolate,
  spring,
  useCurrentFrame,
  useVideoConfig,
} from 'remotion'
import type { OCWQuestion, OneChapterWondersSnapshot } from './fetch'
import { SITE } from '../../components/Watermark'

export type OneChapterWondersProps = OneChapterWondersSnapshot &
  Record<string, unknown>

// Timeline (30fps): a short title beat, then each question runs REVEAL → the
// timer counts down → the recorded pick lands (PICK) → feedback hold, then a
// score card. 15s total for a 5-question round.
const INTRO = 48
const Q_FRAMES = 72
const END_FRAMES = 66
const REVEAL = 8
const PICK = 44

const SANS = 'system-ui, -apple-system, sans-serif'
const MONO = 'ui-monospace, SFMono-Regular, Menlo, monospace'

export function totalFramesFor(questionCount: number): number {
  return INTRO + questionCount * Q_FRAMES + END_FRAMES
}

function timerColor(pct: number): string {
  if (pct > 50) return '#2563eb'
  if (pct > 30) return '#eab308'
  return '#ef4444'
}

export function OneChapterWonders({
  questions,
  totalPoints,
  correctCount,
}: OneChapterWondersProps) {
  const frame = useCurrentFrame()
  const { fps } = useVideoConfig()

  const n = questions.length
  const playEnd = INTRO + n * Q_FRAMES
  const inEnd = frame >= playEnd
  const activeIndex = Math.min(Math.max(Math.floor((frame - INTRO) / Q_FRAMES), 0), n - 1)

  // Running score: sum points of every question whose pick has already landed.
  let runningScore = 0
  for (let i = 0; i < n; i++) {
    if (frame >= INTRO + i * Q_FRAMES + PICK) runningScore += questions[i].points
  }

  return (
    <AbsoluteFill
      style={{
        background: 'linear-gradient(180deg, #0b1e3f 0%, #12306b 48%, #0a1730 100%)',
        fontFamily: SANS,
        color: 'white',
      }}
    >
      {/* Header: game label + running score pill (hidden during the hook) */}
      {frame >= INTRO && (
        <div
          style={{
            position: 'absolute',
            top: 150,
            left: 56,
            right: 56,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
          }}
        >
          <div style={{ fontSize: 26, letterSpacing: 4, fontWeight: 800, color: '#fbbf24' }}>
            ONE-CHAPTER WONDERS
          </div>
          <div
            style={{
              fontFamily: MONO,
              fontVariantNumeric: 'tabular-nums',
              fontSize: 30,
              fontWeight: 700,
              padding: '10px 22px',
              borderRadius: 999,
              background: 'rgba(251,191,36,0.14)',
              border: '2px solid rgba(251,191,36,0.5)',
              color: '#fbbf24',
            }}
          >
            {runningScore.toLocaleString('en-US')}
          </div>
        </div>
      )}

      {inEnd ? (
        <EndCard
          frame={frame - playEnd}
          fps={fps}
          correctCount={correctCount}
          total={n}
          totalPoints={totalPoints}
        />
      ) : (
        <QuestionCard
          key={activeIndex}
          q={questions[activeIndex]}
          index={activeIndex}
          total={n}
          localFrame={frame - (INTRO + activeIndex * Q_FRAMES)}
          fps={fps}
        />
      )}

      {/* Hook slide */}
      {frame < INTRO && <Hook frame={frame} fps={fps} />}

      <div
        style={{
          position: 'absolute',
          bottom: 48,
          left: 0,
          right: 0,
          textAlign: 'center',
          fontSize: 22,
          letterSpacing: '0.1em',
          fontWeight: 600,
          color: 'rgba(245,245,245,0.45)',
        }}
      >
        {SITE}
      </div>
    </AbsoluteFill>
  )
}

function Hook({ frame, fps }: { frame: number; fps: number }) {
  const badge = spring({ frame, fps, config: { damping: 12, stiffness: 200 } })
  const title = spring({ frame: frame - 3, fps, config: { damping: 15, stiffness: 120 } })
  const sub = interpolate(frame, [14, 26], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })
  const out = interpolate(frame, [INTRO - 8, INTRO], [1, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  })

  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        padding: '0 60px',
        opacity: out,
      }}
    >
      <div
        style={{
          transform: `scale(${interpolate(badge, [0, 1], [0.6, 1])})`,
          opacity: badge,
          marginBottom: 40,
          padding: '14px 34px',
          borderRadius: 999,
          background: '#fbbf24',
          color: '#0a1730',
          fontSize: 34,
          fontWeight: 900,
          letterSpacing: 4,
        }}
      >
        ★ NEW GAME
      </div>
      <div
        style={{
          transform: `translateY(${interpolate(title, [0, 1], [50, 0])}px) scale(${interpolate(title, [0, 1], [0.85, 1])})`,
          opacity: title,
          fontSize: 128,
          fontWeight: 900,
          lineHeight: 0.98,
          letterSpacing: 1,
          color: '#fbbf24',
          textShadow: '0 6px 30px rgba(0,0,0,0.4)',
        }}
      >
        ONE-CHAPTER
        <br />
        WONDERS
      </div>
      <div
        style={{
          opacity: sub,
          marginTop: 44,
          fontSize: 40,
          fontWeight: 600,
          lineHeight: 1.3,
          color: 'rgba(255,255,255,0.9)',
        }}
      >
        They appear in exactly{' '}
        <span style={{ color: '#fbbf24', fontWeight: 800 }}>one chapter</span>.
        <br />
        Can you name the arc?
      </div>
    </AbsoluteFill>
  )
}

function QuestionCard({
  q,
  index,
  total,
  localFrame,
  fps,
}: {
  q: OCWQuestion
  index: number
  total: number
  localFrame: number
  fps: number
}) {
  const answered = localFrame >= PICK

  const enter = spring({ frame: localFrame, fps, config: { damping: 16, stiffness: 120 } })
  const cardY = interpolate(enter, [0, 1], [40, 0])

  // Timer ticks from full down to where the pick landed (timeLeft/maxTime).
  const pickPct = (q.timeLeft / q.maxTime) * 100
  const timerPct = answered
    ? pickPct
    : interpolate(localFrame, [REVEAL, PICK], [100, pickPct], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
      })

  const feedback = spring({
    frame: localFrame - PICK,
    fps,
    config: { damping: 14, stiffness: 140 },
  })

  return (
    <AbsoluteFill style={{ alignItems: 'center', justifyContent: 'center' }}>
      <div
        style={{
          width: 860,
          background: 'white',
          borderRadius: 40,
          padding: '48px 44px 40px',
          color: '#111827',
          boxShadow: '0 30px 80px rgba(0,0,0,0.45)',
          transform: `translateY(${cardY}px)`,
          opacity: enter,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        {/* progress dots */}
        <div style={{ display: 'flex', gap: 12, marginBottom: 18 }}>
          {Array.from({ length: total }, (_, i) => (
            <div
              key={i}
              style={{
                width: 14,
                height: 14,
                borderRadius: 999,
                background: i < index ? '#2563eb' : i === index ? '#2563eb' : '#e5e7eb',
                boxShadow: i === index ? '0 0 0 5px rgba(37,99,235,0.2)' : undefined,
              }}
            />
          ))}
        </div>
        <div style={{ fontSize: 24, color: '#6b7280', marginBottom: 22 }}>
          Question {index + 1} of {total}
        </div>

        {/* portrait */}
        <div
          style={{
            width: 300,
            height: 300,
            borderRadius: 32,
            background: '#f3f4f6',
            overflow: 'hidden',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            marginBottom: 22,
          }}
        >
          {q.imageUrl ? (
            <Img
              src={q.imageUrl}
              style={{ width: '100%', height: '100%', objectFit: 'contain' }}
            />
          ) : (
            <span style={{ fontSize: 120, fontWeight: 800, color: '#9ca3af' }}>
              {q.name.charAt(0)}
            </span>
          )}
        </div>

        <div style={{ fontSize: 40, fontWeight: 800, textAlign: 'center' }}>{q.name}</div>
        <div style={{ fontSize: 26, color: '#6b7280', marginTop: 6, marginBottom: 24 }}>
          In which arc did they appear?
        </div>

        {/* timer bar */}
        <div
          style={{
            width: '100%',
            height: 12,
            borderRadius: 999,
            background: '#e5e7eb',
            overflow: 'hidden',
            marginBottom: 30,
          }}
        >
          <div
            style={{
              width: `${timerPct}%`,
              height: '100%',
              borderRadius: 999,
              background: timerColor(timerPct),
            }}
          />
        </div>

        {/* options */}
        <div style={{ width: '100%', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {q.options.map((o) => {
            const isCorrect = o.arcId === q.correctArcId
            const isPicked = o.arcId === q.pickedArcId
            let bg = 'white'
            let border = '#e5e7eb'
            let color = '#111827'
            let opacity = 1
            if (answered) {
              if (isCorrect) {
                bg = '#dcfce7'
                border = '#16a34a'
                color = '#15803d'
              } else if (isPicked) {
                bg = '#fee2e2'
                border = '#dc2626'
                color = '#b91c1c'
              } else {
                opacity = 0.45
              }
            }
            return (
              <div
                key={o.arcId}
                style={{
                  minHeight: 72,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  padding: '0 20px',
                  borderRadius: 18,
                  fontSize: 30,
                  fontWeight: 600,
                  background: bg,
                  border: `3px solid ${border}`,
                  color,
                  opacity,
                }}
              >
                {o.title}
              </div>
            )
          })}
        </div>

        {/* feedback */}
        {answered && (
          <div
            style={{
              marginTop: 26,
              textAlign: 'center',
              opacity: feedback,
              transform: `translateY(${interpolate(feedback, [0, 1], [12, 0])}px)`,
            }}
          >
            <div
              style={{
                fontSize: 34,
                fontWeight: 800,
                color: q.isCorrect ? '#15803d' : '#b91c1c',
              }}
            >
              {q.isCorrect
                ? `Correct!  +${q.points.toLocaleString('en-US')}`
                : `Nope — it was ${q.correctArcTitle}`}
            </div>
            {q.tagline && (
              <div style={{ fontSize: 27, fontWeight: 800, color: '#b45309', marginTop: 10 }}>
                {q.tagline}
              </div>
            )}
            <div style={{ fontSize: 22, fontWeight: 600, color: '#6b7280', marginTop: 6 }}>
              Appears only in chapter {q.chapter}
            </div>
          </div>
        )}
      </div>
    </AbsoluteFill>
  )
}

function EndCard({
  frame,
  fps,
  correctCount,
  total,
  totalPoints,
}: {
  frame: number
  fps: number
  correctCount: number
  total: number
  totalPoints: number
}) {
  const enter = spring({ frame, fps, config: { damping: 15, stiffness: 130 } })
  const count = Math.round(
    interpolate(frame, [6, 34], [0, totalPoints], {
      extrapolateLeft: 'clamp',
      extrapolateRight: 'clamp',
      easing: Easing.out(Easing.cubic),
    })
  )
  return (
    <AbsoluteFill
      style={{
        alignItems: 'center',
        justifyContent: 'center',
        transform: `scale(${interpolate(enter, [0, 1], [0.9, 1])})`,
        opacity: enter,
      }}
    >
      <div style={{ fontSize: 34, letterSpacing: 5, color: 'rgba(255,255,255,0.7)' }}>
        YOU SCORED
      </div>
      <div style={{ fontSize: 190, fontWeight: 900, lineHeight: 1, color: '#fbbf24' }}>
        {correctCount}
        <span style={{ fontSize: 90, color: 'rgba(255,255,255,0.6)' }}>/{total}</span>
      </div>
      <div
        style={{
          fontFamily: MONO,
          fontVariantNumeric: 'tabular-nums',
          fontSize: 64,
          fontWeight: 800,
          marginTop: 12,
        }}
      >
        {count.toLocaleString('en-US')} pts
      </div>
      <div style={{ fontSize: 30, marginTop: 40, color: 'rgba(255,255,255,0.8)', textAlign: 'center' }}>
        Can you beat it?
      </div>
      <div style={{ fontSize: 30, marginTop: 6, fontWeight: 700, color: '#fbbf24' }}>
        Play at {SITE}/games
      </div>
    </AbsoluteFill>
  )
}
