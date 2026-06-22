import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import { textToTipTap, tipTapToMarkdown } from '../utils/markdown.js';

describe('Markdown conversion', () => {
  test('parses headings, lists, and inline formatting', () => {
    const md = `# Title\n\n**Bold** and *italic*\n\n- item one\n- item two\n\n1. first\n2. second`;
    const json = JSON.parse(textToTipTap(md));

    assert.equal(json.type, 'doc');
    assert.equal(json.content[0].type, 'heading');
    assert.equal(json.content[0].attrs.level, 1);

    const boldPara = json.content.find(
      (n) => n.type === 'paragraph' && n.content?.some((t) => t.marks?.some((m) => m.type === 'bold'))
    );
    assert.ok(boldPara);

    const bullet = json.content.find((n) => n.type === 'bulletList');
    assert.equal(bullet.content.length, 2);

    const ordered = json.content.find((n) => n.type === 'orderedList');
    assert.equal(ordered.content.length, 2);
  });

  test('exports TipTap JSON back to markdown', () => {
    const doc = {
      type: 'doc',
      content: [
        { type: 'heading', attrs: { level: 1 }, content: [{ type: 'text', text: 'Hello' }] },
        {
          type: 'paragraph',
          content: [{ type: 'text', marks: [{ type: 'bold' }], text: 'World' }],
        },
      ],
    };

    const md = tipTapToMarkdown(doc);
    assert.match(md, /# Hello/);
    assert.match(md, /\*\*World\*\*/);
  });
});
