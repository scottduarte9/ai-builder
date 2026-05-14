import { getMealTemplates } from '@/lib/notion'
import TemplateList from '@/app/components/TemplateList'

export default async function TemplatesPage() {
  const templates = await getMealTemplates()
  return (
    <main className="min-h-screen bg-stone-50">
      <div className="max-w-2xl mx-auto px-4 py-6">
        <TemplateList initialTemplates={templates} />
      </div>
    </main>
  )
}
