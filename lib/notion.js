import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

// ── User Settings ──────────────────────────────────────────────────────────

export async function getUserSettings() {
  const page = await notion.pages.retrieve({
    page_id: process.env.NOTION_USER_SETTINGS_PAGE_ID,
  })
  const props = page.properties
  return {
    protein: props['Protein (g)']?.number ?? 140,
    carbs: props['Carbs (g)']?.number ?? 150,
    fat: props['Fat (g)']?.number ?? 60,
    calories: props['Calories']?.number ?? 1700,
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
    id: p.id,
    meal: p.properties.Meal?.select?.name,
    description: p.properties.Description?.rich_text?.[0]?.plain_text,
    protein: p.properties['Protein (g)']?.number ?? 0,
    carbs: p.properties['Carbs (g)']?.number ?? 0,
    fat: p.properties['Fat (g)']?.number ?? 0,
    calories: p.properties.Calories?.number ?? 0,
  }))
}

export async function getRecentFoodLogs(days = 30) {
  const since = new Date()
  since.setDate(since.getDate() - days)
  const sinceStr = since.toISOString().split('T')[0]
  const res = await notion.databases.query({
    database_id: process.env.NOTION_FOOD_LOGS_DB_ID,
    filter: { property: 'Date', date: { on_or_after: sinceStr } },
    sorts: [{ property: 'Date', direction: 'descending' }],
    page_size: 200,
  })
  return res.results.map((p) => ({
    id: p.id,
    date: p.properties.Date?.date?.start,
    meal: p.properties.Meal?.select?.name,
    description: p.properties.Description?.rich_text?.[0]?.plain_text,
    protein: p.properties['Protein (g)']?.number ?? 0,
    carbs: p.properties['Carbs (g)']?.number ?? 0,
    fat: p.properties['Fat (g)']?.number ?? 0,
    calories: p.properties.Calories?.number ?? 0,
  }))
}

export async function deleteFoodLog(pageId) {
  return notion.pages.update({ page_id: pageId, in_trash: true })
}

export async function getLastFoodLog() {
  const today = new Date().toISOString().split('T')[0]
  const res = await notion.databases.query({
    database_id: process.env.NOTION_FOOD_LOGS_DB_ID,
    filter: { property: 'Date', date: { equals: today } },
    sorts: [{ timestamp: 'last_edited_time', direction: 'descending' }],
    page_size: 1,
  })
  if (!res.results.length) return null
  const p = res.results[0]
  return {
    id: p.id,
    meal: p.properties.Meal?.select?.name,
    description: p.properties.Description?.rich_text?.[0]?.plain_text,
    protein: p.properties['Protein (g)']?.number ?? 0,
    carbs: p.properties['Carbs (g)']?.number ?? 0,
    fat: p.properties['Fat (g)']?.number ?? 0,
    calories: p.properties.Calories?.number ?? 0,
  }
}

export async function updateUserSettings({ protein, carbs, fat, calories, liked, disliked }) {
  return notion.pages.update({
    page_id: process.env.NOTION_USER_SETTINGS_PAGE_ID,
    properties: {
      'Protein (g)': { number: protein },
      'Carbs (g)': { number: carbs },
      'Fat (g)': { number: fat },
      'Calories': { number: calories },
      'Foods Liked': { rich_text: [{ text: { content: liked || '' } }] },
      'Foods Disliked': { rich_text: [{ text: { content: disliked || '' } }] },
    },
  })
}

export async function updateFoodLog(pageId, { description, protein, carbs, fat, calories }) {
  return notion.pages.update({
    page_id: pageId,
    properties: {
      Description: { rich_text: [{ text: { content: description } }] },
      'Protein (g)': { number: protein },
      'Carbs (g)': { number: carbs },
      'Fat (g)': { number: fat },
      Calories: { number: calories },
    },
  })
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

// Split text into 1990-char chunks for Notion paragraph blocks (no property length limit this way)
function textToBlocks(text = '') {
  const chunks = []
  for (let i = 0; i < text.length; i += 1990) {
    chunks.push({
      object: 'block',
      type: 'paragraph',
      paragraph: { rich_text: [{ type: 'text', text: { content: text.slice(i, i + 1990) } }] },
    })
  }
  return chunks.length ? chunks : [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [] } }]
}

export async function createMealPlan({ weekStart, plan, groceryList }) {
  // Create page (title + date only — content stored as blocks below)
  const page = await notion.pages.create({
    parent: { database_id: process.env.NOTION_MEAL_PLANS_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `Week of ${weekStart}` } }] },
      'Week Start Date': { date: { start: weekStart } },
    },
  })

  // Store plan + grocery list as page content blocks — no length limit
  const divider = { object: 'block', type: 'divider', divider: {} }
  const blocks = [...textToBlocks(plan), divider, ...textToBlocks(groceryList || '')]

  // Notion allows max 100 children per append call
  for (let i = 0; i < blocks.length; i += 100) {
    await notion.blocks.children.append({ block_id: page.id, children: blocks.slice(i, i + 100) })
  }

  return page
}

export async function getCurrentMealPlan() {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_MEAL_PLANS_DB_ID,
    sorts: [{ property: 'Week Start Date', direction: 'descending' }],
    page_size: 1,
  })
  if (!res.results.length) return null
  const p = res.results[0]
  const weekStart = p.properties['Week Start Date']?.date?.start

  // Read plan from page content blocks
  try {
    const blocksRes = await notion.blocks.children.list({ block_id: p.id, page_size: 100 })
    let plan = '', groceryList = '', pastDivider = false
    for (const block of blocksRes.results) {
      if (block.type === 'divider') { pastDivider = true; continue }
      if (block.type === 'paragraph') {
        const text = block.paragraph.rich_text?.map(t => t.plain_text).join('') ?? ''
        if (pastDivider) groceryList += text
        else plan += text
      }
    }
    if (plan) return { weekStart, plan, groceryList }
  } catch {}

  // Fallback: old plans stored in page properties
  return {
    weekStart,
    plan: p.properties.Plan?.rich_text?.map(t => t.plain_text).join('') ?? null,
    groceryList: p.properties['Grocery List']?.rich_text?.map(t => t.plain_text).join('') ?? null,
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

export async function getCheckinResponses(weekStart) {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_CHECKIN_DB_ID,
    filter: { property: 'Week Start Date', date: { equals: weekStart } },
    sorts: [{ timestamp: 'created_time', direction: 'ascending' }],
  })
  return res.results.map((p) => ({
    question: p.properties.Question?.rich_text?.[0]?.plain_text ?? '',
    answer: p.properties.Answer?.rich_text?.[0]?.plain_text ?? '',
  }))
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

// ── Liked Meals ────────────────────────────────────────────────────────────

async function getLikedMealsBlock() {
  const page = await notion.blocks.children.list({
    block_id: process.env.NOTION_USER_SETTINGS_PAGE_ID,
  })
  return page.results.find(
    (b) => b.type === 'paragraph' && b.paragraph.rich_text?.[0]?.plain_text?.startsWith('__LIKED_MEALS__:')
  )
}

export async function getLikedMeals() {
  try {
    const block = await getLikedMealsBlock()
    if (!block) return []
    const raw = block.paragraph.rich_text[0].plain_text.replace('__LIKED_MEALS__:', '')
    return JSON.parse(raw)
  } catch {
    return []
  }
}

async function writeLikedMeals(meals) {
  const text = `__LIKED_MEALS__:${JSON.stringify(meals)}`
  const existing = await getLikedMealsBlock()
  if (existing) {
    await notion.blocks.update({
      block_id: existing.id,
      paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
    })
  } else {
    await notion.blocks.children.append({
      block_id: process.env.NOTION_USER_SETTINGS_PAGE_ID,
      children: [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: text } }] } }],
    })
  }
}

export async function saveLikedMeal(name) {
  const meals = await getLikedMeals()
  if (meals.some((m) => m.name === name)) return
  meals.push({ name, date: new Date().toISOString().split('T')[0] })
  await writeLikedMeals(meals)
}

export async function removeLikedMeal(name) {
  const meals = await getLikedMeals()
  await writeLikedMeals(meals.filter((m) => m.name !== name))
}

// ── Pending Food Log (Telegram quantity follow-up) ─────────────────────────

async function getSentinelBlock(sentinel) {
  const page = await notion.blocks.children.list({
    block_id: process.env.NOTION_USER_SETTINGS_PAGE_ID,
  })
  return page.results.find(
    (b) => b.type === 'paragraph' && b.paragraph.rich_text?.[0]?.plain_text?.startsWith(sentinel)
  )
}

async function writeSentinelBlock(sentinel, value) {
  const text = `${sentinel}${value}`
  const existing = await getSentinelBlock(sentinel)
  if (existing) {
    await notion.blocks.update({
      block_id: existing.id,
      paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
    })
  } else {
    await notion.blocks.children.append({
      block_id: process.env.NOTION_USER_SETTINGS_PAGE_ID,
      children: [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: text } }] } }],
    })
  }
}

export async function getPendingFoodLog(chatId) {
  try {
    const sentinel = `__PENDING_FOOD_${chatId}__:`
    const block = await getSentinelBlock(sentinel)
    if (!block) return null
    const raw = block.paragraph.rich_text[0]?.plain_text?.replace(sentinel, '')
    return raw || null
  } catch {
    return null
  }
}

export async function setPendingFoodLog(chatId, description) {
  const sentinel = `__PENDING_FOOD_${chatId}__:`
  await writeSentinelBlock(sentinel, description)
}

export async function clearPendingFoodLog(chatId) {
  const sentinel = `__PENDING_FOOD_${chatId}__:`
  const existing = await getSentinelBlock(sentinel)
  if (existing) {
    await notion.blocks.update({
      block_id: existing.id,
      paragraph: { rich_text: [{ type: 'text', text: { content: '' } }] },
    })
  }
}

// ── Water Logs ─────────────────────────────────────────────────────────────

export async function getTodayWater() {
  const today = new Date().toISOString().split('T')[0]
  const res = await notion.databases.query({
    database_id: process.env.NOTION_WATER_LOGS_DB_ID,
    filter: { property: 'Date', date: { equals: today } },
  })
  return res.results.reduce((sum, p) => sum + (p.properties['Amount_oz']?.number ?? 0), 0)
}

export async function logWater(oz) {
  const today = new Date().toISOString().split('T')[0]
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_WATER_LOGS_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `Water — ${today}` } }] },
      Date: { date: { start: today } },
      Amount_oz: { number: oz },
    },
  })
}

// ── Meal Templates ─────────────────────────────────────────────────────────

export async function getMealTemplates() {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_MEAL_TEMPLATES_DB_ID,
    sorts: [{ property: 'Meal', direction: 'ascending' }],
  })
  return res.results.map((p) => ({
    id: p.id,
    name: p.properties.Name?.title?.[0]?.plain_text ?? '',
    meal: p.properties.Meal?.select?.name ?? '',
    description: p.properties.Description?.rich_text?.[0]?.plain_text ?? '',
    protein: p.properties['Protein (g)']?.number ?? 0,
    carbs: p.properties['Carbs (g)']?.number ?? 0,
    fat: p.properties['Fat (g)']?.number ?? 0,
    calories: p.properties.Calories?.number ?? 0,
  }))
}

export async function createMealTemplate({ name, meal, description, protein, carbs, fat, calories }) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_MEAL_TEMPLATES_DB_ID },
    properties: {
      Name: { title: [{ text: { content: name } }] },
      Meal: { select: { name: meal } },
      Description: { rich_text: [{ text: { content: description } }] },
      'Protein (g)': { number: protein },
      'Carbs (g)': { number: carbs },
      'Fat (g)': { number: fat },
      Calories: { number: calories },
    },
  })
}

export async function deleteMealTemplate(pageId) {
  return notion.pages.update({ page_id: pageId, in_trash: true })
}

// ── Body Measurements ──────────────────────────────────────────────────────

export async function getBodyMeasurements(limit = 20) {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_BODY_MEASUREMENTS_DB_ID,
    sorts: [{ property: 'Date', direction: 'descending' }],
    page_size: limit,
  })
  return res.results.map((p) => ({
    id: p.id,
    date: p.properties.Date?.date?.start,
    weight: p.properties['Weight (lbs)']?.number ?? null,
    bodyFatPct: p.properties['Body Fat %']?.number ?? null,
    waist: p.properties['Waist (in)']?.number ?? null,
    hips: p.properties['Hips (in)']?.number ?? null,
  }))
}

export async function createBodyMeasurement({ date, weight, bodyFatPct, waist, hips }) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_BODY_MEASUREMENTS_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `Body Comp — ${date}` } }] },
      Date: { date: { start: date } },
      ...(weight != null && { 'Weight (lbs)': { number: weight } }),
      ...(bodyFatPct != null && { 'Body Fat %': { number: bodyFatPct } }),
      ...(waist != null && { 'Waist (in)': { number: waist } }),
      ...(hips != null && { 'Hips (in)': { number: hips } }),
    },
  })
}

// ── Non-Scale Victories ────────────────────────────────────────────────────

export async function getNSVLogs(limit = 20) {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_NSV_DB_ID,
    sorts: [{ property: 'Date', direction: 'descending' }],
    page_size: limit,
  })
  return res.results.map((p) => ({
    id: p.id,
    date: p.properties.Date?.date?.start,
    victory: p.properties.Victory?.rich_text?.[0]?.plain_text ?? '',
    category: p.properties.Category?.select?.name ?? 'Other',
  }))
}

export async function createNSVLog({ date, victory, category }) {
  return notion.pages.create({
    parent: { database_id: process.env.NOTION_NSV_DB_ID },
    properties: {
      Name: { title: [{ text: { content: `${category} — ${date}` } }] },
      Date: { date: { start: date } },
      Victory: { rich_text: [{ text: { content: victory } }] },
      Category: { select: { name: category } },
    },
  })
}

// ── Baseline Weight + Auto-Recalibration ───────────────────────────────────

export async function getBaselineWeight() {
  try {
    const block = await getSentinelBlock('__BASELINE_WEIGHT__:')
    if (!block) return null
    const raw = block.paragraph.rich_text[0]?.plain_text?.replace('__BASELINE_WEIGHT__:', '')
    const val = parseFloat(raw)
    return isNaN(val) ? null : val
  } catch {
    return null
  }
}

export async function setBaselineWeight(lbs) {
  await writeSentinelBlock('__BASELINE_WEIGHT__:', String(lbs))
}

export async function checkAndRecalibrateMacros(newWeight) {
  try {
    const [baseline, settings] = await Promise.all([getBaselineWeight(), getUserSettings()])
    if (baseline === null) {
      await setBaselineWeight(newWeight)
      return null
    }
    if (baseline - newWeight < 5) return null

    // Proportional recalibration
    const newCalories = Math.round(settings.calories * (newWeight / baseline))
    const protein = settings.protein // keep protein fixed
    const remainingCals = newCalories - protein * 4
    const fat = Math.round((remainingCals * 0.45) / 9)
    const carbs = Math.round((remainingCals * 0.55) / 4)

    await Promise.all([
      notion.pages.update({
        page_id: process.env.NOTION_USER_SETTINGS_PAGE_ID,
        properties: {
          Calories: { number: newCalories },
          'Protein (g)': { number: protein },
          'Carbs (g)': { number: carbs },
          'Fat (g)': { number: fat },
        },
      }),
      setBaselineWeight(newWeight),
    ])

    return { calories: newCalories, protein, carbs, fat }
  } catch {
    return null
  }
}

// ── Workout Queries ────────────────────────────────────────────────────────

export async function getRecentWorkouts(limit = 5) {
  const res = await notion.databases.query({
    database_id: process.env.NOTION_WORKOUT_LOGS_DB_ID,
    sorts: [{ property: 'Date', direction: 'descending' }],
    page_size: limit,
  })
  return res.results.map((p) => ({
    date: p.properties.Date?.date?.start,
    type: p.properties.Type?.rich_text?.[0]?.plain_text ?? '',
    duration: p.properties['Duration (mins)']?.number ?? 0,
    notes: p.properties.Notes?.rich_text?.[0]?.plain_text ?? '',
  }))
}
