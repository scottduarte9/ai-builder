'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function BodyMeasurementForm() {
  const today = new Date().toISOString().split('T')[0]
  const [form, setForm] = useState({ date: today, weight: '', bodyFatPct: '', waist: '', hips: '' })
  const [saving, setSaving] = useState(false)
  const [success, setSuccess] = useState(false)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    setSaving(true)
    setSuccess(false)
    try {
      const payload = {
        date: form.date,
        weight: form.weight ? Number(form.weight) : null,
        bodyFatPct: form.bodyFatPct ? Number(form.bodyFatPct) : null,
        waist: form.waist ? Number(form.waist) : null,
        hips: form.hips ? Number(form.hips) : null,
      }
      const res = await fetch('/api/dashboard/body-measurements', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })
      if (res.ok) {
        setSuccess(true)
        setForm({ date: today, weight: '', bodyFatPct: '', waist: '', hips: '' })
        router.refresh()
      }
    } catch {}
    finally { setSaving(false) }
  }

  const fields = [
    { key: 'weight', label: 'Weight (lbs)', placeholder: '185.0' },
    { key: 'bodyFatPct', label: 'Body Fat %', placeholder: '42.0' },
    { key: 'waist', label: 'Waist (in)', placeholder: '34.0' },
    { key: 'hips', label: 'Hips (in)', placeholder: '42.0' },
  ]

  return (
    <form onSubmit={handleSubmit} className="card space-y-4">
      <h2 className="section-title mb-0">Log Measurements</h2>
      <div>
        <label className="text-xs text-stone-400 mb-1 block">Date</label>
        <input type="date" className="input-base" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} required />
      </div>
      <div className="grid grid-cols-2 gap-3">
        {fields.map(({ key, label, placeholder }) => (
          <div key={key}>
            <label className="text-xs text-stone-400 mb-1 block">{label}</label>
            <input
              type="number"
              step="0.1"
              className="input-base"
              value={form[key]}
              onChange={(e) => setForm({ ...form, [key]: e.target.value })}
              placeholder={placeholder}
            />
          </div>
        ))}
      </div>
      <button type="submit" disabled={saving} className="btn bg-emerald-500 text-white hover:bg-emerald-600 w-full">
        {saving ? 'Saving…' : 'Save Measurements'}
      </button>
      {success && <p className="text-xs text-emerald-600 text-center">✓ Saved!</p>}
    </form>
  )
}
