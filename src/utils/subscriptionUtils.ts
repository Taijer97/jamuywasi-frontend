import { Subscription } from '../types';

export interface SubscriptionStatusInfo {
  isExpired: boolean;
  isExpiringSoon: boolean;
  isPendingApproval: boolean;
  daysRemaining: number;
  statusBadgeText: string;
  statusBadgeColor: string;
}

export function getSubscriptionStatusInfo(
  subscription?: Subscription | null,
  userStatus?: string
): SubscriptionStatusInfo {
  if (!subscription) {
    return {
      isExpired: false,
      isExpiringSoon: false,
      isPendingApproval: false,
      daysRemaining: 999,
      statusBadgeText: 'Activa',
      statusBadgeColor: 'bg-emerald-100 text-emerald-800'
    };
  }

  if (userStatus === 'pending_approval' || subscription.status === 'pending_approval') {
    return {
      isExpired: false,
      isExpiringSoon: false,
      isPendingApproval: true,
      daysRemaining: 0,
      statusBadgeText: 'Pendiente Autorizar',
      statusBadgeColor: 'bg-amber-100 text-amber-900 border border-amber-300'
    };
  }

  const now = Date.now();
  const periodEnd = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).getTime() : null;
  const isPeriodPast = periodEnd !== null && !isNaN(periodEnd) && periodEnd <= now;
  const isExplicitlyExpired = subscription.status === 'past_due' || subscription.status === 'canceled' || userStatus === 'suspended';
  const isExpired = isExplicitlyExpired || isPeriodPast;

  if (isExpired) {
    return {
      isExpired: true,
      isExpiringSoon: false,
      isPendingApproval: false,
      daysRemaining: 0,
      statusBadgeText: subscription.status === 'canceled' ? 'Cancelada' : 'Vencida / Pago Pendiente',
      statusBadgeColor: 'bg-rose-100 text-rose-800 border border-rose-300'
    };
  }

  let daysRemaining = 999;
  if (periodEnd !== null && !isNaN(periodEnd)) {
    const diffMs = periodEnd - now;
    daysRemaining = Math.max(0, Math.ceil(diffMs / (1000 * 60 * 60 * 24)));
  }

  const isExpiringSoon = daysRemaining <= 3;
  if (isExpiringSoon) {
    const text = daysRemaining === 0 ? '¡Vence hoy!' : daysRemaining === 1 ? 'Por Vencer (1 día)' : `Por Vencer (${daysRemaining} días)`;
    return {
      isExpired: false,
      isExpiringSoon: true,
      isPendingApproval: false,
      daysRemaining,
      statusBadgeText: text,
      statusBadgeColor: 'bg-amber-100 text-amber-800 border border-amber-300'
    };
  }

  if (subscription.status === 'trial') {
    return {
      isExpired: false,
      isExpiringSoon: false,
      isPendingApproval: false,
      daysRemaining,
      statusBadgeText: 'Prueba',
      statusBadgeColor: 'bg-blue-100 text-blue-800'
    };
  }

  return {
    isExpired: false,
    isExpiringSoon: false,
    isPendingApproval: false,
    daysRemaining,
    statusBadgeText: 'Activa',
    statusBadgeColor: 'bg-emerald-100 text-emerald-800'
  };
}

export function buildReactivationWhatsAppLink(
  storeName: string,
  merchantName: string,
  email: string,
  plan: string,
  targetPhone: string = '51325763903'
): string {
  const cleanPhone = targetPhone.replace(/\D/g, '');
  const message = [
    '👋 Hola SuperAdministrador, necesito reactivar mi tienda en JamuyWasi.',
    '',
    `🏪 *Tienda:* ${storeName}`,
    `👤 *Titular:* ${merchantName}`,
    `📧 *Correo:* ${email}`,
    `📦 *Plan:* ${plan.toUpperCase()}`,
    '',
    '💳 Mi suscripción se encuentra vencida / pendiente de pago. Por favor indíquenme los medios de pago para renovar y volver a publicar mi tienda de inmediato.'
  ].join('\n');

  return `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
}
