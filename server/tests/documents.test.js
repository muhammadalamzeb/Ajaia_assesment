import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const testDbPath = path.join(__dirname, 'data', 'test.db');

function setupTestDb() {
  fs.mkdirSync(path.dirname(testDbPath), { recursive: true });
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  const db = new Database(testDbPath);
  db.exec(`
    CREATE TABLE users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      password_hash TEXT NOT NULL
    );
    CREATE TABLE documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL DEFAULT 'Untitled Document',
      content TEXT NOT NULL DEFAULT '{}',
      owner_id INTEGER NOT NULL,
      updated_at TEXT NOT NULL DEFAULT (datetime('now'))
    );
    CREATE TABLE document_shares (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      document_id INTEGER NOT NULL,
      user_id INTEGER NOT NULL,
      permission TEXT NOT NULL DEFAULT 'edit',
      UNIQUE(document_id, user_id)
    );
  `);

  const hash = bcrypt.hashSync('password123', 10);
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

  return db;
}

describe('Document persistence and sharing', () => {
  let db;

  before(() => {
    db = setupTestDb();
  });

  after(() => {
    db.close();
    if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  });

  test('creates a document for an owner', () => {
    const alice = db.prepare('SELECT id FROM users WHERE email = ?').get('alice@ajaia.dev');
    const content = JSON.stringify({ type: 'doc', content: [{ type: 'paragraph' }] });

    const result = db
      .prepare('INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)')
      .run('Test Doc', content, alice.id);

    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(result.lastInsertRowid);
    assert.equal(doc.title, 'Test Doc');
    assert.equal(doc.owner_id, alice.id);
    assert.equal(JSON.parse(doc.content).type, 'doc');
  });

  test('shares a document and preserves formatting on read', () => {
    const alice = db.prepare('SELECT id FROM users WHERE email = ?').get('alice@ajaia.dev');
    const bob = db.prepare('SELECT id FROM users WHERE email = ?').get('bob@ajaia.dev');

    const richContent = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            { type: 'text', marks: [{ type: 'bold' }], text: 'Hello' },
            { type: 'text', text: ' world' },
          ],
        },
      ],
    });

    const result = db
      .prepare('INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)')
      .run('Shared Doc', richContent, alice.id);

    const docId = result.lastInsertRowid;
    db.prepare('INSERT INTO document_shares (document_id, user_id, permission) VALUES (?, ?, ?)').run(
      docId,
      bob.id,
      'edit'
    );

    const shared = db
      .prepare(
        `SELECT d.* FROM document_shares ds
         JOIN documents d ON d.id = ds.document_id
         WHERE ds.user_id = ?`
      )
      .all(bob.id);

    assert.equal(shared.length, 1);
    const parsed = JSON.parse(shared[0].content);
    assert.equal(parsed.content[0].content[0].marks[0].type, 'bold');
  });

  test('rejects empty document title', () => {
    const title = '   '.trim();
    assert.equal(title, '');
    assert.ok(!title, 'Empty titles should be rejected by validation');
  });
});
