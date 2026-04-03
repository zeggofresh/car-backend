import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Serve static files from root directory (for .docx and other assets)
app.use(express.static(__dirname));

// Request logging
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
  next();
});

// Simulate Vercel routing
app.all('/api/*', async (req, res) => {
  try {
    const apiPath = req.path.replace('/api/', '');
    const pathParts = apiPath.split('/').filter(Boolean);
    
    let currentDir = path.join(__dirname, 'api');
    let filePath = '';
    let params: Record<string, string> = {};

    for (let i = 0; i < pathParts.length; i++) {
      const part = pathParts[i];
      const isLast = i === pathParts.length - 1;

      // Check if current part is a file (catch-all handler)
      if (fs.existsSync(path.join(currentDir, part + '.ts')) && !fs.statSync(path.join(currentDir, part + '.ts')).isDirectory()) {
        filePath = path.join(currentDir, part + '.ts');
        // If it's not the last part, the rest are sub-paths
        break;
      }

      if (isLast) {
        if (fs.existsSync(path.join(currentDir, part, 'index.ts'))) {
          filePath = path.join(currentDir, part, 'index.ts');
        } else {
          // Check for dynamic file
          const files = fs.readdirSync(currentDir);
          const dynamicFile = files.find(f => f.startsWith('[') && f.endsWith('].ts'));
          if (dynamicFile) {
            filePath = path.join(currentDir, dynamicFile);
            const paramName = dynamicFile.slice(1, -4);
            params[paramName] = part;
          }
        }
      } else {
        if (fs.existsSync(path.join(currentDir, part)) && fs.statSync(path.join(currentDir, part)).isDirectory()) {
          currentDir = path.join(currentDir, part);
        } else {
          // Check for dynamic folder
          const items = fs.readdirSync(currentDir);
          const dynamicDir = items.find(d => d.startsWith('[') && d.endsWith(']') && fs.statSync(path.join(currentDir, d)).isDirectory());
          if (dynamicDir) {
            currentDir = path.join(currentDir, dynamicDir);
            const paramName = dynamicDir.slice(1, -1);
            params[paramName] = part;
          } else {
            break;
          }
        }
      }
    }

    if (!filePath) {
      return res.status(404).json({ message: 'API route not found' });
    }

    // Inject params into req.query
    req.query = { ...req.query, ...params };

    // Convert to file:// URL for Windows ESM compatibility
    const module = await import(pathToFileURL(filePath).href);
    const handler = module.default;

    if (typeof handler !== 'function') {
      return res.status(500).json({ message: 'Handler is not a function' });
    }

    await handler(req, res);
  } catch (error) {
    console.error('Local dev server error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
});

const PORT = 3001;

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
