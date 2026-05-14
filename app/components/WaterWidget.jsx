'use client'

import { useState, useEffect } from 'react'

const GOAL_OZ = 64
const GLASS_OZ = 8
const GLASSES = GOAL_OZ / GLASS_OZ

export default function WaterWidget() {
  const [totalOz, setTotalOz] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetch('/api/dashboard/water')
      .then((r) => r.json())
      .then((d) => setTotalOz(d.totalOz ?? 0))
      .catch(() => {})
  }, [])

  async function addGlass() {
    if (loading) return
    setLoading(true)
    try {
      const res = await fetch('/api/dashboard/water', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ oz: GLASS_OZ }),
      })
      const data = await res.json()
      if (data.totalOz != null) setTotalOz(data.totalOz)
    } catch {}
    finally { setLoading(false) }
  }

  const filledGlasses = Math.min(Math.round(totalOz / GLASS_OZ), GLASSES)
  const pct = Math.min(Math.round((totalOz / GOAL_OZ) * 100), 100)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-lg">💧</span>
          <h2 className="section-title mb-0">Water</h2>
        </div>
        <span className="text-xs text-stone-400">{filledGlasses} / {GLASSES} glasses</span>
      </div>

      <div className="w-full bg-stone-100 rounded-full h-1.5 mb-4">
        <div
          className="bg-blue-400 h-1.5 rounded-full transition-all duration-500"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="flex gap-1.5">
        {Array.from({ length: GLASSES }).map((_, i) => (
          <button
            key={i}
            onClick={addGlass}
            disabled={loading || i < filledGlasses}
            className={`flex-1 h-8 rounded-lg text-base transition-all ${
              i < filledGlasses
                ? 'bg-blue-100 text-blue-400 cursor-default'
                : 'bg-stone-100 text-stone-300 hover:bg-blue-50 hover:text-blue-400 active:scale-95'
            }`}
            title={i < filledGlasses ? 'Logged' : '+8 oz'}
          >
            {i < filledGlasses ? '💧' : '○'}
          </button>
        ))}
      </div>

      {totalOz >= GOAL_OZ && (
        <p className="text-xs text-blue-500 text-center mt-3">Goal reached! 💙</p>
      )}
    </div>
  )
}
