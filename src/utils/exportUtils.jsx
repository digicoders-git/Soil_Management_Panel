import * as XLSX from 'xlsx';

export const exportToExcel = (data, columns, filename) => {
  const rows = data.map(row =>
    columns.reduce((obj, col) => {
      let val = row[col.key];
      if (val && typeof val === 'object' && !Array.isArray(val)) val = val.name || val.email || '';
      if (Array.isArray(val)) val = val.map(v => v?.name || v).join(', ');
      obj[col.label] = val ?? '';
      return obj;
    }, {})
  );
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Data');
  XLSX.writeFile(wb, `${filename}-${new Date().toISOString().slice(0, 10)}.xlsx`);
};

export const exportToPdf = async (data, columns, title, filename) => {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ orientation: 'landscape' });
  const pageW = doc.internal.pageSize.getWidth();
  let y = 20;

  doc.setFontSize(14); doc.setFont(undefined, 'bold');
  doc.text(title, 14, y); y += 6;
  doc.setFontSize(8); doc.setFont(undefined, 'normal');
  doc.text(`Generated: ${new Date().toLocaleString()}`, 14, y); y += 8;

  const colW = (pageW - 28) / columns.length;

  doc.setFillColor(59, 130, 246);
  doc.rect(14, y - 4, pageW - 28, 7, 'F');
  doc.setTextColor(255, 255, 255); doc.setFont(undefined, 'bold');
  columns.forEach((col, i) => doc.text(col.label.slice(0, 18), 14 + i * colW, y));
  doc.setTextColor(0, 0, 0); doc.setFont(undefined, 'normal');
  y += 7;

  data.forEach((row, ri) => {
    if (y > 185) { doc.addPage(); y = 20; }
    if (ri % 2 === 0) { doc.setFillColor(245, 247, 250); doc.rect(14, y - 4, pageW - 28, 6, 'F'); }
    columns.forEach((col, i) => {
      let val = row[col.key];
      if (val && typeof val === 'object' && !Array.isArray(val)) val = val.name || val.email || '';
      if (Array.isArray(val)) val = val.map(v => v?.name || v).join(', ');
      doc.text(String(val ?? '').slice(0, 22), 14 + i * colW, y);
    });
    y += 6;
  });

  doc.save(`${filename}-${new Date().toISOString().slice(0, 10)}.pdf`);
};

export const ExportButtons = ({ onExcel, onPdf }) => (
  <div className="flex gap-2">
    <button onClick={onExcel} className="flex items-center gap-1.5 px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-semibold hover:bg-green-700 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
      Excel
    </button>
    <button onClick={onPdf} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-600 text-white rounded-lg text-sm font-semibold hover:bg-red-700 transition-colors">
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" /></svg>
      PDF
    </button>
  </div>
);
