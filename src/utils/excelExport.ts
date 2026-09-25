/**
 * Exportación a Excel (.xlsx) con formato: encabezado con el color de la marca,
 * filas alternadas, filtros, primera fila fija, montos y fechas como números reales
 * (se pueden sumar y ordenar en Excel) y totales con fórmulas.
 *
 * ExcelJS se carga solo al exportar (import dinámico) para no pesar en la carga inicial.
 */
import type { Workbook, Worksheet } from 'exceljs';

export const BRAND = 'FF236257';
const BRAND_LIGHT = 'FFE8F1EF';
const ZEBRA = 'FFF7FAF9';
const BORDER = 'FFD9E2DF';
const TEXT_MUTED = 'FF5F6B68';

export type ColumnKind = 'text' | 'money' | 'int' | 'date' | 'datetime' | 'percent';

export interface ExcelColumn<T> {
  header: string;
  width?: number;
  kind?: ColumnKind;
  value: (row: T) => string | number | Date | null | undefined;
  /** Ajustar texto en varias líneas (por defecto no, para que las filas no crezcan) */
  wrap?: boolean;
  /** Totales al pie: 'sum' o una fórmula propia usando {col} y {first}/{last} */
  total?: 'sum' | 'count' | ((col: string, first: number, last: number) => string);
}

const thin = { style: 'thin' as const, color: { argb: BORDER } };
const allBorders = { top: thin, left: thin, bottom: thin, right: thin };

export const moneyFormat = (symbol = 'S/') => `"${symbol.replace(/"/g, '')} "#,##0.00;-"${symbol.replace(/"/g, '')} "#,##0.00`;

const numFmtFor = (kind: ColumnKind | undefined, symbol: string) => {
  switch (kind) {
    case 'money': return moneyFormat(symbol);
    case 'int': return '#,##0';
    case 'date': return 'dd/mm/yyyy';
    case 'datetime': return 'dd/mm/yyyy hh:mm';
    case 'percent': return '0%';
    default: return undefined;
  }
};

/** Convierte una fecha ISO a Date "local" para que Excel muestre la hora de Perú y no UTC. */
export const toExcelDate = (iso?: string | null): Date | null => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return new Date(Date.UTC(d.getFullYear(), d.getMonth(), d.getDate(), d.getHours(), d.getMinutes(), d.getSeconds()));
};

export async function createWorkbook(): Promise<Workbook> {
  const mod: any = await import('exceljs');
  const ExcelJS = mod.default ?? mod;
  const wb: Workbook = new ExcelJS.Workbook();
  wb.creator = 'JamuyWasi';
  wb.created = new Date();
  return wb;
}

/**
 * Título de hoja (fila 1) + subtítulo (fila 2). Devuelve la siguiente fila libre.
 */
export function addSheetTitle(ws: Worksheet, title: string, subtitle: string, span: number): number {
  ws.mergeCells(1, 1, 1, Math.max(span, 1));
  const t = ws.getCell(1, 1);
  t.value = title;
  t.font = { name: 'Calibri', bold: true, size: 15, color: { argb: 'FFFFFFFF' } };
  t.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } };
  t.alignment = { vertical: 'middle', indent: 1 };
  ws.getRow(1).height = 28;

  ws.mergeCells(2, 1, 2, Math.max(span, 1));
  const s = ws.getCell(2, 1);
  s.value = subtitle;
  s.font = { name: 'Calibri', italic: true, size: 10, color: { argb: TEXT_MUTED } };
  s.alignment = { indent: 1 };
  ws.getRow(2).height = 18;
  return 4;
}

/**
 * Escribe una tabla con formato a partir de la fila `startRow`.
 * Devuelve la última fila usada.
 */
export function writeTable<T>(
  ws: Worksheet,
  columns: ExcelColumn<T>[],
  rows: T[],
  opts: { startRow?: number; currencySymbol?: string; freeze?: boolean; filter?: boolean; totalLabel?: string } = {}
): number {
  const start = opts.startRow ?? 1;
  const symbol = opts.currencySymbol ?? 'S/';

  columns.forEach((c, i) => {
    const col = ws.getColumn(i + 1);
    col.width = Math.max(col.width ?? 0, c.width ?? 16);
  });

  // Encabezado
  const header = ws.getRow(start);
  columns.forEach((c, i) => {
    const cell = header.getCell(i + 1);
    cell.value = c.header;
    cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFFFFFFF' } };
    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND } };
    cell.alignment = { vertical: 'middle', horizontal: c.kind && c.kind !== 'text' ? 'center' : 'left', wrapText: true, indent: c.kind && c.kind !== 'text' ? 0 : 1 };
    cell.border = allBorders;
  });
  header.height = 24;

  // Filas
  rows.forEach((r, idx) => {
    const row = ws.getRow(start + 1 + idx);
    columns.forEach((c, i) => {
      const cell = row.getCell(i + 1);
      const v = c.value(r);
      cell.value = v === undefined || v === '' ? null : (v as any);
      const fmt = numFmtFor(c.kind, symbol);
      if (fmt) cell.numFmt = fmt;
      cell.border = allBorders;
      cell.alignment = {
        vertical: 'middle',
        horizontal: c.kind === 'money' || c.kind === 'int' || c.kind === 'percent' ? 'right' : c.kind === 'date' || c.kind === 'datetime' ? 'center' : 'left',
        wrapText: Boolean(c.wrap),
        indent: !c.kind || c.kind === 'text' ? 1 : 0,
      };
      if (idx % 2 === 1) cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: ZEBRA } };
    });
  });

  let last = start + rows.length;

  // Totales
  if (columns.some(c => c.total) && rows.length > 0) {
    const first = start + 1;
    const lastData = last;
    const totalRow = ws.getRow(lastData + 1);
    columns.forEach((c, i) => {
      const cell = totalRow.getCell(i + 1);
      const letter = ws.getColumn(i + 1).letter;
      if (i === 0 && !c.total) cell.value = opts.totalLabel ?? 'TOTAL';
      if (c.total === 'sum') cell.value = { formula: `SUBTOTAL(9,${letter}${first}:${letter}${lastData})` };
      else if (c.total === 'count') cell.value = { formula: `SUBTOTAL(3,${letter}${first}:${letter}${lastData})` };
      else if (typeof c.total === 'function') cell.value = { formula: c.total(letter, first, lastData) };
      const fmt = numFmtFor(c.kind, symbol);
      if (fmt && c.total) cell.numFmt = fmt;
      cell.font = { name: 'Calibri', bold: true, color: { argb: BRAND } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIGHT } };
      cell.border = { ...allBorders, top: { style: 'medium', color: { argb: BRAND } } };
      cell.alignment = { vertical: 'middle', horizontal: c.kind === 'money' || c.kind === 'int' || c.kind === 'percent' ? 'right' : 'left' };
    });
    totalRow.height = 22;
    last = lastData + 1;
  }

  // Solo las tablas principales (con fila fija) repiten su encabezado al imprimir
  setupPrint(ws, opts.freeze !== false ? start : undefined);
  if (opts.freeze !== false) ws.views = [{ state: 'frozen', ySplit: start, xSplit: 0 }];
  if (opts.filter !== false && rows.length > 0) {
    ws.autoFilter = { from: { row: start, column: 1 }, to: { row: start + rows.length, column: columns.length } };
  }
  return last;
}

/** Impresión: A4 horizontal, ajustado al ancho de la página y encabezado repetido en cada hoja. */
export function setupPrint(ws: Worksheet, headerRow?: number) {
  ws.pageSetup = {
    ...ws.pageSetup,
    paperSize: 9,
    orientation: 'landscape',
    fitToPage: true,
    fitToWidth: 1,
    fitToHeight: 0,
    margins: { left: 0.4, right: 0.4, top: 0.5, bottom: 0.5, header: 0.3, footer: 0.3 },
    ...(headerRow ? { printTitlesRow: `${headerRow}:${headerRow}` } : {}),
  };
  ws.headerFooter = { oddFooter: '&LJamuyWasi&RPágina &P de &N' };
}

/** Bloque "etiqueta : valor" (para hojas de resumen). Devuelve la siguiente fila libre. */
export function writeKeyValues(
  ws: Worksheet,
  startRow: number,
  title: string,
  items: { label: string; value: string | number | { formula: string }; kind?: ColumnKind }[],
  currencySymbol = 'S/'
): number {
  const t = ws.getCell(startRow, 1);
  t.value = title;
  t.font = { name: 'Calibri', bold: true, size: 12, color: { argb: BRAND } };
  let r = startRow + 1;
  for (const it of items) {
    const l = ws.getCell(r, 1);
    const v = ws.getCell(r, 2);
    l.value = it.label;
    l.font = { name: 'Calibri', color: { argb: TEXT_MUTED } };
    l.border = allBorders;
    l.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: BRAND_LIGHT } };
    v.value = it.value as any;
    v.font = { name: 'Calibri', bold: true, size: 12 };
    v.border = allBorders;
    v.alignment = { horizontal: 'right' };
    const fmt = numFmtFor(it.kind, currencySymbol);
    if (fmt) v.numFmt = fmt;
    r++;
  }
  return r + 1;
}

export const safeFileName = (s: string) =>
  s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-zA-Z0-9_-]+/g, '_').replace(/_+/g, '_').replace(/^_|_$/g, '').slice(0, 80);

export async function downloadWorkbook(wb: Workbook, fileName: string): Promise<void> {
  const buffer = await wb.xlsx.writeBuffer();
  const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName.endsWith('.xlsx') ? fileName : `${fileName}.xlsx`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 2000);
}
