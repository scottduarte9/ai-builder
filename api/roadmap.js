const { Client } = require('@notionhq/client');

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_DATABASE_ID;

function getText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title.map(t => t.plain_text).join('');
  if (prop.type === 'rich_text') return prop.rich_text.map(t => t.plain_text).join('');
  return '';
}

function getSelect(prop) {
  return prop?.select?.name || '';
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, PATCH, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();

  if (req.method === 'GET') {
    const response = await notion.databases.query({ database_id: DB_ID });
    const cards = response.results.map(page => ({
      notionId: page.id,
      name: getText(page.properties.Name),
      status: getSelect(page.properties.Status),
      priority: getSelect(page.properties.Priority),
      description: getText(page.properties.Description)
    }));
    return res.status(200).json(cards);
  }

  if (req.method === 'PATCH') {
    const { id, status } = req.body;
    if (!id || !status) return res.status(400).json({ error: 'id and status required' });
    await notion.pages.update({
      page_id: id,
      properties: { Status: { select: { name: status } } }
    });
    return res.status(200).json({ ok: true });
  }

  res.status(405).json({ error: 'Method not allowed' });
};
