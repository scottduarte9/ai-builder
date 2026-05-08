'use client'

const MACROS = [
  { key: 'protein', label: 'Protein', color: 'bg-violet-500', light: 'bg-violet-50', text: 'text-violet-600' },
  { key: 'carbs', label: 'Carbs', color: 'bg-amber-400', light: 'bg-amber-50', text: 'text-amber-600' },
  { key: 'fat', label: 'Fat', color: 'bg-orange-400', light: 'bg-orange-50', text: 'text-orange-600' },
]

function Bar({ label, current, target, color, light, text }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  const remaining = Math.max(0, target - current)
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700">{label}</span>
        <div className="flex items-center gap-2">
          <span className="text-sm text-gray-500">{current}<span className="text-stone-300 mx-0.5">/</span>{target}g</span>
          <span className={`text-xs font-semibold px-1.5 py-0.5 rounded-md ${light} ${text}`}>{pct}%</span>
        </div>
      </div>
      <div className="w-full bg-stone-100 rounded-full h-2.5 overflow-hidden">
        <div className={`h-2.5 rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      {remaining > 0 && (
        <p className="text-xs text-stone-400 mt-1">{remaining}g remaining</p>
      )}
    </div>
  )
}

export default function MacroProgress({ totals, targets }) {
  const calPct = targets.calories > 0 ? Math.min(100, Math.round((totals.calories / targets.calories) * 100)) : 0
  const calRemaining = Math.max(0, targets.calories - totals.calories)

  return (
    <div className="card">
      <div className="flex items-center justify-between mb-5">
        <h2 className="section-title mb-0">Today's Macros</h2>
        <div className="text-right">
          <p className="text-xl font-bold text-gray-900">{totals.calories}</p>
          <p className="text-xs text-stone-400">of {targets.calories} kcal</p>
        </div>
      </div>

      {/* Calorie bar */}
      <div className="mb-5 p-3 bg-emerald-50 rounded-xl">
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-sm font-semibold text-emerald-700">Calories</span>
          <span className="text-xs font-semibold text-emerald-600">{calPct}% — {calRemaining > 0 ? `${calRemaining} left` : 'goal reached!'}</span>
        </div>
        <div className="w-full bg-emerald-100 rounded-full h-3 overflow-hidden">
          <div className="h-3 rounded-full bg-emerald-500 transition-all duration-500" style={{ width: `${calPct}%` }} />
        </div>
      </div>

      <div className="space-y-4">
        {MACROS.map((m) => (
          <Bar
            key={m.key}
            label={m.label}
            current={totals[m.key]}
            target={targets[m.key]}
            color={m.color}
            light={m.light}
            text={m.text}
          />
        ))}
      </div>
    </div>
  )
}
