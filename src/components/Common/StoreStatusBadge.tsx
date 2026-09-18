import React, { useState, useRef, useEffect } from 'react';
import { getStoreOpenStatus, StoreOpenStatus } from '../../utils/storeSchedule';
import {
  Clock,
  ChevronDown,
  Calendar,
  X,
  Sparkles,
  CheckCircle2,
  AlertCircle,
  Info
} from 'lucide-react';

interface StoreStatusBadgeProps {
  schedule?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg';
  showDetail?: boolean;
  interactive?: boolean;
  className?: string;
  storeName?: string;
}

export const StoreStatusBadge: React.FC<StoreStatusBadgeProps> = ({
  schedule,
  size = 'sm',
  showDetail = false,
  interactive = true,
  className = '',
  storeName
}) => {
  const [modalOpen, setModalOpen] = useState(false);
  const [statusInfo, setStatusInfo] = useState<StoreOpenStatus>(() => getStoreOpenStatus(schedule));

  // Recalculate status whenever schedule changes or every minute
  useEffect(() => {
    setStatusInfo(getStoreOpenStatus(schedule));
    const interval = setInterval(() => {
      setStatusInfo(getStoreOpenStatus(schedule));
    }, 60000); // Check every minute
    return () => clearInterval(interval);
  }, [schedule]);

  const currentDayIndex = new Date().getDay();

  // Color styles based on status
  const getBadgeColors = () => {
    switch (statusInfo.status) {
      case 'open':
        return {
          container: 'bg-emerald-50 text-emerald-800 border-emerald-200/90 hover:bg-emerald-100/70',
          dot: 'bg-emerald-500 shadow-xs shadow-emerald-500/50 animate-pulse',
          icon: 'text-emerald-600',
          detail: 'text-emerald-700 font-semibold'
        };
      case 'closing_soon':
        return {
          container: 'bg-amber-50 text-amber-900 border-amber-300 hover:bg-amber-100/70',
          dot: 'bg-amber-500 shadow-xs shadow-amber-500/50 animate-ping',
          icon: 'text-amber-600',
          detail: 'text-amber-800 font-semibold'
        };
      case 'closed':
        return {
          container: 'bg-rose-50 text-rose-800 border-rose-200/80 hover:bg-rose-100/70',
          dot: 'bg-rose-500',
          icon: 'text-rose-600',
          detail: 'text-rose-700 font-medium'
        };
      default:
        return {
          container: 'bg-neutral-100 text-neutral-700 border-neutral-200 hover:bg-neutral-200/70',
          dot: 'bg-neutral-400',
          icon: 'text-neutral-500',
          detail: 'text-neutral-600'
        };
    }
  };

  const colors = getBadgeColors();

  // Size variations
  const sizeClasses = {
    xs: 'text-[10px] px-2 py-0.5 gap-1',
    sm: 'text-[11px] px-2.5 py-1 gap-1.5',
    md: 'text-xs px-3 py-1.5 gap-2',
    lg: 'text-sm px-3.5 py-2 gap-2.5'
  };

  const dotSizes = {
    xs: 'w-1.5 h-1.5',
    sm: 'w-2 h-2',
    md: 'w-2.5 h-2.5',
    lg: 'w-3 h-3'
  };

  return (
    <>
      <div
        onClick={e => {
          if (interactive && statusInfo.hasSchedule) {
            e.stopPropagation();
            setModalOpen(true);
          }
        }}
        className={`inline-flex items-center rounded-full border font-bold select-none transition-all ${
          colors.container
        } ${sizeClasses[size]} ${
          interactive && statusInfo.hasSchedule
            ? 'cursor-pointer hover:shadow-xs active:scale-98'
            : 'cursor-default'
        } ${className}`}
        title={
          interactive && statusInfo.hasSchedule
            ? 'Haz clic para consultar los horarios completos de la semana'
            : undefined
        }
      >
        {/* Pulsing indicator dot */}
        <span className={`rounded-full shrink-0 ${colors.dot} ${dotSizes[size]}`} />

        {/* Primary status badge text */}
        <span className="tracking-tight whitespace-nowrap">{statusInfo.badgeText}</span>

        {/* Dropdown cue arrow if interactive */}
        {interactive && statusInfo.hasSchedule && (
          <ChevronDown className="w-3 h-3 opacity-60 ml-0.5 shrink-0" />
        )}
      </div>

      {/* Popover / Modal with weekly schedule breakdown */}
      {modalOpen && (
        <div
          onClick={e => {
            e.stopPropagation();
            setModalOpen(false);
          }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div
            onClick={e => e.stopPropagation()}
            className="bg-white w-full max-w-sm sm:max-w-md rounded-2xl shadow-2xl border border-neutral-200 overflow-hidden animate-in zoom-in-95 duration-150"
          >
            {/* Modal Header */}
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/80">
              <div className="flex items-center gap-2.5">
                <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                  statusInfo.isOpen ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'
                }`}>
                  <Clock className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-black text-neutral-900 leading-tight">
                    Horarios de Atención
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    {storeName || 'Atención al cliente & Pedidos WhatsApp'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg text-neutral-400 hover:text-neutral-800 hover:bg-neutral-200 transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Current status highlight box */}
            <div className="p-4 space-y-3">
              <div className={`p-3 rounded-xl border flex items-center justify-between ${
                statusInfo.isOpen
                  ? 'bg-emerald-50/80 border-emerald-200 text-emerald-900'
                  : 'bg-rose-50/80 border-rose-200 text-rose-900'
              }`}>
                <div className="flex items-center gap-2">
                  <span className={`w-2.5 h-2.5 rounded-full ${
                    statusInfo.isOpen ? 'bg-emerald-500 animate-pulse' : 'bg-rose-500'
                  }`} />
                  <div>
                    <span className="font-extrabold text-xs block leading-tight">
                      {statusInfo.badgeText}
                    </span>
                    <span className="text-[11px] opacity-80">
                      {statusInfo.detailText}
                    </span>
                  </div>
                </div>

                <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-md bg-white/80 border border-current/20">
                  Estado Actual
                </span>
              </div>

              {/* Weekly calendar table */}
              <div className="space-y-1 pt-1">
                <p className="text-[11px] font-bold text-neutral-500 uppercase tracking-wider px-1">
                  Semana Completa
                </p>

                <div className="rounded-xl border border-neutral-200 divide-y divide-neutral-100 overflow-hidden text-xs">
                  {(statusInfo.weeklyHours.length === 7
                    ? [...statusInfo.weeklyHours.slice(1), statusInfo.weeklyHours[0]]
                    : statusInfo.weeklyHours
                  ).map(day => {
                    const isToday = day.dayIndex === currentDayIndex;

                    return (
                      <div
                        key={day.dayIndex}
                        className={`p-2.5 flex items-center justify-between transition-colors ${
                          isToday
                            ? 'bg-emerald-50/60 font-bold text-neutral-900'
                            : 'hover:bg-neutral-50 text-neutral-700'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className={`w-14 text-xs ${isToday ? 'font-black text-emerald-800' : 'font-semibold text-neutral-800'}`}>
                            {day.dayName}
                          </span>
                          {isToday && (
                            <span className="px-1.5 py-0.5 rounded text-[9px] font-black uppercase tracking-wider bg-emerald-600 text-white shadow-3xs">
                              HOY
                            </span>
                          )}
                        </div>

                        <div className="text-right">
                          {day.isOpen && day.slots.length > 0 ? (
                            <span className={`font-mono text-xs ${isToday ? 'text-emerald-800 font-bold' : 'text-neutral-700'}`}>
                              {day.rawText}
                            </span>
                          ) : (
                            <span className="text-neutral-400 font-medium italic text-[11px]">
                              Cerrado
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Informative footer tip */}
              <div className="p-2.5 rounded-xl bg-neutral-100/80 border border-neutral-200/80 flex items-start gap-2 text-[11px] text-neutral-600">
                <Info className="w-3.5 h-3.5 text-neutral-500 shrink-0 mt-0.5" />
                <p className="leading-snug">
                  Puedes enviar tus pedidos por WhatsApp las 24 horas. El comercio procesará tu solicitud inmediatamente durante sus horarios de apertura.
                </p>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-3 border-t border-neutral-100 bg-neutral-50 text-right">
              <button
                type="button"
                onClick={() => setModalOpen(false)}
                className="px-4 py-1.5 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold cursor-pointer transition-colors"
              >
                Entendido
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
