import { getUserSettings } from '@/lib/notion'
import { sendMessage } from '@/lib/telegram'

export async function GET(req) {
  return POST(req)
}

export async function POST(req) {
  try {
    const settings = await getUserSettings()
    const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID

    await sendMessage(chatId, "Good morning! Time for your weekly weigh-in ⚖️ Just reply with your weight and I'll log it — e.g. \"142.5 lbs\"")

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Weigh-in prompt error:', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
