function parseInline(text) {
  const nodes = [];
  const pattern = /(\*\*\*(.+?)\*\*\*|\*\*(.+?)\*\*|\*(.+?)\*|__(.+?)__|_(.+?)_)/g;
  let last = 0;
  let match;

  while ((match = pattern.exec(text)) !== null) {
    if (match.index > last) {
      nodes.push({ type: 'text', text: text.slice(last, match.index) });
    }

    if (match[2]) {
      nodes.push({
        type: 'text',
        marks: [{ type: 'bold' }, { type: 'italic' }],
        text: match[2],
      });
    } else if (match[3]) {
      nodes.push({ type: 'text', marks: [{ type: 'bold' }], text: match[3] });
    } else if (match[4]) {
      nodes.push({ type: 'text', marks: [{ type: 'italic' }], text: match[4] });
    } else if (match[5]) {
      nodes.push({ type: 'text', marks: [{ type: 'underline' }], text: match[5] });
    } else if (match[6]) {
      nodes.push({ type: 'text', marks: [{ type: 'italic' }], text: match[6] });
    }

    last = match.index + match[0].length;
  }

  if (last < text.length) {
    nodes.push({ type: 'text', text: text.slice(last) });
  }

  return nodes.length ? nodes : [{ type: 'text', text: text || '' }];
}

export function textToTipTap(text) {
  const lines = text.replace(/\r\n/g, '\n').split('\n');
  const content = [];
  let i = 0;

  while (i < lines.length) {
    const line = lines[i];

    if (!line.trim()) {
      content.push({ type: 'paragraph' });
      i++;
      continue;
    }

    const heading = line.match(/^(#{1,3})\s+(.+)$/);
    if (heading) {
      content.push({
        type: 'heading',
        attrs: { level: heading[1].length },
        content: parseInline(heading[2]),
      });
      i++;
      continue;
    }

    if (/^[-*]\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^[-*]\s+/.test(lines[i])) {
        items.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: parseInline(lines[i].replace(/^[-*]\s+/, '')),
            },
          ],
        });
        i++;
      }
      content.push({ type: 'bulletList', content: items });
      continue;
    }

    if (/^\d+\.\s+/.test(line)) {
      const items = [];
      while (i < lines.length && /^\d+\.\s+/.test(lines[i])) {
        items.push({
          type: 'listItem',
          content: [
            {
              type: 'paragraph',
              content: parseInline(lines[i].replace(/^\d+\.\s+/, '')),
            },
          ],
        });
        i++;
      }
      content.push({ type: 'orderedList', content: items });
      continue;
    }

    content.push({ type: 'paragraph', content: parseInline(line) });
    i++;
  }

  return JSON.stringify({
    type: 'doc',
    content: content.length ? content : [{ type: 'paragraph' }],
  });
}

export function tipTapToMarkdown(doc) {
  if (!doc?.content) return '';

  const lines = [];

  function walk(nodes, listPrefix = '') {
    for (const node of nodes) {
      if (node.type === 'paragraph') {
        lines.push(listPrefix + inlineToMd(node.content));
      } else if (node.type === 'heading') {
        const level = node.attrs?.level || 1;
        lines.push(`${'#'.repeat(level)} ${inlineToMd(node.content)}`);
      } else if (node.type === 'bulletList') {
        for (const item of node.content || []) {
          const para = item.content?.find((n) => n.type === 'paragraph');
          lines.push(`- ${inlineToMd(para?.content)}`);
        }
      } else if (node.type === 'orderedList') {
        let n = 1;
        for (const item of node.content || []) {
          const para = item.content?.find((nd) => nd.type === 'paragraph');
          lines.push(`${n}. ${inlineToMd(para?.content)}`);
          n++;
        }
      }
    }
  }

  function inlineToMd(nodes = []) {
    return nodes
      .map((n) => {
        if (!n.text) return '';
        let t = n.text;
        const marks = n.marks?.map((m) => m.type) || [];
        if (marks.includes('bold') && marks.includes('italic')) t = `***${t}***`;
        else if (marks.includes('bold')) t = `**${t}**`;
        else if (marks.includes('italic')) t = `*${t}*`;
        else if (marks.includes('underline')) t = `__${t}__`;
        return t;
      })
      .join('');
  }

  walk(doc.content);
  return lines.join('\n');
}
