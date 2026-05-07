import { getUserSettings, getTodayFoodLogs, createAffirmation } from '@/lib/notion'
import { generateAffirmation } from '@/lib/claude'
import { sendMessage } from '@/lib/telegram'

export async function GET(req) {
  return POST(req)
}

export async function POST(req) {
  try {
    const [settings, recentLogs] = await Promise.all([getUserSettings(), getTodayFoodLogs()])

    const message = await generateAffirmation({
      tone: settings.affirmationTone || 'encouraging',
      recentLogs,
    })

    const today = new Date().toISOString().split('T')[0]
    const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID

    await Promise.all([
      createAffirmation({ date: today, message }),
      sendMessage(chatId, `🌟 ${message}`),
    ])

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Affirmation error:', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
