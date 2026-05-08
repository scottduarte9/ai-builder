'use client'

const TYPE_COLORS = {
  running: 'bg-sky-100 text-sky-700',
  yoga: 'bg-purple-100 text-purple-700',
  strength: 'bg-orange-100 text-orange-700',
  hiit: 'bg-red-100 text-red-700',
  walking: 'bg-teal-100 text-teal-700',
  cycling: 'bg-yellow-100 text-yellow-700',
  swimming: 'bg-blue-100 text-blue-700',
}

function typeColor(type) {
  const key = (type || '').toLowerCase()
  for (const [k, v] of Object.entries(TYPE_COLORS)) {
    if (key.includes(k)) return v
  }
  return 'bg-stone-100 text-stone-600'
}

export default function RecentWorkouts({ workouts }) {
  return (
    <div className="card">
      <div className="flex items-center gap-2 mb-4">
        <span className="text-lg">💪</span>
        <h2 className="section-title mb-0">Recent Workouts</h2>
      </div>
      {workouts.length === 0 ? (
        <div className="text-center py-6">
          <p className="text-stone-400 text-sm">No workouts logged yet.</p>
        </div>
      ) : (
        <ul className="space-y-2">
          {workouts.map((w, i) => (
            <li key={i} className="flex items-center justify-between py-2.5 px-3 rounded-xl hover:bg-stone-50 transition-colors">
              <div className="flex items-center gap-3">
                <span className={`text-xs font-medium px-2.5 py-1 rounded-lg ${typeColor(w.type)}`}>
                  {w.type || 'Workout'}
                </span>
                {w.notes && (
                  <span className="text-xs text-stone-400 hidden sm:block truncate max-w-[160px]">{w.notes}</span>
                )}
              </div>
              <div className="text-right shrink-0 ml-3">
                <p className="text-sm font-medium text-gray-700">{w.duration} min</p>
                <p className="text-xs text-stone-400">{w.date}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
