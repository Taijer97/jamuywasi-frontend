import React, { useEffect, useRef, useState } from 'react';
import {
  Bell, BellRing, ShoppingBag, Clock, AlertTriangle, CheckCircle2, UserPlus, KeyRound,
  CreditCard, ShieldAlert, Ban, X, CheckCheck
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import type { AppNotification } from '../../types';

const TYPE_STYLE: Record<string, { icon: React.ElementType; cls: string }> = {
  ORDER_NEW: { icon: ShoppingBag, cls: 'bg-emerald-100 text-emerald-700' },
  PLAN_EXPIRING: { icon: Clock, cls: 'bg-amber-100 text-amber-700' },
  PLAN_EXPIRED: { icon: AlertTriangle, cls: 'bg-red-100 text-red-700' },
  PLAN_ACTIVATED: { icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  ACCOUNT_APPROVED: { icon: CheckCircle2, cls: 'bg-emerald-100 text-emerald-700' },
  ACCOUNT_SUSPENDED: { icon: Ban, cls: 'bg-red-100 text-red-700' },
  APPROVAL_PENDING: { icon: UserPlus, cls: 'bg-purple-100 text-purple-700' },
  PIN_RESET_REQUESTED: { icon: KeyRound, cls: 'bg-blue-100 text-blue-700' },
  PAYMENT_RECEIVED: { icon: CreditCard, cls: 'bg-emerald-100 text-emerald-700' },
  PAYMENT_MANUAL_REVIEW: { icon: ShieldAlert, cls: 'bg-amber-100 text-amber-700' },
  MERCHANT_PLAN_EXPIRED: { icon: AlertTriangle, cls: 'bg-red-100 text-red-700' },
};

const rtf = new Intl.RelativeTimeFormat('es', { numeric: 'auto' });
export const timeAgo = (iso: string): string => {
  const t = new Date(iso).getTime();
  if (!Number.isFinite(t)) return '';
  const s = Math.round((t - Date.now()) / 1000);
  const a = Math.abs(s);
  if (a < 45) return 'hace un momento';
  if (a < 3600) return rtf.format(Math.round(s / 60), 'minute');
  if (a < 86400) return rtf.format(Math.round(s / 3600), 'hour');
  if (a < 604800) return rtf.format(Math.round(s / 86400), 'day');
  return new Date(t).toLocaleDateString('es-PE', { day: '2-digit', month: 'short' });
};

const canAskPermission = () =>
  typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'default';

export const NotificationBell: React.FC = () => {
  const { notifications, unreadNotifications, openNotification, markAllNotificationsRead } = useApp();
  const [open, setOpen] = useState(false);
  const [askPerm, setAskPerm] = useState(canAskPermission);
  const [, tick] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  // Cerrar con clic fuera / Escape; refrescar "hace X min" mientras está abierto
  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent | TouchEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false); };
    const iv = window.setInterval(() => tick(x => x + 1), 30000);
    document.addEventListener('mousedown', onDown);
    document.addEventListener('touchstart', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      window.clearInterval(iv);
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('touchstart', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  const requestPermission = async () => {
    try { await Notification.requestPermission(); } catch { /* navegadores antiguos */ }
    setAskPerm(canAskPermission());
  };

  const onItem = (n: AppNotification) => { setOpen(false); openNotification(n); };
  const badge = unreadNotifications > 99 ? '99+' : String(unreadNotifications);

  return (
    <div className="relative" ref={rootRef}>
      <button
        type="button"
        onClick={() => setOpen(o => !o)}
        className="relative flex items-center justify-center w-9 h-9 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 transition-colors cursor-pointer shadow-2xs"
        aria-label={unreadNotifications ? `Notificaciones (${unreadNotifications} sin leer)` : 'Notificaciones'}
        aria-expanded={open}
        aria-haspopup="dialog"
        data-testid="notif-bell"
      >
        {unreadNotifications > 0
          ? <BellRing className="w-4 h-4 text-emerald-700" />
          : <Bell className="w-4 h-4 text-neutral-500" />}
        {unreadNotifications > 0 && (
          <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 rounded-full bg-red-600 text-white text-[10px] font-black flex items-center justify-center ring-2 ring-white" data-testid="notif-badge">
            {badge}
          </span>
        )}
      </button>

      {open && (
        <>
          {/* Fondo en móvil */}
          <div className="sm:hidden fixed inset-0 bg-black/30 z-40" onClick={() => setOpen(false)} />
          <div
            role="dialog"
            aria-label="Notificaciones"
            className="fixed sm:absolute inset-x-2 sm:inset-x-auto top-16 sm:top-auto sm:right-0 sm:mt-2 sm:w-96 max-h-[75vh] sm:max-h-[70vh] flex flex-col rounded-2xl bg-white border border-neutral-200 shadow-xl z-50 overflow-hidden"
            data-testid="notif-panel"
          >
            <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-neutral-100">
              <div>
                <p className="font-bold text-sm text-neutral-900">Notificaciones</p>
                <p className="text-[11px] text-neutral-500">
                  {unreadNotifications ? `${unreadNotifications} sin leer` : 'Todo al día'}
                </p>
              </div>
              <div className="flex items-center gap-1">
                {unreadNotifications > 0 && (
                  <button
                    type="button"
                    onClick={markAllNotificationsRead}
                    className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-emerald-700 hover:bg-emerald-50 cursor-pointer"
                  >
                    <CheckCheck className="w-3.5 h-3.5" /> Marcar todas
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="sm:hidden w-8 h-8 flex items-center justify-center rounded-lg hover:bg-neutral-100 cursor-pointer"
                  aria-label="Cerrar notificaciones"
                >
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            </div>

            {askPerm && (
              <div className="mx-3 mt-3 p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
                <BellRing className="w-5 h-5 text-emerald-700 shrink-0" />
                <p className="text-xs text-emerald-900 flex-1">Recibe avisos aunque tengas la pestaña en segundo plano.</p>
                <button
                  type="button"
                  onClick={requestPermission}
                  className="px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold cursor-pointer shrink-0"
                >
                  Activar
                </button>
              </div>
            )}

            <ul className="flex-1 overflow-y-auto overscroll-contain py-1" data-testid="notif-list">
              {notifications.length === 0 && (
                <li className="px-6 py-10 text-center">
                  <Bell className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-neutral-700">Sin notificaciones</p>
                  <p className="text-xs text-neutral-500 mt-1">Aquí verás pedidos nuevos, avisos de tu plan y más.</p>
                </li>
              )}
              {notifications.map(n => {
                const st = TYPE_STYLE[n.type] || { icon: Bell, cls: 'bg-neutral-100 text-neutral-600' };
                const Icon = st.icon;
                return (
                  <li key={n.id}>
                    <button
                      type="button"
                      onClick={() => onItem(n)}
                      className={`w-full text-left flex gap-3 px-4 py-3 hover:bg-neutral-50 transition-colors cursor-pointer ${n.isRead ? '' : 'bg-emerald-50/50'}`}
                      data-testid="notif-item"
                    >
                      <span className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${st.cls}`}>
                        <Icon className="w-4 h-4" />
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`block text-sm leading-snug ${n.isRead ? 'text-neutral-700 font-medium' : 'text-neutral-900 font-bold'}`}>
                          {n.title}
                        </span>
                        {n.message && <span className="block text-xs text-neutral-500 mt-0.5 line-clamp-2">{n.message}</span>}
                        <span className="block text-[11px] text-neutral-400 mt-1">{timeAgo(n.createdAt)}</span>
                      </span>
                      {!n.isRead && <span className="w-2 h-2 rounded-full bg-emerald-600 mt-1.5 shrink-0" aria-label="Sin leer" />}
                    </button>
                  </li>
                );
              })}
            </ul>
          </div>
        </>
      )}
    </div>
  );
};

export default NotificationBell;
