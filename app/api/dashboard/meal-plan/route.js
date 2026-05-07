import { getCurrentMealPlan, createMealPlan, getUserSettings } from '@/lib/notion'
import { generateMealPlan } from '@/lib/claude'

export async function GET() {
  try {
    const plan = await getCurrentMealPlan()
    return Response.json({ plan })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const settings = await getUserSettings()
    const weekStart = new Date().toISOString().split('T')[0]
    const { plan, groceryList } = await generateMealPlan({
      protein: settings.protein,
      carbs: settings.carbs,
      fat: settings.fat,
      calories: settings.calories,
      liked: settings.liked,
      disliked: settings.disliked,
    })
    await createMealPlan({ weekStart, plan, groceryList })
    return Response.json({ ok: true, plan, groceryList })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
