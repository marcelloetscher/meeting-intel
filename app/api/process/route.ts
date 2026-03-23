import { NextRequest, NextResponse } from 'next/server'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'

export const maxDuration = 60

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const audioFile = formData.get('audio') as File | null
    const existingTranscript = formData.get('transcript') as string | null
    const notes = formData.get('notes') as string | null
    const clarificationsRaw = formData.get('clarifications') as string | null

    // Step 1: Transcribe audio if provided (skipped on re-runs that supply existing transcript)
    let transcript = existingTranscript?.trim() ?? ''
    if (!transcript && audioFile && audioFile.size > 0) {
      if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json({ error: 'OPENAI_API_KEY is not configured' }, { status: 500 })
      }
      const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
      const transcription = await openai.audio.transcriptions.create({
        file: audioFile,
        model: 'whisper-1',
      })
      transcript = transcription.text
    }

    // Step 2: Build combined content
    const parts: string[] = []
    if (transcript) parts.push(`[VOICE TRANSCRIPT]\n${transcript}`)
    if (notes?.trim()) parts.push(`[MEETING NOTES]\n${notes.trim()}`)

    // Append clarification answers on re-runs
    if (clarificationsRaw) {
      const clarifications: { question: string; answer: string }[] = JSON.parse(clarificationsRaw)
      const answered = clarifications.filter(c => c.answer.trim())
      if (answered.length > 0) {
        const qaBlock = answered
          .map(c => `Q: ${c.question}\nA: ${c.answer}`)
          .join('\n\n')
        parts.push(`[CLARIFICATIONS PROVIDED BY CONSULTANT]\n${qaBlock}`)
      }
    }

    const combined = parts.join('\n\n')
    if (!combined) {
      return NextResponse.json(
        { error: 'No content provided. Please record a voice memo or enter meeting notes.' },
        { status: 400 }
      )
    }

    // Step 3: Extract structured data with Claude
    if (!process.env.ANTHROPIC_API_KEY) {
      return NextResponse.json({ error: 'ANTHROPIC_API_KEY is not configured' }, { status: 500 })
    }
    const anthropic = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

    const message = await anthropic.messages.create({
      model: 'claude-sonnet-4-6',
      max_tokens: 2500,
      messages: [
        {
          role: 'user',
          content: `You are an expert at extracting structured information from sales meeting notes and voice transcripts for management consultants.

Analyze the following content from a sales meeting and extract key information. Return ONLY a valid JSON object — no markdown code blocks, no explanation, just raw JSON.

Content:
${combined}

Return this exact JSON structure. Use null for missing string fields, [] for missing arrays:
{
  "company_name": "string or null",
  "contact_name": "string or null",
  "contact_email": "string or null",
  "contact_phone": "string or null",
  "service_interested": "string describing the consulting service or solution they are interested in, or null",
  "deal_stage": "one of: Prospecting, Qualification, Proposal, Negotiation, Closed Won, Closed Lost — or null",
  "estimated_value": "string with currency symbol if mentioned (e.g. $150,000), or null",
  "timeline": "string describing when they want to start or make a decision, or null",
  "action_items": [
    {
      "task": "string describing the action item",
      "owner": "name of person responsible or null",
      "due_date": "due date or timeframe string or null"
    }
  ],
  "meeting_summary": "2-3 sentence narrative summary of the key outcomes and context of the meeting",
  "pain_points": ["array of strings, each a distinct client pain point, challenge, or need mentioned"],
  "sentiment": "one of: Positive, Neutral, Negative",
  "sentiment_rationale": "one concise sentence explaining the sentiment assessment based on client engagement and buying signals",
  "clarifications": [
    {
      "issue": "short label describing the gap or inconsistency (max 6 words)",
      "question": "a direct, specific question for the consultant to resolve this"
    }
  ]
}

For "clarifications": identify 2–5 of the most important gaps or inconsistencies that would affect CRM accuracy. Focus on:
- Missing contact details (email, phone) that were not mentioned
- Ambiguous timelines (e.g. "Q3" without a year)
- Unclear or contradictory deal values
- Deal stage that can't be determined from context
- Inconsistencies between the transcript and notes
- Unclear ownership of action items
- Any statements that contradict each other

If all critical information is present and consistent, return an empty array [].`,
        },
      ],
    })

    const content = message.content[0]
    if (content.type !== 'text') {
      return NextResponse.json({ error: 'Unexpected response format from AI' }, { status: 500 })
    }

    const jsonMatch = content.text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      return NextResponse.json({ error: 'Could not extract structured data from AI response' }, { status: 500 })
    }

    const extracted = JSON.parse(jsonMatch[0])
    return NextResponse.json({ transcript, extracted })
  } catch (err) {
    console.error('[/api/process] error:', err)
    const message = err instanceof Error ? err.message : 'An unexpected error occurred'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
