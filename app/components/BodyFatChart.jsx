'use client'

import { useEffect, useState } from 'react'
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend } from 'recharts'

export default function BodyFatChart() {
  const [data, setData] = useState([])

  useEffect(() => {
    fetch('/api/dashboard/body-measurements')
      .then((r) => r.json())
      .then((d) => {
        const sorted = [...(d.measurements || [])].reverse()
        setData(sorted.map((m) => ({
          date: m.date ? m.date.slice(5) : '',
          'Body Fat %': m.bodyFatPct,
          'Weight': m.weight,
        })))
      })
      .catch(() => {})
  }, [])

  if (!data.length) {
    return (
      <div className="card text-center py-12">
        <p className="text-2xl mb-2">📏</p>
        <p className="text-stone-400 text-sm">No measurements logged yet.</p>
        <p className="text-stone-300 text-xs mt-1">Log your first entry above to start tracking.</p>
      </div>
    )
  }

  return (
    <div className="card">
      <h2 className="section-title">Body Composition Trend</h2>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data} margin={{ top: 4, right: 16, left: -16, bottom: 0 }}>
          <XAxis dataKey="date" tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} />
          <YAxis yAxisId="bf" domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}%`} />
          <YAxis yAxisId="wt" orientation="right" domain={['auto', 'auto']} tick={{ fontSize: 11, fill: '#a8a29e' }} tickLine={false} axisLine={false} tickFormatter={(v) => `${v}`} />
          <Tooltip
            contentStyle={{ fontSize: 12, borderRadius: 10, border: '1px solid #e7e5e4' }}
            formatter={(val, name) => [name === 'Body Fat %' ? `${val}%` : `${val} lbs`, name]}
          />
          <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
          <Line yAxisId="bf" type="monotone" dataKey="Body Fat %" stroke="#f97316" strokeWidth={2} dot={{ r: 3, fill: '#f97316' }} connectNulls />
          <Line yAxisId="wt" type="monotone" dataKey="Weight" stroke="#6366f1" strokeWidth={2} dot={{ r: 3, fill: '#6366f1' }} connectNulls />
        </LineChart>
      </ResponsiveContainer>
    </div>
  )
}
