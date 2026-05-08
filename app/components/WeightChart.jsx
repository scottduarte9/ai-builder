'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

function CustomTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-stone-100 shadow-md rounded-xl px-3 py-2 text-sm">
      <p className="text-stone-400 text-xs mb-0.5">{label}</p>
      <p className="font-semibold text-violet-600">{payload[0].value} lbs</p>
    </div>
  )
}

export default function WeightChart() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetch('/api/dashboard/weight-trend')
      .then((r) => r.json())
      .then((d) => setData(d.logs ?? []))
      .finally(() => setLoading(false))
  }, [])

  const formatted = data.map((d) => ({
    date: d.date ? d.date.slice(5) : '',
    weight: d.weight,
  }))

  const weights = formatted.map((d) => d.weight).filter(Boolean)
  const min = weights.length ? Math.floor(Math.min(...weights)) - 2 : 'auto'
  const max = weights.length ? Math.ceil(Math.max(...weights)) + 2 : 'auto'

  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-5">
        <span className="text-lg">📈</span>
        <h2 className="section-title mb-0">Weight Trend</h2>
      </div>
      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-6 h-6 border-2 border-violet-300 border-t-violet-600 rounded-full animate-spin" />
        </div>
      ) : data.length === 0 ? (
        <div className="h-48 flex flex-col items-center justify-center text-center">
          <p className="text-stone-400 text-sm">No weigh-ins logged yet.</p>
          <p className="text-stone-300 text-xs mt-1">Log your first weight above to start tracking.</p>
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formatted} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f5f5f4" vertical={false} />
            <XAxis dataKey="date" tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
            <YAxis domain={[min, max]} tick={{ fontSize: 10, fill: '#a8a29e' }} axisLine={false} tickLine={false} />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="weight"
              stroke="#8b5cf6"
              strokeWidth={2.5}
              dot={{ r: 3, fill: '#8b5cf6', strokeWidth: 0 }}
              activeDot={{ r: 5, fill: '#8b5cf6', strokeWidth: 0 }}
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
