'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MEAL_ICONS = { Breakfast: '🍳', Lunch: '🥗', Dinner: '🍽️', Snack: '🍎' }
const MEAL_TYPES = ['Breakfast', 'Lunch', 'Dinner', 'Snack']

export default function TemplateList({ initialTemplates = [] }) {
  const [templates, setTemplates] = useState(initialTemplates)
  const [showForm, setShowForm] = useState(false)
  const [form, setForm] = useState({ name: '', meal: 'Breakfast', description: '', protein: '', carbs: '', fat: '', calories: '' })
  const [saving, setSaving] = useState(false)
  const [logging, setLogging] = useState(null)
  const [deleting, setDeleting] = useState(null)
  const router = useRouter()

  const grouped = MEAL_TYPES.reduce((acc, meal) => {
    acc[meal] = templates.filter((t) => t.meal === meal)
    return acc
  }, {})

  async function saveTemplate(e) {
    e.preventDefault()
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/templates', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          protein: Number(form.protein) || 0,
          carbs: Number(form.carbs) || 0,
          fat: Number(form.fat) || 0,
          calories: Number(form.calories) || 0,
        }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error)
      setTemplates(data.templates)
      setForm({ name: '', meal: 'Breakfast', description: '', protein: '', carbs: '', fat: '', calories: '' })
      setShowForm(false)
    } catch {}
    finally { setSaving(false) }
  }

  async function logNow(template) {
    setLogging(template.id)
    try {
      await fetch('/api/dashboard/log-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: `${template.description} for ${template.meal}` }),
      })
      router.refresh()
    } catch {}
    finally { setLogging(null) }
  }

  async function deleteTemplate(id) {
    setDeleting(id)
    try {
      const res = await fetch('/api/dashboard/templates', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: id }),
      })
      const data = await res.json()
      if (res.ok) setTemplates(data.templates)
    } catch {}
    finally { setDeleting(null) }
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-gray-900">Recipe Library</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn bg-emerald-500 text-white hover:bg-emerald-600 text-xs px-3 py-1.5"
        >
          {showForm ? 'Cancel' : '+ Add Recipe'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveTemplate} className="card space-y-3">
          <h2 className="section-title mb-0">New Recipe</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Name</label>
              <input
                className="input-base"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                placeholder="My usual breakfast"
                required
              />
            </div>
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Meal</label>
              <select
                className="input-base"
                value={form.meal}
                onChange={(e) => setForm({ ...form, meal: e.target.value })}
              >
                {MEAL_TYPES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-400 mb-1 block">Ingredients</label>
            <textarea
              className="input-base resize-none"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder={"- 150g Kirkwood Chicken Breast — 33g protein\n- 1 cup Season's Choice Broccoli\n- 1 tbsp olive oil"}
            />
            <p className="text-xs text-stone-300 mt-1">One ingredient per line. Used when swapping into your meal plan.</p>
          </div>
          <div className="grid grid-cols-4 gap-2">
            {[
              { key: 'protein', label: 'Protein', color: 'text-violet-600' },
              { key: 'carbs', label: 'Carbs', color: 'text-amber-600' },
              { key: 'fat', label: 'Fat', color: 'text-orange-500' },
              { key: 'calories', label: 'Cal', color: 'text-emerald-600' },
            ].map(({ key, label, color }) => (
              <div key={key}>
                <label className={`text-xs mb-1 block font-medium ${color}`}>{label}</label>
                <input
                  type="number"
                  className="input-base"
                  value={form[key]}
                  onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                  placeholder="0"
                />
              </div>
            ))}
          </div>
          <button
            type="submit"
            disabled={saving || !form.name}
            className="btn bg-emerald-500 text-white hover:bg-emerald-600 w-full"
          >
            {saving ? 'Saving…' : 'Save Recipe'}
          </button>
        </form>
      )}

      {MEAL_TYPES.map((meal) => {
        const list = grouped[meal]
        if (!list.length) return null
        return (
          <div key={meal} className="card">
            <h2 className="section-title">{MEAL_ICONS[meal]} {meal}</h2>
            <div className="space-y-3">
              {list.map((t) => {
                const ingredientLines = (t.description || '').split('\n').filter(Boolean)
                return (
                  <div key={t.id} className="p-3 bg-stone-50 border border-stone-100 rounded-xl">
                    <div className="flex items-start gap-3">
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-800 mb-1.5">{t.name}</p>

                        {/* Ingredients bullet list */}
                        {ingredientLines.length > 0 && (
                          <ul className="space-y-0.5 mb-2">
                            {ingredientLines.map((line, i) => (
                              <li key={i} className="flex items-start gap-1.5 text-xs text-gray-600">
                                <span className="mt-1.5 w-1 h-1 rounded-full bg-stone-300 shrink-0" />
                                {line.replace(/^[-•]\s*/, '')}
                              </li>
                            ))}
                          </ul>
                        )}

                        {/* Colored macro badges */}
                        <div className="flex flex-wrap gap-1.5">
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-violet-50 text-violet-600 border border-violet-100">
                            {t.protein}g P
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-amber-50 text-amber-600 border border-amber-100">
                            {t.carbs}g C
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-orange-50 text-orange-500 border border-orange-100">
                            {t.fat}g F
                          </span>
                          <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-50 text-emerald-600 border border-emerald-100">
                            {t.calories} cal
                          </span>
                        </div>
                      </div>

                      <div className="flex flex-col items-end gap-2 shrink-0">
                        <button
                          onClick={() => deleteTemplate(t.id)}
                          disabled={deleting === t.id}
                          className="text-stone-300 hover:text-red-400 transition-colors text-sm"
                        >
                          ✕
                        </button>
                        <button
                          onClick={() => logNow(t)}
                          disabled={logging === t.id}
                          className="btn bg-emerald-500 text-white hover:bg-emerald-600 text-xs px-3 py-1.5"
                        >
                          {logging === t.id ? '…' : 'Log Now'}
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )
      })}

      {templates.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <p className="text-2xl mb-2">🍳</p>
          <p className="text-stone-400 text-sm mb-1">No recipes yet.</p>
          <p className="text-stone-300 text-xs">Save your go-to meals to swap into your weekly plan.</p>
        </div>
      )}
    </div>
  )
}
