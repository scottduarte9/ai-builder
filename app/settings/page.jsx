import { getUserSettings } from '@/lib/notion'
import SettingsForm from '@/app/components/SettingsForm'

export default async function SettingsPage() {
  const settings = await getUserSettings()
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <SettingsForm initialSettings={settings} />
      </div>
    </main>
  )
}
