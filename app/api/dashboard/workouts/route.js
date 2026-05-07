import { getRecentWorkouts } from '@/lib/notion'

export async function GET() {
  try {
    const workouts = await getRecentWorkouts(5)
    return Response.json({ workouts })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
