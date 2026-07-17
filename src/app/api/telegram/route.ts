import { NextRequest, NextResponse } from 'next/server'
import { parseTicketFromText } from '@/lib/gemini'
import { createAdminClient } from '@/lib/supabase'
import { STATUS_META, TicketStatus } from '@/lib/types'

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

  const statusMatch = msg.text.trim().match(/^\/status\s+(\S+)/i)
  if (statusMatch) {
    await replyTicketStatus(msg.chat.id, statusMatch[1], msg.message_id)
    return
  }

  // 1. Parse using Gemini
  const parsed = await parseTicketFromText(msg.text)
  console.log(`[PIPELINE] [2. parsed] result=`, parsed)

  // Gemini failed (quota/network/invalid JSON) - do NOT silently create a garbage ticket from a failed parse.
  if (parsed.error) {
    console.error(`[PIPELINE] [2b. gemini_error] telegram_message_id=${msg.message_id} error=${parsed.error}`)
    await sendTelegramMessage(msg.chat.id, `⚠️ Hệ thống AI đang tạm thời gặp sự cố, chưa thể xử lý tin nhắn của bạn. Vui lòng thử lại sau ít phút. (Ticket CHƯA được ghi nhận)`, msg.message_id)
    return
  }

  if (parsed.intent === 'check_status') {
    if (parsed.ticket_id) {
      await replyTicketStatus(msg.chat.id, String(parsed.ticket_id), msg.message_id)
    } else {
      await replyMyTickets(msg.chat.id, msg.from?.id, msg.message_id)
    }
    return
  }

  if (parsed.is_off_topic) {
    console.log(`[PIPELINE] [3. off_topic_ignored] telegram_message_id=${msg.message_id}`)
    await sendTelegramMessage(msg.chat.id, `👋 Chào bạn, bot IT Support chỉ tiếp nhận các yêu cầu liên quan đến máy tính, mạng, phần mềm hoặc cấp quyền. Xin vui lòng mô tả vấn đề IT bạn đang gặp phải nhé!`, msg.message_id)
    return
  }

  let title = parsed.title || 'No Title'
  let description = parsed.description || msg.text
  let priority = parsed.priority || 'Medium'
  let category = parsed.category || 'Other'
  
  if (parsed.needs_review) {
    title = `[Needs Review] ${title}`
  }

  const reporterName = msg.from?.first_name || msg.from?.username || 'Telegram User'
  const reporterId = msg.from?.id || 'Unknown'

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
      reporter_telegram_id: msg.from?.id ?? null,
      telegram_message_id: msg.message_id,
      original_text: msg.text,
      status: 'New'
    }]).select()

  if (error) {
    // If it's a unique violation for telegram_message_id, it's just a duplicate retry, ignore.
    if (error.code === '23505') {
      console.log(`[PIPELINE] [3. duplicate_ignored] telegram_message_id=${msg.message_id}`)
    } else {
      console.error(`[PIPELINE] [3. saved_error]`, error)
      await sendTelegramMessage(msg.chat.id, `❌ Đã có lỗi xảy ra khi lưu ticket. Vui lòng thử lại sau.`, msg.message_id)
    }
  } else {
    const ticketId = data && data[0] ? data[0].id : 'N/A'
    console.log(`[PIPELINE] [3. saved] Ticket ${ticketId} created successfully for message ${msg.message_id}`)
    console.log(`[PIPELINE] [4. notified] Realtime channel will notify connected clients`)
    
    // Format Vietnamese Date/Time
    const nowStr = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

    let responseText = `✅ <b>Ticket #${ticketId} đã được ghi nhận!</b>\n\n`
    responseText += `<b>Thời gian:</b> ${nowStr}\n`
    responseText += `<b>Người dùng:</b> ${reporterName} (ID: <code>${reporterId}</code>)\n`
    responseText += `<b>Tiêu đề:</b> ${title}\n`
    responseText += `<b>Mức độ:</b> ${priority}\n`
    responseText += `<b>Phân loại:</b> ${category}\n`
    if (parsed.needs_review) {
      responseText += `\n<i>⚠️ AI không chắc chắn về nội dung này, IT sẽ review lại chi tiết.</i>`
    }
    await sendTelegramMessage(msg.chat.id, responseText, msg.message_id)
  }
}

async function replyTicketStatus(chatId: number, ticketId: string, replyToMessageId?: number) {
  const supabase = createAdminClient()
  const { data: ticket, error } = await supabase
    .from('tickets')
    .select('id, title, status, updated_at')
    .eq('id', ticketId)
    .single()

  if (error || !ticket) {
    await sendTelegramMessage(chatId, `❌ Không tìm thấy ticket #${ticketId}.`, replyToMessageId)
    return
  }

  const meta = STATUS_META[ticket.status as TicketStatus] || { label: ticket.status }
  const updatedStr = new Date(ticket.updated_at).toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' })

  let text = `📋 <b>Ticket #${ticket.id}</b>\n`
  text += `<b>Tiêu đề:</b> ${ticket.title}\n`
  text += `<b>Trạng thái:</b> ${meta.label}\n`
  text += `<b>Cập nhật lần cuối:</b> ${updatedStr}`

  await sendTelegramMessage(chatId, text, replyToMessageId)
}

async function replyMyTickets(chatId: number, telegramUserId: number | undefined, replyToMessageId?: number) {
  if (!telegramUserId) {
    await sendTelegramMessage(chatId, `❌ Không xác định được tài khoản Telegram của bạn.`, replyToMessageId)
    return
  }

  const supabase = createAdminClient()
  const { data: tickets, error } = await supabase
    .from('tickets')
    .select('id, title, status, updated_at')
    .eq('reporter_telegram_id', telegramUserId)
    .order('created_at', { ascending: false })
    .limit(10)

  if (error || !tickets || tickets.length === 0) {
    await sendTelegramMessage(chatId, `📭 Bạn chưa có ticket nào được ghi nhận.`, replyToMessageId)
    return
  }

  let text = `📋 <b>Ticket của bạn (${tickets.length} gần nhất)</b>\n\n`
  for (const t of tickets) {
    const meta = STATUS_META[t.status as TicketStatus] || { label: t.status }
    const cleanTitle = (t.title as string).replace('[Needs Review]', '').trim()
    text += `#${t.id} - ${cleanTitle} - <b>${meta.label}</b>\n`
  }

  await sendTelegramMessage(chatId, text, replyToMessageId)
}

async function sendTelegramMessage(chatId: number, text: string, replyToMessageId?: number) {
  const token = process.env.TELEGRAM_BOT_TOKEN
  if (!token) return

  try {
    await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        chat_id: chatId,
        text: text,
        reply_to_message_id: replyToMessageId,
        parse_mode: 'HTML'
      })
    })
  } catch (err) {
    console.error("Failed to send telegram reply:", err)
  }
}
