'use client'

import { useState, useRef, useCallback } from 'react'

interface ActionItem {
  task: string
  owner: string | null
  due_date: string | null
}

interface Clarification {
  issue: string
  question: string
}

interface ExtractedData {
  company_name: string | null
  contact_name: string | null
  contact_email: string | null
  contact_phone: string | null
  service_interested: string | null
  deal_stage: string | null
  estimated_value: string | null
  timeline: string | null
  action_items: ActionItem[]
  meeting_summary: string | null
  pain_points: string[]
  sentiment: 'Positive' | 'Neutral' | 'Negative'
  sentiment_rationale: string | null
  clarifications: Clarification[]
}

interface ProcessResult {
  transcript: string
  extracted: ExtractedData
}

const SENTIMENT_STYLES = {
  Positive: 'bg-emerald-50 text-emerald-800 border-emerald-200',
  Neutral: 'bg-amber-50 text-amber-800 border-amber-200',
  Negative: 'bg-red-50 text-red-800 border-red-200',
}
const SENTIMENT_ICON = { Positive: '↑', Neutral: '→', Negative: '↓' }

function formatDuration(s: number) {
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`
}

/* ── SVG primitives ── */
function MapleLeaf({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 110" fill="currentColor" className={className} aria-hidden="true">
      <path d="M50,5 L44,27 L22,20 L33,39 L12,44 L30,51 L23,68 L42,60 L42,88 L50,78 L58,88 L58,60 L77,68 L70,51 L88,44 L67,39 L78,20 L56,27 Z" />
      <rect x="47" y="88" width="6" height="17" rx="2" />
    </svg>
  )
}

function Snowflake({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" stroke="currentColor" fill="none" strokeWidth="1.5" className={className} aria-hidden="true">
      <line x1="12" y1="2" x2="12" y2="22" />
      <line x1="2" y1="12" x2="22" y2="12" />
      <line x1="4.9" y1="4.9" x2="19.1" y2="19.1" />
      <line x1="19.1" y1="4.9" x2="4.9" y2="19.1" />
      <line x1="12" y1="2" x2="9" y2="5" /><line x1="12" y1="2" x2="15" y2="5" />
      <line x1="12" y1="22" x2="9" y2="19" /><line x1="12" y1="22" x2="15" y2="19" />
      <line x1="2" y1="12" x2="5" y2="9" /><line x1="2" y1="12" x2="5" y2="15" />
      <line x1="22" y1="12" x2="19" y2="9" /><line x1="22" y1="12" x2="19" y2="15" />
    </svg>
  )
}

function PineTree({ x, height, className }: { x: number; height: number; className?: string }) {
  const w = height * 0.55
  const trunkH = height * 0.2
  const trunkW = height * 0.1
  return (
    <g className={className}>
      <polygon
        points={`${x},${200 - trunkH} ${x - w / 2},200 ${x + w / 2},200`}
        fill="#1a5c2a"
      />
      <polygon
        points={`${x},${200 - trunkH - height * 0.45} ${x - w * 0.65},${200 - trunkH - height * 0.15} ${x + w * 0.65},${200 - trunkH - height * 0.15}`}
        fill="#1a5c2a"
      />
      <polygon
        points={`${x},${200 - trunkH - height * 0.75} ${x - w * 0.38},${200 - trunkH - height * 0.48} ${x + w * 0.38},${200 - trunkH - height * 0.48}`}
        fill="#236b30"
      />
      <rect
        x={x - trunkW / 2}
        y={200 - trunkH}
        width={trunkW}
        height={trunkH}
        fill="#5c3a1e"
      />
    </g>
  )
}

/* ── Canada Scenery Banner ── */
function CanadaBanner() {
  return (
    <div className="relative w-full overflow-hidden" style={{ height: 160 }}>
      {/* Sky gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-sky-300 via-sky-100 to-white" />

      {/* Mountains in background */}
      <svg viewBox="0 0 800 160" className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
        {/* Far mountains — snowy peaks */}
        <polygon points="0,160 80,60 160,160" fill="#d1d5db" />
        <polygon points="60,160 160,45 260,160" fill="#e5e7eb" />
        <polygon points="160,160 280,30 400,160" fill="#d1d5db" />
        <polygon points="320,160 430,55 540,160" fill="#e5e7eb" />
        <polygon points="500,160 600,40 700,160" fill="#d1d5db" />
        <polygon points="650,160 740,65 800,160" fill="#e5e7eb" />
        {/* Snow caps */}
        <polygon points="160,45 140,80 180,80" fill="white" opacity="0.9" />
        <polygon points="280,30 258,68 302,68" fill="white" opacity="0.9" />
        <polygon points="600,40 580,75 620,75" fill="white" opacity="0.9" />

        {/* Snowy ground */}
        <ellipse cx="400" cy="165" rx="450" ry="22" fill="white" />

        {/* Pine trees — left cluster */}
        <PineTree x={30} height={70} />
        <PineTree x={65} height={85} />
        <PineTree x={100} height={60} />

        {/* Pine trees — middle-left */}
        <PineTree x={200} height={78} />
        <PineTree x={235} height={90} />
        <PineTree x={270} height={65} />

        {/* Pine trees — middle-right */}
        <PineTree x={520} height={80} />
        <PineTree x={558} height={95} />
        <PineTree x={592} height={68} />

        {/* Pine trees — right cluster */}
        <PineTree x={700} height={72} />
        <PineTree x={735} height={88} />
        <PineTree x={770} height={62} />

        {/* Moose silhouette */}
        <g transform="translate(360,95) scale(0.9)" fill="#2d1b06">
          {/* Body */}
          <ellipse cx="0" cy="0" rx="38" ry="20" />
          {/* Neck */}
          <path d="M28,-10 Q40,-25 42,-30 Q38,-32 32,-28 Q30,-18 22,-12 Z" />
          {/* Head */}
          <ellipse cx="40" cy="-32" rx="12" ry="8" />
          {/* Snout/nose */}
          <path d="M50,-30 Q60,-28 58,-24 Q54,-20 48,-23" />
          {/* Ear */}
          <path d="M35,-40 Q32,-48 38,-46 Q40,-40 36,-38" />
          {/* Hump */}
          <ellipse cx="-5" cy="-18" rx="14" ry="7" />
          {/* Legs */}
          <rect x="-25" y="16" width="7" height="30" rx="2" />
          <rect x="-12" y="16" width="7" height="32" rx="2" />
          <rect x="8" y="16" width="7" height="30" rx="2" />
          <rect x="21" y="16" width="7" height="28" rx="2" />
          {/* Antlers */}
          <path d="M36,-40 L32,-58 L26,-64 M32,-58 L38,-68 M32,-58 L36,-62" stroke="#2d1b06" strokeWidth="3" fill="none" strokeLinecap="round" />
          <path d="M44,-38 L45,-56 L40,-65 M45,-56 L52,-63 M45,-56 L48,-60" stroke="#2d1b06" strokeWidth="3" fill="none" strokeLinecap="round" />
          {/* Tail */}
          <ellipse cx="-36" cy="-5" rx="5" ry="8" />
        </g>

        {/* Snow dots / falling snow */}
        {[
          [50,30],[120,15],[200,50],[310,25],[420,10],[480,40],[570,20],[660,35],[750,12],
          [85,55],[175,38],[290,60],[400,45],[510,65],[630,50],[710,28],[780,55],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={cx} cy={cy} r="2.5" fill="white" opacity="0.85" />
        ))}
      </svg>

      {/* Title overlay */}
      <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none" style={{ paddingBottom: 24 }}>
        <div className="flex items-center gap-2 bg-white/60 backdrop-blur-sm rounded-full px-5 py-2 shadow-sm">
          <MapleLeaf className="w-5 h-5 text-red-600" />
          <span className="text-sm font-semibold text-red-800 tracking-wide">Your Canadian Sales Intelligence Companion</span>
          <MapleLeaf className="w-5 h-5 text-red-600" />
        </div>
      </div>
    </div>
  )
}

/* ── Main page ── */
export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [showTranscript, setShowTranscript] = useState(false)

  const [isRecording, setIsRecording] = useState(false)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<BlobPart[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

  // Clarification re-run state
  const [clarificationAnswers, setClarificationAnswers] = useState<Record<number, string>>({})
  const [reanalyzing, setReanalyzing] = useState(false)

  // Airtable save state
  const [airtableStatus, setAirtableStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const [airtableError, setAirtableError] = useState<string | null>(null)

  const startRecording = useCallback(async () => {
    setError(null)
    setAudioFile(null)
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      chunksRef.current = []
      const recorder = new MediaRecorder(stream)
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const mimeType = recorder.mimeType || 'audio/webm'
        const blob = new Blob(chunksRef.current, { type: mimeType })
        const ext = mimeType.includes('mp4') ? 'mp4' : mimeType.includes('ogg') ? 'ogg' : 'webm'
        setAudioFile(new File([blob], `recording.${ext}`, { type: mimeType }))
        stream.getTracks().forEach(t => t.stop())
      }
      recorder.start()
      mediaRecorderRef.current = recorder
      setIsRecording(true)
      setRecordingDuration(0)
      timerRef.current = setInterval(() => setRecordingDuration(d => d + 1), 1000)
    } catch {
      setError('Microphone access was denied. Please allow microphone access in your browser and try again.')
    }
  }, [])

  const stopRecording = useCallback(() => {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setIsRecording(false)
  }, [])

  const handleProcess = async () => {
    if (!audioFile && !notes.trim()) {
      setError('Please record a voice memo or enter meeting notes before processing.')
      return
    }
    setLoading(true)
    setError(null)
    setResult(null)
    try {
      const formData = new FormData()
      if (audioFile) formData.append('audio', audioFile)
      if (notes.trim()) formData.append('notes', notes)
      const response = await fetch('/api/process', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Processing failed')
      setResult(data)
      setShowTranscript(false)
      setAirtableStatus('idle')
      setAirtableError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const handleReanalyze = async () => {
    if (!result) return
    const answeredCount = Object.values(clarificationAnswers).filter(a => a.trim()).length
    if (answeredCount === 0) return

    setReanalyzing(true)
    setError(null)
    try {
      const formData = new FormData()
      if (result.transcript) formData.append('transcript', result.transcript)
      if (notes.trim()) formData.append('notes', notes)

      const clarificationsWithAnswers = (result.extracted.clarifications ?? []).map((c, i) => ({
        question: c.question,
        answer: clarificationAnswers[i] ?? '',
      }))
      formData.append('clarifications', JSON.stringify(clarificationsWithAnswers))

      const response = await fetch('/api/process', { method: 'POST', body: formData })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Re-analysis failed')
      setResult(data)
      setClarificationAnswers({})
      setShowTranscript(false)
      setAirtableStatus('idle')
      setAirtableError(null)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setReanalyzing(false)
    }
  }

  const handleSaveToAirtable = async () => {
    if (!result) return
    setAirtableStatus('saving')
    setAirtableError(null)
    try {
      const response = await fetch('/api/airtable', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ extracted: result.extracted }),
      })
      const data = await response.json()
      if (!response.ok) throw new Error(data.error || 'Failed to save to Airtable')
      setAirtableStatus('saved')
    } catch (err) {
      setAirtableStatus('error')
      setAirtableError(err instanceof Error ? err.message : 'Failed to save to Airtable')
    }
  }

  const exportCSV = () => {
    if (!result) return
    const { extracted } = result
    const headers = [
      'Company Name','Contact Name','Contact Email','Contact Phone',
      'Service Interested','Deal Stage','Estimated Value','Timeline',
      'Action Items','Meeting Summary','Pain Points','Sentiment','Sentiment Rationale',
    ]
    const actionItemsStr = (extracted.action_items ?? [])
      .map(ai => `${ai.task}${ai.owner ? ` [${ai.owner}]` : ''}${ai.due_date ? ` - ${ai.due_date}` : ''}`)
      .join('; ')
    const row = [
      extracted.company_name ?? '', extracted.contact_name ?? '',
      extracted.contact_email ?? '', extracted.contact_phone ?? '',
      extracted.service_interested ?? '', extracted.deal_stage ?? '',
      extracted.estimated_value ?? '', extracted.timeline ?? '',
      actionItemsStr, extracted.meeting_summary ?? '',
      (extracted.pain_points ?? []).join('; '),
      extracted.sentiment ?? '', extracted.sentiment_rationale ?? '',
    ]
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [headers.map(escape).join(','), row.map(escape).join(',')].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${extracted.company_name?.toLowerCase().replace(/\s+/g, '-') ?? 'meeting'}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sentiment = result?.extracted.sentiment

  return (
    <div className="min-h-screen bg-slate-50" style={{ backgroundImage: 'radial-gradient(circle at 20% 30%, rgba(220,38,38,0.04) 0%, transparent 60%), radial-gradient(circle at 80% 70%, rgba(220,38,38,0.04) 0%, transparent 60%)' }}>

      {/* Scattered background decorations */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden" aria-hidden="true">
        <MapleLeaf className="absolute top-[8%]  left-[3%]  w-20 h-20 text-red-300 opacity-20 rotate-12" />
        <MapleLeaf className="absolute top-[20%] right-[4%] w-14 h-14 text-red-400 opacity-15 -rotate-15" />
        <MapleLeaf className="absolute top-[55%] left-[2%] w-10 h-10 text-red-300 opacity-20 rotate-45" />
        <MapleLeaf className="absolute bottom-[15%] right-[3%] w-16 h-16 text-red-300 opacity-15 rotate-30" />
        <MapleLeaf className="absolute bottom-[40%] left-[1%] w-8  h-8  text-red-400 opacity-10 -rotate-20" />
        <MapleLeaf className="absolute top-[70%] right-[6%] w-12 h-12 text-red-300 opacity-15 rotate-60" />
        <Snowflake className="absolute top-[12%] left-[18%] w-8 h-8 text-sky-300 opacity-30" />
        <Snowflake className="absolute top-[35%] right-[14%] w-6 h-6 text-sky-300 opacity-25" />
        <Snowflake className="absolute bottom-[25%] left-[8%] w-7 h-7 text-sky-200 opacity-30" />
        <Snowflake className="absolute bottom-[10%] right-[18%] w-5 h-5 text-sky-300 opacity-25" />
        <Snowflake className="absolute top-[48%] left-[22%] w-4 h-4 text-sky-200 opacity-20" />
      </div>

      {/* ── Header ── */}
      <header className="bg-red-700 shadow-md sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <MapleLeaf className="w-9 h-9 text-white flex-shrink-0" />
            <div>
              <h1 className="text-lg font-bold text-white leading-tight tracking-wide">MeetingIntel</h1>
              <p className="text-xs text-red-200">Sales meeting analyzer &amp; CRM exporter</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 text-red-200 text-xs font-medium">
            <Snowflake className="w-4 h-4" />
            <span>Made in Canada, eh?</span>
            <Snowflake className="w-4 h-4" />
          </div>
        </div>
      </header>

      {/* ── Canada Scenery Banner ── */}
      <CanadaBanner />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── Left: Input Panel ── */}
          <div className="space-y-5">
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-6">
              <div className="flex items-center gap-2 mb-5">
                <MapleLeaf className="w-4 h-4 text-red-600" />
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Meeting Input</h2>
              </div>

              {/* Voice Recorder */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Voice Memo
                  <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
                </label>
                <div className="flex flex-col items-center gap-3 py-6 px-4 border border-red-100 rounded-xl bg-red-50/40">
                  <button
                    type="button"
                    onClick={isRecording ? stopRecording : startRecording}
                    className={`relative w-16 h-16 rounded-full flex items-center justify-center transition-all focus:outline-none focus:ring-4 shadow-md ${
                      isRecording
                        ? 'bg-red-600 hover:bg-red-700 focus:ring-red-200'
                        : audioFile
                        ? 'bg-emerald-500 hover:bg-emerald-600 focus:ring-emerald-200'
                        : 'bg-red-700 hover:bg-red-800 focus:ring-red-200'
                    }`}
                    aria-label={isRecording ? 'Stop recording' : 'Start recording'}
                  >
                    {isRecording && (
                      <span className="absolute inset-0 rounded-full bg-red-400 animate-ping opacity-50" />
                    )}
                    {isRecording ? (
                      <svg className="w-6 h-6 text-white relative z-10" fill="currentColor" viewBox="0 0 24 24">
                        <rect x="6" y="6" width="12" height="12" rx="1" />
                      </svg>
                    ) : audioFile ? (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                      </svg>
                    ) : (
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                    )}
                  </button>

                  {isRecording ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-red-700">Recording {formatDuration(recordingDuration)}</p>
                      <p className="text-xs text-gray-400 mt-0.5">Click to stop</p>
                    </div>
                  ) : audioFile ? (
                    <div className="text-center">
                      <p className="text-sm font-semibold text-emerald-700">Recording ready</p>
                      <button
                        type="button"
                        onClick={() => setAudioFile(null)}
                        className="text-xs text-gray-400 hover:text-gray-600 mt-0.5 underline underline-offset-2"
                      >
                        Discard &amp; re-record
                      </button>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-sm text-gray-600 font-medium">Click to record</p>
                      <p className="text-xs text-gray-400 mt-0.5">Speak about your meeting after clicking</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Notes Textarea */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Meeting Notes
                  <span className="ml-1 text-xs font-normal text-gray-400">optional</span>
                </label>
                <textarea
                  className="w-full border border-gray-200 rounded-xl p-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-red-400 focus:border-transparent resize-none leading-relaxed bg-white"
                  rows={9}
                  placeholder={`Paste your notes here...

e.g. Met with Sarah Chen, VP Operations at Acme Corp. They're interested in our supply chain optimisation practice. Budget around $200k, want to kick off in Q3. Main concern is cultural alignment. Follow up with proposal by Friday.`}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              <button
                type="button"
                onClick={handleProcess}
                disabled={loading || isRecording}
                className="w-full bg-red-700 hover:bg-red-800 active:bg-red-900 disabled:bg-red-300 text-white font-semibold py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
              >
                {loading ? (
                  <>
                    <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    Analyzing meeting...
                  </>
                ) : (
                  <>
                    <MapleLeaf className="w-4 h-4 text-white" />
                    Process Meeting
                  </>
                )}
              </button>
            </div>

            {/* Transcript accordion */}
            {result?.transcript && (
              <div className="bg-white rounded-2xl border border-red-100 shadow-sm overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-700 hover:bg-red-50/40 transition-colors"
                  onClick={() => setShowTranscript(v => !v)}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                    </svg>
                    Voice Transcript
                  </span>
                  <svg className={`w-4 h-4 text-gray-400 transition-transform ${showTranscript ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                {showTranscript && (
                  <div className="px-5 pb-5">
                    <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">{result.transcript}</p>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right: Results Panel ── */}
          {result ? (
            <div className="space-y-4">
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2">
                  <MapleLeaf className="w-4 h-4 text-red-600" />
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Extracted Data</h2>
                </div>
                <div className="flex items-center gap-2">
                  {/* Save to Airtable */}
                  <button
                    type="button"
                    onClick={handleSaveToAirtable}
                    disabled={airtableStatus === 'saving' || airtableStatus === 'saved'}
                    className={`flex items-center gap-1.5 text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm ${
                      airtableStatus === 'saved'
                        ? 'bg-blue-100 text-blue-700 border border-blue-200 cursor-default'
                        : airtableStatus === 'error'
                        ? 'bg-red-600 hover:bg-red-700 text-white'
                        : 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white'
                    }`}
                  >
                    {airtableStatus === 'saving' ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Saving...
                      </>
                    ) : airtableStatus === 'saved' ? (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                        Saved to Airtable
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                        </svg>
                        {airtableStatus === 'error' ? 'Retry Airtable' : 'Save to Airtable'}
                      </>
                    )}
                  </button>

                  {/* Export CSV */}
                  <button
                    type="button"
                    onClick={exportCSV}
                    className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors shadow-sm"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                    </svg>
                    Export CSV
                  </button>
                </div>
              </div>

              {/* Airtable error message */}
              {airtableStatus === 'error' && airtableError && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{airtableError}</p>
                </div>
              )}

              {sentiment && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${SENTIMENT_STYLES[sentiment]}`}>
                  <span className="font-bold">{SENTIMENT_ICON[sentiment]}</span>
                  {sentiment} Sentiment
                  {result.extracted.sentiment_rationale && (
                    <span className="text-xs font-normal opacity-80">— {result.extracted.sentiment_rationale}</span>
                  )}
                </div>
              )}

              {/* Clarifications */}
              {(result.extracted.clarifications ?? []).length > 0 && (
                <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
                  <div className="flex items-center gap-2 mb-4">
                    <svg className="w-4 h-4 text-amber-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                    </svg>
                    <h3 className="text-xs font-semibold text-amber-700 uppercase tracking-wider">Clarifications Needed</h3>
                  </div>

                  <div className="space-y-4">
                    {result.extracted.clarifications.map((c, i) => (
                      <div key={i} className="bg-white border border-amber-100 rounded-xl p-4">
                        <div className="flex items-start gap-2 mb-2">
                          <span className="inline-block bg-amber-100 text-amber-700 text-xs font-semibold px-2 py-0.5 rounded-full flex-shrink-0 mt-0.5">
                            {c.issue}
                          </span>
                        </div>
                        <p className="text-sm text-gray-700 font-medium mb-2">{c.question}</p>
                        <input
                          type="text"
                          placeholder="Type your answer..."
                          value={clarificationAnswers[i] ?? ''}
                          onChange={e =>
                            setClarificationAnswers(prev => ({ ...prev, [i]: e.target.value }))
                          }
                          className="w-full border border-amber-200 rounded-lg px-3 py-2 text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-amber-400 focus:border-transparent bg-amber-50/50"
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={handleReanalyze}
                    disabled={reanalyzing || Object.values(clarificationAnswers).every(a => !a.trim())}
                    className="mt-4 w-full bg-amber-500 hover:bg-amber-600 active:bg-amber-700 disabled:bg-amber-200 disabled:text-amber-400 text-white font-semibold py-2.5 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm shadow-sm"
                  >
                    {reanalyzing ? (
                      <>
                        <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                        </svg>
                        Re-analyzing...
                      </>
                    ) : (
                      <>
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Re-analyze with Clarifications
                      </>
                    )}
                  </button>
                </div>
              )}

              <Section title="Company & Contact">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Company" value={result.extracted.company_name} />
                  <Field label="Contact Name" value={result.extracted.contact_name} />
                  <Field label="Email" value={result.extracted.contact_email} />
                  <Field label="Phone" value={result.extracted.contact_phone} />
                </div>
              </Section>

              <Section title="Deal Information">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="col-span-2"><Field label="Service / Solution" value={result.extracted.service_interested} /></div>
                  <Field label="Deal Stage" value={result.extracted.deal_stage} badge />
                  <Field label="Estimated Value" value={result.extracted.estimated_value} />
                  <div className="col-span-2"><Field label="Timeline" value={result.extracted.timeline} /></div>
                </div>
              </Section>

              <Section title="Meeting Summary">
                <p className="text-sm text-gray-700 leading-relaxed">{result.extracted.meeting_summary ?? <NullValue />}</p>
              </Section>

              {(result.extracted.pain_points ?? []).length > 0 && (
                <Section title="Pain Points & Needs">
                  <ul className="space-y-2">
                    {result.extracted.pain_points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-red-400 flex-shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {(result.extracted.action_items ?? []).length > 0 && (
                <Section title="Action Items">
                  <div className="space-y-2">
                    {result.extracted.action_items.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-red-50/40 rounded-lg border border-red-100">
                        <div className="w-4 h-4 rounded border-2 border-red-300 flex-shrink-0 mt-0.5" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-gray-800 font-medium leading-snug">{item.task}</p>
                          <div className="flex flex-wrap items-center gap-3 mt-1.5">
                            {item.owner && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                </svg>
                                {item.owner}
                              </span>
                            )}
                            {item.due_date && (
                              <span className="flex items-center gap-1 text-xs text-gray-500">
                                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                </svg>
                                {item.due_date}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </Section>
              )}
            </div>
          ) : (
            <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <MapleLeaf className="w-16 h-16 text-red-200 mb-4" />
              <h3 className="text-base font-semibold text-gray-800 mb-1">Results will appear here</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Record a voice memo or paste your notes, then click{' '}
                <span className="font-medium text-gray-500">Process Meeting</span> to extract structured CRM data.
              </p>
              <div className="flex items-center gap-2 mt-6 text-red-300">
                <Snowflake className="w-5 h-5" />
                <Snowflake className="w-4 h-4 opacity-60" />
                <Snowflake className="w-5 h-5" />
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="mt-16 border-t border-red-100 py-6 text-center">
        <div className="flex items-center justify-center gap-2 text-xs text-gray-400">
          <MapleLeaf className="w-3.5 h-3.5 text-red-400" />
          <span>MeetingIntel — Built with Canadian pride</span>
          <MapleLeaf className="w-3.5 h-3.5 text-red-400" />
        </div>
      </footer>
    </div>
  )
}

/* ── Sub-components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-2xl border border-red-100 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-red-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({ label, value, badge = false }: { label: string; value: string | null; badge?: boolean }) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      {value ? (
        badge ? (
          <span className="inline-block bg-red-50 text-red-700 text-xs font-medium px-2 py-0.5 rounded-full border border-red-100">
            {value}
          </span>
        ) : (
          <p className="text-sm text-gray-800 font-medium">{value}</p>
        )
      ) : (
        <NullValue />
      )}
    </div>
  )
}

function NullValue() {
  return <span className="text-sm text-gray-300">—</span>
}
