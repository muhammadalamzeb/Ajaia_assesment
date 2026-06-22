import PDFDocument from 'pdfkit';

export function markdownToPdfBuffer(title, markdown) {
  return new Promise((resolve, reject) => {
    const doc = new PDFDocument({ margin: 56, size: 'A4' });
    const chunks = [];

    doc.on('data', (chunk) => chunks.push(chunk));
    doc.on('end', () => resolve(Buffer.concat(chunks)));
    doc.on('error', reject);

    doc.fontSize(20).fillColor('#0f172a').text(title || 'Untitled', { align: 'left' });
    doc.moveDown(0.5);
    doc
      .moveTo(doc.x, doc.y)
      .lineTo(doc.page.width - 56, doc.y)
      .strokeColor('#e2e8f0')
      .stroke();
    doc.moveDown(1);
    doc.fontSize(11).fillColor('#334155').text(markdown || '', {
      align: 'left',
      lineGap: 4,
    });
    doc.end();
  });
}
