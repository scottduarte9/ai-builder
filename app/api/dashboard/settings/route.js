import { getUserSettings, updateUserSettings } from '@/lib/notion'

export async function GET() {
  try {
    const settings = await getUserSettings()
    return Response.json(settings)
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function PUT(req) {
  try {
    const body = await req.json()
    await updateUserSettings(body)
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
