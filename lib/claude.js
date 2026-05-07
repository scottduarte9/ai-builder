import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-20250514'

// Returns one of: 'food' | 'workout' | 'weight' | 'status' | 'unknown'
export async function detectIntent(text) {
  const lower = text.toLowerCase()
  // Fast keyword shortcuts before hitting the API
  if (/how am i doing|macro|today's stats|my stats/.test(lower)) return 'status'
  if (/\d+(\.\d+)?\s*(lbs?|pounds?|kg)/.test(lower) && /weigh|weight|scale/.test(lower)) return 'weight'
  if (/workout|exercise|yoga|run|walk|lift|gym|hiit|pilates|swim|bike|cardio|strength/.test(lower)) return 'workout'

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 10,
    messages: [
      {
        role: 'user',
        content: `Classify this message into one word — food, workout, weight, status, or unknown.\n\nMessage: "${text}"\n\nReply with one word only.`,
      },
    ],
  })
  const intent = msg.content[0].text.trim().toLowerCase()
  if (['food', 'workout', 'weight', 'status'].includes(intent)) return intent
  return 'unknown'
}

export async function parseFoodLog(description) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 512,
    messages: [
      {
        role: 'user',
        content: `Parse this food description and return a JSON object with these fields: meal (one of: Breakfast, Lunch, Dinner, Snack), description (clean summary), protein (grams, number), carbs (grams, number), fat (grams, number), calories (number). Use reasonable estimates if exact values are unknown. Return ONLY valid JSON, no explanation.\n\nFood: ${description}`,
      },
    ],
  })
  return JSON.parse(msg.content[0].text)
}

export async function parseWorkoutLog(description) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Parse this workout description and return a JSON object with: type (string, e.g. "Yoga", "Running", "Strength"), duration (number in minutes), notes (string, friendly summary). Return ONLY valid JSON, no explanation.\n\nWorkout: ${description}`,
      },
    ],
  })
  return JSON.parse(msg.content[0].text)
}

export async function generateMealPlan({ protein, carbs, fat, calories, liked, disliked }) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Create a 7-day meal plan for someone following a macro-based eating plan. Daily targets: ${protein}g protein, ${carbs}g carbs, ${fat}g fat, ${calories} calories. Foods she enjoys: ${liked || 'no preferences set'}. Foods to avoid: ${disliked || 'none'}. Shop at ALDI. Format the plan clearly by day (Monday–Sunday) with Breakfast, Lunch, Dinner, and Snack for each day. After the meal plan, include a consolidated grocery list organized by category. Keep meals simple, realistic, and varied.`,
      },
    ],
  })
  const text = msg.content[0].text
  const groceryStart = text.toLowerCase().indexOf('grocery list')
  const plan = groceryStart > -1 ? text.slice(0, groceryStart).trim() : text
  const groceryList = groceryStart > -1 ? text.slice(groceryStart).trim() : ''
  return { plan, groceryList }
}

export async function generateAffirmation({ tone, recentLogs }) {
  const logSummary = recentLogs.length
    ? `Recent food logs: ${recentLogs.map((l) => `${l.meal} — ${l.description}`).join(', ')}`
    : 'No recent food logs available.'

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 256,
    messages: [
      {
        role: 'user',
        content: `Write a single personalized wellness affirmation for someone working with a nutritionist on a macro-based eating plan. Tone: ${tone}. ${logSummary}. Make it feel warm, specific, and genuine — not generic. 2-3 sentences max. No quotes or labels.`,
      },
    ],
  })
  return msg.content[0].text.trim()
}
