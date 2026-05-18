import { Telegraf } from 'telegraf'
import { message } from 'telegraf/filters'
import { parseFoodLog, parseWorkoutLog, detectIntent, generateCheckinCoachResponse, generateCheckinClosing, generateMealPlan } from '@/lib/claude'
import { createFoodLog, getTodayFoodLogs, createWorkoutLog, createWeightLog, getUserSettings, getCurrentMealPlan, createCheckinResponse, getCheckinResponses, getPendingFoodLog, setPendingFoodLog, clearPendingFoodLog, checkAndRecalibrateMacros, createMealPlan, getLikedMeals, getMealTemplates, deleteFoodLog, getLastFoodLog, logWater, getTodayWater } from '@/lib/notion'
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

  // Check if we're mid check-in — but let food/workout/weight logs escape
  const checkinState = await getCheckinState(chatId)
  if (checkinState) {
    const lower = text.toLowerCase()
    const looksLikeLog =
      /\d+(\.\d+)?\s*(lbs?|pounds?|kg)/.test(lower) ||
      /workout|exercise|yoga|run|walk|lift|gym|hiit|pilates|swim|bike|cardio|strength/.test(lower) ||
      /\b(had|ate|eating|logged?|breakfast|lunch|dinner|snack)\b/.test(lower)
    if (!looksLikeLog) {
      await handleCheckinReply(ctx, text, checkinState)
      return
    }
    // Fall through to normal food/workout/weight handling below,
    // then re-surface the current check-in question afterward
  }

  // Check if we're awaiting a food quantity follow-up
  const pendingFood = await getPendingFoodLog(chatId)
  if (pendingFood) {
    await ctx.sendChatAction('typing')
    try {
      const isYes = /^(yes|yep|yeah|yup|y|correct|exactly|affirmative|sure|👍)$/i.test(text.trim())
      await clearPendingFoodLog(chatId)

      // If "yes" and the original message matches a saved recipe, use exact template macros
      if (isYes) {
        const templateMatch = await matchTemplate(pendingFood)
        if (templateMatch) {
          const { template: t, qty } = templateMatch
          const today = new Date().toISOString().split('T')[0]
          const protein = Math.round(t.protein * qty)
          const carbs = Math.round(t.carbs * qty)
          const fat = Math.round(t.fat * qty)
          const calories = Math.round(t.calories * qty)
          const description = qty > 1 ? `${t.name} ×${qty}` : t.name
          await createFoodLog({ date: today, meal: t.meal, description, protein, carbs, fat, calories })
          await ctx.reply(
            `Perfect, got it! Logged ${description} ✅\n\n` +
            `📊 <b>${description}</b>\n` +
            `Protein: ${protein}g · Carbs: ${carbs}g · Fat: ${fat}g · Calories: ${calories}`,
            { parse_mode: 'HTML' }
          )
          if (checkinState) {
            await ctx.reply(`💚 Logged! When you're ready, here's where we left off in your check-in:\n\n${CHECKIN_QUESTIONS[checkinState.questionIndex]}`)
          }
          return
        }
      }

      const input = isYes
        ? `${pendingFood} — assume this was a full standard portion as typically prepared`
        : `${pendingFood} ${text}`
      const parsed = await parseFoodLog(input)
      const today = new Date().toISOString().split('T')[0]
      await createFoodLog({ date: today, ...parsed })
      await ctx.reply(
        `Perfect, got it! Logged that ${parsed.meal.toLowerCase()} ✅\n\n` +
        `📊 <b>${parsed.description}</b>\n` +
        `Protein: ${parsed.protein}g · Carbs: ${parsed.carbs}g · Fat: ${parsed.fat}g · Calories: ${parsed.calories}`,
        { parse_mode: 'HTML' }
      )
      if (checkinState) {
        await ctx.reply(`💚 Logged! When you're ready, here's where we left off in your check-in:\n\n${CHECKIN_QUESTIONS[checkinState.questionIndex]}`)
      }
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

  // Delete/undo last food log
  if (/\b(delete|remove|undo|oops|wrong)\b.*(log|entry|that|last|food)/i.test(text) ||
      /^(undo|delete that|remove that|oops)$/i.test(text.trim())) {
    await ctx.sendChatAction('typing')
    try {
      const last = await getLastFoodLog()
      if (!last) {
        await ctx.reply("Nothing to undo — no food logged today yet.")
      } else {
        await deleteFoodLog(last.id)
        await ctx.reply(`Done — removed "${last.description}" from today's log.`)
      }
    } catch {
      await ctx.reply("Couldn't undo that — try again in a moment.")
    }
    return
  }

  // Water logging — "drank 16oz", "had a glass of water", etc.
  {
    const lower = text.toLowerCase()
    const isWater =
      /\b(water|glass(es)?|oz of water|cup of water|drank water|logged water|water intake)\b/.test(lower)
    if (isWater) {
      await ctx.sendChatAction('typing')
      try {
        const ozMatch = text.match(/(\d+)\s*oz/i)
        const glassMatch = /\b(\d+)\s+glass(es)?\b/i.exec(text)
        let oz = 8 // default one glass
        if (ozMatch) oz = parseInt(ozMatch[1])
        else if (glassMatch) oz = parseInt(glassMatch[1]) * 8
        await logWater(oz)
        const totalOz = await getTodayWater()
        const goalOz = 110
        const pct = Math.round((totalOz / goalOz) * 100)
        await ctx.reply(`Logged ${oz}oz 💧 Today: ${totalOz}oz / ${goalOz}oz (${pct}%)`)
        if (checkinState) {
          await ctx.reply(`💚 Logged! When you're ready, here's where we left off in your check-in:\n\n${CHECKIN_QUESTIONS[checkinState.questionIndex]}`)
        }
      } catch {
        await ctx.reply("Couldn't log water right now — try again in a moment.")
      }
      return
    }
  }

  // Planned meal shortcut — "had my planned breakfast", "had the lunch from the plan", etc.
  {
    const lower = text.toLowerCase()
    const mealTypeMatch = lower.match(/\b(breakfast|lunch|dinner|snack)\b/)
    const referesPlan = /\bplan\b|\bschedule\b|\brecommend(ed)?\b|\bweekly\b|\bas planned\b/.test(lower)
    if (mealTypeMatch && referesPlan) {
      await ctx.sendChatAction('typing')
      try {
        const plan = await getCurrentMealPlan()
        if (plan?.plan) {
          const dayName = new Date().toLocaleDateString('en-US', { weekday: 'long' })
          const meal = extractMealFromPlan(plan.plan, dayName, mealTypeMatch[1])
          if (meal) {
            const today = new Date().toISOString().split('T')[0]
            await createFoodLog({ date: today, ...meal })
            await ctx.reply(
              `Logged your planned ${meal.meal.toLowerCase()} ✅\n\n` +
              `📊 <b>${meal.name}</b>\n` +
              `Protein: ${meal.protein}g · Carbs: ${meal.carbs}g · Fat: ${meal.fat}g · Calories: ${meal.calories}`,
              { parse_mode: 'HTML' }
            )
            if (checkinState) {
              await ctx.reply(`💚 Logged! When you're ready, here's where we left off in your check-in:\n\n${CHECKIN_QUESTIONS[checkinState.questionIndex]}`)
            }
            return
          }
        }
        await ctx.reply("I couldn't find today's meal plan — try logging it manually or generate a new plan from the dashboard.")
      } catch (err) {
        console.error('Planned meal lookup error:', err)
        await ctx.reply("Couldn't pull the meal plan right now — try again in a moment!")
      }
      return
    }
  }

  const intent = await detectIntent(text)

  if (intent === 'food') {
    await ctx.sendChatAction('typing')
    try {
      // Check saved recipes first — if the message names a recipe, use its exact macros
      const templateMatch = await matchTemplate(text)
      if (templateMatch) {
        const { template: t, qty } = templateMatch
        const today = new Date().toISOString().split('T')[0]
        const protein = Math.round(t.protein * qty)
        const carbs = Math.round(t.carbs * qty)
        const fat = Math.round(t.fat * qty)
        const calories = Math.round(t.calories * qty)
        const description = qty > 1 ? `${t.name} ×${qty}` : t.name
        await createFoodLog({ date: today, meal: t.meal, description, protein, carbs, fat, calories })
        await ctx.reply(
          `Nice! Logged ${description} ✅\n\n` +
          `📊 <b>${description}</b>\n` +
          `Protein: ${protein}g · Carbs: ${carbs}g · Fat: ${fat}g · Calories: ${calories}`,
          { parse_mode: 'HTML' }
        )
        if (checkinState) {
          await ctx.reply(`💚 Logged! When you're ready, here's where we left off in your check-in:\n\n${CHECKIN_QUESTIONS[checkinState.questionIndex]}`)
        }
        return
      }

      // No template match — let Claude parse it
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
        if (checkinState) {
          await ctx.reply(`💚 Logged! When you're ready, here's where we left off in your check-in:\n\n${CHECKIN_QUESTIONS[checkinState.questionIndex]}`)
        }
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
      if (checkinState) {
        await ctx.reply(`💚 Logged! When you're ready, here's where we left off in your check-in:\n\n${CHECKIN_QUESTIONS[checkinState.questionIndex]}`)
      }
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
      if (checkinState) {
        await ctx.reply(`💚 Logged! When you're ready, here's where we left off in your check-in:\n\n${CHECKIN_QUESTIONS[checkinState.questionIndex]}`)
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
      const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
      const MEAL_ICONS = { Breakfast: '🍳', Lunch: '🥗', Dinner: '🍽️', Snack: '🍎' }
      const byMeal = {}
      for (const l of logs) {
        const key = l.meal || 'Snack'
        if (!byMeal[key]) byMeal[key] = []
        byMeal[key].push(l)
      }
      const lines = []
      for (const meal of MEAL_ORDER) {
        if (!byMeal[meal]) continue
        lines.push(`${MEAL_ICONS[meal]} <b>${meal}</b>`)
        for (const l of byMeal[meal]) {
          lines.push(`  • ${l.description} (${l.calories} cal)`)
        }
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
      lines.push('')
      lines.push(`📊 <b>Totals</b>`)
      lines.push(`Protein: ${totals.protein}g / ${settings.protein}g (${pct(totals.protein, settings.protein)}%)`)
      lines.push(`Carbs: ${totals.carbs}g / ${settings.carbs}g (${pct(totals.carbs, settings.carbs)}%)`)
      lines.push(`Fat: ${totals.fat}g / ${settings.fat}g (${pct(totals.fat, settings.fat)}%)`)
      lines.push(`Calories: ${totals.calories} / ${settings.calories} (${pct(totals.calories, settings.calories)}%)`)
      await ctx.reply(lines.join('\n'), { parse_mode: 'HTML' })
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

// ── Planned meal lookup ────────────────────────────────────────────────────
// Parses today's meal out of the stored plan text.
function extractMealFromPlan(planText, dayName, mealType) {
  const lines = planText.split('\n')
  const mealCap = mealType.charAt(0).toUpperCase() + mealType.slice(1)
  let inDay = false
  let inMeal = false
  let mealName = null

  for (const line of lines) {
    const trimmed = line.trim()
    // Day header (e.g. "Monday")
    if (/^(Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday)$/i.test(trimmed)) {
      inDay = trimmed.toLowerCase() === dayName.toLowerCase()
      inMeal = false
      mealName = null
      continue
    }
    if (!inDay) continue

    // Meal type header (e.g. "Breakfast: Greek Yogurt Parfait")
    if (trimmed.toLowerCase().startsWith(mealType.toLowerCase() + ':')) {
      inMeal = true
      mealName = trimmed.slice(mealType.length + 1).trim()
      continue
    }

    // Another meal type header — we've left this meal's section
    if (inMeal && /^(Breakfast|Lunch|Dinner|Snack):/i.test(trimmed)) {
      inMeal = false
    }

    // Macros line — this is what we're after
    if (inMeal && /^Macros:/i.test(trimmed)) {
      const m = trimmed.match(/(\d+)\s*cal\s*\|\s*(\d+)g?\s*P\s*\|\s*(\d+)g?\s*C\s*\|\s*(\d+)g?\s*F/i)
      if (m && mealName) {
        return {
          name: mealName,
          meal: mealCap,
          calories: parseInt(m[1]),
          protein: parseInt(m[2]),
          carbs: parseInt(m[3]),
          fat: parseInt(m[4]),
        }
      }
    }
  }
  return null
}

// ── Template name matcher ──────────────────────────────────────────────────
// Returns { template, qty } if the text matches a saved recipe name, otherwise null.
// Handles: "egg cups", "I had egg cups for breakfast", "3 egg cups", "egg cups x2"
async function matchTemplate(text) {
  let templates
  try { templates = await getMealTemplates() } catch { return null }
  const lower = text.toLowerCase()
  for (const t of templates) {
    const escaped = t.name.toLowerCase().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    const beforeMatch = lower.match(new RegExp(`(\\d+)\\s+${escaped}`))
    const afterMatch = lower.match(new RegExp(`${escaped}\\s*[x×]\\s*(\\d+)`))
    if (beforeMatch) return { template: t, qty: parseInt(beforeMatch[1]) }
    if (afterMatch) return { template: t, qty: parseInt(afterMatch[1]) }
    if (lower.includes(t.name.toLowerCase())) return { template: t, qty: 1 }
  }
  return null
}

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
