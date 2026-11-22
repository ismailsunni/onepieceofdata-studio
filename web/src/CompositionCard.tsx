import { useEffect, useRef, useState } from 'react'
import { Player, type PlayerRef } from '@remotion/player'
import type {
  CompositionEntry,
  CompositionKind,
  Platform,
  PublishStatus,
} from './compositions'

interface Props {
  entry: CompositionEntry
  autoPlay?: boolean
  linked?: boolean
}

const STATUS_LABEL: Record<PublishStatus, string> = {
  draft: 'Draft',
  scheduled: 'Scheduled',
  published: 'Published',
}

const KIND_LABEL: Record<CompositionKind, string> = {
  reel: 'Reel',
  carousel: 'Carousel',
  video: 'Video',
}

const PLATFORM_LABEL: Record<Platform, string> = {
  instagram: 'Instagram',
  tiktok: 'TikTok',
  youtube: 'YouTube',
  x: 'X',
}

function formatDate(iso: string): string {
  // Parse as a plain calendar date (avoid TZ shifting the day).
  const [y, m, d] = iso.split('-').map(Number)
  if (!y || !m || !d) return iso
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  })
}

function formatLength(frames: number, fps: number): string {
  const s = Math.round(frames / fps)
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

interface SnapshotEnvelope {
  ok: boolean
  builtAt: string
  data?: Record<string, unknown>
  error?: string
}

type SnapshotState =
  | { status: 'idle' }
  | { status: 'ok'; data: Record<string, unknown> }
  | { status: 'build-failed'; message: string; builtAt: string }
  | { status: 'fetch-failed'; message: string }

// Only one player plays at a time across the gallery.
let activePlayer: PlayerRef | null = null

function claim(p: PlayerRef) {
  if (activePlayer && activePlayer !== p) activePlayer.pause()
  activePlayer = p
}

export function CompositionCard({ entry, autoPlay = false, linked = false }: Props) {
  const cardRef = useRef<HTMLElement>(null)
  const playerRef = useRef<PlayerRef>(null)
  const [near, setNear] = useState(false)
  const [state, setState] = useState<SnapshotState>({ status: 'idle' })
  const [slide, setSlide] = useState(entry.posterFrame ?? 0)
  const isCarousel = entry.kind === 'carousel'

  // Defer fetching the snapshot and mounting the player until the card nears the viewport.
  useEffect(() => {
    const el = cardRef.current
    if (!el || near) return
    const io = new IntersectionObserver(
      ([e]) => e.isIntersecting && setNear(true),
      { rootMargin: '600px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [near])

  useEffect(() => {
    if (!near) return
    let cancelled = false
    fetch(`${import.meta.env.BASE_URL}${entry.snapshotPath}`)
      .then(async (r) => {
        if (!r.ok) throw new Error(`${r.status} ${r.statusText}`)
        return (await r.json()) as SnapshotEnvelope
      })
      .then((env) => {
        if (cancelled) return
        setState(
          env.ok && env.data
            ? { status: 'ok', data: env.data }
            : {
                status: 'build-failed',
                message: env.error ?? 'Unknown build error',
                builtAt: env.builtAt,
              }
        )
      })
      .catch((err) => {
        if (!cancelled)
          setState({ status: 'fetch-failed', message: String(err.message ?? err) })
      })
    return () => {
      cancelled = true
    }
  }, [near, entry.snapshotPath])

  const ready = state.status === 'ok'

  // Wire up single-active playback and carousel slide tracking.
  useEffect(() => {
    const p = playerRef.current
    if (!ready || !p) return
    const onPlay = () => claim(p)
    const onFrame = (e: { detail: { frame: number } }) => setSlide(e.detail.frame)
    p.addEventListener('play', onPlay)
    p.addEventListener('frameupdate', onFrame)
    p.addEventListener('seeked', onFrame)
    return () => {
      p.removeEventListener('play', onPlay)
      p.removeEventListener('frameupdate', onFrame)
      p.removeEventListener('seeked', onFrame)
    }
  }, [ready])

  // Kick off playback once ready. The Player's own `autoPlay` can be swallowed
  // by the browser's autoplay policy, so also retry on the first interaction.
  useEffect(() => {
    if (!autoPlay || !ready) return
    // Claim here too: the Player may start before our 'play' listener is attached.
    const start = () => {
      const p = playerRef.current
      if (!p) return
      claim(p)
      if (!p.isPlaying()) p.play()
    }
    // Don't hijack a click that was meant for another player.
    const retry = (e: Event) => {
      if (!(e.target as Element | null)?.closest?.('.player-wrap')) start()
    }
    const id = window.setTimeout(start, 0)
    window.addEventListener('pointerdown', retry, { once: true })
    window.addEventListener('keydown', retry, { once: true })
    return () => {
      window.clearTimeout(id)
      window.removeEventListener('pointerdown', retry)
      window.removeEventListener('keydown', retry)
    }
  }, [autoPlay, ready])

  const frames = ready ? Math.max(entry.durationInFrames(state.data), 1) : 1
  const goTo = (i: number) => playerRef.current?.seekTo(Math.min(Math.max(i, 0), frames - 1))

  return (
    <article className={`card${linked ? ' card-linked' : ''}`} id={entry.id} ref={cardRef}>
      <header className="card-header">
        <div className="card-title-row">
          <h3 className="card-title">
            <a href={`#${entry.id}`}>{entry.title}</a>
          </h3>
          <span className={`badge status-${entry.status}`}>
            {STATUS_LABEL[entry.status]}
          </span>
        </div>
        <p className="card-desc" title={entry.description}>
          {entry.description}
        </p>
        <div className="card-info">
          <span>
            {KIND_LABEL[entry.kind]}
            {ready &&
              (isCarousel
                ? ` · ${frames} slides`
                : ` · ${formatLength(frames, entry.fps)}`)}
          </span>
          {entry.publication ? (
            <a className="link" href={entry.publication.url} target="_blank" rel="noreferrer">
              ↗ {PLATFORM_LABEL[entry.publication.platform]}
              {entry.publication.publishedAt &&
                ` · ${formatDate(entry.publication.publishedAt)}`}
            </a>
          ) : (
            <span>Created {formatDate(entry.createdAt)}</span>
          )}
        </div>
        {entry.tags && entry.tags.length > 0 && (
          <div className="card-tags">
            {entry.tags.map((t) => (
              <span key={t} className="tag">
                #{t}
              </span>
            ))}
          </div>
        )}
      </header>
      <div className="player-wrap">
        <div
          className="player-frame"
          style={{ aspectRatio: `${entry.width} / ${entry.height}` }}
        >
          {state.status === 'idle' && <div className="status">Loading…</div>}
          {state.status === 'fetch-failed' && (
            <div className="status error">Couldn’t load snapshot: {state.message}</div>
          )}
          {state.status === 'build-failed' && (
            <div className="status error">
              <strong>Build failed</strong>
              <code>{state.message}</code>
              <small>last attempt: {new Date(state.builtAt).toLocaleString()}</small>
            </div>
          )}
          {ready && (
            <Player
              ref={playerRef}
              component={entry.component}
              inputProps={state.data}
              durationInFrames={frames}
              fps={entry.fps}
              compositionWidth={entry.width}
              compositionHeight={entry.height}
              initialFrame={Math.min(entry.posterFrame ?? 0, frames - 1)}
              controls={!isCarousel}
              clickToPlay={!isCarousel}
              loop={!isCarousel}
              autoPlay={autoPlay}
              acknowledgeRemotionLicense
              style={{ width: '100%', height: '100%' }}
            />
          )}
          {ready && isCarousel && (
            <>
              <button
                type="button"
                className="slide-arrow prev"
                aria-label="Previous slide"
                disabled={slide === 0}
                onClick={() => goTo(slide - 1)}
              >
                ‹
              </button>
              <button
                type="button"
                className="slide-arrow next"
                aria-label="Next slide"
                disabled={slide >= frames - 1}
                onClick={() => goTo(slide + 1)}
              >
                ›
              </button>
            </>
          )}
        </div>
        {ready && isCarousel && (
          <div className="slide-dots" role="group" aria-label="Slides">
            {Array.from({ length: frames }, (_, i) => (
              <button
                key={i}
                type="button"
                className={`dot${i === slide ? ' dot-active' : ''}`}
                aria-label={`Slide ${i + 1} of ${frames}`}
                aria-current={i === slide}
                onClick={() => goTo(i)}
              />
            ))}
          </div>
        )}
      </div>
    </article>
  )
}
