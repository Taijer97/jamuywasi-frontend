import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { PromoCode } from '../../types';
import {
  Tag,
  Plus,
  Trash2,
  Check,
  Copy,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  Percent,
  DollarSign,
  Calendar,
  AlertCircle,
  Clock,
  X,
  RefreshCw,
  Search
} from 'lucide-react';

export const PromoCodesTab: React.FC = () => {
  const [promos, setPromos] = useState<PromoCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [code, setCode] = useState('');
  const [discountType, setDiscountType] = useState<'percentage' | 'fixed'>('percentage');
  const [discountValue, setDiscountValue] = useState<number>(10);
  const [maxUses, setMaxUses] = useState<number>(0);
  const [validUntil, setValidUntil] = useState<string>('');
  const [applicablePlan, setApplicablePlan] = useState<string>('all');
  const [formError, setFormError] = useState<string | null>(null);
  const [creating, setCreating] = useState(false);

  const fetchPromos = async () => {
    setLoading(true);
    try {
      const data = await api.getPromoCodes();
      setPromos(data);
    } catch (err: any) {
      console.error('Error al cargar cupones:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPromos();
  }, []);

  const handleCopy = (promoCode: string, id: string) => {
    navigator.clipboard.writeText(promoCode);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleToggle = async (id: string) => {
    try {
      const updated = await api.togglePromoCode(id);
      setPromos(prev => prev.map(p => p.id === id ? updated : p));
    } catch (err: any) {
      alert(err.message || 'Error al cambiar estado');
    }
  };

  const handleDelete = async (id: string, codeName: string) => {
    if (!window.confirm(`¿Estás seguro de eliminar permanentemente el cupón "${codeName}"?`)) return;
    try {
      await api.deletePromoCode(id);
      setPromos(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      alert(err.message || 'Error al eliminar cupón');
    }
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    const cleanCode = code.trim().toUpperCase();
    if (!cleanCode) {
      setFormError('Ingresa un código.');
      return;
    }

    if (discountValue <= 0) {
      setFormError('El valor del descuento debe ser mayor a 0.');
      return;
    }

    if (discountType === 'percentage' && discountValue > 100) {
      setFormError('El porcentaje no puede ser mayor a 100%.');
      return;
    }

    setCreating(true);
    try {
      const newPromo = await api.createPromoCode({
        code: cleanCode,
        discountType,
        discountValue: Number(discountValue),
        maxUses: Number(maxUses) || 0,
        validUntil: validUntil ? new Date(validUntil).toISOString() : null,
        applicablePlan: applicablePlan || 'all',
        isActive: true
      });

      setPromos(prev => [newPromo, ...prev]);
      setIsCreateOpen(false);
      setCode('');
      setDiscountValue(10);
      setMaxUses(0);
      setValidUntil('');
      setApplicablePlan('all');
    } catch (err: any) {
      setFormError(err.message || 'Error al crear código');
    } finally {
      setCreating(false);
    }
  };

  const filtered = promos.filter(p =>
    p.code.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Top Banner & Action */}
      <div className="bg-white p-6 rounded-2xl border border-neutral-200/80 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Tag className="w-4 h-4" />
            </div>
            <h3 className="text-base font-black text-neutral-900">
              Códigos de Promoción & Cupones de Suscripción
            </h3>
          </div>
          <p className="text-xs text-neutral-500 mt-1">
            Genera cupones con descuento porcentual o en soles para incentivar la suscripción de nuevos comerciantes.
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <button
            type="button"
            onClick={fetchPromos}
            className="p-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-600 transition-colors cursor-pointer"
            title="Recargar lista"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black text-xs flex items-center justify-center gap-1.5 shadow-md shadow-purple-600/20 transition-colors cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            <span>Nuevo Código Promocional</span>
          </button>
        </div>
      </div>

      {/* Table Container */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="p-4 border-b border-neutral-200 flex items-center justify-between gap-3 bg-neutral-50/50">
          <div className="relative w-full sm:w-72">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
            <input
              type="text"
              placeholder="Buscar por código..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-hidden focus:ring-2 focus:ring-purple-600 font-medium"
            />
          </div>

          <span className="text-xs font-bold text-neutral-500">
            {filtered.length} cupón(es)
          </span>
        </div>

        {loading ? (
          <div className="py-12 text-center text-xs text-neutral-400">
            Cargando cupones promocionales...
          </div>
        ) : filtered.length === 0 ? (
          <div className="py-12 text-center space-y-2">
            <Tag className="w-10 h-10 text-neutral-300 mx-auto" />
            <p className="text-xs font-bold text-neutral-500">No hay códigos promocionales registrados</p>
            <p className="text-[11px] text-neutral-400">Crea el primer cupón para tus comerciantes con el botón superior.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-neutral-600">
              <thead className="bg-neutral-50 text-neutral-500 font-extrabold uppercase text-[10px] tracking-wider border-b border-neutral-200">
                <tr>
                  <th className="py-3.5 px-4">Código</th>
                  <th className="py-3.5 px-4">Tipo & Descuento</th>
                  <th className="py-3.5 px-4">Plan Aplicable</th>
                  <th className="py-3.5 px-4">Usos / Límite</th>
                  <th className="py-3.5 px-4">Vigencia</th>
                  <th className="py-3.5 px-4">Estado</th>
                  <th className="py-3.5 px-4 text-right">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-100">
                {filtered.map(promo => {
                  const isExpired = promo.validUntil && new Date(promo.validUntil).getTime() < Date.now();
                  const isExhausted = promo.maxUses > 0 && promo.usedCount >= promo.maxUses;

                  return (
                    <tr key={promo.id} className="hover:bg-neutral-50/70 transition-colors">
                      {/* Código */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-sm text-neutral-900 px-2 py-0.5 rounded-lg bg-neutral-100 border border-neutral-200">
                            {promo.code}
                          </span>
                          <button
                            type="button"
                            onClick={() => handleCopy(promo.code, promo.id)}
                            className="p-1 rounded-md text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer transition-colors"
                            title="Copiar código"
                          >
                            {copiedId === promo.id ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                          </button>
                        </div>
                      </td>

                      {/* Tipo y Descuento */}
                      <td className="py-3.5 px-4">
                        <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-xl bg-purple-50 text-purple-800 font-black text-xs border border-purple-200">
                          {promo.discountType === 'percentage' ? (
                            <>
                              <Percent className="w-3 h-3 text-purple-600" />
                              <span>{promo.discountValue}% de descuento</span>
                            </>
                          ) : (
                            <>
                              <DollarSign className="w-3 h-3 text-purple-600" />
                              <span>S/ {promo.discountValue.toFixed(2)} de descuento</span>
                            </>
                          )}
                        </div>
                      </td>

                      {/* Plan Aplicable */}
                      <td className="py-3.5 px-4">
                        {promo.applicablePlan === 'starter' ? (
                          <span className="px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-800 text-[10px] font-bold border border-emerald-200">
                            Solo Emprendedor
                          </span>
                        ) : promo.applicablePlan === 'pro' ? (
                          <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-800 text-[10px] font-bold border border-indigo-200">
                            Solo Crecimiento Pro
                          </span>
                        ) : promo.applicablePlan === 'business' ? (
                          <span className="px-2 py-0.5 rounded-md bg-purple-50 text-purple-800 text-[10px] font-bold border border-purple-200">
                            Solo Negocio Escala
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[10px] font-bold border border-neutral-200">
                            Todos los Planes
                          </span>
                        )}
                      </td>

                      {/* Usos */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-neutral-800">
                          {promo.usedCount}
                        </span>
                        <span className="text-neutral-400 font-medium">
                          {' '}/ {promo.maxUses === 0 ? '∞ Ilimitado' : promo.maxUses}
                        </span>
                        {isExhausted && (
                          <span className="block text-[9px] font-black text-rose-600 uppercase">
                            Agotado
                          </span>
                        )}
                      </td>

                      {/* Vigencia */}
                      <td className="py-3.5 px-4">
                        {promo.validUntil ? (
                          <div className="space-y-0.5">
                            <span className="text-[11px] font-medium block">
                              Hasta {new Date(promo.validUntil).toLocaleDateString('es-PE')}
                            </span>
                            {isExpired && (
                              <span className="inline-flex items-center gap-0.5 text-[9px] font-black text-rose-600 uppercase">
                                Expirado
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="text-[11px] text-neutral-400 font-medium">
                            Permanente (Sin caducidad)
                          </span>
                        )}
                      </td>

                      {/* Estado */}
                      <td className="py-3.5 px-4">
                        <button
                          type="button"
                          onClick={() => handleToggle(promo.id)}
                          className="cursor-pointer"
                          title={promo.isActive ? 'Desactivar cupón' : 'Activar cupón'}
                        >
                          {promo.isActive ? (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                              <ToggleRight className="w-3.5 h-3.5 text-emerald-600" />
                              <span>Activo</span>
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-neutral-100 text-neutral-600">
                              <ToggleLeft className="w-3.5 h-3.5 text-neutral-400" />
                              <span>Inactivo</span>
                            </span>
                          )}
                        </button>
                      </td>

                      {/* Acciones */}
                      <td className="py-3.5 px-4 text-right">
                        <button
                          type="button"
                          onClick={() => handleDelete(promo.id, promo.code)}
                          className="p-1.5 rounded-lg border border-neutral-200 bg-white hover:bg-rose-50 hover:text-rose-600 text-neutral-400 transition-colors cursor-pointer"
                          title="Eliminar cupón"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Modal de Creación de Cupón */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/70 backdrop-blur-xs">
          <div className="bg-white rounded-3xl p-6 sm:p-7 max-w-md w-full shadow-2xl border border-neutral-200 space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
                  <Plus className="w-4 h-4" />
                </div>
                <h3 className="text-base font-black text-neutral-900">
                  Nuevo Código Promocional
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full text-neutral-400 hover:text-neutral-700 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleCreate} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Código del Cupón *
                </label>
                <input
                  type="text"
                  required
                  placeholder="Ej. VERANO2026"
                  value={code}
                  onChange={e => setCode(e.target.value.toUpperCase())}
                  className="w-full px-3.5 py-2.5 rounded-xl border border-neutral-300 font-mono font-black uppercase text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                />
              </div>

              <div>
                <label className="font-bold text-neutral-700 block mb-1">
                  Plan de Suscripción Aplicable
                </label>
                <select
                  value={applicablePlan}
                  onChange={e => setApplicablePlan(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-600 bg-white"
                >
                  <option value="all">🌟 Todos los Planes (Sin restricción)</option>
                  <option value="starter">🌱 Solo Plan Emprendedor (S/ 10/mes)</option>
                  <option value="pro">🚀 Solo Plan Crecimiento Pro (S/ 25/mes)</option>
                  <option value="business">👑 Solo Plan Negocio Escala (S/ 50/mes)</option>
                </select>
                <span className="text-[10px] text-neutral-400 block mt-0.5">
                  Restringe el cupón a un plan específico para evitar que se use en otros planes.
                </span>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Tipo de Descuento
                  </label>
                  <select
                    value={discountType}
                    onChange={e => setDiscountType(e.target.value as any)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-600 bg-white"
                  >
                    <option value="percentage">Porcentaje (%)</option>
                    <option value="fixed">Monto Fijo (S/)</option>
                  </select>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Valor del Descuento *
                  </label>
                  <input
                    type="number"
                    min="1"
                    max={discountType === 'percentage' ? 100 : 1000}
                    step="any"
                    required
                    value={discountValue}
                    onChange={e => setDiscountValue(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-black text-sm focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Límite de Usos
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0 = ilimitado"
                    value={maxUses}
                    onChange={e => setMaxUses(Number(e.target.value))}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-bold focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                  />
                  <span className="text-[10px] text-neutral-400 block mt-0.5">0 para usos ilimitados</span>
                </div>

                <div>
                  <label className="font-bold text-neutral-700 block mb-1">
                    Fecha de Vencimiento
                  </label>
                  <input
                    type="date"
                    value={validUntil}
                    onChange={e => setValidUntil(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-xl border border-neutral-300 font-semibold focus:outline-hidden focus:ring-2 focus:ring-purple-600"
                  />
                  <span className="text-[10px] text-neutral-400 block mt-0.5">Opcional</span>
                </div>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="flex-1 py-2.5 rounded-xl border border-neutral-200 text-neutral-700 font-bold hover:bg-neutral-50 cursor-pointer transition-colors"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={creating}
                  className="flex-1 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-black shadow-md transition-colors cursor-pointer disabled:opacity-50"
                >
                  {creating ? 'Guardando...' : 'Crear Cupón'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
