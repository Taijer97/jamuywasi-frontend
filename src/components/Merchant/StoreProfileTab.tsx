import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StoreConfig } from '../../types';
import { DEFAULT_STORE_BANNER, DEFAULT_STORE_LOGO } from '../../data/initialData';
import {
  Store,
  Image as ImageIcon,
  Save,
  Check,
  MapPin,
  Clock,
  ExternalLink,
  Sparkles,
  Link,
  Instagram,
  Facebook,
  Upload,
  RefreshCw,
  Eye,
  Calendar,
  Sun,
  Sunset,
  Moon,
  Plus,
  Trash2,
  CheckCircle2,
  Copy,
  Share2,
  Globe,
  MessageCircle
} from 'lucide-react';
import { StoreStatusBadge } from '../Common/StoreStatusBadge';

const LOGO_PRESETS = [
  { label: 'Moda / Ropa', url: 'https://images.unsplash.com/photo-1543163521-1bf539c55dd2?w=300&auto=format&fit=crop&q=80' },
  { label: 'Cafetería / Gourmet', url: 'https://images.unsplash.com/photo-1501339847302-ac426a4a7cbb?w=300&auto=format&fit=crop&q=80' },
  { label: 'Calzado / Sneakers', url: 'https://images.unsplash.com/photo-1552346154-21d32810aba3?w=300&auto=format&fit=crop&q=80' },
  { label: 'Tecnología / Gadgets', url: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&auto=format&fit=crop&q=80' },
  { label: 'Belleza / Cosméticos', url: 'https://images.unsplash.com/photo-1522335789203-aabd1fc54bc9?w=300&auto=format&fit=crop&q=80' },
  { label: 'Hogar / Deco', url: 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=300&auto=format&fit=crop&q=80' },
];

const BANNER_PRESETS = [
  { label: 'Boutique Minimal', url: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=1400&auto=format&fit=crop&q=80' },
  { label: 'Cafetería & Granos', url: 'https://images.unsplash.com/photo-1495474472287-4d71bcdd2085?w=1400&auto=format&fit=crop&q=80' },
  { label: 'Urban & Streetwear', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=1400&auto=format&fit=crop&q=80' },
  { label: 'Tech & Moderno', url: 'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=1400&auto=format&fit=crop&q=80' },
];

import {
  ScheduleTimeSlot,
  DayScheduleItem,
  DEFAULT_DAYS_SCHEDULE,
  parseScheduleToDaysSchedule,
} from '../../utils/storeSchedule';

export type { ScheduleTimeSlot, DayScheduleItem };

export const StoreProfileTab: React.FC = () => {
  const { currentStore, updateStoreConfig, openStoreCatalog, uploadImage } = useApp();

  const [form, setForm] = useState<StoreConfig>({ ...currentStore });
  const [savedSuccess, setSavedSuccess] = useState(false);
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  const [isUploadingBanner, setIsUploadingBanner] = useState(false);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const bannerInputRef = React.useRef<HTMLInputElement>(null);

  // Sharing state & clean public URL
  const [copiedLink, setCopiedLink] = useState(false);
  const effectiveSlug = form.slug || currentStore.slug || currentStore.id;
  const storePublicUrl = typeof window !== 'undefined'
    ? `${window.location.origin}/${effectiveSlug}`
    : `/${effectiveSlug}`;

  const handleCopyLink = () => {
    if (typeof navigator !== 'undefined') {
      navigator.clipboard.writeText(storePublicUrl);
      setCopiedLink(true);
      setTimeout(() => setCopiedLink(false), 2500);
    }
  };

  const handleShareWhatsApp = () => {
    const text = encodeURIComponent(
      `🛍️ ¡Hola! Te invito a visitar nuestra tienda oficial *${form.name}* en JamuyWasi:\n${storePublicUrl}\n¡Haz tu pedido directo por WhatsApp!`
    );
    window.open(`https://api.whatsapp.com/send?text=${text}`, '_blank');
  };

  // Schedule Mode: 'fixed' (Asistente por días independientes y turnos) vs 'manual' (Texto libre)
  const [scheduleMode, setScheduleMode] = useState<'fixed' | 'manual'>('fixed');

  // Schedule Time Slot & Day Model (inicializado a partir del horario guardado de la tienda)
  const [daysSchedule, setDaysSchedule] = useState<DayScheduleItem[]>(() =>
    parseScheduleToDaysSchedule(currentStore.schedule)
  );

  // Sincronizar formulario y horario cuando se cargue o cambie la tienda seleccionada
  React.useEffect(() => {
    if (currentStore) {
      setForm(prev => ({ ...prev, ...currentStore }));
      setDaysSchedule(parseScheduleToDaysSchedule(currentStore.schedule));
    }
  }, [currentStore?.id, currentStore?.schedule]);

  // Helper format time to 12h
  const formatTime12h = (time24: string) => {
    if (!time24) return '';
    const [hStr, mStr] = time24.split(':');
    let h = parseInt(hStr, 10);
    if (isNaN(h)) return '';
    const m = mStr || '00';
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; // 0 -> 12
    return `${h}:${m} ${ampm}`;
  };

  // Compile structured schedule per day into a clean, human-readable string
  const compileDaysScheduleToString = (schedule: DayScheduleItem[]): string => {
    const openDays = schedule.filter(d => d.isOpen && d.slots.length > 0);
    if (openDays.length === 0) return 'Cerrado temporalmente';

    // Format slots string for each day
    const daySlotMap = new Map<string, string>();
    for (const day of openDays) {
      const validSlots = day.slots.filter(s => s.open && s.close);
      if (validSlots.length > 0) {
        daySlotMap.set(
          day.dayId,
          validSlots.map(s => `${formatTime12h(s.open)} - ${formatTime12h(s.close)}`).join(' / ')
        );
      }
    }

    if (daySlotMap.size === 0) return 'Cerrado temporalmente';

    // Group days by identical slot string, preserving day order
    const groups: { slotString: string; dayIds: string[] }[] = [];
    const processedDays = new Set<string>();

    for (const day of openDays) {
      if (processedDays.has(day.dayId) || !daySlotMap.has(day.dayId)) continue;
      const currentSlots = daySlotMap.get(day.dayId)!;
      const matchingDays = openDays
        .filter(d => daySlotMap.get(d.dayId) === currentSlots)
        .map(d => d.dayId);
      matchingDays.forEach(id => processedDays.add(id));
      groups.push({ slotString: currentSlots, dayIds: matchingDays });
    }

    // Format day names for each group
    const parts: string[] = [];
    for (const group of groups) {
      let daysLabel = '';
      const ids = group.dayIds;

      if (ids.length === 7) {
        daysLabel = 'Lun a Dom';
      } else if (ids.length === 6 && !ids.includes('dom')) {
        daysLabel = 'Lun a Sáb';
      } else if (ids.length === 5 && !ids.includes('sab') && !ids.includes('dom')) {
        daysLabel = 'Lun a Vie';
      } else {
        daysLabel = ids.map(id => schedule.find(d => d.dayId === id)?.short || id).join(', ');
      }

      parts.push(`${daysLabel}: ${group.slotString}`);
    }

    return parts.join(' | ');
  };

  // Toggle day open/closed
  const handleToggleDayOpen = (dayId: string) => {
    setDaysSchedule(prev => {
      const updated = prev.map(day => {
        if (day.dayId !== dayId) return day;
        const nextIsOpen = !day.isOpen;
        const nextSlots = nextIsOpen && day.slots.length === 0
          ? [{ id: `${dayId}-${Date.now()}`, open: '08:00', close: '13:00' }]
          : day.slots;
        return { ...day, isOpen: nextIsOpen, slots: nextSlots };
      });
      const str = compileDaysScheduleToString(updated);
      setForm(f => ({ ...f, schedule: str }));
      return updated;
    });
  };

  // Add another time slot to a specific day
  const handleAddSlotToDay = (dayId: string) => {
    setDaysSchedule(prev => {
      const updated = prev.map(day => {
        if (day.dayId !== dayId) return day;
        let nextOpen = '14:30';
        let nextClose = '19:30';
        if (day.slots.length === 0) {
          nextOpen = '08:00';
          nextClose = '13:00';
        } else if (day.slots.length === 1) {
          nextOpen = '14:30';
          nextClose = '19:30';
        } else if (day.slots.length >= 2) {
          nextOpen = '20:00';
          nextClose = '23:00';
        }
        const newSlot: ScheduleTimeSlot = {
          id: `${dayId}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          open: nextOpen,
          close: nextClose,
        };
        return {
          ...day,
          isOpen: true,
          slots: [...day.slots, newSlot],
        };
      });
      const str = compileDaysScheduleToString(updated);
      setForm(f => ({ ...f, schedule: str }));
      return updated;
    });
  };

  // Remove a time slot from a day ("donde no se ponga la hora ese día no se abre")
  const handleRemoveSlotFromDay = (dayId: string, slotId: string) => {
    setDaysSchedule(prev => {
      const updated = prev.map(day => {
        if (day.dayId !== dayId) return day;
        const nextSlots = day.slots.filter(s => s.id !== slotId);
        return {
          ...day,
          isOpen: nextSlots.length > 0,
          slots: nextSlots,
        };
      });
      const str = compileDaysScheduleToString(updated);
      setForm(f => ({ ...f, schedule: str }));
      return updated;
    });
  };

  // Update open or close time for a slot
  const handleUpdateSlotTime = (dayId: string, slotId: string, field: 'open' | 'close', value: string) => {
    setDaysSchedule(prev => {
      const updated = prev.map(day => {
        if (day.dayId !== dayId) return day;
        const nextSlots = day.slots.map(slot => {
          if (slot.id !== slotId) return slot;
          return { ...slot, [field]: value };
        });
        return { ...day, slots: nextSlots };
      });
      const str = compileDaysScheduleToString(updated);
      setForm(f => ({ ...f, schedule: str }));
      return updated;
    });
  };

  // Copy one day's hours to weekdays (Lunes a Viernes)
  const handleCopyDayToWeekdays = (sourceDayId: string) => {
    setDaysSchedule(prev => {
      const source = prev.find(d => d.dayId === sourceDayId);
      if (!source) return prev;
      const weekdays = ['lun', 'mar', 'mie', 'jue', 'vie'];
      const updated = prev.map(day => {
        if (!weekdays.includes(day.dayId)) return day;
        return {
          ...day,
          isOpen: source.isOpen,
          slots: source.slots.map((s, idx) => ({
            id: `${day.dayId}-${idx}-${Date.now()}`,
            open: s.open,
            close: s.close,
          })),
        };
      });
      const str = compileDaysScheduleToString(updated);
      setForm(f => ({ ...f, schedule: str }));
      return updated;
    });
  };

  // Copy one day's hours to all days (Lunes a Domingo)
  const handleCopyDayToAll = (sourceDayId: string) => {
    setDaysSchedule(prev => {
      const source = prev.find(d => d.dayId === sourceDayId);
      if (!source) return prev;
      const updated = prev.map(day => ({
        ...day,
        isOpen: source.isOpen,
        slots: source.slots.map((s, idx) => ({
          id: `${day.dayId}-${idx}-${Date.now()}`,
          open: s.open,
          close: s.close,
        })),
      }));
      const str = compileDaysScheduleToString(updated);
      setForm(f => ({ ...f, schedule: str }));
      return updated;
    });
  };

  // Quick Presets
  const applyPresetSchedule = (type: 'standard_retail' | 'continuous' | 'all_days') => {
    let newSchedule: DayScheduleItem[] = [];
    if (type === 'standard_retail') {
      // Lun-Vie mañana y tarde, Sábado medio día (mañana), Domingo cerrado
      newSchedule = [
        ...['lun', 'mar', 'mie', 'jue', 'vie'].map(id => ({
          dayId: id as any,
          name: DEFAULT_DAYS_SCHEDULE.find(d => d.dayId === id)!.name,
          short: DEFAULT_DAYS_SCHEDULE.find(d => d.dayId === id)!.short,
          isOpen: true,
          slots: [
            { id: `${id}-1`, open: '08:00', close: '13:00' },
            { id: `${id}-2`, open: '14:30', close: '19:30' },
          ],
        })),
        {
          dayId: 'sab',
          name: 'Sábado',
          short: 'Sáb',
          isOpen: true,
          slots: [{ id: 'sab-1', open: '08:00', close: '13:00' }],
        },
        {
          dayId: 'dom',
          name: 'Domingo',
          short: 'Dom',
          isOpen: false,
          slots: [],
        },
      ];
    } else if (type === 'continuous') {
      // Lun a Sáb corrido (9:00 AM - 7:00 PM)
      newSchedule = [
        ...['lun', 'mar', 'mie', 'jue', 'vie', 'sab'].map(id => ({
          dayId: id as any,
          name: DEFAULT_DAYS_SCHEDULE.find(d => d.dayId === id)!.name,
          short: DEFAULT_DAYS_SCHEDULE.find(d => d.dayId === id)!.short,
          isOpen: true,
          slots: [{ id: `${id}-1`, open: '09:00', close: '19:00' }],
        })),
        {
          dayId: 'dom',
          name: 'Domingo',
          short: 'Dom',
          isOpen: false,
          slots: [],
        },
      ];
    } else if (type === 'all_days') {
      // Todos los días (Lun - Dom) 8:30 AM - 1:00 PM y 2:30 PM - 8:00 PM
      newSchedule = DEFAULT_DAYS_SCHEDULE.map(d => ({
        ...d,
        isOpen: true,
        slots: [
          { id: `${d.dayId}-1`, open: '08:30', close: '13:00' },
          { id: `${d.dayId}-2`, open: '14:30', close: '20:00' },
        ],
      }));
    }

    setDaysSchedule(newSchedule);
    const str = compileDaysScheduleToString(newSchedule);
    setForm(f => ({ ...f, schedule: str }));
  };

  // Sync if currentStore changes
  React.useEffect(() => {
    setForm({ ...currentStore });
  }, [currentStore]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreConfig(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingLogo(true);
    try {
      const res = await uploadImage(file, 'logos');
      setForm(prev => ({ ...prev, logo: res.url }));
    } catch (err: any) {
      alert(err.message || 'Error al subir logo');
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleBannerUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingBanner(true);
    try {
      const res = await uploadImage(file, 'banners');
      setForm(prev => ({ ...prev, banner: res.url }));
    } catch (err: any) {
      alert(err.message || 'Error al subir banner');
    } finally {
      setIsUploadingBanner(false);
    }
  };

  const handleGenerateSlug = () => {
    const slug = form.name
      .toLowerCase()
      .trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-');
    setForm(prev => ({ ...prev, slug }));
  };

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Header & Save Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-5 rounded-3xl border border-neutral-200/80 shadow-2xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 text-emerald-700 text-[11px] font-bold mb-1 border border-emerald-200/60">
            <Store className="w-3.5 h-3.5" />
            <span>Personalización de Marca</span>
          </div>
          <h2 className="text-lg font-black text-neutral-900 tracking-tight">
            Identidad & Perfil de la Tienda
          </h2>
          <p className="text-xs text-neutral-500">
            Personaliza el logo, imagen de portada/banner, nombre oficial, slogan y redes sociales que verán tus clientes.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={handleCopyLink}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-300 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
            title="Copiar enlace público directo de la tienda"
          >
            {copiedLink ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span>¡Enlace Copiado!</span>
              </>
            ) : (
              <>
                <Share2 className="w-3.5 h-3.5 text-emerald-600" />
                <span>Compartir Tienda</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={() => openStoreCatalog(currentStore.id)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-700 text-xs font-bold transition-colors cursor-pointer"
          >
            <Eye className="w-3.5 h-3.5 text-neutral-500" />
            <span>Ver Catálogo</span>
          </button>

          <button
            type="submit"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
          >
            {savedSuccess ? (
              <>
                <Check className="w-4 h-4 text-emerald-200" />
                <span>¡Cambios Guardados!</span>
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                <span>Guardar Cambios</span>
              </>
            )}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Form Controls */}
        <div className="lg:col-span-7 space-y-6">
          {/* Card 1: Visual Identity (Logo & Banner) */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-5">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <ImageIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Logo & Imagen de Portada (Banner)
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Imágenes principales para la cabecera de tu catálogo y la tarjeta en el marketplace.
                </p>
              </div>
            </div>

            {/* Logo Input, Upload & Presets */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-800">
                  Logo de la Tienda (Cuadrado recomendado 1:1)
                </label>
                <input
                  type="file"
                  ref={logoInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleLogoUpload}
                />
                <button
                  type="button"
                  onClick={() => logoInputRef.current?.click()}
                  disabled={isUploadingLogo}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingLogo ? 'Subiendo a MinIO...' : 'Subir Imagen (MinIO)'}</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/... o enlace de MinIO"
                  value={form.logo}
                  onChange={e => setForm({ ...form, logo: e.target.value })}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
                {form.logo && (
                  <img loading="lazy" decoding="async"
                    src={form.logo}
                    alt="Logo preview"
                    className="w-8 h-8 rounded-lg object-cover border border-neutral-200"
                  />
                )}
              </div>

              {/* Logo Quick Presets */}
              <div>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block mb-1.5">
                  O elige una muestra rápida:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {LOGO_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm({ ...form, logo: preset.url })}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 text-neutral-700 border border-neutral-200/80 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Banner Input, Upload & Presets */}
            <div className="space-y-2 pt-2 border-t border-neutral-100">
              <div className="flex items-center justify-between">
                <label className="block text-xs font-bold text-neutral-800">
                  Banner / Portada (Panorámica recomendada 16:9)
                </label>
                <input
                  type="file"
                  ref={bannerInputRef}
                  hidden
                  accept="image/*"
                  onChange={handleBannerUpload}
                />
                <button
                  type="button"
                  onClick={() => bannerInputRef.current?.click()}
                  disabled={isUploadingBanner}
                  className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors cursor-pointer"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>{isUploadingBanner ? 'Subiendo a MinIO...' : 'Subir Imagen (MinIO)'}</span>
                </button>
              </div>
              <div className="flex gap-2">
                <input
                  type="text"
                  required
                  placeholder="https://images.unsplash.com/... o enlace de MinIO"
                  value={form.banner}
                  onChange={e => setForm({ ...form, banner: e.target.value })}
                  className="flex-1 px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Banner Quick Presets */}
              <div>
                <span className="text-[10px] text-neutral-400 font-semibold uppercase tracking-wider block mb-1.5">
                  O elige una muestra panorámica:
                </span>
                <div className="flex flex-wrap gap-1.5">
                  {BANNER_PRESETS.map(preset => (
                    <button
                      key={preset.label}
                      type="button"
                      onClick={() => setForm({ ...form, banner: preset.url })}
                      className="px-2.5 py-1 rounded-lg text-[11px] font-medium bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 text-neutral-700 border border-neutral-200/80 transition-colors cursor-pointer"
                    >
                      {preset.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Store Information */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                <Store className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Información Comercial & Enlace Web
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Nombre comercial, enlace directo personalizado (slug) y eslogan de tu negocio.
                </p>
              </div>
            </div>

            {/* Modalidad de la Tienda: Física vs Virtual */}
            <div className="p-4 rounded-2xl bg-neutral-50 border border-neutral-200/80 space-y-2.5">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-black text-neutral-900 uppercase tracking-wide">
                    Modalidad de la Tienda
                  </label>
                  <p className="text-[11px] text-neutral-500">
                    Define la etiqueta visible en el catálogo y las reglas de entrega.
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                  form.storeType === 'fisica'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}>
                  {form.storeType === 'fisica' ? <Store className="w-3 h-3 text-amber-600" /> : <Globe className="w-3 h-3 text-sky-600" />}
                  <span>{form.storeType === 'fisica' ? 'Tienda Física' : 'Tienda Virtual'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      storeType: 'fisica',
                      allowPickup: true // Necesariamente punto de entrega / retiro en local
                    }));
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    form.storeType === 'fisica'
                      ? 'border-amber-500 bg-amber-50/70 ring-2 ring-amber-500/20 shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    form.storeType === 'fisica' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">Tienda Física</span>
                      {form.storeType === 'fisica' && (
                        <span className="text-[10px] font-bold text-amber-700 bg-amber-100 px-1.5 py-0.2 rounded-md">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                      Local comercial presencial. <strong>Requiere punto de entrega / retiro en tienda</strong>.
                    </p>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      storeType: 'virtual',
                      allowDelivery: true // Necesariamente Delivery
                    }));
                  }}
                  className={`p-3 rounded-xl border text-left transition-all cursor-pointer flex items-start gap-3 ${
                    form.storeType === 'virtual'
                      ? 'border-sky-500 bg-sky-50/70 ring-2 ring-sky-500/20 shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${
                    form.storeType === 'virtual' ? 'bg-sky-500 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-neutral-900">Tienda Virtual</span>
                      {form.storeType === 'virtual' && (
                        <span className="text-[10px] font-bold text-sky-700 bg-sky-100 px-1.5 py-0.2 rounded-md">
                          Activo
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-500 mt-0.5 leading-snug">
                      Ventas online por catálogo. <strong>Requiere servicio de Delivery necesariamente</strong>.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Nombre de la Tienda <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  placeholder="Ej. Aura Concept Store"
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="text-xs font-bold text-neutral-800">
                    Enlace / Slug de Tienda
                  </label>
                  <button
                    type="button"
                    onClick={handleGenerateSlug}
                    className="text-[10px] text-emerald-700 font-bold hover:underline cursor-pointer flex items-center gap-1"
                    title="Auto-generar slug a partir del nombre"
                  >
                    <RefreshCw className="w-2.5 h-2.5" />
                    <span>Auto-generar</span>
                  </button>
                </div>
                <div className="flex items-center rounded-xl border border-neutral-200 bg-neutral-50 px-3 py-1.5 text-xs text-neutral-500 focus-within:ring-2 focus-within:ring-emerald-500/20 focus-within:bg-white">
                  <span className="text-neutral-400 select-none font-mono text-[11px] whitespace-nowrap">
                    {typeof window !== 'undefined' ? `${window.location.host}/` : '/'}
                  </span>
                  <input
                    type="text"
                    required
                    value={form.slug}
                    onChange={e => setForm({ ...form, slug: e.target.value.toLowerCase().replace(/[^\w-]/g, '') })}
                    className="w-full bg-transparent focus:outline-none text-emerald-800 font-mono font-bold text-xs"
                    placeholder="mi-tienda"
                  />
                </div>
              </div>
            </div>

            {/* Banner de Compartir Enlace Directo (Dominio + Slug) */}
            <div className="p-3.5 rounded-2xl bg-gradient-to-r from-emerald-50 via-teal-50 to-blue-50 border border-emerald-200/80 flex flex-col md:flex-row items-start md:items-center justify-between gap-3">
              <div className="space-y-0.5">
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-800 flex items-center gap-1.5">
                  <Globe className="w-3 h-3 text-emerald-600" />
                  <span>Enlace Directo de tu Catálogo (Inmediato al Dominio)</span>
                </span>
                <p className="text-xs font-mono font-bold text-neutral-800 break-all select-all">
                  {storePublicUrl}
                </p>
                <p className="text-[10px] text-neutral-500">
                  Tus clientes ingresan directamente escribiendo esta URL o al pulsar el link compartido.
                </p>
              </div>

              <div className="flex flex-wrap items-center gap-2 shrink-0 w-full md:w-auto">
                <button
                  type="button"
                  onClick={handleCopyLink}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-white hover:bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold transition-all shadow-2xs cursor-pointer"
                >
                  {copiedLink ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span>¡Copiado!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-emerald-600" />
                      <span>Copiar Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={handleShareWhatsApp}
                  className="flex-1 md:flex-none inline-flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-all shadow-xs cursor-pointer"
                  title="Compartir link directo por WhatsApp"
                >
                  <MessageCircle className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </button>

                <a
                  href={storePublicUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-1.5 rounded-xl bg-white hover:bg-neutral-100 border border-neutral-200 text-neutral-600 hover:text-neutral-900 transition-colors inline-flex items-center justify-center"
                  title="Abrir tienda en nueva pestaña"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                </a>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Eslogan / Frase Destacada (Tagline)
              </label>
              <input
                type="text"
                value={form.tagline}
                onChange={e => setForm({ ...form, tagline: e.target.value })}
                placeholder="Ej. Moda contemporánea, prendas minimalistas y accesorios de autor."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-800 mb-1">
                Descripción Detallada
              </label>
              <textarea
                rows={3}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                placeholder="Describe tu propuesta de valor, envíos, métodos de confección o especialidades..."
                className="w-full px-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none leading-relaxed"
              />
            </div>

            <div className="pt-3 border-t border-neutral-100 space-y-4">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Dirección Física o Punto de Entrega
                </label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    placeholder="Ej. Av. Larco 812, Miraflores, Lima"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <label className="block text-xs font-bold text-neutral-800">
                      Horarios de Atención al Cliente (Día por Día)
                    </label>
                    <p className="text-[11px] text-neutral-500">
                      Configura cada día de la semana de forma independiente con múltiples horas de apertura y cierre.
                    </p>
                  </div>
                  <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                    Visible en tu Catálogo
                  </span>
                </div>

                {/* Switch: Asistente por Días & Turnos vs Escritura Manual */}
                <div className="flex items-center gap-1 p-1 bg-neutral-100 rounded-xl mb-3 border border-neutral-200/70 text-[11px] font-bold">
                  <button
                    type="button"
                    onClick={() => setScheduleMode('fixed')}
                    className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      scheduleMode === 'fixed'
                        ? 'bg-white text-neutral-900 shadow-xs font-extrabold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-emerald-600" />
                    <span>Días de la Semana & Horas de Abrir/Cerrar</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setScheduleMode('manual')}
                    className={`flex-1 py-1.5 px-3 rounded-lg transition-all cursor-pointer flex items-center justify-center gap-1.5 ${
                      scheduleMode === 'manual'
                        ? 'bg-white text-neutral-900 shadow-xs font-extrabold'
                        : 'text-neutral-500 hover:text-neutral-900'
                    }`}
                  >
                    <Clock className="w-3.5 h-3.5 text-blue-600" />
                    <span>Escribir Manualmente</span>
                  </button>
                </div>

                {/* MODO ASISTENTE: DÍAS Y TURNOS INDEPENDIENTES */}
                {scheduleMode === 'fixed' ? (
                  <div className="bg-neutral-50/70 border border-neutral-200 rounded-2xl p-3.5 sm:p-4 space-y-4">
                    {/* Barra de Atajos Rápidos */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-neutral-200/70">
                      <div>
                        <span className="text-xs font-bold text-neutral-800 flex items-center gap-1">
                          <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Atajos y Plantillas Rápidas:</span>
                        </span>
                        <p className="text-[10px] text-neutral-500">
                          Aplica una plantilla inicial y luego personaliza cualquier día como desees.
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-1 text-[10px] font-bold">
                        <button
                          type="button"
                          onClick={() => applyPresetSchedule('standard_retail')}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-emerald-50 text-emerald-800 border border-neutral-200 shadow-3xs transition-colors cursor-pointer"
                          title="Lun-Vie mañana y tarde, Sáb medio día (mañana), Dom cerrado"
                        >
                          ⚡ Comercio Estándar (Lun-Vie + Sáb 1/2 día)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetSchedule('continuous')}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 shadow-3xs transition-colors cursor-pointer"
                          title="Lun a Sáb corrido de 9:00 AM a 7:00 PM"
                        >
                          Horario Corrido (9am - 7pm)
                        </button>
                        <button
                          type="button"
                          onClick={() => applyPresetSchedule('all_days')}
                          className="px-2.5 py-1 rounded-lg bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-200 shadow-3xs transition-colors cursor-pointer"
                          title="Todos los días de lunes a domingo"
                        >
                          Todos los Días
                        </button>
                      </div>
                    </div>

                    {/* LISTADO DE DÍAS DE LA SEMANA */}
                    <div className="space-y-2.5">
                      {daysSchedule.map(day => (
                        <div
                          key={day.dayId}
                          className={`rounded-xl border transition-all ${
                            day.isOpen
                              ? 'bg-white border-neutral-200 shadow-3xs'
                              : 'bg-neutral-100/50 border-neutral-200/70'
                          }`}
                        >
                          {/* Fila Encabezado del Día */}
                          <div className="p-3 flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2.5">
                              <span
                                className={`w-10 h-8 rounded-lg flex flex-col items-center justify-center font-black text-[11px] uppercase tracking-wide border shadow-3xs ${
                                  day.isOpen
                                    ? 'bg-emerald-600 border-emerald-500 text-white'
                                    : 'bg-neutral-200 border-neutral-300 text-neutral-400'
                                }`}
                              >
                                {day.short}
                              </span>

                              <div>
                                <div className="flex items-center gap-1.5">
                                  <span className="text-xs font-bold text-neutral-900">{day.name}</span>
                                  <span
                                    className={`text-[9px] font-bold px-1.5 py-0.2 rounded-md border ${
                                      day.isOpen
                                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                                        : 'bg-neutral-200/60 text-neutral-500 border-neutral-300'
                                    }`}
                                  >
                                    {day.isOpen
                                      ? `${day.slots.length} ${day.slots.length === 1 ? 'Turno' : 'Turnos'}`
                                      : 'Cerrado'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-neutral-500 hidden sm:block">
                                  {day.isOpen && day.slots.length > 0
                                    ? day.slots.map(s => `${formatTime12h(s.open)} - ${formatTime12h(s.close)}`).join('  |  ')
                                    : 'No abre atención en este día'}
                                </p>
                              </div>
                            </div>

                            <div className="flex items-center gap-2">
                              {/* Atajos de copia rápida */}
                              {day.isOpen && (
                                <div className="hidden sm:flex items-center gap-1 text-[10px]">
                                  <button
                                    type="button"
                                    onClick={() => handleCopyDayToWeekdays(day.dayId)}
                                    title="Copiar las horas de este día a Lunes - Viernes"
                                    className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar a Lun-Vie</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() => handleCopyDayToAll(day.dayId)}
                                    title="Copiar las horas de este día a toda la semana"
                                    className="px-2 py-0.5 rounded bg-neutral-100 hover:bg-neutral-200 text-neutral-600 font-semibold transition-colors flex items-center gap-1 cursor-pointer"
                                  >
                                    <Copy className="w-3 h-3" />
                                    <span>Copiar a Todos</span>
                                  </button>
                                </div>
                              )}

                              {/* Switch Abierto / Cerrado */}
                              <label className="relative inline-flex items-center cursor-pointer">
                                <input
                                  type="checkbox"
                                  checked={day.isOpen}
                                  onChange={() => handleToggleDayOpen(day.dayId)}
                                  className="sr-only peer"
                                />
                                <div className="w-10 h-5 bg-neutral-300 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-600"></div>
                              </label>
                            </div>
                          </div>

                          {/* Cuerpo de Horas de Abrir y Cerrar (Si está abierto) */}
                          {day.isOpen ? (
                            <div className="px-3 pb-3 pt-0 space-y-2 border-t border-neutral-100">
                              <div className="pt-2 space-y-1.5">
                                {day.slots.map((slot, sIdx) => (
                                  <div
                                    key={slot.id}
                                    className="flex flex-wrap items-center justify-between gap-2 p-2 rounded-lg bg-neutral-50/90 border border-neutral-200/70"
                                  >
                                    <div className="flex items-center gap-2">
                                      <span className="text-[10px] font-bold text-neutral-500 bg-white px-2 py-0.5 rounded border border-neutral-200">
                                        Turno {sIdx + 1}
                                      </span>
                                      <div className="flex items-center gap-1.5 text-xs">
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] uppercase font-bold text-neutral-400">Abre:</span>
                                          <input
                                            type="time"
                                            value={slot.open}
                                            onChange={e => handleUpdateSlotTime(day.dayId, slot.id, 'open', e.target.value)}
                                            className="px-2 py-1 rounded border border-neutral-300 text-xs font-bold bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                          />
                                        </div>
                                        <span className="text-neutral-400 font-bold px-0.5">a</span>
                                        <div className="flex items-center gap-1">
                                          <span className="text-[10px] uppercase font-bold text-neutral-400">Cierra:</span>
                                          <input
                                            type="time"
                                            value={slot.close}
                                            onChange={e => handleUpdateSlotTime(day.dayId, slot.id, 'close', e.target.value)}
                                            className="px-2 py-1 rounded border border-neutral-300 text-xs font-bold bg-white text-neutral-800 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                          />
                                        </div>
                                      </div>
                                    </div>

                                    {/* Botón eliminar turno */}
                                    <button
                                      type="button"
                                      onClick={() => handleRemoveSlotFromDay(day.dayId, slot.id)}
                                      title="Eliminar este turno (si no hay turnos este día no abre)"
                                      className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50 transition-colors cursor-pointer"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </div>
                                ))}
                              </div>

                              {/* Botón para adicionar otra hora de abrir y cerrar */}
                              <div className="flex items-center justify-between pt-1">
                                <button
                                  type="button"
                                  onClick={() => handleAddSlotToDay(day.dayId)}
                                  className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border border-dashed border-emerald-400 bg-emerald-50/70 hover:bg-emerald-100 text-emerald-800 text-xs font-bold transition-all cursor-pointer"
                                >
                                  <Plus className="w-3.5 h-3.5 text-emerald-600" />
                                  <span>+ Adicionar otra hora de abrir y cerrar</span>
                                </button>

                                <span className="text-[10px] text-neutral-400 font-medium">
                                  {day.slots.length === 1 ? '1 turno activo' : `${day.slots.length} turnos activos`}
                                </span>
                              </div>
                            </div>
                          ) : (
                            <div className="px-3 pb-2.5 pt-0">
                              <div className="p-2 rounded-lg bg-neutral-100/70 border border-dashed border-neutral-200 flex items-center justify-between text-[11px]">
                                <span className="text-neutral-500 font-medium italic">
                                  🔒 Cerrado todo el día (este día no se abre)
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleToggleDayOpen(day.dayId)}
                                  className="font-bold text-emerald-700 hover:text-emerald-800 hover:underline cursor-pointer"
                                >
                                  + Abrir y asignar horario
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>

                    {/* Previsualización del Horario Compilado */}
                    <div className="pt-3 border-t border-neutral-200/70 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
                      <span className="text-neutral-500 font-semibold flex items-center gap-1">
                        <span>Texto generado para el catálogo:</span>
                      </span>
                      <span className="font-bold text-emerald-800 font-mono bg-white px-3 py-1.5 rounded-lg border border-emerald-200 shadow-3xs break-all">
                        {form.schedule || 'Cerrado temporalmente'}
                      </span>
                    </div>
                  </div>
                ) : (
                  /* MODO MANUAL */
                  <div className="space-y-2">
                    <div className="relative">
                      <Clock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
                      <input
                        type="text"
                        value={form.schedule}
                        onChange={e => setForm({ ...form, schedule: e.target.value })}
                        placeholder="Ej. Lun a Sáb: 9:00 AM - 1:00 PM y 3:00 PM - 8:00 PM (Domingos previa cita)"
                        className="w-full pl-9 pr-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-semibold text-neutral-800"
                      />
                    </div>
                    <p className="text-[11px] text-neutral-500">
                      Escribe libremente el formato que mejor se adapte a tu tipo de negocio (incluyendo domingos, feriados o guardias).
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Card 3: Social Media */}
          <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-xs p-6 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-xl bg-purple-50 text-purple-600 flex items-center justify-center">
                <Link className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Redes Sociales
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Aparecen en el encabezado de tu catálogo para que tus clientes te sigan.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  Instagram
                </label>
                <div className="relative">
                  <Instagram className="w-4 h-4 text-pink-500 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={form.socials?.instagram || ''}
                    onChange={e => setForm({
                      ...form,
                      socials: { ...form.socials, instagram: e.target.value }
                    })}
                    placeholder="@tu_marca"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-neutral-800 mb-1">
                  TikTok o Facebook
                </label>
                <div className="relative">
                  <Facebook className="w-4 h-4 text-blue-600 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={form.socials?.facebook || ''}
                    onChange={e => setForm({
                      ...form,
                      socials: { ...form.socials, facebook: e.target.value }
                    })}
                    placeholder="facebook.com/tu_marca"
                    className="w-full pl-9 pr-3.5 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live Interactive Card & Header Preview */}
        <div className="lg:col-span-5 space-y-5">
          <div className="sticky top-20 space-y-4">
            {/* Live Preview Card */}
            <div className="bg-white rounded-3xl border border-neutral-200/80 shadow-sm p-5 space-y-4">
              <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
                <span className="text-xs font-black text-neutral-900 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-emerald-600" />
                  Vista Previa en Vivo de tu Tienda
                </span>
                <span className="text-[10px] text-emerald-800 font-extrabold bg-emerald-100/70 px-2 py-0.5 rounded-full">
                  Resultado en Tiempo Real
                </span>
              </div>

              {/* Card visual demo (Simulating StoreCard in Home) */}
              <div className="border border-neutral-200/90 rounded-3xl overflow-hidden shadow-md bg-white">
                <div className="relative h-32 w-full overflow-hidden bg-neutral-900">
                  <img loading="lazy" decoding="async"
                    src={form.banner || DEFAULT_STORE_BANNER}
                    alt={form.name}
                    className="w-full h-full object-cover opacity-80"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />
                  
                  {/* Floating Smart Status Tag in Preview */}
                  <div className="absolute top-3 left-3">
                    <StoreStatusBadge
                      schedule={form.schedule}
                      storeName={form.name}
                      size="xs"
                      interactive={true}
                    />
                  </div>

                  <div className="absolute top-3 right-3">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] font-bold text-white border border-white/20 shadow-xs">
                      {form.storeType === 'fisica' ? (
                        <>
                          <Store className="w-3 h-3 text-amber-400" />
                          <span>Tienda Física</span>
                        </>
                      ) : (
                        <>
                          <Globe className="w-3 h-3 text-sky-400" />
                          <span>Tienda Virtual</span>
                        </>
                      )}
                    </span>
                  </div>
                </div>

                <div className="p-4 pt-0 -mt-7 relative">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden bg-white p-0.5 shadow-md border-2 border-white mb-2">
                    <img loading="lazy" decoding="async"
                      src={form.logo || DEFAULT_STORE_LOGO}
                      alt={form.name}
                      className="w-full h-full object-cover rounded-xl"
                    />
                  </div>

                  <h4 className="text-base font-black text-neutral-900 leading-tight">
                    {form.name || 'Nombre de la Tienda'}
                  </h4>
                  <p className="text-[11px] text-neutral-500 mt-0.5 line-clamp-2">
                    {form.tagline || 'Eslogan comercial de la tienda'}
                  </p>

                  <div className="mt-3 pt-2.5 border-t border-neutral-100 space-y-1.5 text-[10px] text-neutral-600">
                    <div className="flex items-center gap-1.5 truncate">
                      <MapPin className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate">{form.address || 'Ubicación física'}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <Clock className="w-3 h-3 text-neutral-400 shrink-0" />
                      <span className="truncate flex-1 font-medium">{form.schedule || 'Horario no especificado'}</span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="bg-emerald-50 rounded-2xl p-3 border border-emerald-200/70 text-emerald-900 text-[11px] space-y-1">
                <p className="font-bold flex items-center gap-1">
                  <span>💡 Tip de Imagen y Marca:</span>
                </p>
                <p className="text-emerald-800 leading-relaxed">
                  Los cambios que guardes aquí se reflejarán instantáneamente en tu catálogo online, en el carrusel de tiendas de Inicio y en las tarjetas del catálogo multitienda.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
