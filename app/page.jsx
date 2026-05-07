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

  return (
    <main className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-2xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Wellness Dashboard</h1>
          <p className="text-gray-400 text-sm mt-1">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>

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
