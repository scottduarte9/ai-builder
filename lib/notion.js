import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

// ── User Settings ──────────────────────────────────────────────────────────

export async function getUserSettings() {
  const page = await notion.pages.retrieve({
    page_id: process.env.NOTION_USER_SETTINGS_PAGE_ID,
  })
  const props = page.properties
  return {
    protein: props['Protein (g)']?.number ?? 150,
    carbs: props['Carbs (g)']?.number ?? 180,
    fat: props['Fat (g)']?.number ?? 60,
    calories: props['Calories']?.number ?? 1800,
    liked: props['Foods Liked']?.rich_text?.[0]?.plain_text ?? '',
    disliked: props['Foods Disliked']?.rich_text?.[0]?.plain_text ?? '',
    affirmationTone: props['Affirmation Tone']?.rich_text?.[0]?.plain_text ?? 'encouraging',
    weighInDay: props['Weigh-In Day']?.rich_text?.[0]?.plain_text ?? 'Monday',
    checkInDay: props['Check-In Day']?.rich_text?.[0]?.plain_text ?? 'Sunday',
    checkInTime: props['Check-In Time']?.rich_text?.[0]?.plain_text ?? '7:00 PM',
    telegramChatId: props['Telegram Chat ID']?.rich_text?.[0]?.plain_text ?? process.env.TELEGRAM_CHAT_ID,
  }
}

// ── Food Logs ──────────────────────────────────────────────────────────────

export async function createFoodLog({ date, description, protein, carbs, fat, calories, meal }) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_FOOD_LOGS_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `${date} — ${meal}` } }] },
      Date: { date: { start: date } },
      Description: { rich_text: [{ text: { content: description } }] },
      'Protein (g)': { number: protein },
      'Carbs (g)': { number: carbs },
      'Fat (g)': { number: fat },
      Calories: { number: calories },
      Meal: { select: { name: meal } },
    },
  })
}

export async function getTodayFoodLogs() {
  const today = new Date().toISOString().split('T')[0]
  const res = await notion.databases.query({
    database_id: process.env.NOTION_FOOD_LOGS_DB_ID,
    filter: { property: 'Date', date: { equals: today } },
  })
  return res.results.map((p) => ({
    meal: p.properties.Meal?.select?.name,
    description: p.properties.Description?.rich_text?.[0]?.plain_text,
    protein: p.properties['Protein (g)']?.number ?? 0,
    carbs: p.properties['Carbs (g)']?.number ?? 0,
    fat: p.properties['Fat (g)']?.number ?? 0,
    calories: p.properties.Calories?.number ?? 0,
  }))
}

// ── Workout Logs ───────────────────────────────────────────────────────────

export async function createWorkoutLog({ date, type, duration, notes }) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_WORKOUT_LOGS_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `${date} — ${type}` } }] },
      Date: { date: { start: date } },
      Type: { rich_text: [{ text: { content: type } }] },
      'Duration (mins)': { number: duration },
      Notes: { rich_text: [{ text: { content: notes } }] },
    },
  })
}

// ── Weight Logs ────────────────────────────────────────────────────────────

export async function createWeightLog({ date, weight }) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_WEIGHT_LOGS_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `Weight — ${date}` } }] },
      Date: { date: { start: date } },
      'Weight (lbs)': { number: weight },
    },
  })
}

export async function getWeightLogs(limit = 10) {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_WEIGHT_LOGS_DB_ID,
    sorts: [{ property: 'Date', direction: 'descending' }],
    page_size: limit,
  })
  return res.results.map((p) => ({
    date: p.properties.Date?.date?.start,
    weight: p.properties['Weight (lbs)']?.number,
  }))
}

// ── Meal Plans ─────────────────────────────────────────────────────────────

export async function createMealPlan({ weekStart, plan, groceryList }) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_MEAL_PLANS_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `Week of ${weekStart}` } }] },
      'Week Start Date': { date: { start: weekStart } },
      Plan: { rich_text: [{ text: { content: plan } }] },
      'Grocery List': { rich_text: [{ text: { content: groceryList } }] },
    },
  })
}

export async function getCurrentMealPlan() {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_MEAL_PLANS_DB_ID,
    sorts: [{ property: 'Week Start Date', direction: 'descending' }],
    page_size: 1,
  })
  if (!res.results.length) return null
  const p = res.results[0]
  return {
    weekStart: p.properties['Week Start Date']?.date?.start,
    plan: p.properties.Plan?.rich_text?.[0]?.plain_text,
    groceryList: p.properties['Grocery List']?.rich_text?.[0]?.plain_text,
  }
}

// ── Check-In Responses ─────────────────────────────────────────────────────

export async function createCheckinResponse({ weekStart, question, answer }) {
  const date = new Date().toISOString().split('T')[0]
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_CHECKIN_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `Check-In ${date}` } }] },
      'Week Start Date': { date: { start: weekStart } },
      Question: { rich_text: [{ text: { content: question } }] },
      Answer: { rich_text: [{ text: { content: answer } }] },
    },
  })
}

// ── Affirmations ───────────────────────────────────────────────────────────

export async function createAffirmation({ date, message }) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_AFFIRMATIONS_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `Affirmation — ${date}` } }] },
      Date: { date: { start: date } },
      Message: { rich_text: [{ text: { content: message } }] },
    },
  })
}
