'use client'

import { useState, useRef, useCallback } from 'react'

interface ActionItem {
  task: string
  owner: string | null
  due_date: string | null
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

const SENTIMENT_ICON = {
  Positive: '↑',
  Neutral: '→',
  Negative: '↓',
}

export default function Home() {
  const [audioFile, setAudioFile] = useState<File | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<ProcessResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [isDragging, setIsDragging] = useState(false)
  const [showTranscript, setShowTranscript] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(false)
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('audio/')) {
      setAudioFile(file)
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setIsDragging(true)
  }, [])

  const handleDragLeave = useCallback(() => setIsDragging(false), [])

  const handleProcess = async () => {
    if (!audioFile && !notes.trim()) {
      setError('Please upload a voice recording or enter meeting notes before processing.')
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setLoading(false)
    }
  }

  const exportCSV = () => {
    if (!result) return
    const { extracted } = result

    const headers = [
      'Company Name', 'Contact Name', 'Contact Email', 'Contact Phone',
      'Service Interested', 'Deal Stage', 'Estimated Value', 'Timeline',
      'Action Items', 'Meeting Summary', 'Pain Points', 'Sentiment', 'Sentiment Rationale',
    ]

    const actionItemsStr = (extracted.action_items ?? [])
      .map(ai => `${ai.task}${ai.owner ? ` [${ai.owner}]` : ''}${ai.due_date ? ` - ${ai.due_date}` : ''}`)
      .join('; ')

    const row = [
      extracted.company_name ?? '',
      extracted.contact_name ?? '',
      extracted.contact_email ?? '',
      extracted.contact_phone ?? '',
      extracted.service_interested ?? '',
      extracted.deal_stage ?? '',
      extracted.estimated_value ?? '',
      extracted.timeline ?? '',
      actionItemsStr,
      extracted.meeting_summary ?? '',
      (extracted.pain_points ?? []).join('; '),
      extracted.sentiment ?? '',
      extracted.sentiment_rationale ?? '',
    ]

    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`
    const csv = [headers.map(escape).join(','), row.map(escape).join(',')].join('\n')

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    const slug = extracted.company_name?.toLowerCase().replace(/\s+/g, '-') ?? 'meeting'
    a.href = url
    a.download = `${slug}-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const sentiment = result?.extracted.sentiment
  const sentimentStyle = sentiment ? SENTIMENT_STYLES[sentiment] : ''
  const sentimentIcon = sentiment ? SENTIMENT_ICON[sentiment] : ''

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex items-center gap-3">
          <div className="w-9 h-9 bg-indigo-600 rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-semibold text-gray-900 leading-tight">MeetingIntel</h1>
            <p className="text-xs text-gray-400">Sales meeting analyzer &amp; CRM exporter</p>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-start">

          {/* ── Left: Input Panel ── */}
          <div className="space-y-5">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-6">
              <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide mb-5">Meeting Input</h2>

              {/* Audio Upload */}
              <div className="mb-5">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Voice Recording
                  <span className="ml-1 text-xs font-normal text-gray-400">optional · MP3, M4A, WAV, WEBM up to 25 MB</span>
                </label>
                <div
                  role="button"
                  tabIndex={0}
                  aria-label="Upload audio file"
                  className={`relative border-2 border-dashed rounded-xl p-6 text-center cursor-pointer transition-all select-none focus:outline-none focus:ring-2 focus:ring-indigo-400 ${
                    isDragging
                      ? 'border-indigo-400 bg-indigo-50'
                      : audioFile
                      ? 'border-emerald-400 bg-emerald-50'
                      : 'border-gray-300 hover:border-indigo-400 hover:bg-gray-50'
                  }`}
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  onKeyDown={e => e.key === 'Enter' && fileInputRef.current?.click()}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="audio/*"
                    className="hidden"
                    onChange={e => {
                      const f = e.target.files?.[0]
                      if (f) setAudioFile(f)
                      e.target.value = ''
                    }}
                  />
                  {audioFile ? (
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 text-emerald-600 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      <span className="text-sm font-medium text-emerald-700 truncate max-w-xs">{audioFile.name}</span>
                      <button
                        type="button"
                        onClick={e => { e.stopPropagation(); setAudioFile(null) }}
                        className="ml-1 text-gray-400 hover:text-gray-600 text-lg leading-none"
                        aria-label="Remove file"
                      >
                        &times;
                      </button>
                    </div>
                  ) : (
                    <>
                      <svg className="mx-auto w-8 h-8 text-gray-300 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z" />
                      </svg>
                      <p className="text-sm text-gray-500">
                        Drop audio here or{' '}
                        <span className="text-indigo-600 font-medium">browse</span>
                      </p>
                    </>
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
                  className="w-full border border-gray-300 rounded-xl p-3.5 text-sm text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent resize-none leading-relaxed"
                  rows={9}
                  placeholder={`Paste your notes here...

e.g. Met with Sarah Chen, VP Operations at Acme Corp. They're interested in our supply chain optimisation practice. Budget around $200k, want to kick off in Q3. Main pain point is their warehouse fulfilment rate. Follow up with proposal by end of week.`}
                  value={notes}
                  onChange={e => setNotes(e.target.value)}
                />
              </div>

              {/* Error */}
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg flex items-start gap-2">
                  <svg className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <p className="text-sm text-red-700">{error}</p>
                </div>
              )}

              {/* Process Button */}
              <button
                type="button"
                onClick={handleProcess}
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 active:bg-indigo-800 disabled:bg-indigo-300 text-white font-medium py-3 px-4 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
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
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                    </svg>
                    Process Meeting
                  </>
                )}
              </button>
            </div>

            {/* Transcript accordion */}
            {result?.transcript && (
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-4 text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
                  onClick={() => setShowTranscript(v => !v)}
                >
                  <span className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
              {/* Header row */}
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">Extracted Data</h2>
                <button
                  type="button"
                  onClick={exportCSV}
                  className="flex items-center gap-1.5 bg-emerald-600 hover:bg-emerald-700 active:bg-emerald-800 text-white text-sm font-medium py-2 px-4 rounded-lg transition-colors"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
                  </svg>
                  Export CSV
                </button>
              </div>

              {/* Sentiment badge */}
              {sentiment && (
                <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium border ${sentimentStyle}`}>
                  <span className="font-bold">{sentimentIcon}</span>
                  {sentiment} Sentiment
                  {result.extracted.sentiment_rationale && (
                    <span className="text-xs font-normal opacity-80">— {result.extracted.sentiment_rationale}</span>
                  )}
                </div>
              )}

              {/* Company & Contact */}
              <Section title="Company & Contact">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <Field label="Company" value={result.extracted.company_name} />
                  <Field label="Contact Name" value={result.extracted.contact_name} />
                  <Field label="Email" value={result.extracted.contact_email} />
                  <Field label="Phone" value={result.extracted.contact_phone} />
                </div>
              </Section>

              {/* Deal Info */}
              <Section title="Deal Information">
                <div className="grid grid-cols-2 gap-x-6 gap-y-4">
                  <div className="col-span-2">
                    <Field label="Service / Solution" value={result.extracted.service_interested} />
                  </div>
                  <Field label="Deal Stage" value={result.extracted.deal_stage} badge />
                  <Field label="Estimated Value" value={result.extracted.estimated_value} />
                  <div className="col-span-2">
                    <Field label="Timeline" value={result.extracted.timeline} />
                  </div>
                </div>
              </Section>

              {/* Meeting Summary */}
              <Section title="Meeting Summary">
                <p className="text-sm text-gray-700 leading-relaxed">
                  {result.extracted.meeting_summary ?? <NullValue />}
                </p>
              </Section>

              {/* Pain Points */}
              {(result.extracted.pain_points ?? []).length > 0 && (
                <Section title="Pain Points & Needs">
                  <ul className="space-y-2">
                    {result.extracted.pain_points.map((pt, i) => (
                      <li key={i} className="flex items-start gap-2.5 text-sm text-gray-700">
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0" />
                        {pt}
                      </li>
                    ))}
                  </ul>
                </Section>
              )}

              {/* Action Items */}
              {(result.extracted.action_items ?? []).length > 0 && (
                <Section title="Action Items">
                  <div className="space-y-2">
                    {result.extracted.action_items.map((item, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-100">
                        <div className="w-4 h-4 rounded border-2 border-indigo-300 flex-shrink-0 mt-0.5" />
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
            /* Empty state */
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-12 flex flex-col items-center justify-center text-center">
              <div className="w-16 h-16 bg-indigo-50 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-base font-medium text-gray-800 mb-1">Results will appear here</h3>
              <p className="text-sm text-gray-400 max-w-xs leading-relaxed">
                Upload a voice recording or paste your notes, then click{' '}
                <span className="font-medium text-gray-500">Process Meeting</span> to extract structured CRM data.
              </p>
            </div>
          )}
        </div>
      </main>
    </div>
  )
}

/* ── Sub-components ── */

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <h3 className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">{title}</h3>
      {children}
    </div>
  )
}

function Field({
  label,
  value,
  badge = false,
}: {
  label: string
  value: string | null
  badge?: boolean
}) {
  return (
    <div>
      <p className="text-xs text-gray-400 mb-0.5">{label}</p>
      {value ? (
        badge ? (
          <span className="inline-block bg-indigo-50 text-indigo-700 text-xs font-medium px-2 py-0.5 rounded-full border border-indigo-100">
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
