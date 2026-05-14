import Anthropic from '@anthropic-ai/sdk'
import { formatProductsForPrompt } from './aldi-products.js'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const MODEL = 'claude-sonnet-4-20250514'

function extractJson(text) {
  const match = text.match(/```(?:json)?\s*([\s\S]*?)```/)
  return JSON.parse(match ? match[1].trim() : text.trim())
}

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
        content: `Parse this food description and return a JSON object with these fields:
- meal (one of: Breakfast, Lunch, Dinner, Snack)
- description (clean summary with quantities if known)
- protein (grams, number)
- carbs (grams, number)
- fat (grams, number)
- calories (number)
- needsQuantity (boolean — true if any food item is missing a specific weight or portion size, e.g. "chicken" with no grams, "rice" with no amount, "a salad" with no detail)
- followUp (string — if needsQuantity is true, a friendly one-line question asking for the specific weights or portions of each item; otherwise empty string "")

Use accurate nutritional values based on the quantities given. Do not guess quantities — if they are missing, set needsQuantity to true. Return ONLY valid JSON, no explanation.

Food: ${description}`,
      },
    ],
  })
  return extractJson(msg.content[0].text)
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
  return extractJson(msg.content[0].text)
}

export async function generateMealPlan({ protein, carbs, fat, calories, liked, disliked, likedMeals = [], weeklyContext = {} }) {
  const savedMealsLine = likedMeals.length
    ? `She has saved these meals she loves — try to incorporate them this week where they fit: ${likedMeals.map((m) => m.name).join(', ')}.`
    : ''

  const contextLines = [
    weeklyContext.enjoyed && `What she enjoyed from last week: ${weeklyContext.enjoyed}`,
    weeklyContext.avoid && `What she wants to avoid or change this week: ${weeklyContext.avoid}`,
    weeklyContext.cravings && `Foods or meals she's thinking about: ${weeklyContext.cravings}`,
    weeklyContext.schedule && `Her schedule this week is ${weeklyContext.schedule} — plan accordingly (${weeklyContext.schedule === 'busy' ? 'prioritize quick meals' : weeklyContext.schedule === 'relaxed' ? 'can include more involved recipes' : 'mix of quick and normal meals'}).`,
  ].filter(Boolean).join(' ')

  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 8000,
    messages: [
      {
        role: 'user',
        content: `Create a 7-day meal plan for someone following a macro-based eating plan. Daily targets: ${protein}g protein, ${carbs}g carbs, ${fat}g fat, ${calories} calories. Foods she enjoys: ${liked || 'no preferences set'}. Foods to avoid: ${disliked || 'none'}. ${savedMealsLine} ${contextLines}

${formatProductsForPrompt()}

IMPORTANT: Build every meal using the ALDI products listed above. Use their exact brand names (e.g. "Friendly Farms Nonfat Plain Greek Yogurt", "Kirkwood Boneless Skinless Chicken Breast", "Millville Old Fashioned Rolled Oats"). Use the actual nutrition values from the product list — do not guess or substitute generic values. For ingredients not covered above (olive oil, spices, condiments, fresh produce basics) use reasonable estimates.

For every meal include:
- Exact serving sizes matching the ALDI product (e.g. "150g Kirkwood Boneless Skinless Chicken Breast — 33g protein")
- Protein callout next to each protein-rich ingredient
- A macro summary line: Macros: Xcal | Xg P | Xg C | Xg F

Format each day exactly like this:

Monday
Breakfast: Greek Yogurt Parfait
- 1 container (150g) Friendly Farms Nonfat Plain Greek Yogurt — 16g protein
- 1/2 cup (75g) ALDI blueberries
- 1/4 cup (20g) Millville Old Fashioned Rolled Oats
- 1 tbsp honey
Macros: 280 cal | 19g P | 46g C | 1g F

Lunch: Chicken Rice Bowl
- 150g Kirkwood Boneless Skinless Chicken Breast — 33g protein
- 1 cup cooked Season's Choice Steamable Brown Rice (195g)
- 1 cup Season's Choice Frozen Broccoli Florets
- 1 tbsp olive oil
Macros: 420 cal | 38g P | 47g C | 10g F

Dinner: Ground Beef Stir Fry
- 113g Ground Beef 93% Lean (ALDI) — 23g protein
- 1 cup Season's Choice Frozen Steamable Mixed Veg
- 2 oz dry Reggano Whole Wheat Penne (cooked)
- 2 tbsp low sodium soy sauce
Macros: 420 cal | 33g P | 48g C | 10g F

Snack: Protein Shake
- 1 scoop (37g) Millville Elevation Vanilla Whey Protein Powder — 30g protein
- 1 medium banana
- 1 cup (240ml) Friendly Farms 2% Ultra-Filtered Milk
Macros: 395 cal | 43g P | 42g C | 7g F

Include all 7 days (Monday–Sunday) with Breakfast, Lunch, Dinner, and Snack. After the full meal plan, include a grocery list organized by category with exact package quantities to buy (e.g. "2 lbs Kirkwood Chicken Breast — ~$7.99"), an estimated price per item, and a total estimated weekly cost at ALDI.`,
      },
    ],
  })
  const text = msg.content[0].text
  const groceryStart = text.toLowerCase().indexOf('grocery list')
  const plan = groceryStart > -1 ? text.slice(0, groceryStart).trim() : text
  const groceryList = groceryStart > -1 ? text.slice(groceryStart).trim() : ''
  return { plan, groceryList }
}

export async function refineMealPlan({ currentPlan, request, protein, carbs, fat, calories }) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 2048,
    messages: [
      {
        role: 'user',
        content: `Here is a current 7-day meal plan:\n\n${currentPlan}\n\nThe user wants to make this change: "${request}"\n\nReturn the full updated meal plan in the exact same format (Monday through Sunday, with Breakfast, Lunch, Dinner, and Snack for each day), applying only the requested changes and keeping everything else identical. Daily macro targets: ${protein}g protein, ${carbs}g carbs, ${fat}g fat, ${calories} calories. After the plan, include an updated grocery list organized by category. Return the plan only, no preamble or explanation.`,
      },
    ],
  })
  const text = msg.content[0].text
  const groceryStart = text.toLowerCase().indexOf('grocery list')
  const plan = groceryStart > -1 ? text.slice(0, groceryStart).trim() : text
  const groceryList = groceryStart > -1 ? text.slice(groceryStart).trim() : ''
  return { plan, groceryList }
}

export async function generateCheckinCoachResponse(question, answer) {
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 150,
    messages: [
      {
        role: 'user',
        content: `You are a warm, supportive nutritionist and wellness coach checking in with a client. She just answered a check-in question. Write 1–2 sentences that acknowledge her answer and offer a brief, genuine observation or encouragement. Do NOT repeat the question back. Do NOT lecture. Do NOT say "Next question" or similar. Keep it conversational and caring, like a coach who knows her well.\n\nQuestion: ${question}\nHer answer: ${answer}\n\nRespond with just your 1–2 sentence reply, nothing else.`,
      },
    ],
  })
  return msg.content[0].text.trim()
}

export async function generateCheckinClosing(responses) {
  const summary = responses.map((r, i) => `Q${i + 1}: ${r.question}\nA: ${r.answer}`).join('\n\n')
  const msg = await client.messages.create({
    model: MODEL,
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `You are a warm, supportive nutritionist and wellness coach. A client just completed her weekly check-in. Based on her answers, write a 2–3 sentence personalized closing reflection. Reference something specific she shared. Offer one genuine observation or encouragement. End with positive energy for the week ahead. Keep it warm and personal.\n\nHer check-in answers:\n${summary}\n\nRespond with just your closing reflection, nothing else.`,
      },
    ],
  })
  return msg.content[0].text.trim()
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
