import { getUserSettings, createMealPlan } from '@/lib/notion'
import { refineMealPlan } from '@/lib/claude'

export async function POST(req) {
  try {
    const { currentPlan, request } = await req.json()
    if (!request?.trim()) return Response.json({ error: 'No request provided' }, { status: 400 })
    if (!currentPlan?.trim()) return Response.json({ error: 'No current plan provided' }, { status: 400 })

    const settings = await getUserSettings()
    const weekStart = new Date().toISOString().split('T')[0]

    const { plan, groceryList } = await refineMealPlan({
      currentPlan,
      request,
      protein: settings.protein,
      carbs: settings.carbs,
      fat: settings.fat,
      calories: settings.calories,
    })

    await createMealPlan({ weekStart, plan, groceryList })
    return Response.json({ ok: true, plan, groceryList })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
