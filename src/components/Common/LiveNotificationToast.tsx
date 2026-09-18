import React, { useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { ShoppingBag, CheckCircle2, AlertTriangle, Info, X, ExternalLink, UserPlus, KeyRound, Sparkles } from 'lucide-react';

export const LiveNotificationToast: React.FC = () => {
  const { liveNotifications, dismissLiveNotification } = useApp();

  useEffect(() => {
    if (liveNotifications.length === 0) return;
    const timer = setTimeout(() => {
      // Dismiss the oldest notification after 6.5 seconds
      if (liveNotifications.length > 0) {
        dismissLiveNotification(liveNotifications[liveNotifications.length - 1].id);
      }
    }, 6500);
    return () => clearTimeout(timer);
  }, [liveNotifications, dismissLiveNotification]);

  if (!liveNotifications || liveNotifications.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-50 flex flex-col gap-2.5 max-w-sm w-full pointer-events-none">
      {liveNotifications.map((notif) => {
        const isOrder = notif.type === 'order';
        const isApproval = notif.type === 'approval' || notif.type === 'payment' || notif.type === 'success';
        const isPinReset = notif.type === 'pin_reset' || notif.type === 'pin';
        const isUser = notif.type === 'user';
        const isWarning = notif.type === 'warning';

        const bgBorder = isOrder
          ? 'bg-neutral-950/95 border-emerald-500/50 text-white shadow-emerald-500/10'
          : isApproval
          ? 'bg-neutral-950/95 border-indigo-500/50 text-white shadow-indigo-500/10'
          : isPinReset
          ? 'bg-neutral-950/95 border-amber-500/50 text-white shadow-amber-500/10'
          : isUser
          ? 'bg-neutral-950/95 border-sky-500/50 text-white shadow-sky-500/10'
          : isWarning
          ? 'bg-neutral-950/95 border-rose-500/50 text-white shadow-rose-500/10'
          : 'bg-neutral-950/95 border-neutral-700 text-white';

        return (
          <div
            key={notif.id}
            className={`pointer-events-auto rounded-2xl border backdrop-blur-md shadow-2xl p-4 flex items-start gap-3 transition-all animate-in fade-in slide-in-from-top-3 duration-300 ${bgBorder}`}
          >
            <div className="shrink-0 mt-0.5">
              {isOrder && (
                <div className="w-9 h-9 rounded-xl bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center animate-bounce">
                  <ShoppingBag className="w-5 h-5" />
                </div>
              )}
              {isApproval && (
                <div className="w-9 h-9 rounded-xl bg-indigo-500/20 text-indigo-400 border border-indigo-500/30 flex items-center justify-center animate-pulse">
                  {notif.type === 'payment' ? <Sparkles className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
                </div>
              )}
              {isPinReset && (
                <div className="w-9 h-9 rounded-xl bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center justify-center animate-pulse">
                  <KeyRound className="w-5 h-5" />
                </div>
              )}
              {isUser && (
                <div className="w-9 h-9 rounded-xl bg-sky-500/20 text-sky-400 border border-sky-500/30 flex items-center justify-center">
                  <UserPlus className="w-5 h-5" />
                </div>
              )}
              {isWarning && (
                <div className="w-9 h-9 rounded-xl bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center justify-center">
                  <AlertTriangle className="w-5 h-5" />
                </div>
              )}
              {!isOrder && !isApproval && !isPinReset && !isUser && !isWarning && (
                <div className="w-9 h-9 rounded-xl bg-neutral-800 text-neutral-300 border border-neutral-700 flex items-center justify-center">
                  <Info className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-1">
                <h4 className="text-xs font-black tracking-tight truncate text-white">
                  {notif.title}
                </h4>
                <button
                  type="button"
                  onClick={() => dismissLiveNotification(notif.id)}
                  className="text-neutral-400 hover:text-white p-0.5 rounded-lg transition-colors cursor-pointer"
                  title="Cerrar notificación"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>

              <p className="text-xs text-neutral-300 mt-0.5 line-clamp-2 leading-relaxed">
                {notif.message}
              </p>

              {notif.actionLabel && notif.onAction && (
                <button
                  type="button"
                  onClick={() => {
                    notif.onAction?.();
                    dismissLiveNotification(notif.id);
                  }}
                  className="mt-2 text-[11px] font-bold text-emerald-400 hover:text-emerald-300 flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <span>{notif.actionLabel}</span>
                  <ExternalLink className="w-3 h-3" />
                </button>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
};
