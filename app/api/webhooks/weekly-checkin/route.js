import { getUserSettings } from '@/lib/notion'
import { sendMessage } from '@/lib/telegram'
import { setCheckinState } from '@/lib/state'

const FIRST_QUESTION = 'Did you stick to your meal plan this week?'

export async function GET(req) {
  return POST(req)
}

export async function POST(req) {
  try {
    const settings = await getUserSettings()
    const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID
    const weekStart = new Date().toISOString().split('T')[0]

    await setCheckinState(Number(chatId), 0, weekStart)
    await sendMessage(chatId, `Hey! Time for your weekly check-in 💚 I've got 5 quick questions for you — just reply to each one.\n\n${FIRST_QUESTION}`)

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Check-in error:', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
