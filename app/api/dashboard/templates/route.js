import { getMealTemplates, createMealTemplate, deleteMealTemplate } from '@/lib/notion'

export async function GET() {
  try {
    const templates = await getMealTemplates()
    return Response.json({ templates })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function POST(req) {
  try {
    const body = await req.json()
    const { name, meal, description, protein, carbs, fat, calories } = body
    if (!name || !meal) return Response.json({ error: 'name and meal required' }, { status: 400 })
    await createMealTemplate({ name, meal, description, protein, carbs, fat, calories })
    const templates = await getMealTemplates()
    return Response.json({ ok: true, templates })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}

export async function DELETE(req) {
  try {
    const { pageId } = await req.json()
    if (!pageId) return Response.json({ error: 'pageId required' }, { status: 400 })
    await deleteMealTemplate(pageId)
    const templates = await getMealTemplates()
    return Response.json({ ok: true, templates })
  } catch (err) {
    return Response.json({ error: err.message }, { status: 500 })
  }
}
