import bcrypt from 'bcryptjs';
import db from './db.js';

const users = [
  { email: 'alice@ajaia.dev', name: 'Alice Chen', password: 'password123' },
  { email: 'bob@ajaia.dev', name: 'Bob Rivera', password: 'password123' },
  { email: 'carol@ajaia.dev', name: 'Carol Kim', password: 'password123' },
];

const insertUser = db.prepare(
  'INSERT OR IGNORE INTO users (email, name, password_hash) VALUES (?, ?, ?)'
);

for (const user of users) {
  const hash = bcrypt.hashSync(user.password, 10);
  insertUser.run(user.email, user.name, hash);
}

const alice = db.prepare('SELECT id FROM users WHERE email = ?').get('alice@ajaia.dev');
const bob = db.prepare('SELECT id FROM users WHERE email = ?').get('bob@ajaia.dev');

if (alice) {
  const existing = db.prepare('SELECT id FROM documents WHERE owner_id = ?').get(alice.id);
  if (!existing) {
    const welcomeContent = JSON.stringify({
      type: 'doc',
      content: [
        {
          type: 'heading',
          attrs: { level: 1 },
          content: [{ type: 'text', text: 'Welcome to Ajaia Docs' }],
        },
        {
          type: 'paragraph',
          content: [
            { type: 'text', text: 'This is a sample document owned by ' },
            { type: 'text', marks: [{ type: 'bold' }], text: 'Alice' },
            { type: 'text', text: '. Try editing, sharing with Bob, or uploading a .txt/.md file.' },
          ],
        },
        {
          type: 'bulletList',
          content: [
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Bold, italic, underline formatting' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Headings and lists' }],
                },
              ],
            },
            {
              type: 'listItem',
              content: [
                {
                  type: 'paragraph',
                  content: [{ type: 'text', text: 'Document sharing between users' }],
                },
              ],
            },
          ],
        },
      ],
    });

    const result = db
      .prepare('INSERT INTO documents (title, content, owner_id) VALUES (?, ?, ?)')
      .run('Getting Started', welcomeContent, alice.id);

    if (bob) {
      db.prepare(
        'INSERT OR IGNORE INTO document_shares (document_id, user_id, permission) VALUES (?, ?, ?)'
      ).run(result.lastInsertRowid, bob.id, 'edit');
    }
  }
}

console.log('Database seeded with demo users and sample document.');
console.log('  alice@ajaia.dev / password123');
console.log('  bob@ajaia.dev   / password123');
console.log('  carol@ajaia.dev / password123');
