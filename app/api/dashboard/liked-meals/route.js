import { getLikedMeals, saveLikedMeal, removeLikedMeal } from '@/lib/notion'

export async function GET() {
  try {
    const meals = await getLikedMeals()
    return Response.json({ meals })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const { name, action } = await req.json()
    if (!name) return Response.json({ error: 'name required' }, { status: 400 })
    if (action === 'remove') {
      await removeLikedMeal(name)
    } else {
      await saveLikedMeal(name)
    }
    const meals = await getLikedMeals()
    return Response.json({ ok: true, meals })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
