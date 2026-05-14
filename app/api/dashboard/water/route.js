import { getTodayWater, logWater } from '@/lib/notion'

export async function GET() {
  try {
    const totalOz = await getTodayWater()
    return Response.json({ totalOz })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { oz = 8 } = await req.json()
    await logWater(oz)
    const totalOz = await getTodayWater()
    return Response.json({ ok: true, totalOz })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
