import { getNSVLogs, createNSVLog } from '@/lib/notion'

export async function GET() {
  try {
    const victories = await getNSVLogs(20)
    return Response.json({ victories })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { date, victory, category } = await req.json()
    if (!victory?.trim()) return Response.json({ error: 'victory text required' }, { status: 400 })
    const today = date || new Date().toISOString().split('T')[0]
    await createNSVLog({ date: today, victory, category: category || 'Other' })
    const victories = await getNSVLogs(20)
    return Response.json({ ok: true, victories })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
