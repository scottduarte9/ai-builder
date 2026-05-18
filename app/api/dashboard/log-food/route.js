import { parseFoodLog } from '@/lib/claude'
import { createFoodLog, updateFoodLog, deleteFoodLog } from '@/lib/notion'

export async function POST(req) {
  try {
    const body = await req.json()

    // Pre-parsed path — description + meal + macros provided directly (skips Claude)
    if (body.description && body.meal && body.calories !== undefined) {
      const today = new Date().toISOString().split('T')[0]
      const page = await createFoodLog({ date: today, ...body })
      return Response.json({ ok: true, logged: { id: page.id, date: today, ...body } })
    }

    // Original Claude path
    const { text } = body
    if (!text?.trim()) return Response.json({ error: 'No text provided' }, { status: 400 })

    const parsed = await parseFoodLog(text)
    const today = new Date().toISOString().split('T')[0]
    const page = await createFoodLog({ date: today, ...parsed })

    return Response.json({ ok: true, logged: { id: page.id, date: today, ...parsed } })
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

export async function DELETE(req) {
  try {
    const { pageId } = await req.json()
    if (!pageId) return Response.json({ error: 'pageId required' }, { status: 400 })
    await deleteFoodLog(pageId)
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
