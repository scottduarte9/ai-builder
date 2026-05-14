import { getTodayFoodLogs, getUserSettings } from '@/lib/notion'
import { sendMessage } from '@/lib/telegram'

export async function GET(req) {
  return POST(req)
}

export async function POST() {
  try {
    const [logs, settings] = await Promise.all([getTodayFoodLogs(), getUserSettings()])
    if (logs.length > 0) return Response.json({ ok: true, skipped: true })

    const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID
    await sendMessage(chatId, "Hey! Just checking in 💚 Don't forget to log your meals today — even a quick entry helps keep your progress on track.")

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Log nudge error:', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
