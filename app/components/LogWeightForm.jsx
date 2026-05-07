'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogWeightForm() {
  const [weight, setWeight] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!weight) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/dashboard/log-weight', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ weight: Number(weight) }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to log weight')
      setSuccess(`Logged ${weight} lbs`)
      setWeight('')
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold mb-3">Log Weight</h2>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <div className="flex gap-2">
          <input
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="142.5"
            className="flex-1 border border-gray-200 rounded-xl p-3 text-sm focus:outline-none focus:ring-2 focus:ring-purple-400"
          />
          <span className="flex items-center text-gray-500 text-sm">lbs</span>
        </div>
        <button
          type="submit"
          disabled={loading}
          className="bg-purple-500 text-white rounded-xl py-2 text-sm font-medium hover:bg-purple-600 disabled:opacity-50 transition-colors"
        >
          {loading ? 'Saving…' : 'Log Weight'}
        </button>
        {error && <p className="text-red-500 text-sm">{error}</p>}
        {success && <p className="text-green-600 text-sm">{success}</p>}
      </form>
    </section>
  )
}
