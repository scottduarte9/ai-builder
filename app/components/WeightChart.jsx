'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid } from 'recharts'

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

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold mb-4">Weight Trend</h2>
      {loading ? (
        <div className="h-48 flex items-center justify-center text-gray-400 text-sm">Loading…</div>
      ) : data.length === 0 ? (
        <p className="text-gray-400 text-sm">No weight logs yet — log your first weigh-in above.</p>
      ) : (
        <ResponsiveContainer width="100%" height={200}>
          <LineChart data={formatted}>
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis dataKey="date" tick={{ fontSize: 11 }} />
            <YAxis domain={['auto', 'auto']} tick={{ fontSize: 11 }} />
            <Tooltip formatter={(v) => [`${v} lbs`, 'Weight']} />
            <Line type="monotone" dataKey="weight" stroke="#8b5cf6" strokeWidth={2} dot={{ r: 3 }} />
          </LineChart>
        </ResponsiveContainer>
      )}
    </section>
  )
}
