import { getWeightLogs } from '@/lib/notion'

export async function GET() {
  try {
    const logs = await getWeightLogs(30)
    return Response.json({ logs: logs.reverse() })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
