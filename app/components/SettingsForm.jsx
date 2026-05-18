'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function SettingsForm({ initialSettings }) {
  const [form, setForm] = useState({
    calories: initialSettings.calories ?? 1700,
    protein: initialSettings.protein ?? 140,
    carbs: initialSettings.carbs ?? 150,
    fat: initialSettings.fat ?? 60,
    liked: initialSettings.liked ?? '',
    disliked: initialSettings.disliked ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [error, setError] = useState(null)
  const router = useRouter()

  function set(key, value) {
    setForm((f) => ({ ...f, [key]: value }))
    setSaved(false)
  }

  async function handleSave(e) {
    e.preventDefault()
    setSaving(true)
    setError(null)
    setSaved(false)
    try {
      const res = await fetch('/api/dashboard/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          calories: Number(form.calories),
          protein: Number(form.protein),
          carbs: Number(form.carbs),
          fat: Number(form.fat),
        }),
      })
      if (!res.ok) throw new Error('Failed to save')
      setSaved(true)
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setSaving(false)
    }
  }

  const totalCal = Number(form.protein) * 4 + Number(form.carbs) * 4 + Number(form.fat) * 9
  const calDiff = Number(form.calories) - totalCal

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900 tracking-tight">Settings</h1>
        <p className="text-xs text-stone-400 mt-0.5">Update your daily macro targets and food preferences.</p>
      </div>

      <form onSubmit={handleSave} className="space-y-5">
        {/* Macro targets */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5"
             style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Daily Macro Targets</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500 mb-1.5">
                Calories
              </label>
              <input
                type="number"
                value={form.calories}
                onChange={(e) => set('calories', e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5
                           focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-violet-600 mb-1.5">
                Protein (g)
              </label>
              <input
                type="number"
                value={form.protein}
                onChange={(e) => set('protein', e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5
                           focus:outline-none focus:ring-2 focus:ring-violet-400/40 focus:border-violet-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-amber-600 mb-1.5">
                Carbs (g)
              </label>
              <input
                type="number"
                value={form.carbs}
                onChange={(e) => set('carbs', e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5
                           focus:outline-none focus:ring-2 focus:ring-amber-400/40 focus:border-amber-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-orange-600 mb-1.5">
                Fat (g)
              </label>
              <input
                type="number"
                value={form.fat}
                onChange={(e) => set('fat', e.target.value)}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5
                           focus:outline-none focus:ring-2 focus:ring-orange-400/40 focus:border-orange-400"
              />
            </div>
          </div>

          {/* Macro math check */}
          <div className={`mt-3 text-xs rounded-lg px-3 py-2 ${Math.abs(calDiff) <= 50 ? 'bg-emerald-50 text-emerald-700' : 'bg-amber-50 text-amber-700'}`}>
            Macro calories: {totalCal} cal
            {Math.abs(calDiff) <= 50
              ? ' ✓ matches calorie target'
              : ` · ${Math.abs(calDiff)} cal ${calDiff > 0 ? 'under' : 'over'} your calorie target`}
          </div>
        </div>

        {/* Food preferences */}
        <div className="bg-white rounded-2xl border border-stone-200/60 p-5"
             style={{ boxShadow: '0 1px 8px rgba(0,0,0,0.05)' }}>
          <h2 className="text-sm font-semibold text-gray-800 mb-4">Food Preferences</h2>
          <p className="text-xs text-stone-400 mb-4">These are used when generating your weekly meal plan.</p>

          <div className="space-y-4">
            <div>
              <label className="block text-xs font-medium text-emerald-600 mb-1.5">
                Foods you enjoy
              </label>
              <textarea
                value={form.liked}
                onChange={(e) => set('liked', e.target.value)}
                placeholder="e.g. chicken, Greek yogurt, eggs, rice, berries…"
                rows={2}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 resize-none
                           focus:outline-none focus:ring-2 focus:ring-emerald-400/40 focus:border-emerald-400
                           placeholder:text-stone-400"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-rose-500 mb-1.5">
                Foods to avoid
              </label>
              <textarea
                value={form.disliked}
                onChange={(e) => set('disliked', e.target.value)}
                placeholder="e.g. mushrooms, shellfish, spicy food…"
                rows={2}
                className="w-full text-sm border border-stone-200 rounded-xl px-3 py-2.5 resize-none
                           focus:outline-none focus:ring-2 focus:ring-rose-400/40 focus:border-rose-400
                           placeholder:text-stone-400"
              />
            </div>
          </div>
        </div>

        {/* Save */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="bg-emerald-500 text-white text-sm font-semibold rounded-xl px-6 py-2.5
                       hover:bg-emerald-600 transition-colors disabled:opacity-50"
          >
            {saving ? 'Saving…' : 'Save Settings'}
          </button>
          {saved && (
            <span className="text-sm text-emerald-600 font-medium flex items-center gap-1">
              <span>✓</span> Saved
            </span>
          )}
          {error && <span className="text-sm text-red-500">{error}</span>}
        </div>
      </form>
    </div>
  )
}
