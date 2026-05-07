import { Client } from '@notionhq/client'

const notion = new Client({ auth: process.env.NOTION_API_KEY })

// Check-in state is stored as a JSON string in the User Settings page
// under a property called "Active Checkin". This is lightweight and
// avoids needing a separate state database for a single-user app.

async function getStateBlock() {
  const page = await notion.blocks.children.list({
    block_id: process.env.NOTION_USER_SETTINGS_PAGE_ID,
  })
  return page.results.find(
    (b) => b.type === 'paragraph' && b.paragraph.rich_text?.[0]?.plain_text?.startsWith('__CHECKIN_STATE__:')
  )
}

export async function getCheckinState(chatId) {
  try {
    const block = await getStateBlock()
    if (!block) return null
    const raw = block.paragraph.rich_text[0].plain_text.replace('__CHECKIN_STATE__:', '')
    const state = JSON.parse(raw)
    if (String(state.chatId) !== String(chatId)) return null
    return state
  } catch {
    return null
  }
}

export async function setCheckinState(chatId, questionIndex, weekStart) {
  const payload = JSON.stringify({ chatId: String(chatId), questionIndex, weekStart })
  const text = `__CHECKIN_STATE__:${payload}`

  const existing = await getStateBlock()
  if (existing) {
    await notion.blocks.update({
      block_id: existing.id,
      paragraph: { rich_text: [{ type: 'text', text: { content: text } }] },
    })
  } else {
    await notion.blocks.children.append({
      block_id: process.env.NOTION_USER_SETTINGS_PAGE_ID,
      children: [{ object: 'block', type: 'paragraph', paragraph: { rich_text: [{ type: 'text', text: { content: text } }] } }],
    })
  }
}

export async function advanceCheckinState(chatId, nextIndex) {
  const state = await getCheckinState(chatId)
  if (!state) return
  await setCheckinState(chatId, nextIndex, state.weekStart)
}

export async function clearCheckinState(chatId) {
  const block = await getStateBlock()
  if (!block) return
  await notion.blocks.update({
    block_id: block.id,
    paragraph: { rich_text: [] },
  })
}
