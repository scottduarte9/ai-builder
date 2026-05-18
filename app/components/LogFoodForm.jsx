'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

const MEAL_ICONS = { Breakfast: '🍳', Lunch: '🥗', Dinner: '🍽️', Snack: '🍎' }

export default function LogFoodForm({ initialLogs = [] }) {
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [success, setSuccess] = useState(null)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState({})
  const [editLoading, setEditLoading] = useState(false)
  const [deletingId, setDeletingId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)
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

  function startEdit(log) {
    setEditingId(log.id)
    setEditForm({
      description: log.description || '',
      protein: log.protein,
      carbs: log.carbs,
      fat: log.fat,
      calories: log.calories,
    })
  }

  async function deleteLog(log) {
    setDeletingId(log.id)
    setConfirmDeleteId(null)
    try {
      await fetch('/api/dashboard/log-food', {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: log.id }),
      })
      router.refresh()
    } catch {
      // silent
    } finally {
      setDeletingId(null)
    }
  }

  async function saveEdit(log) {
    setEditLoading(true)
    try {
      const res = await fetch('/api/dashboard/log-food', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageId: log.id, ...editForm }),
      })
      if (!res.ok) throw new Error('Failed to update')
      setEditingId(null)
      router.refresh()
    } catch {
      // silent
    } finally {
      setEditLoading(false)
    }
  }

  return (
    <div className="card flex flex-col">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">🥗</span>
        <h2 className="section-title mb-0">Log Food</h2>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-3">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="e.g. 150g chicken breast, 1 cup rice, side salad for lunch"
          className="input-base focus:ring-emerald-400 resize-none min-h-[72px]"
          rows={3}
        />
        <button
          type="submit"
          disabled={loading || !text.trim()}
          className="btn bg-emerald-500 text-white hover:bg-emerald-600 w-full"
        >
          {loading ? 'Logging…' : 'Log Food'}
        </button>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {success && (
          <p className="text-xs text-emerald-600 flex items-start gap-1">
            <span>✓</span><span>Logged: {success}</span>
          </p>
        )}
      </form>

      {initialLogs.length > 0 && (
        <div className="mt-4 space-y-2">
          <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">Today's logs</p>
          {initialLogs.map((log) => (
            <div key={log.id} className="bg-stone-50 border border-stone-100 rounded-xl p-3">
              {editingId === log.id ? (
                <div className="space-y-2">
                  <input
                    className="input-base text-xs w-full"
                    value={editForm.description}
                    onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                    placeholder="Description"
                  />
                  <div className="grid grid-cols-4 gap-1.5">
                    {[
                      { key: 'protein', label: 'Protein' },
                      { key: 'carbs', label: 'Carbs' },
                      { key: 'fat', label: 'Fat' },
                      { key: 'calories', label: 'Cal' },
                    ].map(({ key, label }) => (
                      <div key={key}>
                        <label className="text-xs text-stone-400">{label}</label>
                        <input
                          type="number"
                          className="input-base text-xs w-full mt-0.5 px-2 py-1"
                          value={editForm[key]}
                          onChange={(e) => setEditForm({ ...editForm, [key]: Number(e.target.value) })}
                        />
                      </div>
                    ))}
                  </div>
                  <div className="flex gap-2 pt-1">
                    <button
                      onClick={() => saveEdit(log)}
                      disabled={editLoading}
                      className="btn bg-emerald-500 text-white hover:bg-emerald-600 text-xs px-3 py-1.5"
                    >
                      {editLoading ? 'Saving…' : 'Save'}
                    </button>
                    <button
                      onClick={() => setEditingId(null)}
                      className="btn text-xs px-3 py-1.5"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <div className="flex items-start gap-2">
                  <span className="text-base shrink-0 mt-0.5">{MEAL_ICONS[log.meal] || '🍴'}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide">{log.meal}</p>
                    <p className="text-sm text-gray-800 leading-snug">{log.description}</p>
                    <p className="text-xs text-stone-400 mt-0.5">
                      P: {log.protein}g · C: {log.carbs}g · F: {log.fat}g · {log.calories} cal
                    </p>
                  </div>
                  <div className="flex items-center gap-1 shrink-0 mt-0.5">
                    {confirmDeleteId === log.id ? (
                      <>
                        <button
                          onClick={() => deleteLog(log)}
                          disabled={deletingId === log.id}
                          className="text-xs bg-red-500 text-white rounded-lg px-2 py-1 font-medium hover:bg-red-600"
                        >
                          {deletingId === log.id ? '…' : 'Delete'}
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(null)}
                          className="text-xs text-stone-500 bg-stone-100 rounded-lg px-2 py-1 font-medium hover:bg-stone-200"
                        >
                          Keep
                        </button>
                      </>
                    ) : (
                      <>
                        <button
                          onClick={() => startEdit(log)}
                          className="text-stone-300 hover:text-stone-500 transition-colors text-sm"
                          title="Edit entry"
                        >
                          ✏️
                        </button>
                        <button
                          onClick={() => setConfirmDeleteId(log.id)}
                          className="text-stone-300 hover:text-red-400 transition-colors text-sm"
                          title="Delete entry"
                        >
                          🗑️
                        </button>
                      </>
                    )}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
