import BodyMeasurementForm from '@/app/components/BodyMeasurementForm'
import BodyFatChart from '@/app/components/BodyFatChart'

export default function BodyPage() {
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold text-gray-900">Body Composition</h1>
          <p className="text-xs text-stone-400 mt-0.5">Track body fat %, measurements, and weight over time</p>
        </div>
        <BodyMeasurementForm />
        <BodyFatChart />
      </div>
    </main>
  )
}
