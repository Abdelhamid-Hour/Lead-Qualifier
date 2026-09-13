import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

const localApiPlugin = () => ({
  name: 'local-api',
  configureServer(server) {
    server.middlewares.use(async (req, res, next) => {
      const getSaveDir = (requestedDir) => {
        let dir = requestedDir || path.join(process.cwd(), 'saved_leads');
        if (!fs.existsSync(dir)) {
          try {
            fs.mkdirSync(dir, { recursive: true });
          } catch (e) {
            dir = path.join(process.cwd(), 'saved_leads');
            if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
          }
        }
        return dir;
      };

      if (req.url === '/api/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const saveDir = getSaveDir(data.saveDirectory);
            const buffer = Buffer.from(data.fileData, 'base64');
            const fullPath = path.join(saveDir, data.fileName);
            fs.writeFileSync(fullPath, buffer);
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true, path: fullPath }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (req.url.startsWith('/api/list') && req.method === 'GET') {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const saveDir = getSaveDir(url.searchParams.get('dir'));
          const files = fs.readdirSync(saveDir).filter(f => f.endsWith('.xlsx'));
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ files }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      if (req.url.startsWith('/api/load') && req.method === 'GET') {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const fileName = url.searchParams.get('name');
          const saveDir = getSaveDir(url.searchParams.get('dir'));
          const fullPath = path.join(saveDir, fileName);
          const buffer = fs.readFileSync(fullPath);
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ fileData: buffer.toString('base64') }));
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }


      if (req.url === '/api/delete' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const saveDir = getSaveDir(data.saveDirectory);
            const fullPath = path.join(saveDir, data.fileName);
            if (fs.existsSync(fullPath)) {
              fs.unlinkSync(fullPath);
            }
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      if (req.url.startsWith('/api/coverage/load') && req.method === 'GET') {
        try {
          const url = new URL(req.url, `http://${req.headers.host}`);
          const saveDir = getSaveDir(url.searchParams.get('dir'));
          const fullPath = path.join(saveDir, 'coverage.json');
          if (fs.existsSync(fullPath)) {
            const content = fs.readFileSync(fullPath, 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(content);
          } else {
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ niches: [], countries: [] }));
          }
        } catch (e) {
          res.statusCode = 500;
          res.end(JSON.stringify({ error: e.message }));
        }
        return;
      }

      if (req.url === '/api/coverage/save' && req.method === 'POST') {
        let body = '';
        req.on('data', chunk => body += chunk.toString());
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const saveDir = getSaveDir(data.saveDirectory);
            const fullPath = path.join(saveDir, 'coverage.json');
            fs.writeFileSync(fullPath, JSON.stringify(data.coverage, null, 2), 'utf-8');
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ success: true }));
          } catch (e) {
            res.statusCode = 500;
            res.end(JSON.stringify({ error: e.message }));
          }
        });
        return;
      }

      next();
    });
  }
});

export default defineConfig({
  plugins: [react(), localApiPlugin()],
  server: {
    open: false
  }
})
