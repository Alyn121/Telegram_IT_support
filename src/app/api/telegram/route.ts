import { NextRequest, NextResponse } from 'next/server'
import { parseTicketFromText } from '@/lib/gemini'
import { createAdminClient } from '@/lib/supabase'

export async function POST(req: NextRequest) {
  try {
    const update = await req.json()
    const msg = update.message
    
    // Ignore updates that aren't text messages
    if (!msg?.text) {
      return NextResponse.json({ ok: true })
    }

    // Fire and forget - DO NOT AWAIT processMessage here
    // This allows returning 200 immediately to Telegram (5s timeout)
    processMessage(msg).catch(console.error)
    
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error("Webhook payload parsing error:", err)
    return NextResponse.json({ ok: true }) // Always return 200 to Telegram
  }
}

async function processMessage(msg: any) {
  console.log(`[PIPELINE] [1. received] telegram_message_id=${msg.message_id} text="${msg.text?.substring(0, 30)}..."`)
  
  // 1. Parse using Gemini
  const parsed = await parseTicketFromText(msg.text)
  console.log(`[PIPELINE] [2. parsed] result=`, parsed)
  
  let title = parsed.title || 'No Title'
  let description = parsed.description || msg.text
  let priority = parsed.priority || 'Medium'
  let category = parsed.category || 'Other'
  
  if (parsed.needs_review) {
    title = `[Needs Review] ${title}`
  }

  const reporterName = msg.from?.first_name || msg.from?.username || 'Telegram User'

  // 2. Save to Supabase
  const supabase = createAdminClient()
  const { data, error } = await supabase
    .from('tickets')
    .insert([{
      title,
      description,
      priority,
      category,
      source: 'telegram',
      reporter_name: reporterName,
      telegram_message_id: msg.message_id,
      original_text: msg.text,
      status: 'New'
    }])

  if (error) {
    // If it's a unique violation for telegram_message_id, it's just a duplicate retry, ignore.
    if (error.code === '23505') {
      console.log(`[PIPELINE] [3. duplicate_ignored] telegram_message_id=${msg.message_id}`)
    } else {
      console.error(`[PIPELINE] [3. saved_error]`, error)
    }
  } else {
    console.log(`[PIPELINE] [3. saved] Ticket created successfully for message ${msg.message_id}`)
    console.log(`[PIPELINE] [4. notified] Realtime channel will notify connected clients`)
  }
}
