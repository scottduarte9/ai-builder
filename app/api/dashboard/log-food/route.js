import { parseFoodLog } from '@/lib/claude'
import { createFoodLog } from '@/lib/notion'

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
