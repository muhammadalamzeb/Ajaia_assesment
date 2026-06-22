import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import request from 'supertest';
import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.join(__dirname, 'data', 'api-test.db');

let app;
let aliceToken;
let bobToken;
let testDb;

describe('API integration', () => {
  before(async () => {
    fs.mkdirSync(path.dirname(testDbPath), { recursive: true });
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

    process.env.DATABASE_PATH = testDbPath;
    process.env.JWT_SECRET = 'test-secret';

    await import('../db.js');

    const { default: db } = await import('../db.js');
    testDb = db;
    const hash = bcrypt.hashSync('password123', 10);
    db.prepare('DELETE FROM document_versions').run();
    db.prepare('DELETE FROM document_shares').run();
    db.prepare('DELETE FROM documents').run();
    db.prepare('DELETE FROM users').run();
    db.prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)').run(
      'alice@ajaia.dev',
      'Alice',
      hash
    );
    db.prepare('INSERT INTO users (email, name, password_hash) VALUES (?, ?, ?)').run(
      'bob@ajaia.dev',
      'Bob',
      hash
    );

    const authRoutes = (await import('../routes/auth.js')).default;
    const documentRoutes = (await import('../routes/documents.js')).default;

    const testApp = express();
    testApp.use(cors());
    testApp.use(express.json({ limit: '2mb' }));
    testApp.use('/api/auth', authRoutes);
    testApp.use('/api/documents', documentRoutes);
    app = testApp;

    const aliceRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'alice@ajaia.dev', password: 'password123' });
    aliceToken = aliceRes.body.token;

    const bobRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'bob@ajaia.dev', password: 'password123' });
    bobToken = bobRes.body.token;
  });

  after(() => {
    if (testDb) testDb.close();
    try {
      if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
    } catch {
      // Windows file lock — safe to ignore in local dev
    }
  });

  test('creates and retrieves a document', async () => {
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'API Test Doc' });

    assert.equal(createRes.status, 201);
    assert.equal(createRes.body.title, 'API Test Doc');

    const getRes = await request(app)
      .get(`/api/documents/${createRes.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`);

    assert.equal(getRes.status, 200);
    assert.equal(getRes.body.permission, 'owner');
  });

  test('shares document and enforces view-only edit block', async () => {
    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'Shared Doc' });

    const docId = createRes.body.id;

    await request(app)
      .post(`/api/documents/${docId}/share`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ email: 'bob@ajaia.dev', permission: 'view' });

    const bobList = await request(app)
      .get('/api/documents')
      .set('Authorization', `Bearer ${bobToken}`);

    assert.ok(bobList.body.shared.some((d) => d.id === docId));
    assert.equal(bobList.body.shared.find((d) => d.id === docId).permission, 'view');

    const editAttempt = await request(app)
      .put(`/api/documents/${docId}`)
      .set('Authorization', `Bearer ${bobToken}`)
      .send({ title: 'Hacked' });

    assert.equal(editAttempt.status, 403);
  });

  test('exports document as markdown', async () => {
    const content = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Export Me' }] },
      ],
    };

    const createRes = await request(app)
      .post('/api/documents')
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ title: 'Export Test' });

    await request(app)
      .put(`/api/documents/${createRes.body.id}`)
      .set('Authorization', `Bearer ${aliceToken}`)
      .send({ content });

    const exportRes = await request(app)
      .get(`/api/documents/${createRes.body.id}/export`)
      .set('Authorization', `Bearer ${aliceToken}`);

    assert.equal(exportRes.status, 200);
    assert.match(exportRes.text, /# Export Me/);
  });
});
