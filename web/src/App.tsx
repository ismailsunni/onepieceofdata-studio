import { useEffect, useMemo, useState } from 'react'
import {
  COMPOSITIONS,
  type CompositionEntry,
  type CompositionKind,
  type PublishStatus,
} from './compositions'
import { CompositionCard } from './CompositionCard'

type FormatFilter = 'all' | CompositionKind
type StatusFilter = 'all' | PublishStatus
type Theme = 'system' | 'light' | 'dark'

const THEME_ORDER: Theme[] = ['system', 'light', 'dark']
const THEME_LABEL: Record<Theme, string> = {
  system: 'System',
  light: 'Light',
  dark: 'Dark',
}

function nextTheme(t: Theme): Theme {
  return THEME_ORDER[(THEME_ORDER.indexOf(t) + 1) % THEME_ORDER.length]
}

function ThemeIcon({ theme }: { theme: Theme }) {
  const common = {
    width: 18,
    height: 18,
    viewBox: '0 0 24 24',
    fill: 'none',
    stroke: 'currentColor',
    strokeWidth: 2,
    strokeLinecap: 'round' as const,
    strokeLinejoin: 'round' as const,
  }
  if (theme === 'light') {
    return (
      <svg {...common}>
        <circle cx="12" cy="12" r="4" />
        <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
      </svg>
    )
  }
  if (theme === 'dark') {
    return (
      <svg {...common}>
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
      </svg>
    )
  }
  return (
    <svg {...common}>
      <rect x="2" y="3" width="20" height="14" rx="2" ry="2" />
      <path d="M8 21h8M12 17v4" />
    </svg>
  )
}

function readTheme(): Theme {
  try {
    const t = localStorage.getItem('theme')
    if (t === 'light' || t === 'dark' || t === 'system') return t
  } catch {
    /* localStorage unavailable */
  }
  return 'system'
}

const FORMAT_FILTERS: { value: FormatFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'reel', label: 'Reels' },
  { value: 'carousel', label: 'Carousels' },
  { value: 'video', label: 'Videos' },
]

const STATUS_FILTERS: { value: StatusFilter; label: string }[] = [
  { value: 'all', label: 'All' },
  { value: 'published', label: 'Published' },
  { value: 'scheduled', label: 'Scheduled' },
  { value: 'draft', label: 'Draft' },
]

const SECTION_TITLE: Record<PublishStatus, string> = {
  published: 'Published',
  scheduled: 'Scheduled',
  draft: 'In the works',
}

function readParam<T extends string>(key: string, allowed: { value: T }[]): T {
  const v = new URLSearchParams(window.location.search).get(key)
  return allowed.find((f) => f.value === v)?.value ?? allowed[0].value
}

const readHash = () => decodeURIComponent(window.location.hash.slice(1))

export function App() {
  const [format, setFormat] = useState<FormatFilter>(() => readParam('format', FORMAT_FILTERS))
  const [status, setStatus] = useState<StatusFilter>(() => readParam('status', STATUS_FILTERS))
  const [theme, setTheme] = useState<Theme>(readTheme)
  const [linkedId, setLinkedId] = useState(readHash)

  useEffect(() => {
    document.documentElement.dataset.theme = theme
    try {
      localStorage.setItem('theme', theme)
    } catch {
      /* localStorage unavailable */
    }
  }, [theme])

  // Keep filters in the URL so a filtered view can be shared.
  useEffect(() => {
    const p = new URLSearchParams()
    if (format !== 'all') p.set('format', format)
    if (status !== 'all') p.set('status', status)
    const q = p.toString()
    history.replaceState(null, '', `${window.location.pathname}${q ? `?${q}` : ''}${window.location.hash}`)
  }, [format, status])

  // #<id> deep-links to a composition: scroll to it and play it.
  useEffect(() => {
    const onHash = () => setLinkedId(readHash())
    window.addEventListener('hashchange', onHash)
    if (linkedId) document.getElementById(linkedId)?.scrollIntoView({ block: 'start' })
    return () => window.removeEventListener('hashchange', onHash)
  }, [])

  const matches = (c: CompositionEntry, f: FormatFilter, s: StatusFilter) =>
    (f === 'all' || c.kind === f) && (s === 'all' || c.status === s)

  const visible = useMemo(
    () => COMPOSITIONS.filter((c) => matches(c, format, status)),
    [format, status]
  )

  // Group by status (COMPOSITIONS is already ordered published → draft).
  const sections = useMemo(() => {
    const groups = new Map<PublishStatus, CompositionEntry[]>()
    for (const c of visible) groups.set(c.status, [...(groups.get(c.status) ?? []), c])
    return [...groups]
  }, [visible])

  // Autoplay the deep-linked reel, else the first reel on screen.
  const autoPlayId = useMemo(() => {
    const linked = visible.find((c) => c.id === linkedId)
    return linked?.kind === 'reel' ? linked.id : visible.find((c) => c.kind === 'reel')?.id
  }, [visible, linkedId])

  const filterGroup = <T extends string>(
    label: string,
    options: { value: T; label: string }[],
    value: T,
    setValue: (v: T) => void,
    count: (v: T) => number
  ) => (
    <div className="filter-group" role="group" aria-label={`Filter by ${label.toLowerCase()}`}>
      <span className="filter-label">{label}</span>
      {options
        // Hide options nothing could ever match (e.g. no videos yet).
        .filter(
          (f) =>
            f.value === 'all' ||
            f.value === value ||
            COMPOSITIONS.some((c) => c.kind === f.value || c.status === f.value)
        )
        .map((f) => (
          <button
            key={f.value}
            type="button"
            className={`pill${value === f.value ? ' pill-active' : ''}`}
            aria-pressed={value === f.value}
            onClick={() => setValue(f.value)}
          >
            {f.label}
            <span className="pill-count">{count(f.value)}</span>
          </button>
        ))}
    </div>
  )

  return (
    <main className="page">
      <header className="header">
        <div className="header-top">
          <div>
            <p className="eyebrow">One Piece of Data</p>
            <h1>Studio</h1>
          </div>
          <button
            type="button"
            className="theme-toggle"
            onClick={() => setTheme(nextTheme(theme))}
            aria-label={`Theme: ${THEME_LABEL[theme]}. Click to switch to ${THEME_LABEL[nextTheme(theme)]}.`}
            title={`Theme: ${THEME_LABEL[theme]} (click to change)`}
          >
            <ThemeIcon theme={theme} />
          </button>
        </div>
        <p className="tagline">
          Data-driven reels and carousels about the world of One Piece — every
          chart, ranking and number pulled straight from the dataset.
        </p>
        <div className="header-links">
          <a
            className="btn btn-primary"
            href="https://www.instagram.com/onepieceofdata/"
            target="_blank"
            rel="noreferrer"
          >
            Follow on Instagram
          </a>
          <a className="btn" href="https://onepieceofdata.com" target="_blank" rel="noreferrer">
            Explore the data ↗
          </a>
        </div>
      </header>

      <div className="filters">
        {filterGroup('Format', FORMAT_FILTERS, format, setFormat, (v) =>
          COMPOSITIONS.filter((c) => matches(c, v, status)).length
        )}
        {filterGroup('Status', STATUS_FILTERS, status, setStatus, (v) =>
          COMPOSITIONS.filter((c) => matches(c, format, v)).length
        )}
      </div>

      {visible.length === 0 ? (
        <div className="empty-state">
          Nothing matches this filter yet — try another combination.
        </div>
      ) : (
        sections.map(([s, items]) => (
          <section key={s} className="section" aria-label={SECTION_TITLE[s]}>
            {sections.length > 1 && (
              <h2 className="section-title">
                {SECTION_TITLE[s]} <span className="pill-count">{items.length}</span>
              </h2>
            )}
            <div className="gallery">
              {items.map((c) => (
                <CompositionCard
                  key={c.id}
                  entry={c}
                  autoPlay={c.id === autoPlayId}
                  linked={c.id === linkedId}
                />
              ))}
            </div>
          </section>
        ))
      )}
    </main>
  )
}
