import { getUserSettings, createMealPlan } from '@/lib/notion'
import { generateMealPlan } from '@/lib/claude'
import { sendMessage } from '@/lib/telegram'

export async function POST(req) {
  try {
    const settings = await getUserSettings()

    const { plan, groceryList } = await generateMealPlan({
      protein: settings.protein,
      carbs: settings.carbs,
      fat: settings.fat,
      calories: settings.calories,
      liked: settings.liked,
      disliked: settings.disliked,
    })

    const weekStart = new Date().toISOString().split('T')[0]
    await createMealPlan({ weekStart, plan, groceryList })

    const chatId = settings.telegramChatId || process.env.TELEGRAM_CHAT_ID

    // Telegram has a 4096 char limit — send plan and grocery list as separate messages
    await sendMessage(chatId, `🗓 <b>Your Meal Plan for the Week</b>\n\n${plan.slice(0, 3800)}`)
    if (groceryList) {
      await sendMessage(chatId, `🛒 <b>Grocery List</b>\n\n${groceryList.slice(0, 3800)}`)
    }

    return Response.json({ ok: true })
  } catch (err) {
    console.error('Meal plan error:', err)
    return Response.json({ ok: false, error: err.message }, { status: 500 })
  }
}
