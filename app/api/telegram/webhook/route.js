import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { parseFoodLog, parseWorkoutLog, detectIntent, generateCheckinCoachResponse, generateCheckinClosing, generateMealPlan } from '@/lib/claude'
import { createFoodLog, getTodayFoodLogs, createWorkoutLog, createWeightLog, getUserSettings, getCurrentMealPlan, createCheckinResponse, getCheckinResponses, getPendingFoodLog, setPendingFoodLog, clearPendingFoodLog, checkAndRecalibrateMacros, createMealPlan, getLikedMeals } from '@/lib/notion'
import { getCheckinState, clearCheckinState, advanceCheckinState, getMealPlannerState, setMealPlannerState, clearMealPlannerState } from '@/lib/state'
import { PLANNER_QUESTIONS, PLANNER_KEYS } from '@/app/api/webhooks/weekly-meal-plan/route'
const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN)

bot.command('chatid', (ctx) => ctx.reply(`Your chat ID is: ${ctx.chat.id}`))

const CHECKIN_QUESTIONS = [
  "Walk me through your eating this week — did the meal plan feel doable, or did you find yourself veering off?",
  "How's your energy been? Any patterns you noticed — times you felt great or dragged?",
  "What went really well this week? I want to hear the wins, big or small.",
  "Anything that felt hard or that you want to approach differently next week?",
  "Stepping back — how do you feel about where you are right now? Physically, mentally, all of it.",
]

// ── Text messages ──────────────────────────────────────────────────────────

bot.on(message('text'), async (ctx) => {
  const text = ctx.message.text.trim()
  const chatId = ctx.chat.id

  // Check if we're mid meal plan planner
  const plannerState = await getMealPlannerState(chatId)
  if (plannerState) {
    await handleMealPlannerReply(ctx, text, plannerState)
    return
  }

  // Check if we're mid check-in
  const checkinState = await getCheckinState(chatId)
  if (checkinState) {
    await handleCheckinReply(ctx, text, checkinState)
    return
  }

  // Check if we're awaiting a food quantity follow-up
  const pendingFood = await getPendingFoodLog(chatId)
  if (pendingFood) {
    await ctx.sendChatAction('typing')
    try {
      const parsed = await parseFoodLog(`${pendingFood} ${text}`)
      await clearPendingFoodLog(chatId)
      const today = new Date().toISOString().split('T')[0]
      await createFoodLog({ date: today, ...parsed })
      await ctx.reply(
        `Perfect, got it! Logged that ${parsed.meal.toLowerCase()} ✅\n\n` +
        `📊 <b>${parsed.description}</b>\n` +
        `Protein: ${parsed.protein}g · Carbs: ${parsed.carbs}g · Fat: ${parsed.fat}g · Calories: ${parsed.calories}`,
        { parse_mode: 'HTML' }
      )
    } catch (err) {
      console.error('Food log error (pending):', err)
      await clearPendingFoodLog(chatId)
      await ctx.reply("Couldn't process that — try logging the full meal again with weights.")
    }
    return
  }

  // Meal plan shortcut before intent detection
  if (/meal plan|this week'?s? plan|what('?s| is) (my |the )?plan/i.test(text)) {
    await ctx.sendChatAction('typing')
    try {
      const plan = await getCurrentMealPlan()
      if (!plan) {
        await ctx.reply("No meal plan yet for this week! It'll be sent automatically on your scheduled day.")
        return
      }
      await ctx.reply(`🗓 <b>Your Meal Plan (week of ${plan.weekStart})</b>\n\n${plan.plan.slice(0, 3800)}`, { parse_mode: 'HTML' })
      if (plan.groceryList) {
        await ctx.reply(`🛒 <b>Grocery List</b>\n\n${plan.groceryList.slice(0, 3800)}`, { parse_mode: 'HTML' })
      }
    } catch {
      await ctx.reply("Couldn't pull the meal plan right now — try again in a moment!")
    }
    return
  }

  const intent = await detectIntent(text)

  if (intent === 'food') {
    await ctx.sendChatAction('typing')
    try {
      const parsed = await parseFoodLog(text)
      if (parsed.needsQuantity) {
        await setPendingFoodLog(chatId, text)
        await ctx.reply(parsed.followUp || "Can you give me the weights or portions? e.g. '150g chicken, 1 cup rice'")
      } else {
        const today = new Date().toISOString().split('T')[0]
        await createFoodLog({ date: today, ...parsed })
        await ctx.reply(
          `Nice! Logged that ${parsed.meal.toLowerCase()} ✅\n\n` +
          `📊 <b>${parsed.description}</b>\n` +
          `Protein: ${parsed.protein}g · Carbs: ${parsed.carbs}g · Fat: ${parsed.fat}g · Calories: ${parsed.calories}`,
          { parse_mode: 'HTML' }
        )
      }
    } catch (err) {
      console.error('Food log error:', err)
      await ctx.reply("Hmm, I couldn't log that one. Try including the food and weight — like '150g chicken breast, 1 cup rice for lunch'.")
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
      const recalibrated = await checkAndRecalibrateMacros(weight)
      if (recalibrated) {
        await ctx.reply(
          `🎉 You've lost 5+ lbs since your last target update! Your daily targets have been adjusted:\n\n` +
          `Calories: ${recalibrated.calories}\nProtein: ${recalibrated.protein}g\nCarbs: ${recalibrated.carbs}g\nFat: ${recalibrated.fat}g`
        )
      }
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

// ── Meal planner reply handler ─────────────────────────────────────────────

async function handleMealPlannerReply(ctx, answer, state) {
  const { questionIndex, responses } = state
  const key = PLANNER_KEYS[questionIndex]
  const updatedResponses = { ...responses, [key]: answer }
  const nextIndex = questionIndex + 1
  const isLast = nextIndex >= PLANNER_QUESTIONS.length

  if (isLast) {
    await clearMealPlannerState(ctx.chat.id)
    await ctx.sendChatAction('typing')
    await ctx.reply("Love it — give me a moment while I put your plan together 🗓✨")

    try {
      const [settings, likedMeals] = await Promise.all([getUserSettings(), getLikedMeals()])
      const { plan, groceryList } = await generateMealPlan({
        protein: settings.protein,
        carbs: settings.carbs,
        fat: settings.fat,
        calories: settings.calories,
        liked: settings.liked,
        disliked: settings.disliked,
        likedMeals,
        weeklyContext: updatedResponses,
      })

      // weekStart = next Monday (this runs on Sunday)
      const nextMonday = new Date()
      nextMonday.setDate(nextMonday.getDate() + 1)
      const weekStart = nextMonday.toISOString().split('T')[0]

      await createMealPlan({ weekStart, plan, groceryList })
      await ctx.reply(`🗓 <b>Your Meal Plan — week of ${weekStart}</b>\n\n${plan.slice(0, 3800)}`, { parse_mode: 'HTML' })
      if (groceryList) {
        await ctx.reply(`🛒 <b>Grocery List</b>\n\n${groceryList.slice(0, 3800)}`, { parse_mode: 'HTML' })
      }
    } catch (err) {
      console.error('Meal plan generation error:', err)
      await ctx.reply("Something went wrong generating the plan — you can always kick it off from the dashboard!")
    }
  } else {
    await setMealPlannerState(ctx.chat.id, nextIndex, updatedResponses)
    await ctx.reply(PLANNER_QUESTIONS[nextIndex], { parse_mode: 'HTML' })
  }
}

// ── Check-in reply handler ─────────────────────────────────────────────────

async function handleCheckinReply(ctx, answer, state) {
  const { questionIndex, weekStart } = state
  const question = CHECKIN_QUESTIONS[questionIndex]

  await ctx.sendChatAction('typing')
  const nextIndex = questionIndex + 1
  const isLast = nextIndex >= CHECKIN_QUESTIONS.length

  await createCheckinResponse({ weekStart, question, answer })

  const coachResponse = await generateCheckinCoachResponse(question, answer)

  if (isLast) {
    await clearCheckinState(ctx.chat.id)
    const allResponses = await getCheckinResponses(weekStart)
    const closing = await generateCheckinClosing(allResponses)
    await ctx.reply(coachResponse)
    await ctx.reply(`💚 ${closing}`)
  } else {
    await advanceCheckinState(ctx.chat.id, nextIndex)
    await ctx.reply(`${coachResponse}\n\n${CHECKIN_QUESTIONS[nextIndex]}`)
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
