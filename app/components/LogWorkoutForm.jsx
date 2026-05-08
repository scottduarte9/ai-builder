'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogWorkoutForm() {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const router = useRouter()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!text.trim()) return
    setLoading(true)
    setError(null)
    setSuccess(null)
    try {
      const res = await fetch('/api/dashboard/log-workout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to log workout')
      setSuccess(`${data.logged.type} — ${data.logged.duration} min`)
      setText('')
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
        <span className="text-lg">🏃</span>
        <h2 className="section-title mb-0">Log Workout</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. 45 min yoga class this morning"
          className="input-base focus:ring-sky-400 resize-none flex-1 min-h-[80px]"
          rows={3}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="btn bg-sky-500 text-white hover:bg-sky-600 w-full"
        >
          {loading ? 'Logging…' : 'Log Workout'}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {success && (
          <p className="text-xs text-sky-600 mt-1 flex items-start gap-1">
            <span>✓</span> <span>Logged: {success}</span>
          </p>
        )}
      </form>
    </div>
  )
}
