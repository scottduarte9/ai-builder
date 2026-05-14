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
        <h1 className="text-lg font-semibold text-gray-900">Meal Templates</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn bg-emerald-500 text-white hover:bg-emerald-600 text-xs px-3 py-1.5"
        >
          {showForm ? 'Cancel' : '+ Add Template'}
        </button>
      </div>

      {showForm && (
        <form onSubmit={saveTemplate} className="card space-y-3">
          <h2 className="section-title mb-0">New Template</h2>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Name</label>
              <input className="input-base" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="My usual breakfast" required />
            </div>
            <div>
              <label className="text-xs text-stone-400 mb-1 block">Meal</label>
              <select className="input-base" value={form.meal} onChange={(e) => setForm({ ...form, meal: e.target.value })}>
                {MEAL_TYPES.map((m) => <option key={m}>{m}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="text-xs text-stone-400 mb-1 block">Description</label>
            <input className="input-base" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="3 eggs, 2 slices toast, coffee with cream" />
          </div>
          <div className="grid grid-cols-4 gap-2">
            {['protein', 'carbs', 'fat', 'calories'].map((f) => (
              <div key={f}>
                <label className="text-xs text-stone-400 mb-1 block capitalize">{f === 'calories' ? 'Cal' : f}</label>
                <input type="number" className="input-base" value={form[f]} onChange={(e) => setForm({ ...form, [f]: e.target.value })} placeholder="0" />
              </div>
            ))}
          </div>
          <button type="submit" disabled={saving || !form.name} className="btn bg-emerald-500 text-white hover:bg-emerald-600 w-full">
            {saving ? 'Saving…' : 'Save Template'}
          </button>
        </form>
      )}

      {MEAL_TYPES.map((meal) => {
        const list = grouped[meal]
        if (!list.length) return null
        return (
          <div key={meal} className="card">
            <h2 className="section-title">{MEAL_ICONS[meal]} {meal}</h2>
            <div className="space-y-2">
              {list.map((t) => (
                <div key={t.id} className="flex items-center gap-3 p-3 bg-stone-50 border border-stone-100 rounded-xl">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800">{t.name}</p>
                    {t.description && <p className="text-xs text-stone-400 mt-0.5 truncate">{t.description}</p>}
                    <p className="text-xs text-stone-400 mt-0.5">P: {t.protein}g · C: {t.carbs}g · F: {t.fat}g · {t.calories} cal</p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => logNow(t)}
                      disabled={logging === t.id}
                      className="btn bg-emerald-500 text-white hover:bg-emerald-600 text-xs px-3 py-1.5"
                    >
                      {logging === t.id ? '…' : 'Log Now'}
                    </button>
                    <button
                      onClick={() => deleteTemplate(t.id)}
                      disabled={deleting === t.id}
                      className="text-stone-300 hover:text-red-400 transition-colors text-sm"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )
      })}

      {templates.length === 0 && !showForm && (
        <div className="card text-center py-12">
          <p className="text-2xl mb-2">🍳</p>
          <p className="text-stone-400 text-sm mb-1">No templates yet.</p>
          <p className="text-stone-300 text-xs">Save your go-to meals for one-tap logging.</p>
        </div>
      )}
    </div>
  )
}
