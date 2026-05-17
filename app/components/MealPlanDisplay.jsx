'use client'

import { useState, useCallback, useEffect } from 'react'
import { useRouter } from 'next/navigation'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SHORT = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

const MEAL_ICONS = { breakfast: '🍳', lunch: '🥗', dinner: '🍽️', snack: '🍎' }
const MEAL_COLORS = {
  breakfast: 'border-l-amber-300 bg-amber-50/50',
  lunch: 'border-l-emerald-300 bg-emerald-50/50',
  dinner: 'border-l-indigo-300 bg-indigo-50/50',
  snack: 'border-l-rose-300 bg-rose-50/50',
}
const MEAL_LABEL_COLORS = {
  breakfast: 'text-amber-600',
  lunch: 'text-emerald-600',
  dinner: 'text-indigo-600',
  snack: 'text-rose-500',
}

function parseMealPlan(text) {
  if (!text) return []
  const clean = (s) => s.replace(/[#*_`]/g, '').replace(/\s+/g, ' ').trim()
  const days = []
  let currentDay = null
  let currentMeal = null

  for (const rawLine of text.split('\n')) {
    const line = clean(rawLine)
    if (!line) continue

    const dayMatch = line.match(/^(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
    if (dayMatch) {
      if (currentDay) {
        if (currentMeal) { currentDay.meals.push(currentMeal); currentMeal = null }
        if (currentDay.meals.length) days.push(currentDay)
      }
      const name = dayMatch[1]
      currentDay = { day: name.charAt(0).toUpperCase() + name.slice(1).toLowerCase(), meals: [] }
      continue
    }

    if (!currentDay) continue

    const mealMatch = line.match(/^(breakfast|lunch|dinner|snack)\s*[:\-]?\s*/i)
    if (mealMatch) {
      if (currentMeal) currentDay.meals.push(currentMeal)
      const type = mealMatch[1].toLowerCase()
      const title = line.slice(mealMatch[0].length).trim()
      currentMeal = { type, icon: MEAL_ICONS[type] || '🍴', title, bullets: [], macros: null }
    } else if (currentMeal) {
      const bulletMatch = line.match(/^[-•]\s*(.+)/)
      const macroMatch = line.match(/^macros?\s*:/i)
      if (macroMatch) {
        currentMeal.macros = line.replace(/^macros?\s*:\s*/i, '').trim()
      } else if (bulletMatch) {
        currentMeal.bullets.push(bulletMatch[1].trim())
      } else if (!currentMeal.bullets.length && line) {
        currentMeal.title += (currentMeal.title ? ' ' : '') + line
      }
    }
  }

  if (currentDay) {
    if (currentMeal) currentDay.meals.push(currentMeal)
    if (currentDay.meals.length) days.push(currentDay)
  }

  return days
}

function parseMacros(str) {
  if (!str) return { cal: 0, p: 0, c: 0, f: 0 }
  const cal = parseInt(str.match(/(\d+)\s*cal/i)?.[1] || 0)
  const p = parseInt(str.match(/(\d+)g?\s*P\b/i)?.[1] || 0)
  const c = parseInt(str.match(/(\d+)g?\s*C\b/i)?.[1] || 0)
  const f = parseInt(str.match(/(\d+)g?\s*F\b/i)?.[1] || 0)
  return { cal, p, c, f }
}

function capitalize(s) {
  return s.charAt(0).toUpperCase() + s.slice(1)
}

function serializePlan(days) {
  return days.map(d =>
    d.day + '\n' + d.meals.map(m =>
      `${capitalize(m.type)}: ${m.title}\n` +
      m.bullets.map(b => `- ${b}`).join('\n') +
      (m.macros ? `\nMacros: ${m.macros}` : '')
    ).join('\n\n')
  ).join('\n\n')
}

function templateToMeal(template) {
  const type = template.meal.toLowerCase()
  return {
    type,
    icon: MEAL_ICONS[type] || '🍴',
    title: template.name,
    bullets: (template.description || '').split('\n').filter(Boolean).map(l => l.replace(/^[-•]\s*/, '')),
    macros: `${template.calories} cal | ${template.protein}g P | ${template.carbs}g C | ${template.fat}g F`,
  }
}

// ── SwapPanel ──────────────────────────────────────────────────────────────
function SwapPanel({ mealType, templates, onSelect, onClose }) {
  const [search, setSearch] = useState('')
  const filtered = (templates || [])
    .filter(t => t.meal.toLowerCase() === mealType.toLowerCase())
    .filter(t => !search || t.name.toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="mt-2 p-3 bg-white border border-stone-200 rounded-xl shadow-sm">
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-semibold text-stone-600">Swap with a saved recipe</p>
        <button onClick={onClose} className="text-stone-300 hover:text-stone-500 text-sm leading-none">✕</button>
      </div>
      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        placeholder="Search recipes…"
        className="input-base text-xs py-1.5 mb-2"
        autoFocus
      />
      {templates === null ? (
        <p className="text-xs text-stone-400 text-center py-3">Loading…</p>
      ) : filtered.length === 0 ? (
        <p className="text-xs text-stone-400 text-center py-3">
          No {capitalize(mealType)} recipes saved.{' '}
          <a href="/templates" className="text-emerald-500 underline">Add one →</a>
        </p>
      ) : (
        <ul className="space-y-1 max-h-48 overflow-y-auto">
          {filtered.map(t => (
            <li key={t.id} className="flex items-center justify-between gap-2 p-2 hover:bg-stone-50 rounded-lg">
              <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-gray-800 truncate">{t.name}</p>
                <p className="text-xs text-stone-400">{t.calories} cal | {t.protein}g P | {t.carbs}g C | {t.fat}g F</p>
              </div>
              <button
                onClick={() => onSelect(t)}
                className="shrink-0 text-xs px-2.5 py-1 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
              >
                Use this
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

// ── DailyMacroBar ──────────────────────────────────────────────────────────
function DailyMacroBar({ meals, targets }) {
  const totals = meals.reduce((acc, m) => {
    const { cal, p, c, f } = parseMacros(m.macros)
    return { cal: acc.cal + cal, p: acc.p + p, c: acc.c + c, f: acc.f + f }
  }, { cal: 0, p: 0, c: 0, f: 0 })

  if (!totals.cal) return null

  const pctOver = targets?.calories ? (totals.cal - targets.calories) / targets.calories : 0
  const color = pctOver > 0.2
    ? 'text-red-500 bg-red-50 border-red-100'
    : pctOver > 0.1
    ? 'text-amber-600 bg-amber-50 border-amber-100'
    : 'text-emerald-600 bg-emerald-50 border-emerald-100'

  return (
    <div className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl border text-xs font-medium mb-3 w-fit ${color}`}>
      <span>📊</span>
      <span>Day total: {totals.cal} cal | {totals.p}g P | {totals.c}g C | {totals.f}g F</span>
    </div>
  )
}

// ── HeartButton ────────────────────────────────────────────────────────────
function HeartButton({ mealText, liked, onToggle, loading }) {
  return (
    <button
      onClick={() => onToggle(mealText)}
      disabled={loading}
      className={`ml-2 shrink-0 text-base transition-all active:scale-90 ${loading ? 'opacity-40' : ''}`}
      title={liked ? 'Remove from saved' : 'Save this meal'}
    >
      {liked ? '❤️' : '🤍'}
    </button>
  )
}

// ── PlannerForm ────────────────────────────────────────────────────────────
const SCHEDULE_OPTIONS = [
  { value: 'busy', label: '🏃 Busy', desc: 'Quick meals' },
  { value: 'moderate', label: '😊 Moderate', desc: 'Mix it up' },
  { value: 'relaxed', label: '🧘 Relaxed', desc: 'Can cook more' },
]

function PlannerForm({ onGenerate, generating }) {
  const [form, setForm] = useState({ enjoyed: '', avoid: '', cravings: '', schedule: 'moderate' })

  function handleSubmit(e) {
    e.preventDefault()
    onGenerate(form)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="bg-gradient-to-br from-orange-50 to-amber-50 border border-orange-100 rounded-2xl p-5">
        <div className="flex items-center gap-2 mb-4">
          <span className="text-xl">🗓️</span>
          <div>
            <p className="text-sm font-semibold text-gray-800">Plan this week</p>
            <p className="text-xs text-stone-400">Answer a few quick questions and I'll build your plan</p>
          </div>
        </div>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block">
              What did you enjoy from last week? ✨
            </label>
            <textarea
              value={form.enjoyed}
              onChange={(e) => setForm({ ...form, enjoyed: e.target.value })}
              placeholder="e.g. Loved the chicken stir fry, the overnight oats were easy…"
              className="input-base resize-none text-sm min-h-[60px] bg-white"
              rows={2}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block">
              Anything you want to swap out or avoid? 🔄
            </label>
            <textarea
              value={form.avoid}
              onChange={(e) => setForm({ ...form, avoid: e.target.value })}
              placeholder="e.g. Tired of salads, skip the tuna this week…"
              className="input-base resize-none text-sm min-h-[60px] bg-white"
              rows={2}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-500 mb-1.5 block">
              Any cravings or meals on your mind? 🍽️
            </label>
            <textarea
              value={form.cravings}
              onChange={(e) => setForm({ ...form, cravings: e.target.value })}
              placeholder="e.g. Craving pasta, want something warm and comforting…"
              className="input-base resize-none text-sm min-h-[60px] bg-white"
              rows={2}
            />
          </div>

          <div>
            <label className="text-xs font-medium text-stone-500 mb-2 block">
              How busy is your week? ⏱️
            </label>
            <div className="flex gap-2">
              {SCHEDULE_OPTIONS.map(({ value, label, desc }) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setForm({ ...form, schedule: value })}
                  className={`flex-1 py-2 px-2 rounded-xl border text-center transition-all ${
                    form.schedule === value
                      ? 'bg-orange-500 border-orange-500 text-white'
                      : 'bg-white border-stone-200 text-stone-600 hover:border-orange-300'
                  }`}
                >
                  <p className="text-xs font-medium">{label}</p>
                  <p className={`text-xs mt-0.5 ${form.schedule === value ? 'text-orange-100' : 'text-stone-400'}`}>{desc}</p>
                </button>
              ))}
            </div>
          </div>
        </div>

        <button
          type="submit"
          disabled={generating}
          className="btn bg-orange-500 text-white hover:bg-orange-600 w-full mt-4 py-3 font-semibold"
        >
          {generating ? (
            <span className="flex items-center justify-center gap-2">
              <span className="inline-block w-3 h-3 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Building your plan…
            </span>
          ) : '✨ Build My Plan'}
        </button>
      </div>
    </form>
  )
}

// ── Main component ─────────────────────────────────────────────────────────
export default function MealPlanDisplay({ initialPlan, initialLikedMeals = [], targets = null }) {
  const [plan, setPlan] = useState(initialPlan)
  const [likedMeals, setLikedMeals] = useState(initialLikedMeals.map((m) => m.name))
  const [generating, setGenerating] = useState(false)
  const [heartLoading, setHeartLoading] = useState(null)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('plan')
  const [activeDay, setActiveDay] = useState(0)
  const [showPlanner, setShowPlanner] = useState(false)
  const [aiInput, setAiInput] = useState('')
  const [refining, setRefining] = useState(false)
  const [refineError, setRefineError] = useState(null)
  const router = useRouter()

  // Mutable plan state for swaps
  const [planDays, setPlanDays] = useState(() => parseMealPlan(initialPlan?.plan))
  const [swappingSlot, setSwappingSlot] = useState(null) // { dayIndex, mealIndex }
  const [swapTemplates, setSwapTemplates] = useState(null) // null = not yet loaded
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [saving, setSaving] = useState(false)

  // Sync planDays whenever plan state changes (after generate / refine)
  useEffect(() => {
    setPlanDays(parseMealPlan(plan?.plan))
    setHasUnsavedChanges(false)
    setSwappingSlot(null)
  }, [plan])

  // ── Swap helpers ───────────────────────────────────────────────────────
  async function openSwap(dayIndex, mealIndex) {
    // Load templates lazily on first open
    if (swapTemplates === null) {
      setSwappingSlot({ dayIndex, mealIndex })
      try {
        const res = await fetch('/api/dashboard/templates')
        const data = await res.json()
        setSwapTemplates(data.templates || [])
      } catch {
        setSwapTemplates([])
      }
    } else {
      setSwappingSlot({ dayIndex, mealIndex })
    }
  }

  function applySwap(template) {
    const { dayIndex, mealIndex } = swappingSlot
    const newDays = planDays.map((d, di) =>
      di !== dayIndex ? d : {
        ...d,
        meals: d.meals.map((m, mi) => mi !== mealIndex ? m : templateToMeal(template)),
      }
    )
    setPlanDays(newDays)
    setHasUnsavedChanges(true)
    setSwappingSlot(null)
  }

  async function savePlan() {
    setSaving(true)
    try {
      const serialized = serializePlan(planDays)
      await fetch('/api/dashboard/meal-plan', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ plan: serialized, groceryList: plan?.groceryList || '' }),
      })
      setHasUnsavedChanges(false)
      router.refresh()
    } catch {
      // silently fail — user can retry
    } finally {
      setSaving(false)
    }
  }

  // ── Generate / refine ──────────────────────────────────────────────────
  async function generatePlan(weeklyContext) {
    setGenerating(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/meal-plan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weeklyContext }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan')
      setPlan({ plan: data.plan, groceryList: data.groceryList, weekStart: new Date().toISOString().split('T')[0] })
      setActiveDay(0)
      setShowPlanner(false)
      setTab('plan')
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

  const savedList = initialLikedMeals.filter((m) => likedMeals.includes(m.name))

  // ── Render ─────────────────────────────────────────────────────────────
  return (
    <div className="card">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗓</span>
          <h2 className="section-title mb-0">Weekly Meal Plan</h2>
          {plan?.weekStart && <span className="text-xs text-stone-400 hidden sm:inline">· week of {plan.weekStart}</span>}
        </div>
        <div className="flex items-center gap-2">
          {hasUnsavedChanges && (
            <button
              onClick={savePlan}
              disabled={saving}
              className="btn text-xs px-3 py-1.5 bg-emerald-500 text-white hover:bg-emerald-600"
            >
              {saving ? (
                <span className="flex items-center gap-1.5">
                  <span className="inline-block w-2.5 h-2.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving…
                </span>
              ) : '↑ Save Changes'}
            </button>
          )}
          <button
            onClick={() => setShowPlanner(!showPlanner)}
            className={`btn text-xs px-3 py-1.5 transition-all ${
              showPlanner
                ? 'bg-stone-100 text-stone-600'
                : 'bg-orange-500 text-white hover:bg-orange-600'
            }`}
          >
            {showPlanner ? '✕ Cancel' : plan ? '↺ New Plan' : '+ Plan Week'}
          </button>
        </div>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {/* Weekly planner form */}
      {showPlanner && (
        <div className="mb-4">
          <PlannerForm onGenerate={generatePlan} generating={generating} />
        </div>
      )}

      {/* AI Tweak Bar */}
      {plan && !showPlanner && (
        <form onSubmit={refinePlan} className="mb-4">
          <div className="flex gap-2 items-center p-2.5 bg-stone-50 border border-stone-200 rounded-xl focus-within:border-orange-300 transition-colors">
            <span className="text-sm shrink-0 pl-0.5">✨</span>
            <input
              type="text"
              value={aiInput}
              onChange={(e) => setAiInput(e.target.value)}
              placeholder="Tweak the plan — e.g. 'keep breakfasts the same' or 'swap Thursday dinner'"
              disabled={refining}
              className="flex-1 bg-transparent text-sm text-gray-800 placeholder-stone-400 outline-none"
            />
            <button
              type="submit"
              disabled={refining || !aiInput.trim()}
              className={`shrink-0 w-7 h-7 rounded-lg flex items-center justify-center transition-colors text-sm font-medium ${
                aiInput.trim() && !refining
                  ? 'bg-orange-500 text-white hover:bg-orange-600'
                  : 'bg-stone-200 text-stone-400'
              }`}
            >
              {refining ? '…' : '↑'}
            </button>
          </div>
          {refineError && <p className="text-xs text-red-500 mt-1.5">{refineError}</p>}
        </form>
      )}

      {/* Tab bar */}
      {plan && !showPlanner && (
        <div className="flex gap-1 p-1 bg-stone-100 rounded-xl mb-4 w-fit">
          {['plan', 'grocery', 'saved'].map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                tab === t ? 'bg-white text-gray-800 shadow-sm' : 'text-stone-500 hover:text-gray-700'
              }`}
            >
              {t === 'plan' && '🗓 Plan'}
              {t === 'grocery' && '🛒 Grocery'}
              {t === 'saved' && `❤️ Saved${likedMeals.length ? ` (${likedMeals.length})` : ''}`}
            </button>
          ))}
        </div>
      )}

      {/* ── MEAL PLAN TAB ── */}
      {tab === 'plan' && !showPlanner && (
        <>
          {plan ? (
            <>
              {planDays.length > 0 ? (
                <>
                  {/* Day selector */}
                  <div className="flex gap-1.5 overflow-x-auto pb-1 mb-4 scrollbar-none">
                    {planDays.map((d, i) => (
                      <button
                        key={d.day}
                        onClick={() => setActiveDay(i)}
                        className={`shrink-0 px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${
                          activeDay === i
                            ? 'bg-orange-500 text-white shadow-sm'
                            : 'bg-stone-100 text-stone-500 hover:bg-stone-200'
                        }`}
                      >
                        {DAY_SHORT[DAYS.indexOf(d.day)] ?? d.day.slice(0, 3)}
                      </button>
                    ))}
                  </div>

                  {/* Meals for active day */}
                  {planDays[activeDay] && (
                    <div>
                      <p className="text-sm font-semibold text-gray-700 mb-3">
                        {planDays[activeDay].day}
                      </p>

                      {/* Daily macro summary bar */}
                      <DailyMacroBar meals={planDays[activeDay].meals} targets={targets} />

                      <div className="space-y-2">
                        {planDays[activeDay].meals.map((meal, mealIndex) => {
                          const key = meal.title.slice(0, 120)
                          const isLiked = likedMeals.includes(key)
                          const isSwapping =
                            swappingSlot?.dayIndex === activeDay &&
                            swappingSlot?.mealIndex === mealIndex

                          return (
                            <div key={mealIndex}>
                              <div
                                className={`flex items-start gap-3 p-3.5 rounded-xl border-l-4 border border-stone-100 transition-colors ${
                                  MEAL_COLORS[meal.type] || 'bg-stone-50 border-l-stone-300'
                                } ${isLiked ? 'ring-1 ring-red-200' : ''} ${isSwapping ? 'ring-1 ring-emerald-300' : ''}`}
                              >
                                <span className="text-xl shrink-0 mt-0.5">{meal.icon}</span>
                                <div className="flex-1 min-w-0">
                                  <p className={`text-xs font-semibold uppercase tracking-wide mb-1 ${MEAL_LABEL_COLORS[meal.type] || 'text-stone-400'}`}>
                                    {meal.type}
                                  </p>
                                  {meal.title && (
                                    <p className="text-sm font-medium text-gray-800 leading-snug mb-1.5">{meal.title}</p>
                                  )}
                                  {meal.bullets.length > 0 && (
                                    <ul className="space-y-1">
                                      {meal.bullets.map((b, j) => (
                                        <li key={j} className="flex items-start gap-2 text-xs text-gray-600 leading-relaxed">
                                          <span className="mt-1.5 w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                                          {b}
                                        </li>
                                      ))}
                                    </ul>
                                  )}
                                  {meal.macros && (
                                    <p className="mt-2 text-xs font-medium text-stone-500 bg-stone-100 rounded-lg px-2.5 py-1 inline-block">
                                      {meal.macros}
                                    </p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  {/* Swap button */}
                                  <button
                                    onClick={() => isSwapping ? setSwappingSlot(null) : openSwap(activeDay, mealIndex)}
                                    className={`text-xs px-2 py-1 rounded-lg border transition-colors ${
                                      isSwapping
                                        ? 'bg-emerald-500 text-white border-emerald-500'
                                        : 'bg-white text-stone-400 border-stone-200 hover:border-emerald-300 hover:text-emerald-500'
                                    }`}
                                    title="Swap this meal"
                                  >
                                    ↕
                                  </button>
                                  <HeartButton
                                    mealText={key}
                                    liked={isLiked}
                                    onToggle={toggleLike}
                                    loading={heartLoading === key}
                                  />
                                </div>
                              </div>

                              {/* Swap panel inline below this card */}
                              {isSwapping && (
                                <SwapPanel
                                  mealType={meal.type}
                                  templates={swapTemplates}
                                  onSelect={applySwap}
                                  onClose={() => setSwappingSlot(null)}
                                />
                              )}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
                  {plan.plan}
                </pre>
              )}
            </>
          ) : (
            !showPlanner && (
              <div className="text-center py-10">
                <p className="text-4xl mb-3">🥗</p>
                <p className="text-stone-500 text-sm font-medium mb-1">No meal plan yet this week.</p>
                <p className="text-stone-400 text-xs mb-4">Hit "Plan Week" to get started — takes about 30 seconds.</p>
                <button
                  onClick={() => setShowPlanner(true)}
                  className="btn bg-orange-500 text-white hover:bg-orange-600 px-6"
                >
                  + Plan Week
                </button>
              </div>
            )
          )}
        </>
      )}

      {/* ── GROCERY TAB ── */}
      {tab === 'grocery' && !showPlanner && (
        <>
          {plan?.groceryList ? (
            <div className="text-sm text-gray-700 leading-relaxed font-sans">
              {plan.groceryList.split('\n').map((line, i) => {
                const isHeader = /^[A-Z][A-Za-z\s]+:?\s*$/.test(line.trim()) || /^\*\*/.test(line)
                const clean = line.replace(/\*\*/g, '').trim()
                if (!clean) return <div key={i} className="h-2" />
                return isHeader ? (
                  <p key={i} className="font-semibold text-gray-900 mt-4 mb-1.5 text-sm">{clean}</p>
                ) : (
                  <p key={i} className="text-gray-600 pl-3 py-0.5 text-sm">• {clean.replace(/^[-•]\s*/, '')}</p>
                )
              })}
            </div>
          ) : (
            <p className="text-stone-400 text-sm text-center py-8">No grocery list yet.</p>
          )}
        </>
      )}

      {/* ── SAVED TAB ── */}
      {tab === 'saved' && !showPlanner && (
        <>
          {likedMeals.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-2xl mb-2">🤍</p>
              <p className="text-stone-400 text-sm">No saved meals yet.</p>
              <p className="text-stone-300 text-xs mt-1">Tap ❤️ on any meal to save it for future plans.</p>
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
