import { AbsoluteFill, useCurrentFrame } from 'remotion'
import { SITE } from '../../components/Watermark'
import {
  formatPublishedOn,
  type BirthdayMoment,
} from './fetch'

export type OnePieceBirthdaysProps = {
  moments: BirthdayMoment[]
} & Record<string, unknown>

export const SLIDE_WIDTH = 1080
export const SLIDE_HEIGHT = 1350

const SANS = 'system-ui, -apple-system, sans-serif'
const GOLD = '#fbbf24'
const SAFE_X = 72

function Footer({ index, total }: { index: number; total: number }) {
  return (
    <div
      style={{
        position: 'absolute', bottom: 26, left: 40, right: 40,
        display: 'flex', justifyContent: 'space-between',
        fontSize: 19, fontWeight: 700, letterSpacing: 2.5,
        color: 'rgba(255,255,255,0.62)',
      }}
    >
      <span>{SITE}</span><span>{index + 1} / {total}</span>
    </div>
  )
}

function Cover() {
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(145deg, #16051e, #57215f 54%, #142449)', color: 'white', fontFamily: SANS, overflow: 'hidden' }}>
      <div style={{ position: 'absolute', width: 940, height: 940, borderRadius: '50%', border: '2px solid rgba(251,191,36,.28)', top: 175, left: 70 }} />
      <div style={{ position: 'absolute', width: 680, height: 680, borderRadius: '50%', border: '2px solid rgba(251,191,36,.16)', top: 305, left: 200 }} />
      <div style={{ margin: 'auto 72px', textAlign: 'center', zIndex: 1 }}>
        <div style={{ color: GOLD, fontSize: 29, fontWeight: 800, letterSpacing: 8, textTransform: 'uppercase' }}>22 July 1997 → 2026</div>
        <div style={{ fontSize: 120, lineHeight: .94, fontWeight: 900, letterSpacing: -5, marginTop: 35 }}>29 YEARS<br />AT SEA</div>
        <div style={{ height: 10, width: 250, borderRadius: 999, background: GOLD, margin: '42px auto' }} />
        <div style={{ fontSize: 39, lineHeight: 1.35, fontWeight: 500 }}>Where was the manga on each One Piece birthday?</div>
        <div style={{ marginTop: 47, fontSize: 25, letterSpacing: 4, fontWeight: 800, color: 'rgba(255,255,255,.7)' }}>SWIPE TO SAIL THROUGH TIME →</div>
      </div>
    </AbsoluteFill>
  )
}

function MomentCard({ moment }: { moment: BirthdayMoment }) {
  const chapter = moment.chapter == null ? '—' : `ch. ${moment.chapter}`
  return (
    <div style={{ flex: 1, minHeight: 270, borderRadius: 30, padding: '28px 32px', background: 'rgba(255,255,255,.095)', border: '1px solid rgba(255,255,255,.16)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 16 }}>
        <span style={{ color: GOLD, fontSize: 27, fontWeight: 900, letterSpacing: 2 }}>BIRTHDAY {moment.birthday}</span>
        <span style={{ fontSize: 25, fontWeight: 700, color: 'rgba(255,255,255,.67)' }}>{moment.year}</span>
      </div>
      <div style={{ marginTop: 13, fontSize: 52, lineHeight: 1, fontWeight: 900, letterSpacing: -1 }}>{chapter}</div>
      <div style={{ marginTop: 10, fontSize: 27, lineHeight: 1.16, fontWeight: 700, color: '#fff' }}>{moment.chapterTitle ?? 'No chapter publication found'}</div>
      <div style={{ marginTop: 16, display: 'flex', gap: 12, alignItems: 'center', fontSize: 22, lineHeight: 1.2, color: 'rgba(255,255,255,.7)' }}>
        <span style={{ color: GOLD }}>◆</span><span>{moment.arcTitle ?? '—'} · {formatPublishedOn(moment.publishedOn)}</span>
      </div>
    </div>
  )
}

function TimelineSlide({ moments, start }: { moments: BirthdayMoment[]; start: number }) {
  const group = moments.slice(start, start + 3)
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(160deg, #15051d 0%, #3c164e 52%, #102342 100%)', color: 'white', fontFamily: SANS, padding: `78px ${SAFE_X}px 105px`, boxSizing: 'border-box' }}>
      <div style={{ color: GOLD, fontSize: 25, letterSpacing: 6, fontWeight: 900 }}>THE BIRTHDAY LOG</div>
      <div style={{ marginTop: 14, fontSize: 63, lineHeight: 1, fontWeight: 900, letterSpacing: -2 }}>Years {group[0]?.year}–{group[group.length - 1]?.year}</div>
      <div style={{ marginTop: 15, fontSize: 27, lineHeight: 1.3, color: 'rgba(255,255,255,.7)' }}>The latest chapter published on or before 22 July.</div>
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 22, marginTop: 37 }}>
        {group.map((moment) => <MomentCard key={moment.birthday} moment={moment} />)}
      </div>
    </AbsoluteFill>
  )
}

function Closer() {
  return (
    <AbsoluteFill style={{ background: 'linear-gradient(145deg, #142449, #57215f 55%, #16051e)', color: 'white', fontFamily: SANS, textAlign: 'center' }}>
      <div style={{ margin: 'auto 72px' }}>
        <div style={{ color: GOLD, fontSize: 28, fontWeight: 900, letterSpacing: 7 }}>ONE MORE YEAR</div>
        <div style={{ marginTop: 27, fontSize: 104, lineHeight: .95, fontWeight: 900, letterSpacing: -4 }}>29 birthdays.<br />One voyage.</div>
        <div style={{ width: 230, height: 9, borderRadius: 99, background: GOLD, margin: '42px auto' }} />
        <div style={{ fontSize: 37, lineHeight: 1.32, color: 'rgba(255,255,255,.9)' }}>Which birthday chapter takes you straight back to your favourite era?</div>
        <div style={{ marginTop: 55, color: GOLD, fontSize: 27, fontWeight: 800 }}>Happy 29th, One Piece.</div>
      </div>
    </AbsoluteFill>
  )
}

export function OnePieceBirthdays({ moments }: OnePieceBirthdaysProps) {
  const frame = useCurrentFrame()
  const timelineSlides = Math.ceil(moments.length / 3)
  const total = timelineSlides + 2
  const content = frame === 0 ? <Cover /> : frame === total - 1 ? <Closer /> : <TimelineSlide moments={moments} start={(frame - 1) * 3} />
  return <AbsoluteFill>{content}<Footer index={frame} total={total} /></AbsoluteFill>
}
