type CellValue = string | number | null | undefined;

function escapeCell(v: CellValue): string {
  const s = v == null ? '' : String(v);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

/** Build a CSV string from a 2-D array of rows (first row = headers). */
export function buildCSV(rows: CellValue[][]): string {
  return rows.map(row => row.map(escapeCell).join(',')).join('\r\n');
}

/** Trigger a browser download of a CSV file. Adds a UTF-8 BOM so Excel opens it correctly. */
export function downloadCSV(filename: string, rows: CellValue[][]): void {
  const csv = buildCSV(rows);
  const blob = new Blob(['﻿' + csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.csv') ? filename : `${filename}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

/** Format today's date as YYYY-MM-DD for filenames. */
export function todayStamp(): string {
  return new Date().toISOString().slice(0, 10);
}
