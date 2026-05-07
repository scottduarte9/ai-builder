'use client'

export default function RecentWorkouts({ workouts }) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold mb-4">Recent Workouts</h2>
      {workouts.length === 0 ? (
        <p className="text-gray-400 text-sm">No workouts logged yet.</p>
      ) : (
        <ul className="divide-y divide-gray-50">
          {workouts.map((w, i) => (
            <li key={i} className="py-3 flex items-start justify-between">
              <div>
                <p className="text-sm font-medium">{w.type || 'Workout'}</p>
                {w.notes && <p className="text-xs text-gray-400 mt-0.5">{w.notes}</p>}
              </div>
              <div className="text-right ml-4 shrink-0">
                <p className="text-sm text-gray-600">{w.duration} min</p>
                <p className="text-xs text-gray-400">{w.date}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}
