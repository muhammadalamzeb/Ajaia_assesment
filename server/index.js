import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import authRoutes from './routes/auth.js';
import documentRoutes from './routes/documents.js';
import db from './db.js';
import bcrypt from 'bcryptjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use('/api/auth', authRoutes);
app.use('/api/documents', documentRoutes);

const clientDist = path.join(__dirname, '..', 'client', 'dist');
if (fs.existsSync(clientDist)) {
  app.use(express.static(clientDist));
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next();
    res.sendFile(path.join(clientDist, 'index.html'), (err) => {
      if (err) res.status(404).json({ error: 'Not found' });
    });
  });
}

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(500).json({ error: 'Internal server error' });
});

function ensureSeeded() {
  const count = db.prepare('SELECT COUNT(*) AS c FROM users').get().c;
  if (count === 0) {
    const users = [
      { email: 'alice@ajaia.dev', name: 'Alice Chen', password: 'password123' },
      { email: 'bob@ajaia.dev', name: 'Bob Rivera', password: 'password123' },
      { email: 'carol@ajaia.dev', name: 'Carol Kim', password: 'password123' },
    ];
    const insert = db.prepare(
      'INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)'
    );
    for (const u of users) {
      insert.run(u.email, u.name, bcrypt.hashSync(u.password, 10));
    }
    console.log('Auto-seeded demo users on first run.');
  }
}

ensureSeeded();

const server = app.listen(PORT, () => {
  console.log(`Ajaia Docs server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
  if (err.code === 'EADDRINUSE') {
    console.error(`Port ${PORT} is already in use. Stop the other process or set PORT env variable.`);
    console.error('Windows: netstat -ano | findstr :3001  then  taskkill /PID <pid> /F');
  } else {
    console.error(err);
  }
  process.exit(1);
});
