'use client'

import { useState, useCallback, useEffect, useRef } from 'react'
import MacroProgress from './MacroProgress'
import LogFoodForm from './LogFoodForm'
import LogWorkoutForm from './LogWorkoutForm'
import LogWeightForm from './LogWeightForm'
import MealPlanDisplay from './MealPlanDisplay'
import WaterWidget from './WaterWidget'

function getTodayStr() {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

function offsetDateStr(dateStr, days) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  date.setDate(date.getDate() + days)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function formatDateLabel(dateStr) {
  const todayStr = getTodayStr()
  const yesterdayStr = offsetDateStr(todayStr, -1)
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  if (dateStr === todayStr) return { primary: 'Today', secondary: monthDay }
  if (dateStr === yesterdayStr) return { primary: 'Yesterday', secondary: monthDay }
  return { primary: weekday, secondary: monthDay }
}

export default function DashboardClient({ initialLogs, targets, initialPlan, initialLikedMeals }) {
  const todayStr = getTodayStr()
  const [selectedDate, setSelectedDate] = useState(todayStr)
  const [logs, setLogs] = useState(initialLogs)
  const [loadingDate, setLoadingDate] = useState(false)
  const mountedDate = useRef(null)

  // Always fetch fresh logs from the client — this bypasses both Next.js caching
  // and Notion's eventual consistency (new entries take ~1s to appear in queries).
  // Server-rendered initialLogs still paint instantly; this silently corrects stale data.
  useEffect(() => {
    const isDateChange = mountedDate.current !== null && mountedDate.current !== selectedDate
    mountedDate.current = selectedDate

    if (isDateChange) {
      setLoadingDate(true)
      setLogs([])
    }

    fetch(`/api/dashboard/log-food?date=${selectedDate}`)
      .then(r => r.json())
      .then(data => { if (data.logs) setLogs(data.logs) })
      .catch(() => {})
      .finally(() => setLoadingDate(false))
  }, [selectedDate])

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

  const isToday = selectedDate === todayStr
  const canGoBack = selectedDate > offsetDateStr(todayStr, -7)
  const canGoForward = !isToday
  const { primary, secondary } = formatDateLabel(selectedDate)

  function changeDate(dir) {
    setSelectedDate(prev => offsetDateStr(prev, dir))
  }

  return (
    <>
      {/* Date Navigator */}
      <div
        className="flex items-center justify-between bg-white rounded-2xl border border-stone-200/60 px-4 py-3"
        style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
      >
        <button
          onClick={() => changeDate(-1)}
          disabled={!canGoBack}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-lg"
          aria-label="Previous day"
        >
          ‹
        </button>

        <div className="text-center">
          <div className="flex items-center justify-center gap-2">
            <span className="text-sm font-bold text-gray-900">{primary}</span>
            {isToday && (
              <span className="text-[10px] font-semibold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                Today
              </span>
            )}
            {loadingDate && (
              <span className="text-[10px] text-stone-400 animate-pulse">loading…</span>
            )}
          </div>
          <span className="text-xs text-stone-400">{secondary}</span>
        </div>

        <button
          onClick={() => changeDate(1)}
          disabled={!canGoForward}
          className="w-9 h-9 flex items-center justify-center rounded-xl text-stone-400 hover:text-stone-700 hover:bg-stone-100 disabled:opacity-25 disabled:cursor-not-allowed transition-colors text-lg"
          aria-label="Next day"
        >
          ›
        </button>
      </div>

      <MacroProgress totals={totals} targets={targets} />
      <WaterWidget />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <LogFoodForm
          logs={logs}
          onAdd={addLog}
          onRemove={removeLog}
          onUpdate={updateLog}
          selectedDate={selectedDate}
          loadingDate={loadingDate}
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
