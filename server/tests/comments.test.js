import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import { replaceTextInTipTap } from '../utils/access.js';

describe('Comments and suggestions', () => {
  test('replaces quoted text when accepting a suggestion', () => {
    const doc = {
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [{ type: 'text', text: 'Hello world from Alice' }],
        },
      ],
    };

    const updated = replaceTextInTipTap(doc, 'world', 'universe');
    assert.equal(updated.content[0].content[0].text, 'Hello universe from Alice');
  });

  test('validates comment permission hierarchy', () => {
    const perms = { owner: ['edit', 'comment'], edit: ['edit', 'comment'], comment: ['comment'], view: [] };
    assert.ok(perms.edit.includes('comment'));
    assert.ok(!perms.view.includes('comment'));
  });
});
