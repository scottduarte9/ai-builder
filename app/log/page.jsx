import { getRecentFoodLogs, getUserSettings } from '@/lib/notion'
import FoodJournal from '@/app/components/FoodJournal'

export default async function LogPage() {
  const [logs, settings] = await Promise.all([
    getRecentFoodLogs(30),
    getUserSettings(),
  ])

  const targets = {
    protein: settings.protein,
    carbs: settings.carbs,
    fat: settings.fat,
    calories: settings.calories,
  }

  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <FoodJournal logs={logs} targets={targets} />
      </div>
    </main>
  )
}
