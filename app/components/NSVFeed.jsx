'use client'

import { useState } from 'react'

const CATEGORIES = ['Energy', 'Sleep', 'Clothes', 'Mood', 'Fitness', 'Other']
const CATEGORY_COLORS = {
  Energy: 'bg-yellow-100 text-yellow-700',
  Sleep: 'bg-blue-100 text-blue-700',
  Clothes: 'bg-pink-100 text-pink-700',
  Mood: 'bg-purple-100 text-purple-700',
  Fitness: 'bg-green-100 text-green-700',
  Other: 'bg-stone-100 text-stone-600',
}
const CATEGORY_ICONS = {
  Energy: '⚡️', Sleep: '😴', Clothes: '👗', Mood: '😊', Fitness: '💪', Other: '✨',
}

export default function NSVFeed({ initialVictories = [] }) {
  const [victories, setVictories] = useState(initialVictories)
  const [victory, setVictory] = useState('')
  const [category, setCategory] = useState('Energy')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(e) {
    e.preventDefault()
    if (!victory.trim()) return
    setSaving(true)
    try {
      const res = await fetch('/api/dashboard/nsv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ victory, category }),
      })
      const data = await res.json()
      if (res.ok) {
        setVictories(data.victories)
        setVictory('')
      }
    } catch {}
    finally { setSaving(false) }
  }

  return (
    <div className="space-y-4">
      <h1 className="text-lg font-semibold text-gray-900">Non-Scale Victories</h1>
      <p className="text-sm text-stone-400 -mt-2">Track the wins that don't show up on the scale 🌟</p>

      {/* Log form */}
      <form onSubmit={handleSubmit} className="card space-y-3">
        <textarea
          value={victory}
          onChange={(e) => setVictory(e.target.value)}
          placeholder="e.g. My jeans fit better today, had energy for a walk after dinner, slept 8 hours…"
          className="input-base resize-none min-h-[72px]"
          rows={3}
        />
        <div className="flex gap-2 flex-wrap">
          {CATEGORIES.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all border ${
                category === c
                  ? `${CATEGORY_COLORS[c]} border-transparent`
                  : 'bg-white border-stone-200 text-stone-500 hover:border-stone-300'
              }`}
            >
              {CATEGORY_ICONS[c]} {c}
            </button>
          ))}
        </div>
        <button
          type="submit"
          disabled={saving || !victory.trim()}
          className="btn bg-emerald-500 text-white hover:bg-emerald-600 w-full"
        >
          {saving ? 'Saving…' : 'Log Victory 🎉'}
        </button>
      </form>

      {/* Feed */}
      {victories.length > 0 ? (
        <div className="space-y-3">
          {victories.map((v) => (
            <div key={v.id} className="card py-4">
              <div className="flex items-start gap-3">
                <span className="text-xl shrink-0">{CATEGORY_ICONS[v.category] || '✨'}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-gray-800 leading-snug">{v.victory}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${CATEGORY_COLORS[v.category] || CATEGORY_COLORS.Other}`}>
                      {v.category}
                    </span>
                    <span className="text-xs text-stone-400">{v.date}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="card text-center py-12">
          <p className="text-3xl mb-3">🏆</p>
          <p className="text-stone-400 text-sm mb-1">No victories logged yet.</p>
          <p className="text-stone-300 text-xs">Every win counts — even the tiny ones.</p>
        </div>
      )}
    </div>
  )
}
