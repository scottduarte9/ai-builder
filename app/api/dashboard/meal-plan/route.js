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

export async function PUT(req) {
  try {
    const { plan, groceryList } = await req.json()
    const weekStart = new Date().toISOString().split('T')[0]
    await createMealPlan({ weekStart, plan, groceryList: groceryList || '' })
    return Response.json({ ok: true })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    let weeklyContext = {}
    try {
      const body = await req.json()
      weeklyContext = body.weeklyContext ?? {}
      console.log('[meal-plan POST] selectedTemplates:', JSON.stringify(weeklyContext.selectedTemplates ?? []))
      console.log('[meal-plan POST] mealVariety:', JSON.stringify(weeklyContext.mealVariety ?? {}))
      console.log('[meal-plan POST] recipeIdeas:', weeklyContext.recipeIdeas ?? '')
    } catch (e) {
      console.error('[meal-plan POST] failed to parse body:', e)
    }
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
      weeklyContext,
    })
    await createMealPlan({ weekStart, plan, groceryList })
    return Response.json({ ok: true, plan, groceryList })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
