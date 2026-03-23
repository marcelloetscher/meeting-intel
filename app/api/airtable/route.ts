import { NextRequest, NextResponse } from 'next/server'

export async function POST(request: NextRequest) {
  const accessToken = process.env.AIRTABLE_ACCESS_TOKEN
  const baseId = process.env.AIRTABLE_BASE_ID
  const tableName = process.env.AIRTABLE_TABLE_NAME ?? 'Meetings'

  if (!accessToken || !baseId) {
    return NextResponse.json(
      { error: 'Airtable credentials are not configured. Add AIRTABLE_ACCESS_TOKEN and AIRTABLE_BASE_ID to your Vercel environment variables.' },
      { status: 500 }
    )
  }

  const { extracted } = await request.json()

  const actionItemsStr = (extracted.action_items ?? [])
    .map((ai: { task: string; owner?: string; due_date?: string }) =>
      `• ${ai.task}${ai.owner ? ` [${ai.owner}]` : ''}${ai.due_date ? ` — ${ai.due_date}` : ''}`
    )
    .join('\n')

  const painPointsStr = (extracted.pain_points ?? [])
    .map((p: string) => `• ${p}`)
    .join('\n')

  const allFields: Record<string, string> = {
    'Company Name': extracted.company_name ?? '',
    'Contact Name': extracted.contact_name ?? '',
    'Contact Email': extracted.contact_email ?? '',
    'Contact Phone': extracted.contact_phone ?? '',
    'Service Interested': extracted.service_interested ?? '',
    'Deal Stage': extracted.deal_stage ?? '',
    'Estimated Value': extracted.estimated_value ?? '',
    'Timeline': extracted.timeline ?? '',
    'Action Items': actionItemsStr,
    'Meeting Summary': extracted.meeting_summary ?? '',
    'Pain Points': painPointsStr,
    'Sentiment': extracted.sentiment ?? '',
    'Sentiment Rationale': extracted.sentiment_rationale ?? '',
    'Meeting Date': new Date().toISOString().split('T')[0],
  }

  // Drop empty strings — Airtable rejects writes to typed fields (email, phone) with empty values
  const fields = Object.fromEntries(Object.entries(allFields).filter(([, v]) => v.trim() !== ''))

  const res = await fetch(
    `https://api.airtable.com/v0/${baseId}/${encodeURIComponent(tableName)}`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ records: [{ fields }] }),
    }
  )

  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    const msg = err?.error?.message ?? `Airtable returned ${res.status}`
    return NextResponse.json({ error: msg }, { status: res.status })
  }

  const data = await res.json()
  return NextResponse.json({ recordId: data.records[0].id })
}
