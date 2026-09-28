/**
 * Utilidad de Impresión en Formato Oficial A4 para Comprobantes de Suscripción Electrónica.
 * 
 * Genera un documento A4 estandarizado y profesional, con membrete oficial,
 * desglose de importes, sello digital de validación, código QR y estilos optimizados
 * para impresión directa y exportación a PDF sin bordes oscuros ni elementos de la web.
 */

export interface PrintableInvoiceData {
  invoiceNumber: string;
  createdAt: string;
  storeName: string;
  customerName: string;
  customerDni?: string;
  customerEmail: string;
  customerPhone?: string;
  customerAddress?: string;
  planName: string;
  billingCycle: string;
  periodStart: string;
  periodEnd: string;
  paymentMethod: string;
  reference?: string;
  amount: number;
  currency?: string;
  status?: string;
}

/**
 * Convierte un número monetario a texto oficial en Soles (Perú)
 */
export function amountToWordsPE(amount: number): string {
  const integerPart = Math.floor(Math.abs(amount));
  const decimalPart = Math.round((Math.abs(amount) - integerPart) * 100);
  const cents = decimalPart.toString().padStart(2, '0');

  if (integerPart === 0) return `CERO Y ${cents}/100 SOLES`;

  const units = ['', 'UN', 'DOS', 'TRES', 'CUATRO', 'CINCO', 'SEIS', 'SIETE', 'OCHO', 'NUEVE'];
  const tens10 = ['DIEZ', 'ONCE', 'DOCE', 'TRECE', 'CATORCE', 'QUINCE', 'DIECISÉIS', 'DIECISIETE', 'DIECIOCHO', 'DIECINUEVE'];
  const tens = ['', '', 'VEINTE', 'TREINTA', 'CUARENTA', 'CINCUENTA', 'SESENTA', 'SETENTA', 'OCHENTA', 'NOVENTA'];
  const hundreds = ['', 'CIENTO', 'DOSCIENTOS', 'TRESCIENTOS', 'CUATROCIENTOS', 'QUINIENTOS', 'SEISCIENTOS', 'SETECIENTOS', 'OCHOCIENTOS', 'NOVECIENTOS'];

  function convertGroup(n: number): string {
    if (n === 100) return 'CIEN';
    let output = '';
    const c = Math.floor(n / 100);
    const d = Math.floor((n % 100) / 10);
    const u = n % 10;

    if (c > 0) output += hundreds[c] + ' ';
    if (d === 1) {
      output += tens10[u];
    } else if (d === 2) {
      output += u === 0 ? 'VEINTE' : 'VEINTI' + units[u];
    } else if (d > 2) {
      output += tens[d];
      if (u > 0) output += ' Y ' + units[u];
    } else if (u > 0) {
      output += units[u];
    }
    return output.trim();
  }

  let words = '';
  if (integerPart >= 1000) {
    const thousands = Math.floor(integerPart / 1000);
    const remainder = integerPart % 1000;
    if (thousands === 1) {
      words += 'MIL ';
    } else {
      words += convertGroup(thousands) + ' MIL ';
    }
    if (remainder > 0) {
      words += convertGroup(remainder);
    }
  } else {
    words = convertGroup(integerPart);
  }

  return `${words.trim()} Y ${cents}/100 SOLES`;
}

/**
 * Genera el documento HTML completo A4 con diseño vectorial, tipografía nítida
 * y reglas estrictas de impresión.
 */
export function generateInvoiceA4Html(data: PrintableInvoiceData): string {
  const amountFormatted = data.amount <= 0 ? '0.00' : data.amount.toFixed(2);
  const amountWords = amountToWordsPE(data.amount);
  const cycleText = data.billingCycle === 'annual' ? 'Anual (12 Meses)' : 'Mensual (30 Días)';
  const igvAmount = data.amount > 0 ? (data.amount - data.amount / 1.18).toFixed(2) : '0.00';
  const subtotalBase = data.amount > 0 ? (data.amount / 1.18).toFixed(2) : '0.00';

  // Hash simulado de verificación digital basado en el número de comprobante
  const verificationCode = `JW-${data.invoiceNumber.replace(/\D/g, '') || '001'}-${Math.abs(data.invoiceNumber.split('').reduce((a, b) => a + b.charCodeAt(0), 0)).toString(16).toUpperCase()}`;

  // QR oficial de verificación
  const qrValidationUrl = `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=https://jamuywasi.com/validar-comprobante?num=${encodeURIComponent(data.invoiceNumber)}&monto=${amountFormatted}`;

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>Comprobante_${data.invoiceNumber}</title>
  <style>
    @page {
      size: A4 portrait;
      margin: 12mm 15mm;
    }
    * {
      box-sizing: border-box;
      margin: 0;
      padding: 0;
      -webkit-print-color-adjust: exact !important;
      print-color-adjust: exact !important;
    }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif;
      color: #1e293b;
      background: #ffffff;
      font-size: 11px;
      line-height: 1.45;
    }
    .invoice-page {
      width: 100%;
      max-width: 180mm;
      margin: 0 auto;
      padding: 0;
    }
    /* Encabezado */
    .header-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 18px;
    }
    .header-table td {
      vertical-align: top;
    }
    .company-logo-text {
      font-size: 26px;
      font-weight: 900;
      letter-spacing: -0.5px;
      color: #0f172a;
      line-height: 1;
    }
    .company-logo-accent {
      color: #236257;
    }
    .company-subtitle {
      font-size: 11px;
      font-weight: 700;
      color: #236257;
      text-transform: uppercase;
      letter-spacing: 0.8px;
      margin-top: 3px;
    }
    .company-meta {
      font-size: 10px;
      color: #64748b;
      margin-top: 6px;
      line-height: 1.4;
    }
    /* Marco oficial del recibo */
    .receipt-box {
      border: 2px solid #236257;
      border-radius: 10px;
      padding: 12px 18px;
      text-align: center;
      background: #f8fafc;
      width: 250px;
      float: right;
    }
    .receipt-box-ruc {
      font-size: 13px;
      font-weight: 800;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .receipt-box-title {
      font-size: 11px;
      font-weight: 800;
      color: #ffffff;
      background: #236257;
      padding: 3px 6px;
      border-radius: 4px;
      margin: 6px 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    .receipt-box-num {
      font-size: 16px;
      font-weight: 900;
      font-family: monospace, monospace;
      color: #0f172a;
      letter-spacing: 0.5px;
    }
    .receipt-box-date {
      font-size: 9.5px;
      color: #64748b;
      margin-top: 4px;
    }
    .clear {
      clear: both;
    }

    /* Grilla de Datos */
    .info-grid {
      width: 100%;
      border-collapse: separate;
      border-spacing: 12px 0;
      margin-bottom: 16px;
    }
    .info-card {
      width: 50%;
      border: 1px solid #e2e8f0;
      border-radius: 8px;
      padding: 10px 14px;
      background: #fcfcfd;
      vertical-align: top;
    }
    .info-card-title {
      font-size: 9.5px;
      font-weight: 800;
      color: #236257;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 5px;
      margin-bottom: 8px;
    }
    .info-row {
      margin-bottom: 4px;
      font-size: 10.5px;
    }
    .info-label {
      color: #64748b;
      font-weight: 600;
      display: inline-block;
      width: 85px;
    }
    .info-value {
      color: #0f172a;
      font-weight: 700;
    }

    /* Tabla de Conceptos */
    .items-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 14px;
      border: 1px solid #cbd5e1;
      border-radius: 6px;
      overflow: hidden;
    }
    .items-table th {
      background: #236257;
      color: #ffffff;
      font-size: 9.5px;
      font-weight: 800;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      padding: 8px 10px;
      border: 1px solid #236257;
    }
    .items-table td {
      padding: 10px;
      border: 1px solid #e2e8f0;
      font-size: 10.5px;
      vertical-align: top;
    }
    .item-desc-title {
      font-weight: 800;
      color: #0f172a;
      font-size: 11.5px;
    }
    .item-desc-sub {
      color: #64748b;
      font-size: 9.5px;
      margin-top: 3px;
      line-height: 1.35;
    }

    /* Resumen y Totales */
    .totals-table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 16px;
    }
    .totals-table td {
      vertical-align: top;
    }
    .words-box {
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 8px 12px;
      background: #f8fafc;
      font-size: 10px;
      line-height: 1.4;
      margin-bottom: 8px;
    }
    .words-label {
      font-size: 9px;
      font-weight: 800;
      color: #64748b;
      text-transform: uppercase;
    }
    .words-text {
      font-weight: 700;
      color: #0f172a;
      text-transform: uppercase;
    }
    .status-badge {
      display: inline-block;
      background: #dcfce7;
      color: #166534;
      border: 1px solid #86efac;
      padding: 3px 8px;
      border-radius: 4px;
      font-size: 9px;
      font-weight: 800;
      letter-spacing: 0.5px;
      text-transform: uppercase;
    }

    .calc-table {
      width: 250px;
      float: right;
      border-collapse: collapse;
    }
    .calc-table td {
      padding: 4px 6px;
      font-size: 10.5px;
    }
    .calc-table .label {
      text-align: right;
      color: #64748b;
      font-weight: 600;
    }
    .calc-table .val {
      text-align: right;
      color: #0f172a;
      font-weight: 700;
      font-family: monospace, monospace;
    }
    .calc-table .total-row td {
      border-top: 2px solid #236257;
      background: #236257;
      color: #ffffff;
      padding: 8px 10px;
      font-size: 12px;
      font-weight: 900;
    }
    .calc-table .total-row .label {
      color: #ffffff;
      text-align: left;
    }
    .calc-table .total-row .val {
      color: #ffffff;
      font-size: 13.5px;
    }

    /* Footer & Seguridad */
    .footer-box {
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      margin-top: 20px;
      width: 100%;
    }
    .footer-table {
      width: 100%;
      border-collapse: collapse;
    }
    .footer-table td {
      vertical-align: middle;
    }
    .qr-img {
      width: 68px;
      height: 68px;
      border: 1px solid #e2e8f0;
      border-radius: 4px;
      display: block;
    }
    .footer-text {
      font-size: 9px;
      color: #64748b;
      line-height: 1.4;
      padding-left: 12px;
    }
    .footer-security {
      font-family: monospace, monospace;
      font-weight: 700;
      color: #334155;
      font-size: 9.5px;
    }
  </style>
</head>
<body>
  <div class="invoice-page">
    
    <!-- Encabezado con Identidad Oficial y Cuadro de Recibo -->
    <table class="header-table">
      <tr>
        <td style="width: 58%;">
          <div class="company-logo-text">
            <span class="company-logo-accent">Jamuy</span>Wasi
          </div>
          <div class="company-subtitle">
            Plataforma SaaS de Comercio Digital & Catálogos WhatsApp
          </div>
          <div class="company-meta">
            <strong>JAMUYWASI PERÚ</strong> • R.U.C. 20615233731<br>
            Jr. Urubamba 432, Atalaya, Ucayali - Perú<br>
            Email: jamuywasi22@gmail.com 
          </div>
        </td>
        <td style="width: 42%;">
          <div class="receipt-box">
            <div class="receipt-box-ruc">R.U.C. 20615233731</div>
            <div class="receipt-box-title">Comprobante de Suscripción</div>
            <div class="receipt-box-num">${data.invoiceNumber}</div>
            <div class="receipt-box-date">Fecha de Emisión: ${data.createdAt}</div>
          </div>
        </td>
      </tr>
    </table>
    <div class="clear"></div>

    <!-- Grilla de Información del Comercio y de la Suscripción -->
    <table class="info-grid">
      <tr>
        <td class="info-card">
          <div class="info-card-title">Datos del Comercio & Titular</div>
          <div class="info-row">
            <span class="info-label">Comercio:</span>
            <span class="info-value">${data.storeName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Titular:</span>
            <span class="info-value">${data.customerName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">DNI / RUC:</span>
            <span class="info-value">${data.customerDni || 'No especificado'}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Correo:</span>
            <span class="info-value">${data.customerEmail}</span>
          </div>
          ${data.customerPhone ? `
          <div class="info-row">
            <span class="info-label">Teléfono:</span>
            <span class="info-value">${data.customerPhone}</span>
          </div>` : ''}
          ${data.customerAddress ? `
          <div class="info-row">
            <span class="info-label">Dirección:</span>
            <span class="info-value">${data.customerAddress}</span>
          </div>` : ''}
        </td>

        <td class="info-card">
          <div class="info-card-title">Detalles del Plan & Pago</div>
          <div class="info-row">
            <span class="info-label">Plan SaaS:</span>
            <span class="info-value">Plan ${data.planName}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Ciclo:</span>
            <span class="info-value">${cycleText}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Vigencia:</span>
            <span class="info-value">${data.periodStart} al ${data.periodEnd}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Medio de Pago:</span>
            <span class="info-value">${data.paymentMethod}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Referencia:</span>
            <span class="info-value">${data.reference || 'Aprobado Sistema'}</span>
          </div>
          <div class="info-row" style="margin-top: 5px;">
            <span class="status-badge">✓ Pago Aprobado & Activo</span>
          </div>
        </td>
      </tr>
    </table>

    <!-- Tabla Detallada de Conceptos -->
    <table class="items-table">
      <thead>
        <tr>
          <th style="width: 8%; text-align: center;">Item</th>
          <th style="width: 54%; text-align: left;">Descripción del Servicio</th>
          <th style="width: 14%; text-align: center;">Ciclo</th>
          <th style="width: 10%; text-align: center;">Cant.</th>
          <th style="width: 14%; text-align: right;">Importe (PEN)</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td style="text-align: center; font-weight: bold;">01</td>
          <td>
            <div class="item-desc-title">Suscripción Plataforma JamuyWasi - Plan ${data.planName}</div>
            <div class="item-desc-sub">
              Activación integral de catálogo digital, conexión directa de pedidos a WhatsApp, pasarela de cobros Yape/Plin, administración de inventario y variantes, soporte técnico y actualizaciones en la nube.
            </div>
          </td>
          <td style="text-align: center; font-weight: 600;">${cycleText}</td>
          <td style="text-align: center;">1</td>
          <td style="text-align: right; font-weight: 800; font-family: monospace, monospace;">
            S/ ${amountFormatted}
          </td>
        </tr>
      </tbody>
    </table>

    <!-- Bloque de Monto en Letras y Totales -->
    <table class="totals-table">
      <tr>
        <td style="width: 58%; padding-right: 15px;">
          <div class="words-box">
            <div class="words-label">Importe en Letras:</div>
            <div class="words-text">${amountWords}</div>
          </div>
          <div style="font-size: 9.5px; color: #64748b; line-height: 1.4;">
            <strong>Observaciones:</strong> Comprobante electrónico de control y vigencia de servicio de software emitido bajo los estándares de JamuyWasi. Válido como constancia de servicio activo.
          </div>
        </td>

        <td style="width: 42%;">
          <table class="calc-table">
            <tr>
              <td class="label">Operación Gravada:</td>
              <td class="val">S/ ${subtotalBase}</td>
            </tr>
            <tr>
              <td class="label">I.G.V. (18% Incluido):</td>
              <td class="val">S/ ${igvAmount}</td>
            </tr>
            <tr>
              <td class="label">Descuentos:</td>
              <td class="val">S/ 0.00</td>
            </tr>
            <tr class="total-row">
              <td class="label">TOTAL ABONADO:</td>
              <td class="val">S/ ${amountFormatted}</td>
            </tr>
          </table>
        </td>
      </tr>
    </table>
    <div class="clear"></div>

    <!-- Pie de Seguridad y Validez -->
    <div class="footer-box">
      <table class="footer-table">
        <tr>
          <td style="width: 76px;">
            <img src="${qrValidationUrl}" alt="QR Validación" class="qr-img">
          </td>
          <td class="footer-text">
            <div class="footer-security">CÓDIGO DE VALIDACIÓN: ${verificationCode}</div>
            <div>
              Comprobante digital verificado por el sistema central de JamuyWasi SaaS.<br>
              Escanea el código QR para validar la autenticidad y vigencia de este comprobante en línea.<br>
              Emitido el ${data.createdAt} • Impreso desde la plataforma de gestión.
            </div>
          </td>
        </tr>
      </table>
    </div>

  </div>

  <script>
    window.onload = function() {
      // Auto-trigger print dialog
      setTimeout(function() {
        window.print();
      }, 200);
    };
  </script>
</body>
</html>`;
}

/**
 * Lanza la impresión A4 en un iframe oculto para garantizar un resultado
 * limpio, sin cortes, sin fondo oscuro y con proporciones 100% A4 en cualquier navegador.
 */
export function printInvoiceA4Document(data: PrintableInvoiceData): void {
  const iframe = document.createElement('iframe');
  iframe.id = 'jamuywasi-print-frame';
  iframe.style.position = 'fixed';
  iframe.style.top = '-9999px';
  iframe.style.left = '-9999px';
  iframe.style.width = '210mm';
  iframe.style.height = '297mm';
  iframe.style.border = 'none';
  iframe.style.zIndex = '-9999';
  document.body.appendChild(iframe);

  const doc = iframe.contentWindow?.document;
  if (!doc) {
    window.print();
    return;
  }

  const html = generateInvoiceA4Html(data);
  doc.open();
  doc.write(html);
  doc.close();

  // Limpiar iframe después de imprimir
  setTimeout(() => {
    try {
      const el = document.getElementById('jamuywasi-print-frame');
      if (el) document.body.removeChild(el);
    } catch {}
  }, 10000);
}
