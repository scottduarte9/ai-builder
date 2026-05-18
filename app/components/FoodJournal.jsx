'use client'

import { useMemo, useState } from 'react'
import { useRouter } from 'next/navigation'

const MEAL_ORDER = ['Breakfast', 'Lunch', 'Dinner', 'Snack']
const MEAL_ICONS = { Breakfast: '🍳', Lunch: '🥗', Dinner: '🍽️', Snack: '🍎' }
const MEAL_COLORS = {
  Breakfast: 'bg-amber-50 border-amber-100 text-amber-700',
  Lunch:     'bg-emerald-50 border-emerald-100 text-emerald-700',
  Dinner:    'bg-indigo-50 border-indigo-100 text-indigo-700',
  Snack:     'bg-rose-50 border-rose-100 text-rose-700',
}

function formatDate(dateStr) {
  const [y, m, d] = dateStr.split('-').map(Number)
  const date = new Date(y, m - 1, d)
  const today = new Date()
  const yesterday = new Date()
  yesterday.setDate(today.getDate() - 1)

  const isToday =
    date.getFullYear() === today.getFullYear() &&
    date.getMonth() === today.getMonth() &&
    date.getDate() === today.getDate()

  const isYesterday =
    date.getFullYear() === yesterday.getFullYear() &&
    date.getMonth() === yesterday.getMonth() &&
    date.getDate() === yesterday.getDate()

  const weekday = date.toLocaleDateString('en-US', { weekday: 'long' })
  const monthDay = date.toLocaleDateString('en-US', { month: 'long', day: 'numeric' })

  return { weekday, monthDay, isToday, isYesterday }
}

function MacroChip({ label, value, color }) {
  return (
    <span className={`inline-flex items-center gap-0.5 text-xs font-medium px-2 py-0.5 rounded-full ${color}`}>
      {label} <span className="font-semibold">{value}g</span>
    </span>
  )
}

function CalBar({ actual, target }) {
  const pct = Math.min(Math.round((actual / target) * 100), 130)
  const over = actual > target * 1.1
  const under = actual < target * 0.8
  const color = over ? 'bg-rose-400' : under ? 'bg-amber-400' : 'bg-emerald-400'
  return (
    <div className="mt-3 pt-3 border-t border-stone-100">
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-xs font-medium text-stone-500">
          {actual} <span className="text-stone-400">/ {target} cal</span>
        </span>
        <span className={`text-xs font-semibold ${over ? 'text-rose-500' : under ? 'text-amber-500' : 'text-emerald-600'}`}>
          {over ? `+${actual - target} over` : under ? `${target - actual} under` : 'On target ✓'}
        </span>
      </div>
      <div className="h-1.5 bg-stone-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all ${color}`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  )
}

function WeeklySummary({ logsByDate, targets }) {
  const today = new Date()
  const days = Array.from({ length: 7 }, (_, i) => {
    const d = new Date()
    d.setDate(today.getDate() - (6 - i))
    return d.toISOString().split('T')[0]
  })

  const dayData = days.map((date) => {
    const entries = logsByDate[date] || []
    const total = entries.reduce((s, e) => s + e.calories, 0)
    return { date, total, hasLog: entries.length > 0 }
  })

  const loggedDays = dayData.filter((d) => d.hasLog)
  const avgCal = loggedDays.length
    ? Math.round(loggedDays.reduce((s, d) => s + d.total, 0) / loggedDays.length)
    : 0

  return (
    <div className="bg-white rounded-2xl border border-stone-200/60 p-4 mb-6"
         style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
      <div className="flex items-center justify-between mb-3">
        <h2 className="text-sm font-semibold text-gray-800">This Week</h2>
        {loggedDays.length > 0 && (
          <span className="text-xs text-stone-500">
            avg <span className="font-semibold text-gray-700">{avgCal}</span> / {targets.calories} cal
          </span>
        )}
      </div>
      <div className="grid grid-cols-7 gap-1.5">
        {dayData.map(({ date, total, hasLog }) => {
          const d = new Date(date + 'T12:00:00')
          const label = d.toLocaleDateString('en-US', { weekday: 'narrow' })
          const pct = Math.min((total / targets.calories) * 100, 100)
          const over = total > targets.calories * 1.1
          const isToday = date === today.toISOString().split('T')[0]
          return (
            <div key={date} className="flex flex-col items-center gap-1">
              <span className={`text-[10px] font-medium ${isToday ? 'text-emerald-600' : 'text-stone-400'}`}>
                {label}
              </span>
              <div className="w-full h-10 bg-stone-100 rounded-lg overflow-hidden flex flex-col justify-end">
                {hasLog && (
                  <div
                    className={`w-full rounded-lg transition-all ${over ? 'bg-rose-400' : 'bg-emerald-400'}`}
                    style={{ height: `${Math.max(pct, 12)}%` }}
                  />
                )}
              </div>
              {isToday && <div className="w-1 h-1 rounded-full bg-emerald-500" />}
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default function FoodJournal({ logs, targets }) {
  const [search, setSearch] = useState('')
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const router = useRouter()

  function startEdit(entry) {
    setEditingId(entry.id)
    setEditForm({
      description: entry.description || '',
      protein: entry.protein,
      carbs: entry.carbs,
      fat: entry.fat,
      calories: entry.calories,
    })
  }

  async function saveEdit(entry) {
    setEditLoading(true)
    try {
      await fetch('/api/dashboard/log-food', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: entry.id, ...editForm }),
      })
      setEditingId(null)
      router.refresh()
    } catch { /* silent */ } finally {
      setEditLoading(false)
    }
  }

  async function deleteEntry(entry) {
    if (!window.confirm(`Remove "${entry.description}"?`)) return
    setDeletingId(entry.id)
    try {
      await fetch('/api/dashboard/log-food', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: entry.id }),
      })
      router.refresh()
    } catch { /* silent */ } finally {
      setDeletingId(null)
    }
  }

  // Group logs by date
  const logsByDate = useMemo(() => {
    const grouped = {}
    for (const log of logs) {
      if (!log.date) continue
      if (!grouped[log.date]) grouped[log.date] = []
      grouped[log.date].push(log)
    }
    return grouped
  }, [logs])

  // Sorted dates descending
  const dates = useMemo(() =>
    Object.keys(logsByDate).sort((a, b) => b.localeCompare(a)),
    [logsByDate]
  )

  // Filter by search
  const filteredDates = useMemo(() => {
    if (!search.trim()) return dates
    const q = search.toLowerCase()
    return dates.filter((date) =>
      logsByDate[date].some((l) => l.description?.toLowerCase().includes(q) || l.meal?.toLowerCase().includes(q))
    )
  }, [dates, logsByDate, search])

  const totalLogged = logs.length

  return (
    <div>
      {/* Header */}
      <div className="mb-5">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Food Journal</h1>
        <p className="text-xs text-stone-400 mt-0.5">
          {dates.length} days logged · {totalLogged} total entries
        </p>
      </div>

      {/* Weekly summary */}
      <WeeklySummary logsByDate={logsByDate} targets={targets} />

      {/* Search */}
      <div className="relative mb-5">
        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-stone-400 text-sm">🔍</span>
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search meals or foods…"
          className="w-full pl-8 pr-4 py-2.5 text-sm bg-white border border-stone-200 rounded-xl
                     focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400
                     placeholder:text-stone-400"
        />
      </div>

      {/* Empty state */}
      {filteredDates.length === 0 && (
        <div className="text-center py-16 text-stone-400">
          <div className="text-4xl mb-3">📓</div>
          <p className="text-sm font-medium">{search ? 'No entries match that search' : 'No food logged yet'}</p>
          <p className="text-xs mt-1">Log meals via Telegram or the dashboard to see your journal here.</p>
        </div>
      )}

      {/* Day entries */}
      <div className="space-y-4">
        {filteredDates.map((date) => {
          const { weekday, monthDay, isToday, isYesterday } = formatDate(date)
          const dayLogs = logsByDate[date]

          // Group by meal type, in order
          const byMeal = {}
          for (const log of dayLogs) {
            const key = log.meal || 'Snack'
            if (!byMeal[key]) byMeal[key] = []
            byMeal[key].push(log)
          }

          const dayTotals = dayLogs.reduce(
            (acc, l) => ({
              protein: acc.protein + l.protein,
              carbs: acc.carbs + l.carbs,
              fat: acc.fat + l.fat,
              calories: acc.calories + l.calories,
            }),
            { protein: 0, carbs: 0, fat: 0, calories: 0 }
          )

          return (
            <div
              key={date}
              className="bg-white rounded-2xl border border-stone-200/60 overflow-hidden"
              style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}
            >
              {/* Date header */}
              <div className="px-4 pt-4 pb-3 flex items-center justify-between border-b border-stone-100">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-gray-900">{weekday}</span>
                    {isToday && (
                      <span className="text-[10px] font-semibold bg-emerald-500 text-white px-1.5 py-0.5 rounded-full">
                        Today
                      </span>
                    )}
                    {isYesterday && (
                      <span className="text-[10px] font-semibold bg-stone-200 text-stone-600 px-1.5 py-0.5 rounded-full">
                        Yesterday
                      </span>
                    )}
                  </div>
                  <span className="text-xs text-stone-400">{monthDay}</span>
                </div>
                <div className="text-right">
                  <span className="text-sm font-bold text-gray-800">{dayTotals.calories}</span>
                  <span className="text-xs text-stone-400"> cal</span>
                </div>
              </div>

              {/* Meals */}
              <div className="divide-y divide-stone-50">
                {MEAL_ORDER.filter((m) => byMeal[m]).map((mealType) => (
                  <div key={mealType} className="px-4 py-3">
                    <div className="flex items-center gap-1.5 mb-2">
                      <span className="text-sm">{MEAL_ICONS[mealType]}</span>
                      <span className={`text-[10px] font-semibold uppercase tracking-wide px-2 py-0.5 rounded-full border ${MEAL_COLORS[mealType]}`}>
                        {mealType}
                      </span>
                    </div>
                    <div className="space-y-2">
                      {byMeal[mealType].map((entry) => (
                        <div key={entry.id}>
                          {editingId === entry.id ? (
                            <div className="space-y-2 bg-stone-50 rounded-xl p-3 border border-stone-100">
                              <input
                                className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                value={editForm.description}
                                onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                                placeholder="Description"
                              />
                              <div className="grid grid-cols-4 gap-1.5">
                                {[['protein','P'],['carbs','C'],['fat','F'],['calories','Cal']].map(([key, label]) => (
                                  <div key={key}>
                                    <label className="text-[10px] text-stone-400">{label}</label>
                                    <input
                                      type="number"
                                      className="w-full text-xs border border-stone-200 rounded-lg px-2 py-1 mt-0.5 focus:outline-none focus:ring-1 focus:ring-emerald-400"
                                      value={editForm[key]}
                                      onChange={(e) => setEditForm({ ...editForm, [key]: Number(e.target.value) })}
                                    />
                                  </div>
                                ))}
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => saveEdit(entry)}
                                  disabled={editLoading}
                                  className="text-xs bg-emerald-500 text-white rounded-lg px-3 py-1.5 font-medium hover:bg-emerald-600"
                                >
                                  {editLoading ? 'Saving…' : 'Save'}
                                </button>
                                <button
                                  onClick={() => setEditingId(null)}
                                  className="text-xs text-stone-500 bg-stone-100 rounded-lg px-3 py-1.5 font-medium hover:bg-stone-200"
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-start justify-between gap-3">
                              <p className="text-sm text-gray-700 leading-snug flex-1">{entry.description}</p>
                              <div className="flex items-center gap-1.5 shrink-0">
                                <span className="text-xs font-semibold text-gray-600 whitespace-nowrap">
                                  {entry.calories} cal
                                </span>
                                <button
                                  onClick={() => startEdit(entry)}
                                  className="text-stone-300 hover:text-stone-500 transition-colors text-sm leading-none"
                                  title="Edit"
                                >✏️</button>
                                <button
                                  onClick={() => deleteEntry(entry)}
                                  disabled={deletingId === entry.id}
                                  className="text-stone-300 hover:text-red-400 transition-colors text-sm leading-none"
                                  title="Delete"
                                >🗑️</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                    {/* Meal macro chips */}
                    {byMeal[mealType].length > 0 && (() => {
                      const mt = byMeal[mealType].reduce(
                        (a, l) => ({ p: a.p + l.protein, c: a.c + l.carbs, f: a.f + l.fat }),
                        { p: 0, c: 0, f: 0 }
                      )
                      return (
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <MacroChip label="P" value={mt.p} color="bg-violet-50 text-violet-600" />
                          <MacroChip label="C" value={mt.c} color="bg-amber-50 text-amber-600" />
                          <MacroChip label="F" value={mt.f} color="bg-orange-50 text-orange-600" />
                        </div>
                      )
                    })()}
                  </div>
                ))}
              </div>

              {/* Day totals + calorie bar */}
              <div className="px-4 pb-4">
                <div className="flex gap-1.5 flex-wrap mb-1">
                  <MacroChip label="Protein" value={dayTotals.protein} color="bg-violet-50 text-violet-700" />
                  <MacroChip label="Carbs" value={dayTotals.carbs} color="bg-amber-50 text-amber-700" />
                  <MacroChip label="Fat" value={dayTotals.fat} color="bg-orange-50 text-orange-700" />
                </div>
                <CalBar actual={dayTotals.calories} target={targets.calories} />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
