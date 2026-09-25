/**
 * Reportes descargables en Excel:
 *  - exportSalesReport: Panel Tienda > Reportes (Resumen, Pedidos, Detalle de productos)
 *  - exportUsersDirectory: SuperAdmin > Gestión de Usuarios (Usuarios, Resumen)
 */
import type { Order, OrderStatus, Product, StoreConfig, UserAccount } from '../types';
import { SAAS_PLANS } from '../data/initialData';
import { getSubscriptionStatusInfo } from './subscriptionUtils';
import {
  ExcelColumn, addSheetTitle, createWorkbook, downloadWorkbook, safeFileName, toExcelDate, writeKeyValues, writeTable,
} from './excelExport';

export const ORDER_STATUS_LABEL: Record<OrderStatus, string> = {
  pending_whatsapp: 'Pendiente WhatsApp',
  confirmed: 'Confirmado',
  preparing: 'En preparación',
  delivered: 'Entregado',
  cancelled: 'Cancelado',
};

const nowLabel = () =>
  new Date().toLocaleString('es-PE', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' });

/* ------------------------------------------------------------------ */
/* Reporte de ventas de una tienda                                     */
/* ------------------------------------------------------------------ */
export async function exportSalesReport(params: {
  store: StoreConfig;
  orders: Order[];            // pedidos del periodo (incluye cancelados)
  products: Product[];
  periodLabel: string;
  periodKey: string;          // para el nombre del archivo
}): Promise<void> {
  const { store, orders, products, periodLabel, periodKey } = params;
  const sym = store.currencySymbol || 'S/';
  const valid = orders.filter(o => o.status !== 'cancelled');
  const sorted = [...orders].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  const wb = await createWorkbook();
  const subtitle = `${periodLabel} · Generado el ${nowLabel()} · JamuyWasi`;

  /* ---------- Hoja 1: Resumen ---------- */
  const ws1 = wb.addWorksheet('Resumen', { properties: { tabColor: { argb: 'FF236257' } } });
  ws1.getColumn(1).width = 42;
  ws1.getColumn(2).width = 20;
  ws1.getColumn(3).width = 16;
  ws1.getColumn(4).width = 16;
  let r = addSheetTitle(ws1, `Reporte de ventas · ${store.name}`, subtitle, 4);

  const revenue = valid.reduce((a, o) => a + o.total, 0);
  const units = valid.reduce((a, o) => a + o.items.reduce((s, i) => s + i.quantity, 0), 0);
  r = writeKeyValues(ws1, r, 'Indicadores (sin pedidos cancelados)', [
    { label: 'Ingresos totales', value: revenue, kind: 'money' },
    { label: 'Pedidos', value: valid.length, kind: 'int' },
    { label: 'Ticket promedio', value: valid.length ? revenue / valid.length : 0, kind: 'money' },
    { label: 'Unidades vendidas', value: units, kind: 'int' },
    { label: 'Ingresos por envío', value: valid.reduce((a, o) => a + (o.deliveryFee || 0), 0), kind: 'money' },
    { label: 'Pedidos cancelados', value: orders.length - valid.length, kind: 'int' },
  ], sym);

  // Pedidos por estado
  const byStatus = (Object.keys(ORDER_STATUS_LABEL) as OrderStatus[]).map(st => {
    const list = orders.filter(o => o.status === st);
    return { estado: ORDER_STATUS_LABEL[st], pedidos: list.length, monto: list.reduce((a, o) => a + o.total, 0) };
  });
  ws1.getCell(r, 1).value = 'Pedidos por estado';
  ws1.getCell(r, 1).font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF236257' } };
  r = writeTable(ws1, [
    { header: 'Estado', width: 34, value: x => x.estado },
    { header: 'Pedidos', kind: 'int', value: x => x.pedidos, total: 'sum' },
    { header: 'Monto', kind: 'money', value: x => x.monto, total: 'sum' },
  ] as ExcelColumn<typeof byStatus[number]>[], byStatus, { startRow: r + 1, currencySymbol: sym, freeze: false, filter: false }) + 2;

  // Ventas por categoría
  const catMap = new Map<string, { unidades: number; monto: number }>();
  valid.forEach(o => o.items.forEach(i => {
    const cat = products.find(p => p.id === i.productId)?.category || 'General';
    const c = catMap.get(cat) || { unidades: 0, monto: 0 };
    c.unidades += i.quantity; c.monto += i.subtotal;
    catMap.set(cat, c);
  }));
  const cats = [...catMap.entries()].map(([categoria, v]) => ({ categoria, ...v })).sort((a, b) => b.monto - a.monto);
  if (cats.length) {
    ws1.getCell(r, 1).value = 'Ventas por categoría';
    ws1.getCell(r, 1).font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF236257' } };
    const first = r + 2;
    const last = first + cats.length - 1;
    r = writeTable(ws1, [
      { header: 'Categoría', value: x => x.categoria },
      { header: 'Unidades', kind: 'int', value: x => x.unidades, total: 'sum' },
      { header: 'Monto', kind: 'money', value: x => x.monto, total: 'sum' },
      { header: '% del total', kind: 'percent', value: (x) => (revenue ? x.monto / revenue : 0),
        total: (col) => `SUM(${col}${first}:${col}${last})` },
    ] as ExcelColumn<typeof cats[number]>[], cats, { startRow: r + 1, currencySymbol: sym, freeze: false, filter: false }) + 2;
  }

  // Productos más vendidos
  const prodMap = new Map<string, { producto: string; unidades: number; monto: number }>();
  valid.forEach(o => o.items.forEach(i => {
    const p = prodMap.get(i.productId) || { producto: i.productName, unidades: 0, monto: 0 };
    p.unidades += i.quantity; p.monto += i.subtotal;
    prodMap.set(i.productId, p);
  }));
  const top = [...prodMap.values()].sort((a, b) => b.monto - a.monto).slice(0, 10);
  if (top.length) {
    ws1.getCell(r, 1).value = 'Top 10 productos';
    ws1.getCell(r, 1).font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF236257' } };
    writeTable(ws1, [
      { header: 'Producto', value: x => x.producto },
      { header: 'Unidades', kind: 'int', value: x => x.unidades },
      { header: 'Monto', kind: 'money', value: x => x.monto },
    ] as ExcelColumn<typeof top[number]>[], top, { startRow: r + 1, currencySymbol: sym, freeze: false, filter: false });
  }
  ws1.views = [{ showGridLines: false }];
  ws1.pageSetup = { ...ws1.pageSetup, orientation: 'portrait' };

  /* ---------- Hoja 2: Pedidos ---------- */
  const ws2 = wb.addWorksheet('Pedidos');
  const orderCols: ExcelColumn<Order>[] = [
    { header: 'N° Pedido', width: 14, value: o => o.orderNumber },
    { header: 'Fecha y hora', width: 18, kind: 'datetime', value: o => toExcelDate(o.createdAt) },
    { header: 'Cliente', width: 24, value: o => o.customerName },
    { header: 'DNI/CE', width: 12, value: o => o.customerDni || '' },
    { header: 'Teléfono', width: 15, value: o => o.customerPhone },
    { header: 'Modalidad', width: 17, value: o => (o.deliveryType === 'pickup' ? 'Recojo en tienda' : 'Delivery') },
    { header: 'Dirección', width: 30, value: o => (o.deliveryType === 'pickup' ? '' : o.customerAddress) },
    { header: 'Método de pago', width: 16, value: o => o.paymentMethod },
    { header: 'Unidades', width: 11, kind: 'int', value: o => o.items.reduce((s, i) => s + i.quantity, 0), total: 'sum' },
    { header: 'Subtotal', width: 14, kind: 'money', value: o => o.subtotal, total: 'sum' },
    { header: 'Envío', width: 12, kind: 'money', value: o => o.deliveryFee || 0, total: 'sum' },
    { header: 'Total', width: 14, kind: 'money', value: o => o.total, total: 'sum' },
    { header: 'Estado', width: 19, value: o => ORDER_STATUS_LABEL[o.status] || o.status },
    { header: 'Notas', width: 40, value: o => o.notes || '' },
  ];
  const lastOrderRow = writeTable(ws2, orderCols, sorted, {
    startRow: 1, currencySymbol: sym, totalLabel: 'TOTAL (filas visibles)',
  });
  // Total sin cancelados (independiente de los filtros)
  if (sorted.length) {
    const rr = lastOrderRow + 1;
    ws2.getCell(rr, 1).value = 'Total sin cancelados';
    ws2.getCell(rr, 1).font = { name: 'Calibri', bold: true, color: { argb: 'FF236257' } };
    const cell = ws2.getCell(rr, 12); // columna Total
    cell.value = { formula: `SUMIFS(L2:L${sorted.length + 1},M2:M${sorted.length + 1},"<>Cancelado")` };
    cell.numFmt = `"${sym} "#,##0.00`;
    cell.font = { name: 'Calibri', bold: true, color: { argb: 'FF236257' } };
  }

  /* ---------- Hoja 3: Detalle de productos ---------- */
  const ws3 = wb.addWorksheet('Detalle de productos');
  type Line = { o: Order; i: Order['items'][number] };
  const lines: Line[] = sorted.flatMap(o => o.items.map(i => ({ o, i })));
  writeTable<Line>(ws3, [
    { header: 'N° Pedido', width: 14, value: x => x.o.orderNumber },
    { header: 'Fecha', width: 12, kind: 'date', value: x => toExcelDate(x.o.createdAt) },
    { header: 'Cliente', width: 22, value: x => x.o.customerName },
    { header: 'Producto', width: 40, value: x => x.i.productName },
    { header: 'Categoría', width: 18, value: x => products.find(p => p.id === x.i.productId)?.category || 'General' },
    { header: 'Variantes', width: 22, value: x => Object.entries(x.i.selectedVariants || {}).map(([k, v]) => `${k}: ${v}`).join(', ') },
    { header: 'Cantidad', width: 10, kind: 'int', value: x => x.i.quantity, total: 'sum' },
    { header: 'Precio unit.', width: 13, kind: 'money', value: x => x.i.price },
    { header: 'Subtotal', width: 14, kind: 'money', value: x => x.i.subtotal, total: 'sum' },
    { header: 'Estado del pedido', width: 19, value: x => ORDER_STATUS_LABEL[x.o.status] || x.o.status },
  ], lines, { startRow: 1, currencySymbol: sym, totalLabel: 'TOTAL (filas visibles)' });

  await downloadWorkbook(wb, `Ventas_${safeFileName(store.name)}_${periodKey}.xlsx`);
}

/* ------------------------------------------------------------------ */
/* Directorio de usuarios (SuperAdmin)                                 */
/* ------------------------------------------------------------------ */
export async function exportUsersDirectory(params: { users: UserAccount[]; stores: StoreConfig[] }): Promise<void> {
  const { users, stores } = params;
  const wb = await createWorkbook();

  const storesOf = (u: UserAccount) =>
    u.role === 'superadmin'
      ? 'Todas (SuperAdmin)'
      : stores.filter(s => s.ownerId === u.id || (Boolean(u.dni) && s.ownerId === u.dni) || s.id === u.storeId)
          .map(s => s.name).join(', ');
  const plan = (u: UserAccount) => SAAS_PLANS.find(p => p.id === u.subscription?.planId);
  const accountStatus = (u: UserAccount) =>
    u.status === 'pending_approval' ? 'Pendiente de aprobación' : u.status === 'suspended' ? 'Suspendido' : 'Activo';

  const sorted = [...users].sort((a, b) =>
    a.role === b.role ? (a.name || '').localeCompare(b.name || '', 'es') : a.role === 'superadmin' ? -1 : 1);

  const ws = wb.addWorksheet('Usuarios', { properties: { tabColor: { argb: 'FF236257' } } });
  const cols: ExcelColumn<UserAccount>[] = [
    { header: 'Nombre', width: 26, value: u => u.name },
    { header: 'Email', width: 28, value: u => u.email },
    { header: 'Teléfono', width: 14, value: u => u.phone || '' },
    { header: 'DNI', width: 11, value: u => u.dni || '' },
    { header: 'Rol', width: 13, value: u => (u.role === 'superadmin' ? 'SuperAdmin' : 'Admin Tienda') },
    { header: 'Tienda(s)', width: 34, wrap: true, value: storesOf },
    { header: 'Estado de cuenta', width: 20, value: accountStatus },
    { header: 'Plan', width: 22, value: u => plan(u)?.name || (u.subscription?.planId || '').toUpperCase() },
    { header: 'Ciclo', width: 10, value: u => (u.subscription?.billingCycle === 'annual' ? 'Anual' : 'Mensual') },
    { header: 'Precio del plan', width: 14, kind: 'money', value: u => {
        const p = plan(u); if (!p || u.role === 'superadmin') return null;
        return u.subscription?.billingCycle === 'annual' ? p.priceAnnual : p.priceMonthly;
      } },
    { header: 'Suscripción', width: 22, value: u => (u.role === 'superadmin' ? '—' : getSubscriptionStatusInfo(u.subscription, u.status).statusBadgeText) },
    { header: 'Vence', width: 12, kind: 'date', value: u => toExcelDate(u.subscription?.currentPeriodEnd) },
    { header: 'Días restantes', width: 12, kind: 'int', value: u => {
        if (u.role === 'superadmin' || !u.subscription?.currentPeriodEnd) return null;
        const d = Math.ceil((new Date(u.subscription.currentPeriodEnd).getTime() - Date.now()) / 86400000);
        return Number.isFinite(d) ? d : null;
      } },
    { header: 'Registro', width: 12, kind: 'date', value: u => toExcelDate(u.createdAt) },
    { header: 'Solicitud de PIN', width: 14, value: u => (u.pinResetRequested ? 'Sí' : '') },
  ];
  const title = addSheetTitle(ws, 'Directorio de usuarios · JamuyWasi', `Generado el ${nowLabel()} · ${users.length} usuarios`, cols.length);
  writeTable(ws, cols, sorted, { startRow: title });
  // Resaltar vencidos / por vencer en "Días restantes"
  sorted.forEach((u, idx) => {
    const cell = ws.getCell(title + 1 + idx, 13);
    const v = typeof cell.value === 'number' ? cell.value : null;
    if (v === null) return;
    if (v <= 0) cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFC62828' } };
    else if (v <= 3) cell.font = { name: 'Calibri', bold: true, color: { argb: 'FFB26A00' } };
  });

  // Resumen con fórmulas (se actualiza si editan la hoja Usuarios)
  const ws2 = wb.addWorksheet('Resumen');
  ws2.getColumn(1).width = 30; ws2.getColumn(2).width = 14; ws2.getColumn(3).width = 18;
  let r = addSheetTitle(ws2, 'Resumen de usuarios', `Generado el ${nowLabel()}`, 3);
  const first = title + 1, last = title + sorted.length;
  const rng = (col: string) => `Usuarios!$${col}$${first}:$${col}$${last}`;
  const merchants = sorted.filter(u => u.role === 'merchant');
  r = writeKeyValues(ws2, r, 'Cuentas', [
    { label: 'Total de usuarios', value: { formula: `COUNTA(${rng('A')})` }, kind: 'int' },
    { label: 'Admins de tienda', value: { formula: `COUNTIF(${rng('E')},"Admin Tienda")` }, kind: 'int' },
    { label: 'Activos', value: { formula: `COUNTIF(${rng('G')},"Activo")` }, kind: 'int' },
    { label: 'Pendientes de aprobación', value: { formula: `COUNTIF(${rng('G')},"Pendiente de aprobación")` }, kind: 'int' },
    { label: 'Suspendidos', value: { formula: `COUNTIF(${rng('G')},"Suspendido")` }, kind: 'int' },
    { label: 'Planes que vencen en ≤ 3 días', value: { formula: `COUNTIFS(${rng('M')},">0",${rng('M')},"<=3")` }, kind: 'int' },
    { label: 'Planes vencidos', value: { formula: `COUNTIFS(${rng('M')},"<=0",${rng('E')},"Admin Tienda")` }, kind: 'int' },
  ]);

  const planRows = SAAS_PLANS.map(p => ({ plan: p.name, count: merchants.filter(u => u.subscription?.planId === p.id).length }));
  ws2.getCell(r, 1).value = 'Admins de tienda por plan';
  ws2.getCell(r, 1).font = { name: 'Calibri', bold: true, size: 12, color: { argb: 'FF236257' } };
  const pFirst = r + 2;
  writeTable(ws2, [
    { header: 'Plan', value: x => x.plan },
    { header: 'Usuarios', kind: 'int', value: x => ({ formula: `COUNTIFS(${rng('H')},A${pFirst + planRows.indexOf(x)},${rng('E')},"Admin Tienda")`, result: x.count }) as any, total: 'sum' },
    { header: 'Ingreso mensual est.', kind: 'money', value: x => ({
        formula: `SUMIFS(${rng('J')},${rng('H')},A${pFirst + planRows.indexOf(x)},${rng('I')},"Mensual",${rng('G')},"Activo")+SUMIFS(${rng('J')},${rng('H')},A${pFirst + planRows.indexOf(x)},${rng('I')},"Anual",${rng('G')},"Activo")/12`,
      }) as any, total: 'sum' },
  ] as ExcelColumn<typeof planRows[number]>[], planRows, { startRow: r + 1, freeze: false, filter: false });
  ws2.views = [{ showGridLines: false }];

  await downloadWorkbook(wb, `Usuarios_JamuyWasi_${new Date().toISOString().slice(0, 10)}.xlsx`);
}
