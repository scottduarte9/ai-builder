import { parseFoodLog } from '@/lib/claude'
import { createFoodLog, updateFoodLog } from '@/lib/notion'

export async function POST(req) {
  try {
    const { text } = await req.json()
    if (!text?.trim()) return Response.json({ error: 'No text provided' }, { status: 400 })

    const parsed = await parseFoodLog(text)
    const today = new Date().toISOString().split('T')[0]
    await createFoodLog({ date: today, ...parsed })

    return Response.json({ ok: true, logged: parsed })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const { pageId, description, protein, carbs, fat, calories } = await req.json()
    if (!pageId) return Response.json({ error: 'pageId required' }, { status: 400 })
    await updateFoodLog(pageId, { description, protein, carbs, fat, calories })
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
