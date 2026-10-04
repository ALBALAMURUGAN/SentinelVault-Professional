import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const root = path.resolve(__dirname, '..');
const app = express();
const PORT = process.env.PORT || 4000;

app.use(express.json());
app.use(express.static(root));
app.get('/api/health', (_req, res) => res.json({ status: 'ok', service: 'SentinelVault' }));
app.get('*', (_req, res) => res.sendFile(path.join(root, 'index.html')));

app.listen(PORT, () => console.log(`SentinelVault server running on http://localhost:${PORT}`));
