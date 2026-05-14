import { getTodayFoodLogs, getUserSettings, getCurrentMealPlan, getRecentWorkouts, getLikedMeals } from '@/lib/notion'
import MacroProgress from '@/app/components/MacroProgress'
import LogFoodForm from '@/app/components/LogFoodForm'
import LogWorkoutForm from '@/app/components/LogWorkoutForm'
import LogWeightForm from '@/app/components/LogWeightForm'
import MealPlanDisplay from '@/app/components/MealPlanDisplay'
import WeightChart from '@/app/components/WeightChart'
import RecentWorkouts from '@/app/components/RecentWorkouts'
import WaterWidget from '@/app/components/WaterWidget'

export default async function Dashboard() {
  const [logs, settings, mealPlan, workouts, likedMeals] = await Promise.all([
    getTodayFoodLogs(),
    getUserSettings(),
    getCurrentMealPlan(),
    getRecentWorkouts(5),
    getLikedMeals(),
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
      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <p className="text-xs text-stone-400">{today}</p>
        <MacroProgress totals={totals} targets={targets} />
        <WaterWidget />

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <LogFoodForm initialLogs={logs} />
          <LogWorkoutForm />
          <LogWeightForm />
        </div>

        <MealPlanDisplay initialPlan={mealPlan} initialLikedMeals={likedMeals} />

        <WeightChart />

        <RecentWorkouts workouts={workouts} />
      </div>
    </main>
  )
}
