import { createWeightLog } from '@/lib/notion'

export async function POST(req) {
  try {
    const { weight } = await req.json()
    if (!weight || isNaN(Number(weight))) {
      return Response.json({ error: 'Invalid weight' }, { status: 400 })
    }
    const today = new Date().toISOString().split('T')[0]
    await createWeightLog({ date: today, weight: Number(weight) })
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
