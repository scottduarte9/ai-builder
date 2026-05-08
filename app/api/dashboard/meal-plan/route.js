import { getCurrentMealPlan, createMealPlan, getUserSettings, getLikedMeals } from '@/lib/notion'
import { generateMealPlan } from '@/lib/claude'

export async function GET() {
  try {
    const [plan, likedMeals] = await Promise.all([getCurrentMealPlan(), getLikedMeals()])
    return Response.json({ plan, likedMeals })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST() {
  try {
    const [settings, likedMeals] = await Promise.all([getUserSettings(), getLikedMeals()])
    const weekStart = new Date().toISOString().split('T')[0]
    const { plan, groceryList } = await generateMealPlan({
      protein: settings.protein,
      carbs: settings.carbs,
      fat: settings.fat,
      calories: settings.calories,
      liked: settings.liked,
      disliked: settings.disliked,
      likedMeals,
    })
    await createMealPlan({ weekStart, plan, groceryList })
    return Response.json({ ok: true, plan, groceryList })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
