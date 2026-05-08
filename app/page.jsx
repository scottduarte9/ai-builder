import { getTodayFoodLogs, getUserSettings, getCurrentMealPlan, getRecentWorkouts } from '@/lib/notion'
import MacroProgress from '@/app/components/MacroProgress'
import LogFoodForm from '@/app/components/LogFoodForm'
import LogWorkoutForm from '@/app/components/LogWorkoutForm'
import LogWeightForm from '@/app/components/LogWeightForm'
import MealPlanDisplay from '@/app/components/MealPlanDisplay'
import WeightChart from '@/app/components/WeightChart'
import RecentWorkouts from '@/app/components/RecentWorkouts'

export default async function Dashboard() {
  const [logs, settings, mealPlan, workouts] = await Promise.all([
    getTodayFoodLogs(),
    getUserSettings(),
    getCurrentMealPlan(),
    getRecentWorkouts(5),
  ])

  const totals = logs.reduce(
    (acc, log) => ({
      protein: acc.protein + log.protein,
      carbs: acc.carbs + log.carbs,
      fat: acc.fat + log.fat,
      calories: acc.calories + log.calories,
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  )

  const targets = {
    protein: settings.protein,
    carbs: settings.carbs,
    fat: settings.fat,
    calories: settings.calories,
  }

  const today = new Date().toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'long',
    day: 'numeric',
  })

  return (
    <main className="min-h-screen bg-stone-50">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold text-gray-900">Wellness Dashboard</h1>
            <p className="text-xs text-stone-400 mt-0.5">{today}</p>
          </div>
          <div className="w-8 h-8 rounded-full bg-emerald-100 flex items-center justify-center text-emerald-600 text-sm font-semibold">
            ✦
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <MacroProgress totals={totals} targets={targets} />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LogFoodForm />
          <LogWorkoutForm />
          <LogWeightForm />
        </div>

        <MealPlanDisplay initialPlan={mealPlan} />

        <WeightChart />

        <RecentWorkouts workouts={workouts} />
      </div>
    </main>
  )
}
