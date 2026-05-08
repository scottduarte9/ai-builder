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
      setSuccess(`${weight} lbs saved`)
      setWeight('')
      router.refresh()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="card flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">⚖️</span>
        <h2 className="section-title mb-0">Log Weight</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
        <div className="relative flex-1 flex flex-col justify-center">
          <input
            type="number"
            step="0.1"
            min="0"
            value={weight}
            onChange={(e) => setWeight(e.target.value)}
            placeholder="142.5"
            className="input-base focus:ring-violet-400 text-center text-2xl font-semibold pr-12"
          />
          <span className="absolute right-4 top-1/2 -translate-y-1/2 text-sm text-stone-400 font-medium">lbs</span>
        </div>
        <button
          type="submit"
          disabled={loading || !weight}
          className="btn bg-violet-500 text-white hover:bg-violet-600 w-full"
        >
          {loading ? 'Saving…' : 'Log Weight'}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {success && (
          <p className="text-xs text-violet-600 mt-1 flex items-start gap-1">
            <span>✓</span> <span>{success}</span>
          </p>
        )}
      </form>
    </div>
  )
}
