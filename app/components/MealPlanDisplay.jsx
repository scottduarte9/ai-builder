'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function MealPlanDisplay({ initialPlan }) {
  const [plan, setPlan] = useState(initialPlan)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [tab, setTab] = useState('plan')
  const router = useRouter()

  async function generatePlan() {
    setLoading(true)
    setError(null)
    try {
      const res = await fetch('/api/dashboard/meal-plan', { method: 'POST' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to generate plan')
      setPlan({ plan: data.plan, groceryList: data.groceryList, weekStart: new Date().toISOString().split('T')[0] })
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <span className="text-lg">🗓</span>
          <h2 className="section-title mb-0">Weekly Meal Plan</h2>
        </div>
        <button
          onClick={generatePlan}
          disabled={loading}
          className="btn bg-orange-500 text-white hover:bg-orange-600 text-xs px-3 py-1.5"
        >
          {loading ? 'Generating…' : '+ Generate New'}
        </button>
      </div>

      {error && <p className="text-xs text-red-500 mb-3">{error}</p>}

      {plan ? (
        <>
          {plan.weekStart && (
            <p className="text-xs text-stone-400 mb-3">Week of {plan.weekStart}</p>
          )}
          <div className="flex gap-1 p-1 bg-stone-100 rounded-xl mb-4 w-fit">
            {['plan', 'grocery'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t)}
                className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                  tab === t
                    ? 'bg-white text-gray-800 shadow-sm'
                    : 'text-stone-500 hover:text-gray-700'
                }`}
              >
                {t === 'plan' ? 'Meal Plan' : 'Grocery List'}
              </button>
            ))}
          </div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed font-sans">
            {tab === 'plan' ? plan.plan : plan.groceryList}
          </pre>
        </>
      ) : (
        <div className="text-center py-8">
          <p className="text-stone-400 text-sm mb-1">No meal plan yet this week.</p>
          <p className="text-stone-400 text-xs">Hit "Generate New" to create one.</p>
        </div>
      )}
    </div>
  )
}
