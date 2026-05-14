import { getUserSettings } from '@/lib/notion'
import { sendMessage } from '@/lib/telegram'
import { setMealPlannerState } from '@/lib/state'

export const PLANNER_QUESTIONS = [
  "What did you enjoy from last week's meal plan? 🌟",
  "Anything you want to swap out or avoid this week?",
  "Any foods or meals you've been thinking about or craving?",
  "How's your schedule looking this week? Reply <b>busy</b>, <b>moderate</b>, or <b>relaxed</b>.",
]

export const PLANNER_KEYS = ['enjoyed', 'avoid', 'cravings', 'schedule']

export async function GET(req) {
  return POST(req)
}

export async function POST() {
  try {
    const settings = await getUserSettings()
    const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID

    await setMealPlannerState(chatId, 0, {})
    await sendMessage(
      chatId,
      `🗓 <b>Time to plan this week's meals!</b>\n\nI've got 4 quick questions so I can build a plan that actually fits your week.\n\n${PLANNER_QUESTIONS[0]}`
    )

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Meal plan planner error:', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
