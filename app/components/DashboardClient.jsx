'use client'

import { useState, useCallback } from 'react'
import MacroProgress from './MacroProgress'
import LogFoodForm from './LogFoodForm'
import LogWorkoutForm from './LogWorkoutForm'
import LogWeightForm from './LogWeightForm'
import MealPlanDisplay from './MealPlanDisplay'
import WaterWidget from './WaterWidget'

export default function DashboardClient({ initialLogs, targets, initialPlan, initialLikedMeals }) {
  const [logs, setLogs] = useState(initialLogs)

  const addLog = useCallback((entry) => {
    setLogs(prev => [entry, ...prev])
  }, [])

  const removeLog = useCallback((id) => {
    setLogs(prev => prev.filter(l => l.id !== id))
  }, [])

  const updateLog = useCallback((id, updates) => {
    setLogs(prev => prev.map(l => l.id === id ? { ...l, ...updates } : l))
  }, [])

  const totals = logs.reduce(
    (acc, log) => ({
      protein: acc.protein + (log.protein || 0),
      carbs: acc.carbs + (log.carbs || 0),
      fat: acc.fat + (log.fat || 0),
      calories: acc.calories + (log.calories || 0),
    }),
    { protein: 0, carbs: 0, fat: 0, calories: 0 }
  )

  return (
    <>
      <MacroProgress totals={totals} targets={targets} />
      <WaterWidget />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <LogFoodForm
          logs={logs}
          onAdd={addLog}
          onRemove={removeLog}
          onUpdate={updateLog}
        />
        <LogWorkoutForm />
        <LogWeightForm />
      </div>

      <MealPlanDisplay
        initialPlan={initialPlan}
        initialLikedMeals={initialLikedMeals}
        targets={targets}
        todayLogs={logs}
        onLog={addLog}
      />
    </>
  )
}
