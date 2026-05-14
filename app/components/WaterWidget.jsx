'use client'

import { useState, useEffect } from 'react'

// Recommendation: weight(lbs)/2 + 16oz breastfeeding bonus ≈ 114oz → rounded to 110oz
const GOAL_OZ = 110

const INCREMENTS = [
  { label: '+8 oz', oz: 8, icon: '🥃' },
  { label: '+16 oz', oz: 16, icon: '🥤' },
  { label: '+32 oz', oz: 32, icon: '🍶' },
]

export default function WaterWidget() {
  const [totalOz, setTotalOz] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/water')
      .then((r) => r.json())
      .then((d) => setTotalOz(d.totalOz ?? 0))
      .catch(() => {})
  }, [])

  async function addWater(oz) {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oz }),
      })
      const data = await res.json()
      if (data.totalOz != null) setTotalOz(data.totalOz)
    } catch {}
    finally { setLoading(false) }
  }

  const pct = Math.min(Math.round((totalOz / GOAL_OZ) * 100), 100)
  const done = totalOz >= GOAL_OZ

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <h2 className="section-title mb-0">Water</h2>
        </div>
        <div className="text-right">
          <span className="text-sm font-semibold text-gray-800">{totalOz}</span>
          <span className="text-xs text-stone-400"> / {GOAL_OZ} oz</span>
        </div>
      </div>

      <div className="w-full bg-stone-100 rounded-full h-2 mb-1">
        <div
          className={`h-2 rounded-full transition-all duration-500 ${done ? 'bg-blue-500' : 'bg-blue-300'}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-stone-400 mb-4">
        {done ? '🎉 Goal reached!' : `${GOAL_OZ - totalOz} oz to go · Based on your weight + breastfeeding`}
      </p>

      <div className="flex gap-2">
        {INCREMENTS.map(({ label, oz, icon }) => (
          <button
            key={oz}
            onClick={() => addWater(oz)}
            disabled={loading}
            className="flex-1 flex flex-col items-center gap-1 py-2.5 bg-stone-50 border border-stone-200 rounded-xl text-xs font-medium text-stone-600 hover:bg-blue-50 hover:border-blue-200 hover:text-blue-600 active:scale-95 transition-all disabled:opacity-50"
          >
            <span className="text-base">{icon}</span>
            {label}
          </button>
        ))}
      </div>
    </div>
  )
}
