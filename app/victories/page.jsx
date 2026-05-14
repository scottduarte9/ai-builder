import { getNSVLogs } from '@/lib/notion'
import NSVFeed from '@/app/components/NSVFeed'

export default async function VictoriesPage() {
  const victories = await getNSVLogs(20)
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <NSVFeed initialVictories={victories} />
      </div>
    </main>
  )
}
