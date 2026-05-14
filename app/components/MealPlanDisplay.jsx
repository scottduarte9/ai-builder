'use client'

import { useState, useCallback } from 'react'
import { useRouter } from 'next/navigation'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MEAL_ICONS = {
  breakfast: '🍳',
  lunch: '🥗',
  dinner: '🍽️',
  snack: '🍎',
}

function parseMealPlan(text) {
  if (!text) return []
  const days = []
  const dayRegex = /^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/im
  const chunks = text.split(/\n(?=(?:monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b)/i)
  for (const chunk of chunks) {
    const lines = chunk.trim().split('\n')
    const dayMatch = lines[0].match(dayRegex)
    if (!dayMatch) continue
    const day = dayMatch[0].charAt(0).toUpperCase() + dayMatch[0].slice(1).toLowerCase()
    const meals = []
    let current = null
    for (const line of lines.slice(1)) {
      const mealMatch = line.match(/^(breakfast|lunch|dinner|snack)[\s:]*/i)
      if (mealMatch) {
        if (current) meals.push(current)
        const type = mealMatch[1].toLowerCase()
        const text = line.slice(mealMatch[0].length).trim()
        current = { type, icon: MEAL_ICONS[type] || '🍴', text }
      } else if (current && line.trim()) {
        current.text += ' ' + line.trim()
      }
    }
    if (current) meals.push(current)
    if (meals.length) days.push({ day, meals })
  }
  return days
}

function parseGroceryList(text) {
  if (!text) return text
  return text
}

function HeartButton({ mealText, liked, onToggle, loading }) {
  return (
    <button
      onClick={() => onToggle(mealText)}
      disabled={loading}
      className={`ml-2 shrink-0 text-lg transition-all active:scale-90 ${loading ? 'opacity-40' : ''}`}
      title={liked ? 'Remove from saved' : 'Save this meal'}
    >
      {liked ? '❤️' : '🤍'}
    </button>
  )
}

export default function MealPlanDisplay({ initialPlan, initialLikedMeals = [] }) {
  const [plan, setPlan] = useState(initialPlan)
  const [likedMeals, setLikedMeals] = useState(initialLikedMeals.map((m) => m.name))
  const [generating, setGenerating] = useState(false)
  const [heartLoading, setHeartLoading] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('plan')
  const [activeDay, setActiveDay] = useState(0)
  const [aiInput, setAiInput] = useState('')
  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState(null)
  const router = useRouter()

  const parsedDays = parseMealPlan(plan?.plan)

  async function generatePlan() {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/meal-plan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan')
      setPlan({ plan: data.plan, groceryList: data.groceryList, weekStart: new Date().toISOString().split('T')[0] })
      setActiveDay(0)
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setGenerating(false)
    }
  }

  const toggleLike = useCallback(async (mealText) => {
    const name = mealText.slice(0, 120)
    const isLiked = likedMeals.includes(name)
    setHeartLoading(name)
    try {
      const res = await fetch('/api/dashboard/liked-meals', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, action: isLiked ? 'remove' : 'save' }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setLikedMeals(data.meals.map((m) => m.name))
    } catch {
      // silently fail
    } finally {
      setHeartLoading(null)
    }
  }, [likedMeals])

  const savedList = initialLikedMeals.filter((m) => likedMeals.includes(m.name))

  async function refinePlan(e) {
    e.preventDefault()
    if (!aiInput.trim() || !plan?.plan) return
    setRefining(true)
    setRefineError(null)
    try {
      const res = await fetch('/api/dashboard/meal-plan/refine', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPlan: plan.plan, request: aiInput }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to refine plan')
      setPlan({ plan: data.plan, groceryList: data.groceryList, weekStart: new Date().toISOString().split('T')[0] })
      setAiInput('')
      setActiveDay(0)
      setTab('plan')
      router.refresh()
    } catch (err) {
      setRefineError(err.message)
    } finally {
      setRefining(false)
    }
  }

  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗓</span>
          <h2 className="section-title mb-0">Weekly Meal Plan</h2>
        </div>
        <button
          onClick={generatePlan}
          disabled={generating}
          className="btn bg-orange-500 text-white hover:bg-orange-600 text-xs px-3 py-1.5"
        >
          {generating ? 'Generating…' : '+ New Plan'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {/* AI Assistant Bar */}
      <form onSubmit={refinePlan} className="mb-4">
        <div className="flex gap-2 items-center p-2 bg-stone-50 border border-stone-200 rounded-xl focus-within:border-orange-300 transition-colors">
          <span className="text-base shrink-0 pl-1">✨</span>
          <input
            type="text"
            value={aiInput}
            onChange={(e) => setAiInput(e.target.value)}
            placeholder={plan ? "Tweak the plan — e.g. 'keep breakfasts the same' or 'swap Thursday dinner'" : "Generate a plan first, then ask me to tweak it"}
            disabled={refining || !plan}
            className="flex-1 bg-transparent text-sm text-gray-800 placeholder-stone-400 outline-none"
          />
          <button
            type="submit"
            disabled={refining || !aiInput.trim() || !plan}
            className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-sm ${
              aiInput.trim() && plan && !refining
                ? 'bg-orange-500 text-white hover:bg-orange-600'
                : 'bg-stone-200 text-stone-400'
            }`}
          >
            {refining ? '…' : '↑'}
          </button>
        </div>
        {refineError && <p className="text-xs text-red-500 mt-1.5">{refineError}</p>}
      </form>

      {/* Top tab bar */}
      <div className="flex gap-1 p-1 bg-stone-100 rounded-xl mb-4 w-fit">
        {['plan', 'grocery', 'saved'].map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all flex items-center gap-1 ${
              tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-stone-500 hover:text-gray-700'
            }`}
          >
            {t === 'plan' && 'Meal Plan'}
            {t === 'grocery' && '🛒 Grocery'}
            {t === 'saved' && `❤️ Saved${likedMeals.length ? ` (${likedMeals.length})` : ''}`}
          </button>
        ))}
      </div>

      {/* MEAL PLAN TAB */}
      {tab === 'plan' && (
        <>
          {plan ? (
            <>
              {plan.weekStart && (
                <p className="text-xs text-stone-400 mb-3">Week of {plan.weekStart}</p>
              )}
              {parsedDays.length > 0 ? (
                <>
                  {/* Day selector */}
                  <div className="flex gap-1 overflow-x-auto pb-1 mb-4 scrollbar-none">
                    {parsedDays.map((d, i) => (
                      <button
                        key={d.day}
                        onClick={() => setActiveDay(i)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          activeDay === i
                            ? 'bg-orange-500 text-white'
                            : 'bg-stone-100 text-stone-600 hover:bg-stone-200'
                        }`}
                      >
                        {DAY_SHORT[DAYS.indexOf(d.day)] ?? d.day.slice(0, 3)}
                      </button>
                    ))}
                  </div>

                  {/* Meals for active day */}
                  {parsedDays[activeDay] && (
                    <div className="space-y-2">
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        {parsedDays[activeDay].day}
                      </p>
                      {parsedDays[activeDay].meals.map((meal, i) => {
                        const key = meal.text.slice(0, 120)
                        const isLiked = likedMeals.includes(key)
                        return (
                          <div
                            key={i}
                            className={`flex items-start gap-3 p-3 rounded-xl border transition-colors ${
                              isLiked ? 'bg-red-50 border-red-100' : 'bg-stone-50 border-stone-100'
                            }`}
                          >
                            <span className="text-xl shrink-0 mt-0.5">{meal.icon}</span>
                            <div className="flex-1 min-w-0">
                              <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-0.5">
                                {meal.type}
                              </p>
                              <p className="text-sm text-gray-800 leading-snug">{meal.text}</p>
                            </div>
                            <HeartButton
                              mealText={key}
                              liked={isLiked}
                              onToggle={toggleLike}
                              loading={heartLoading === key}
                            />
                          </div>
                        )
                      })}
                    </div>
                  )}
                </>
              ) : (
                // Fallback: raw text if parsing fails
                <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {plan.plan}
                </pre>
              )}
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-stone-400 text-sm mb-1">No meal plan yet this week.</p>
              <p className="text-stone-300 text-xs">Hit "+ New Plan" to generate one.</p>
            </div>
          )}
        </>
      )}

      {/* GROCERY TAB */}
      {tab === 'grocery' && (
        <>
          {plan?.groceryList ? (
            <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap font-sans">
              {plan.groceryList.split('\n').map((line, i) => {
                const isHeader = /^[A-Z][A-Za-z\s]+:?\s*$/.test(line.trim()) || /^\*\*/.test(line)
                const clean = line.replace(/\*\*/g, '').trim()
                if (!clean) return <div key={i} className="h-2" />
                return isHeader ? (
                  <p key={i} className="font-semibold text-gray-900 mt-3 mb-1">{clean}</p>
                ) : (
                  <p key={i} className="text-gray-600 pl-2">• {clean.replace(/^[-•]\s*/, '')}</p>
                )
              })}
            </div>
          ) : (
            <p className="text-stone-400 text-sm text-center py-8">No grocery list yet.</p>
          )}
        </>
      )}

      {/* SAVED TAB */}
      {tab === 'saved' && (
        <>
          {likedMeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🤍</p>
              <p className="text-stone-400 text-sm">No saved meals yet.</p>
              <p className="text-stone-300 text-xs mt-1">Tap ❤️ on any meal to save it.</p>
            </div>
          ) : (
            <ul className="space-y-2">
              {likedMeals.map((name, i) => (
                <li key={i} className="flex items-center justify-between p-3 bg-red-50 border border-red-100 rounded-xl">
                  <p className="text-sm text-gray-800 flex-1 leading-snug">{name}</p>
                  <button
                    onClick={() => toggleLike(name)}
                    disabled={heartLoading === name}
                    className="ml-3 text-sm text-stone-400 hover:text-red-500 transition-colors"
                  >
                    ✕
                  </button>
                </li>
              ))}
            </ul>
          )}
          {likedMeals.length > 0 && (
            <p className="text-xs text-stone-400 mt-3 text-center">
              These meals will be included in your next generated plan.
            </p>
          )}
        </>
      )}
    </div>
  )
}
