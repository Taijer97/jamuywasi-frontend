import React, { useEffect, useState } from 'react';
import { api } from '../../services/api';
import { VisitsDashboard } from '../../types';
import { Eye, Globe, Store, TrendingUp, RefreshCw } from 'lucide-react';

const RANGE_OPTIONS: { value: number; label: string }[] = [
  { value: 7, label: '7 días' },
  { value: 30, label: '30 días' },
  { value: 90, label: '90 días' },
];

function fillTrend(trend: { date: string; visits: number }[], days: number): { date: string; visits: number }[] {
  const byDate = new Map(trend.map(p => [p.date, p.visits]));
  const out: { date: string; visits: number }[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const key = d.toISOString().slice(0, 10);
    out.push({ date: key, visits: byDate.get(key) || 0 });
  }
  return out;
}

const TrendChart: React.FC<{ data: { date: string; visits: number }[]; barClassName: string }> = ({ data, barClassName }) => {
  const max = Math.max(1, ...data.map(p => p.visits));
  return (
    <div className="flex items-end gap-[3px] h-28">
      {data.map(p => (
        <div key={p.date} className="flex-1 group relative flex items-end h-full">
          <div
            className={`w-full rounded-t-sm ${barClassName} transition-all`}
            style={{ height: `${Math.max(2, (p.visits / max) * 100)}%` }}
          />
          <div className="pointer-events-none absolute -top-8 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity bg-neutral-900 text-white text-[10px] font-bold px-2 py-1 rounded-lg whitespace-nowrap z-10">
            {new Date(p.date + 'T00:00:00').toLocaleDateString('es-PE', { day: '2-digit', month: 'short' })}: {p.visits}
          </div>
        </div>
      ))}
    </div>
  );
};

export const VisitsAnalyticsTab: React.FC = () => {
  const [data, setData] = useState<VisitsDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [days, setDays] = useState(30);

  const load = async (period: number) => {
    setLoading(true);
    setError('');
    try {
      const dashboard = await api.getVisitsDashboard(period);
      setData(dashboard);
    } catch (e) {
      setError('No se pudo cargar el dashboard de visitas. Intenta de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load(days);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [days]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900">Visitas a la Plataforma</h2>
          <p className="text-xs text-neutral-500">
            Vistas orgánicas (deduplicadas por IP) a la página principal y a los catálogos de tiendas.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex rounded-xl border border-neutral-200 bg-white p-0.5 shadow-2xs">
            {RANGE_OPTIONS.map(opt => (
              <button
                key={opt.value}
                onClick={() => setDays(opt.value)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors cursor-pointer ${
                  days === opt.value ? 'bg-purple-600 text-white' : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
          <button
            onClick={() => load(days)}
            className="p-2 rounded-xl border border-neutral-200 bg-white text-neutral-500 hover:bg-neutral-100 cursor-pointer"
            title="Actualizar"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {error && (
        <div className="p-4 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 text-xs font-semibold">
          {error}
        </div>
      )}

      {!data && loading && (
        <div className="p-12 text-center text-neutral-400 text-xs">Cargando estadísticas de visitas...</div>
      )}

      {data && (
        <>
          {/* KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
                <span>Visitas a la Landing</span>
                <div className="w-8 h-8 rounded-lg bg-indigo-50 text-indigo-600 flex items-center justify-center">
                  <Globe className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-neutral-900">{data.landing.total}</div>
              <p className="mt-1 text-[11px] text-neutral-500">{data.landing.today} hoy</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
                <span>Visitas a Tiendas</span>
                <div className="w-8 h-8 rounded-lg bg-sky-50 text-sky-600 flex items-center justify-center">
                  <Store className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-neutral-900">{data.stores.total}</div>
              <p className="mt-1 text-[11px] text-neutral-500">{data.stores.today} hoy</p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
                <span>Tienda Más Visitada</span>
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <TrendingUp className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-base font-black text-neutral-900 truncate">
                {data.stores.topStores[0]?.storeName || '—'}
              </div>
              <p className="mt-1 text-[11px] text-neutral-500">
                {data.stores.topStores[0] ? `${data.stores.topStores[0].visits} visitas` : 'Sin datos aún'}
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <div className="flex items-center justify-between text-neutral-500 text-xs font-medium">
                <span>Total Visitas Plataforma</span>
                <div className="w-8 h-8 rounded-lg bg-purple-50 text-purple-600 flex items-center justify-center">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
              <div className="mt-2 text-2xl font-black text-neutral-900">{data.landing.total + data.stores.total}</div>
              <p className="mt-1 text-[11px] text-neutral-500">Landing + catálogos de tiendas</p>
            </div>
          </div>

          {/* Trend charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-neutral-900 mb-4">Tendencia · Página Principal</h3>
              <TrendChart data={fillTrend(data.landing.trend, days)} barClassName="bg-indigo-500" />
            </div>
            <div className="p-5 rounded-2xl bg-white border border-neutral-200/80 shadow-xs">
              <h3 className="text-sm font-bold text-neutral-900 mb-4">Tendencia · Catálogos de Tiendas</h3>
              <TrendChart data={fillTrend(data.stores.trend, days)} barClassName="bg-sky-500" />
            </div>
          </div>

          {/* Top stores table */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
            <div className="p-4 border-b border-neutral-200">
              <h3 className="text-sm font-bold text-neutral-900">Tiendas Más Visitadas</h3>
              <p className="text-xs text-neutral-500">Ranking histórico por visitas orgánicas al catálogo.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
                  <tr>
                    <th className="py-3 px-4">#</th>
                    <th className="py-3 px-4">Tienda</th>
                    <th className="py-3 px-4 text-right">Visitas</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-100">
                  {data.stores.topStores.length > 0 ? (
                    data.stores.topStores.map((s, i) => (
                      <tr key={s.storeId} className="hover:bg-neutral-50/50">
                        <td className="py-3 px-4 font-bold text-neutral-400">{i + 1}</td>
                        <td className="py-3 px-4 font-bold text-neutral-900">{s.storeName}</td>
                        <td className="py-3 px-4 text-right font-extrabold text-neutral-900">{s.visits}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={3} className="py-10 text-center text-neutral-400">
                        Aún no hay visitas registradas.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};
