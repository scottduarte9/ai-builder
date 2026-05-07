'use client'

function Bar({ label, current, target, color }) {
  const pct = target > 0 ? Math.min(100, Math.round((current / target) * 100)) : 0
  return (
    <div className="mb-4">
      <div className="flex justify-between text-sm mb-1">
        <span className="font-medium">{label}</span>
        <span className="text-gray-500">
          {current}g / {target}g
        </span>
      </div>
      <div className="w-full bg-gray-100 rounded-full h-3">
        <div
          className={`h-3 rounded-full transition-all ${color}`}
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="text-xs text-gray-400 mt-0.5 text-right">{pct}%</div>
    </div>
  )
}

export default function MacroProgress({ totals, targets }) {
  return (
    <section className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
      <h2 className="text-lg font-semibold mb-4">Today's Macros</h2>
      <Bar label="Protein" current={totals.protein} target={targets.protein} color="bg-blue-500" />
      <Bar label="Carbs" current={totals.carbs} target={targets.carbs} color="bg-yellow-400" />
      <Bar label="Fat" current={totals.fat} target={targets.fat} color="bg-orange-400" />
      <div className="mt-2 pt-2 border-t border-gray-100">
        <div className="flex justify-between text-sm font-medium">
          <span>Calories</span>
          <span className="text-gray-600">
            {totals.calories} / {targets.calories} kcal
          </span>
        </div>
        <div className="w-full bg-gray-100 rounded-full h-3 mt-1">
          <div
            className="h-3 rounded-full bg-green-500 transition-all"
            style={{
              width: `${targets.calories > 0 ? Math.min(100, Math.round((totals.calories / targets.calories) * 100)) : 0}%`,
            }}
          />
        </div>
      </div>
    </section>
  )
}
