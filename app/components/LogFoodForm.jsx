'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function LogFoodForm() {
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
      const res = await fetch('/api/dashboard/log-food', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to log food')
      setSuccess(data.logged.description)
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
        <span className="text-lg">🥗</span>
        <h2 className="section-title mb-0">Log Food</h2>
      </div>
      <form onSubmit={handleSubmit} className="flex flex-col gap-3 flex-1">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. Greek yogurt with berries and granola for breakfast"
          className="input-base focus:ring-emerald-400 resize-none flex-1 min-h-[80px]"
          rows={3}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="btn bg-emerald-500 text-white hover:bg-emerald-600 w-full"
        >
          {loading ? 'Logging…' : 'Log Food'}
        </button>
        {error && <p className="text-xs text-red-500 mt-1">{error}</p>}
        {success && (
          <p className="text-xs text-emerald-600 mt-1 flex items-start gap-1">
            <span>✓</span> <span>Logged: {success}</span>
          </p>
        )}
      </form>
    </div>
  )
}
