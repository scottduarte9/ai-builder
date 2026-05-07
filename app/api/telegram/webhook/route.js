import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { parseFoodLog, parseWorkoutLog, detectIntent } from '@/lib/claude'
import { createFoodLog, getTodayFoodLogs, createWorkoutLog, createWeightLog, getUserSettings } from '@/lib/notion'
import { getCheckinState, clearCheckinState, advanceCheckinState } from '@/lib/state'
import { createCheckinResponse } from '@/lib/notion'

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

const CHECKIN_QUESTIONS = [
  'Did you stick to your meal plan this week?',
  'How was your energy overall?',
  'Any wins you want to celebrate?',
  'Anything you want to do differently next week?',
  'How are you feeling about your progress?',
]

// ── Text messages ──────────────────────────────────────────────────────────

bot.on(message('text'), async (ctx) => {
  const text = ctx.message.text.trim()
  const chatId = ctx.chat.id

  // Check if we're mid check-in before doing anything else
  const checkinState = await getCheckinState(chatId)
  if (checkinState) {
    await handleCheckinReply(ctx, text, checkinState)
    return
  }

  const intent = await detectIntent(text)

  if (intent === 'food') {
    await ctx.sendChatAction('typing')
    try {
      const parsed = await parseFoodLog(text)
      const today = new Date().toISOString().split('T')[0]
      await createFoodLog({ date: today, ...parsed })
      await ctx.reply(
        `Nice! Logged that ${parsed.meal.toLowerCase()} ✅\n\n` +
        `📊 <b>${parsed.description}</b>\n` +
        `Protein: ${parsed.protein}g · Carbs: ${parsed.carbs}g · Fat: ${parsed.fat}g · Calories: ${parsed.calories}`,
        { parse_mode: 'HTML' }
      )
    } catch (err) {
      console.error('Food log error:', err)
      await ctx.reply(`Debug error: ${err.message}`)
    }
    return
  }

  if (intent === 'workout') {
    await ctx.sendChatAction('typing')
    try {
      const parsed = await parseWorkoutLog(text)
      const today = new Date().toISOString().split('T')[0]
      await createWorkoutLog({ date: today, ...parsed })
      await ctx.reply(`Love it! Logged your ${parsed.type} session (${parsed.duration} mins) 💪`)
    } catch {
      await ctx.reply("I couldn't quite parse that workout — try something like 'Did 40 min yoga today'.")
    }
    return
  }

  if (intent === 'weight') {
    await ctx.sendChatAction('typing')
    const match = text.match(/(\d+(\.\d+)?)\s*(lbs?|pounds?|kg)?/i)
    if (match) {
      const weight = parseFloat(match[1])
      const today = new Date().toISOString().split('T')[0]
      await createWeightLog({ date: today, weight })
      await ctx.reply(`Got it — logged ${weight} lbs for today. Keep going! 🌟`)
    } else {
      await ctx.reply("I couldn't find a number in that. Try something like '142.5 lbs'.")
    }
    return
  }

  if (intent === 'status') {
    await ctx.sendChatAction('typing')
    try {
      const [logs, settings] = await Promise.all([getTodayFoodLogs(), getUserSettings()])
      if (!logs.length) {
        await ctx.reply("No food logged yet today — you've got a fresh start! 🌅")
        return
      }
      const totals = logs.reduce(
        (acc, l) => ({
          protein: acc.protein + l.protein,
          carbs: acc.carbs + l.carbs,
          fat: acc.fat + l.fat,
          calories: acc.calories + l.calories,
        }),
        { protein: 0, carbs: 0, fat: 0, calories: 0 }
      )
      const pct = (val, target) => Math.round((val / target) * 100)
      await ctx.reply(
        `Here's how today's looking 📈\n\n` +
        `Protein: ${totals.protein}g / ${settings.protein}g (${pct(totals.protein, settings.protein)}%)\n` +
        `Carbs: ${totals.carbs}g / ${settings.carbs}g (${pct(totals.carbs, settings.carbs)}%)\n` +
        `Fat: ${totals.fat}g / ${settings.fat}g (${pct(totals.fat, settings.fat)}%)\n` +
        `Calories: ${totals.calories} / ${settings.calories} (${pct(totals.calories, settings.calories)}%)`,
      )
    } catch {
      await ctx.reply("Couldn't pull your stats right now — try again in a moment!")
    }
    return
  }

  // Fallback
  await ctx.reply(
    "Hey! You can:\n• Log food: \"I had eggs and toast for breakfast\"\n• Log a workout: \"Did 30 min run\"\n• Log weight: \"142 lbs\"\n• Check progress: \"How am I doing today?\""
  )
})

// ── Voice messages ─────────────────────────────────────────────────────────

bot.on(message('voice'), async (ctx) => {
  await ctx.reply(
    "I can hear you! Voice transcription is coming soon — for now, just type out what you had and I'll log it 😊"
  )
})

// ── Check-in reply handler ─────────────────────────────────────────────────

async function handleCheckinReply(ctx, answer, state) {
  const { questionIndex, weekStart } = state
  const question = CHECKIN_QUESTIONS[questionIndex]

  await createCheckinResponse({ weekStart, question, answer })

  const nextIndex = questionIndex + 1

  if (nextIndex >= CHECKIN_QUESTIONS.length) {
    await clearCheckinState(ctx.chat.id)
    await ctx.reply(
      "That's all the questions! Thanks for checking in — you're doing great. I've saved all your responses 💚"
    )
  } else {
    await advanceCheckinState(ctx.chat.id, nextIndex)
    await ctx.reply(CHECKIN_QUESTIONS[nextIndex])
  }
}

// ── Webhook handler ────────────────────────────────────────────────────────

export async function POST(req) {
  try {
    const body = await req.json()
    await bot.handleUpdate(body)
    return new Response('ok', { status: 200 })
  } catch (err) {
    console.error('Telegram webhook error:', err)
    return new Response('error', { status: 500 })
  }
}
