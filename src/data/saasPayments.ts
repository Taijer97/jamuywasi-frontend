export interface PaymentAccount {
  id: string;
  name: string;
  type: 'yape_plin' | 'bank_transfer';
  accountNumber: string;
  holder: string;
  cci?: string;
  badge?: string;
  instructions: string;
}

export const SUPER_ADMIN_CONFIG = {
  name: 'Super Administrador',
  role: 'Super Administrador JamuyWasi',
  phone: '51925763903',
  phoneFormatted: '+51 925 763 903',
  email: 'admin@jamuywasi.com',
  paymentAccounts: [
    {
      id: 'yape_plin',
      name: 'Yape / Plin',
      type: 'yape_plin',
      accountNumber: '925 763 903',
      holder: 'JamuyWasi',
      badge: 'Pago Inmediato',
      instructions: 'Envía tu pago por Yape o Plin al número indicado e incluye tu comprobante.'
    },
    {
      id: 'bcp',
      name: 'Banco BCP Soles',
      type: 'bank_transfer',
      accountNumber: '193-98765432-0-12',
      holder: 'JamuyWasi',
      cci: '002-193-009876543201-14',
      badge: 'Transferencia Directa',
      instructions: 'Transferencias desde BCP o interbancarias inmediatas con CCI.'
    },
    {
      id: 'bbva',
      name: 'Banco BBVA Soles',
      type: 'bank_transfer',
      accountNumber: '0011-0123-0200987654',
      holder: 'JamuyWasi',
      cci: '011-123-000200987654-25',
      badge: 'Transferencia BBVA',
      instructions: 'Acepta depósitos en agente BBVA o banca por internet.'
    }
  ] as PaymentAccount[]
};

export function buildPaymentProofWhatsappUrl(params: {
  storeName: string;
  merchantName: string;
  email: string;
  phone?: string;
  planName: string;
  amount: number;
  billingCycle: 'monthly' | 'annual';
  reference?: string;
}): string {
  const cycleLabel = params.billingCycle === 'annual' ? 'Anual' : 'Mensual';
  const lines = [
    '🔔 *COMPROBANTE DE PAGO - SUSCRIPCIÓN SAAS*',
    '--------------------------------------',
    `🏪 *Tienda:* ${params.storeName}`,
    `👤 *Comerciante:* ${params.merchantName}`,
    `📧 *Email de acceso:* ${params.email}`,
    params.phone ? `📱 *Teléfono:* ${params.phone}` : '',
    `📦 *Plan solicitado:* ${params.planName}`,
    `💰 *Monto abonado:* S/ ${params.amount.toFixed(2)} (${cycleLabel})`,
    params.reference ? `🔖 *Nº de Operación / Ref:* ${params.reference}` : '',
    '--------------------------------------',
    '📄 *Adjunto mi comprobante de pago* a este mensaje para la aprobación y activación inmediata de mi tienda.',
    '¡Quedo atento a su confirmación!'
  ].filter(Boolean);

  const text = encodeURIComponent(lines.join('\n'));
  return `https://wa.me/${SUPER_ADMIN_CONFIG.phone}?text=${text}`;
}
