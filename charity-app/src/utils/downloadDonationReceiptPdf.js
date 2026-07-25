import { jsPDF } from 'jspdf';
import { calcDonationReceipt } from './donationReceipt.js';

const BRAND = {
  primary: [26, 110, 181],
  dark: [26, 46, 74],
  muted: [81, 97, 122],
  light: [147, 167, 188],
  soft: [227, 240, 251],
  border: [232, 238, 244],
  white: [255, 255, 255],
  green: [30, 158, 87],
};

function formatMoney(value) {
  const n = typeof value === 'number' ? value : Number(value) || 0;
  return `$${n.toFixed(2)}`;
}

export function receiptFileSlug(eventTitle = 'event') {
  return String(eventTitle)
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 48) || 'event';
}

function formatReceiptDate(date = new Date()) {
  return date.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

/**
 * Build and download a branded Charity Hub donation receipt PDF.
 */
export function downloadDonationReceiptPdf({
  donorName = 'Donor',
  publicName = 'Anonymous',
  eventTitle = 'Event',
  nonprofit = 'Nonprofit',
  amount = 25,
  tip,
  total,
  paymentRef,
  donationId,
} = {}) {
  const computed = calcDonationReceipt(amount);
  const donation = typeof amount === 'number' && amount > 0 ? amount : computed.donation;
  const tipValue = tip ?? computed.tip;
  const totalValue = total ?? computed.total;
  const issued = formatReceiptDate();
  const ref =
    paymentRef
    || (donationId != null ? `CH-${donationId}` : `CH-${Date.now().toString(36).toUpperCase()}`);

  const doc = new jsPDF({ unit: 'pt', format: 'letter' });
  const pageW = doc.internal.pageSize.getWidth();
  const marginX = 48;
  const contentW = pageW - marginX * 2;
  let y = 0;

  // Top brand bar
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, 0, pageW, 8, 'F');

  // Header band
  y = 36;
  doc.setFillColor(...BRAND.soft);
  doc.roundedRect(marginX, y, contentW, 72, 10, 10, 'F');

  doc.setTextColor(...BRAND.primary);
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(18);
  doc.text('Charity Hub', marginX + 20, y + 32);

  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text('Donation receipt', marginX + 20, y + 50);

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(11);
  doc.setTextColor(...BRAND.dark);
  doc.text('THANK YOU', pageW - marginX - 20, y + 32, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  doc.text(issued, pageW - marginX - 20, y + 50, { align: 'right' });

  y += 100;

  // Title
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(...BRAND.dark);
  doc.text('Official donation receipt', marginX, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.muted);
  doc.text(`Receipt reference  ·  ${ref}`, marginX, y);
  y += 28;

  // Meta panel
  const metaTop = y;
  const metaH = 96;
  doc.setDrawColor(...BRAND.border);
  doc.setFillColor(...BRAND.white);
  doc.setLineWidth(1);
  doc.roundedRect(marginX, metaTop, contentW, metaH, 8, 8, 'FD');

  const col1 = marginX + 18;
  const col2 = marginX + contentW / 2 + 8;
  const row1 = metaTop + 24;
  const row2 = metaTop + 58;

  const meta = [
    { x: col1, y: row1, label: 'Donor', value: donorName },
    { x: col2, y: row1, label: 'Shown publicly as', value: publicName },
    { x: col1, y: row2, label: 'Event', value: eventTitle },
    { x: col2, y: row2, label: 'Beneficiary nonprofit', value: nonprofit },
  ];

  meta.forEach(({ x, y: my, label, value }) => {
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(8);
    doc.setTextColor(...BRAND.light);
    doc.text(label.toUpperCase(), x, my);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(11);
    doc.setTextColor(...BRAND.dark);
    const lines = doc.splitTextToSize(String(value || '—'), contentW / 2 - 36);
    doc.text(lines.slice(0, 2), x, my + 16);
  });

  y = metaTop + metaH + 28;

  // Amounts section
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(12);
  doc.setTextColor(...BRAND.dark);
  doc.text('Payment summary', marginX, y);
  y += 14;

  const rows = [
    { label: 'Donation to nonprofit', value: formatMoney(donation), bold: false },
    { label: 'Tip to Charity Hub', value: formatMoney(tipValue), bold: false },
    { label: 'Total charged', value: formatMoney(totalValue), bold: true },
  ];

  const rowH = 28;
  rows.forEach((row, i) => {
    const ry = y + i * rowH;
    if (row.bold) {
      doc.setFillColor(...BRAND.soft);
      doc.roundedRect(marginX, ry, contentW, rowH, 6, 6, 'F');
    } else if (i < rows.length - 1) {
      doc.setDrawColor(...BRAND.border);
      doc.setLineWidth(0.6);
      doc.line(marginX, ry + rowH, marginX + contentW, ry + rowH);
    }
    doc.setFont('helvetica', row.bold ? 'bold' : 'normal');
    doc.setFontSize(row.bold ? 12 : 10);
    doc.setTextColor(...BRAND.dark);
    doc.text(row.label, marginX + 14, ry + 18);
    doc.text(row.value, marginX + contentW - 14, ry + 18, { align: 'right' });
  });

  y += rows.length * rowH + 28;

  // Tax / legal note
  doc.setFillColor(245, 248, 251);
  doc.roundedRect(marginX, y, contentW, 78, 8, 8, 'F');
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(...BRAND.dark);
  doc.text('Tax & recordkeeping', marginX + 16, y + 22);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.muted);
  const note = doc.splitTextToSize(
    `This receipt confirms your contribution to ${nonprofit} through Charity Hub. `
    + 'Keep this document for your records. Tax deductibility depends on your local laws '
    + 'and the nonprofit’s 501(c)(3) status. Charity Hub does not provide tax advice.',
    contentW - 32,
  );
  doc.text(note, marginX + 16, y + 40);

  y += 100;

  // Footer
  doc.setDrawColor(...BRAND.border);
  doc.setLineWidth(1);
  doc.line(marginX, y, marginX + contentW, y);
  y += 18;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(9);
  doc.setTextColor(...BRAND.light);
  doc.text('Charity Hub  ·  charity.hub  ·  Prototype receipt (demo payment)', marginX, y);
  doc.setTextColor(...BRAND.green);
  doc.setFont('helvetica', 'bold');
  doc.text('PAID', pageW - marginX, y, { align: 'right' });

  // Bottom brand bar
  doc.setFillColor(...BRAND.primary);
  doc.rect(0, doc.internal.pageSize.getHeight() - 8, pageW, 8, 'F');

  const filename = `charity-hub-receipt-${receiptFileSlug(eventTitle)}.pdf`;
  doc.save(filename);
  return filename;
}
