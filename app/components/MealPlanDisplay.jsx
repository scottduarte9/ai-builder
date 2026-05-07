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
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold">Weekly Meal Plan</h2>
        <button
          onClick={generatePlan}
          disabled={loading}
          className="bg-orange-500 text-white rounded-xl px-4 py-2 text-sm font-medium hover:bg-orange-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Generating…' : 'Generate New Plan'}
        </button>
      </div>

      {error && <p className="text-red-500 text-sm mb-3">{error}</p>}

      {plan ? (
        <>
          {plan.weekStart && (
            <p className="text-xs text-gray-400 mb-3">Week of {plan.weekStart}</p>
          )}
          <div className="flex gap-2 mb-4">
            <button
              onClick={() => setTab('plan')}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${tab === 'plan' ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Meal Plan
            </button>
            <button
              onClick={() => setTab('grocery')}
              className={`text-sm px-3 py-1 rounded-lg transition-colors ${tab === 'grocery' ? 'bg-orange-100 text-orange-700 font-medium' : 'text-gray-500 hover:bg-gray-100'}`}
            >
              Grocery List
            </button>
          </div>
          <pre className="text-sm text-gray-700 whitespace-pre-wrap leading-relaxed">
            {tab === 'plan' ? plan.plan : plan.groceryList}
          </pre>
        </>
      ) : (
        <p className="text-gray-400 text-sm">No meal plan yet — generate one above.</p>
      )}
    </section>
  )
}
