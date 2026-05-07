import { getTodayFoodLogs, getUserSettings } from '@/lib/notion'

export async function GET() {
  try {
    const [logs, settings] = await Promise.all([getTodayFoodLogs(), getUserSettings()])
    const totals = logs.reduce(
      (acc, log) => ({
        protein: acc.protein + log.protein,
        carbs: acc.carbs + log.carbs,
        fat: acc.fat + log.fat,
        calories: acc.calories + log.calories,
      }),
      { protein: 0, carbs: 0, fat: 0, calories: 0 }
    )
    return Response.json({
      totals,
      targets: {
        protein: settings.protein,
        carbs: settings.carbs,
        fat: settings.fat,
        calories: settings.calories,
      },
    })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
