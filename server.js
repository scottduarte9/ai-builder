const http = require('http');
const fs = require('fs');
const path = require('path');
const { Client } = require('@notionhq/client');

require('dotenv').config({ path: path.join(__dirname, '.env.local') });

const notion = new Client({ auth: process.env.NOTION_TOKEN });
const DB_ID = process.env.NOTION_DATABASE_ID;
const PORT = 3000;

function getText(prop) {
  if (!prop) return '';
  if (prop.type === 'title') return prop.title.map(t => t.plain_text).join('');
  if (prop.type === 'rich_text') return prop.rich_text.map(t => t.plain_text).join('');
  return '';
}
function getSelect(prop) { return prop?.select?.name || ''; }

const server = http.createServer(async (req, res) => {
  const url = new URL(req.url, `http://localhost:${PORT}`);

  // API routes
  if (url.pathname === '/api/roadmap') {
    res.setHeader('Content-Type', 'application/json');
    res.setHeader('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') { res.writeHead(200); return res.end(); }

    if (req.method === 'GET') {
      const response = await notion.databases.query({ database_id: DB_ID });
      const cards = response.results.map(page => ({
        notionId: page.id,
        name: getText(page.properties.Name),
        status: getSelect(page.properties.Status),
        priority: getSelect(page.properties.Priority),
        description: getText(page.properties.Description)
      }));
      res.writeHead(200);
      return res.end(JSON.stringify(cards));
    }

    if (req.method === 'PATCH') {
      let body = '';
      req.on('data', d => body += d);
      req.on('end', async () => {
        const { id, status } = JSON.parse(body);
        await notion.pages.update({
          page_id: id,
          properties: { Status: { select: { name: status } } }
        });
        res.writeHead(200);
        res.end(JSON.stringify({ ok: true }));
      });
      return;
    }
  }

  // Serve HTML
  const filePath = (url.pathname === '/' || url.pathname === '/ai-builder-dashboard.html')
    ? path.join(__dirname, 'ai-builder-dashboard.html')
    : path.join(__dirname, url.pathname.slice(1));

  fs.readFile(filePath, (err, data) => {
    if (err) { res.writeHead(404); return res.end('Not found'); }
    const ext = path.extname(filePath);
    const types = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };
    res.writeHead(200, { 'Content-Type': types[ext] || 'text/plain' });
    res.end(data);
  });
});

server.listen(PORT, () => console.log(`Running at http://localhost:${PORT}`));
