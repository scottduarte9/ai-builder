import { createWeightLog, checkAndRecalibrateMacros } from '@/lib/notion'

export async function POST(req) {
  try {
    const { weight } = await req.json()
    if (!weight || isNaN(Number(weight))) {
      return Response.json({ error: 'Invalid weight' }, { status: 400 })
    }
    const w = Number(weight)
    const today = new Date().toISOString().split('T')[0]
    await createWeightLog({ date: today, weight: w })
    const recalibrated = await checkAndRecalibrateMacros(w)
    return Response.json({ ok: true, ...(recalibrated && { recalibrated: true, newTargets: recalibrated }) })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
