import { getBodyMeasurements, createBodyMeasurement } from '@/lib/notion'

export async function GET() {
  try {
    const measurements = await getBodyMeasurements(20)
    return Response.json({ measurements })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { date, weight, bodyFatPct, waist, hips } = await req.json()
    if (!date) return Response.json({ error: 'date required' }, { status: 400 })
    await createBodyMeasurement({ date, weight, bodyFatPct, waist, hips })
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
