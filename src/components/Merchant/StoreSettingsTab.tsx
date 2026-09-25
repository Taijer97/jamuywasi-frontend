import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StoreConfig } from '../../types';
import {
  MessageCircle,
  Save,
  Check,
  Smartphone,
  Copy,
  Info,
  Truck,
  DollarSign,
  Globe,
  Store,
  Clock,
  MapPin,
  Sparkles,
  CreditCard,
  AlertCircle,
  CheckCircle2
} from 'lucide-react';
import { generateWhatsAppOrderMessage } from '../../utils/whatsapp';
import { DEFAULT_STORE_LOGO } from '../../data/initialData';

const COUNTRY_CODES = [
  { code: '51', label: 'Perú (+51)' },
  { code: '52', label: 'México (+52)' },
  { code: '57', label: 'Colombia (+57)' },
  { code: '54', label: 'Argentina (+54)' },
  { code: '56', label: 'Chile (+56)' },
  { code: '34', label: 'España (+34)' },
  { code: '1', label: 'Estados Unidos (+1)' },
  { code: '58', label: 'Venezuela (+58)' },
  { code: '593', label: 'Ecuador (+593)' },
  { code: '502', label: 'Guatemala (+502)' }
];

const CURRENCY_PRESETS = [
  { code: 'PEN', symbol: 'S/', label: 'PEN - Nuevo Sol / Sol Peruano (S/)' },
  { code: 'USD', symbol: '$', label: 'USD - Dólares Americanos ($)' },
  { code: 'MXN', symbol: '$', label: 'MXN - Pesos Mexicanos ($)' },
  { code: 'COP', symbol: '$', label: 'COP - Pesos Colombianos ($)' },
  { code: 'CLP', symbol: '$', label: 'CLP - Pesos Chilenos ($)' },
  { code: 'EUR', symbol: '€', label: 'EUR - Euros (€)' },
  { code: 'ARS', symbol: '$', label: 'ARS - Pesos Argentinos ($)' }
];

const TEMPLATE_VARIABLES = [
  { tag: '{nombre_tienda}', label: 'Nombre Tienda' },
  { tag: '{numero_pedido}', label: 'N° de Pedido' },
  { tag: '{nombre_cliente}', label: 'Nombre Cliente' },
  { tag: '{dni_cliente}', label: 'DNI Cliente' },
  { tag: '{telefono_cliente}', label: 'Teléfono Cliente' },
  { tag: '{tipo_entrega}', label: 'Tipo Entrega' },
  { tag: '{direccion_entrega}', label: 'Dirección' },
  { tag: '{metodo_pago}', label: 'Método Pago' },
  { tag: '{lista_productos}', label: 'Lista Productos' },
  { tag: '{subtotal}', label: 'Subtotal' },
  { tag: '{costo_envio}', label: 'Costo Envío' },
  { tag: '{total}', label: 'Total' },
  { tag: '{notas_pedido}', label: 'Notas' },
  { tag: '{recordatorio_pago}', label: 'Recordatorio de pago' }
];

export const StoreSettingsTab: React.FC = () => {
  const { currentStore, updateStoreConfig, currentStoreProducts } = useApp();

  const [form, setForm] = useState<StoreConfig>(() => ({
    ...currentStore,
    allowDelivery: currentStore.allowDelivery !== false,
    allowPickup: currentStore.allowPickup !== false,
    pickupAddress: currentStore.pickupAddress || '',
    preferredPaymentMethod: currentStore.preferredPaymentMethod || 'Transferencia Bancaria'
  }));
  const [savedSuccess, setSavedSuccess] = useState(false);

  React.useEffect(() => {
    setForm({
      ...currentStore,
      allowDelivery: currentStore.allowDelivery !== false,
      allowPickup: currentStore.allowPickup !== false,
      pickupAddress: currentStore.pickupAddress || '',
      preferredPaymentMethod: currentStore.preferredPaymentMethod || 'Transferencia Bancaria'
    });
  }, [currentStore.id]);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateStoreConfig(form);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 2500);
  };

  const handleInsertTag = (tag: string) => {
    setForm(prev => ({
      ...prev,
      whatsappMessageTemplate: prev.whatsappMessageTemplate + ` ${tag}`
    }));
  };

  // Live simulation of the message for the smartphone preview
  const previewMessage = generateWhatsAppOrderMessage(
    form,
    'PED-5920',
    {
      name: 'Sofía Valenzuela Ríos',
      dni: '45678912',
      phone: '+51 999333111',
      deliveryType: 'delivery',
      address: 'Calle Las Roasa 82, Pascual Alegre, Atalaya',
      paymentMethod: 'Yape',
      notes: 'Llamar al llegar, por favor.'
    },
    [
      {
        id: 'sample_1',
        product: currentStoreProducts[0] || {
          id: 'p1',
          storeId: form.id,
          name: 'Producto Destacado',
          slug: 'prod',
          description: '',
          price: 490,
          category: 'General',
          imageUrl: '',
          inStock: true,
          variants: [],
          createdAt: ''
        },
        quantity: 1,
        selectedVariants: { Talla: 'M', Color: 'Arena' }
      }
    ],
    490,
    0,
    490
  );

  return (
    <form onSubmit={handleSave} className="space-y-6">
      {/* Top action bar */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900">
            Configuración de la Tienda & Canal WhatsApp
          </h2>
          <p className="text-xs text-neutral-500">
            Ajusta los datos del negocio, números de contacto y personaliza la plantilla automática de cierre.
          </p>
        </div>

        <button
          type="submit"
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          {savedSuccess ? (
            <>
              <Check className="w-4 h-4" />
              <span>¡Configuración Guardada!</span>
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              <span>Guardar Cambios</span>
            </>
          )}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Store Details & WhatsApp Config */}
        <div className="lg:col-span-7 space-y-6">
          {/* WhatsApp Settings Card */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <MessageCircle className="w-4 h-4 fill-emerald-600" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Cierre de Ventas en WhatsApp
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Número oficial al que serán enviados los carritos de compra de tus clientes.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Código de País
                </label>
                <select
                  value={form.countryCode}
                  onChange={e => setForm({ ...form, countryCode: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer"
                >
                  {COUNTRY_CODES.map(c => (
                    <option key={c.code} value={c.code}>{c.label}</option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Número de WhatsApp (sin signos ni espacios) <span className="text-rose-500">*</span>
                </label>
                <input
                  type="tel"
                  required
                  placeholder="5541982301"
                  value={form.phone}
                  onChange={e => setForm({ ...form, phone: e.target.value.replace(/\D/g, '') })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono font-bold"
                />
              </div>
            </div>

            {/* Template editor */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-semibold text-neutral-700">
                  Plantilla del Mensaje Automático
                </label>
                <span className="text-[10px] text-neutral-400">
                  Soporta formato WhatsApp (*negrita*, _cursiva_)
                </span>
              </div>

              {/* Dynamic tag insert buttons */}
              <div className="mb-2">
                <span className="text-[10px] text-neutral-500 font-medium block mb-1">
                  Haz clic en una etiqueta para insertarla:
                </span>
                <div className="flex flex-wrap gap-1">
                  {TEMPLATE_VARIABLES.map(v => (
                    <button
                      key={v.tag}
                      type="button"
                      onClick={() => handleInsertTag(v.tag)}
                      className="px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-emerald-50 hover:text-emerald-700 text-[10px] text-neutral-600 font-mono border border-neutral-200/80 transition-colors cursor-pointer"
                      title={`Insertar ${v.tag}`}
                    >
                      +{v.label}
                    </button>
                  ))}
                </div>
              </div>

              <p className="mb-2 text-[11px] text-neutral-500 leading-relaxed">
                Déjala <strong>vacía</strong> para usar el mensaje recomendado de JamuyWasi (distinto para envío a domicilio y recojo, con DNI del cliente y recordatorio de pago anticipado).
              </p>
              <textarea
                rows={9}
                placeholder="(Vacío = mensaje recomendado)"
                value={form.whatsappMessageTemplate}
                onChange={e => setForm({ ...form, whatsappMessageTemplate: e.target.value })}
                className="w-full px-3.5 py-2.5 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono leading-relaxed"
              />
            </div>
          </div>

          {/* General Store Profile */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5 space-y-4">
            <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider pb-2 border-b border-neutral-100">
              Datos Generales de la Tienda
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Nombre de la Tienda
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Eslogan / Tagline
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={e => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-neutral-700 mb-1">
                Descripción para el catálogo
              </label>
              <textarea
                rows={2}
                value={form.description}
                onChange={e => setForm({ ...form, description: e.target.value })}
                className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  URL del Logo
                </label>
                <input
                  type="text"
                  value={form.logo}
                  onChange={e => setForm({ ...form, logo: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  URL del Banner
                </label>
                <input
                  type="text"
                  value={form.banner}
                  onChange={e => setForm({ ...form, banner: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Dirección física
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={e => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Horarios de atención
                </label>
                <input
                  type="text"
                  value={form.schedule}
                  onChange={e => setForm({ ...form, schedule: e.target.value })}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none"
                />
              </div>
            </div>
          </div>

          {/* Pricing & Delivery configuration */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5 space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                  <Truck className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                    Modalidad & Entregas de la Tienda
                  </h3>
                  <p className="text-[11px] text-neutral-500">
                    Configura si tu tienda es física o virtual y gestiona tus opciones de despacho y retiro.
                  </p>
                </div>
              </div>
            </div>

            {/* Selector de Modalidad Operativa (Física vs Virtual) */}
            <div className="p-4 rounded-2xl bg-neutral-50/80 border border-neutral-200/90 space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <label className="block text-xs font-black text-neutral-900 uppercase tracking-wide">
                    Cambiar Modalidad del Negocio
                  </label>
                  <p className="text-[11px] text-neutral-500">
                    Define cómo opera tu tienda ante tus clientes y en el directorio de tiendas.
                  </p>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[10px] font-extrabold border ${
                  form.storeType === 'fisica'
                    ? 'bg-amber-50 text-amber-800 border-amber-200'
                    : 'bg-sky-50 text-sky-800 border-sky-200'
                }`}>
                  {form.storeType === 'fisica' ? <Store className="w-3 h-3 text-amber-600" /> : <Globe className="w-3 h-3 text-sky-600" />}
                  <span>{form.storeType === 'fisica' ? 'Modalidad Física Activa' : 'Modalidad Virtual Activa'}</span>
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Opción Tienda Física */}
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      storeType: 'fisica',
                      allowPickup: true // Necesariamente punto de entrega / retiro en local
                    }));
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                    form.storeType === 'fisica'
                      ? 'border-amber-500 bg-amber-50/80 ring-2 ring-amber-500/30 shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    form.storeType === 'fisica' ? 'bg-amber-500 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-neutral-900">Tienda Física</span>
                      {form.storeType === 'fisica' && (
                        <span className="text-[10px] font-extrabold text-amber-800 bg-amber-200/70 px-2 py-0.5 rounded-full">
                          Seleccionada
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-1 leading-snug">
                      Local comercial presencial. <strong>Necesariamente incluye punto de entrega / retiro en local</strong>. El delivery a domicilio es opcional.
                    </p>
                  </div>
                </button>

                {/* Opción Tienda Virtual */}
                <button
                  type="button"
                  onClick={() => {
                    setForm(prev => ({
                      ...prev,
                      storeType: 'virtual',
                      allowDelivery: true // Necesariamente Delivery
                    }));
                  }}
                  className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-start gap-3 relative ${
                    form.storeType === 'virtual'
                      ? 'border-sky-500 bg-sky-50/80 ring-2 ring-sky-500/30 shadow-xs'
                      : 'border-neutral-200 bg-white hover:bg-neutral-50'
                  }`}
                >
                  <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-2xs ${
                    form.storeType === 'virtual' ? 'bg-sky-500 text-white' : 'bg-neutral-100 text-neutral-500'
                  }`}>
                    <Globe className="w-4 h-4" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-black text-neutral-900">Tienda Virtual</span>
                      {form.storeType === 'virtual' && (
                        <span className="text-[10px] font-extrabold text-sky-800 bg-sky-200/70 px-2 py-0.5 rounded-full">
                          Seleccionada
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-neutral-600 mt-1 leading-snug">
                      Ventas online por catálogo. <strong>Necesariamente incluye servicio de Delivery</strong>. El retiro presencial solo aplica si configuras un punto físico de entrega.
                    </p>
                  </div>
                </button>
              </div>
            </div>

            {/* Moneda */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="sm:col-span-2">
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Moneda de la Tienda
                </label>
                <select
                  value={form.currency}
                  onChange={e => {
                    const selected = CURRENCY_PRESETS.find(p => p.code === e.target.value);
                    setForm({
                      ...form,
                      currency: e.target.value,
                      currencySymbol: selected ? selected.symbol : form.currencySymbol
                    });
                  }}
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none cursor-pointer"
                >
                  {CURRENCY_PRESETS.map(curr => (
                    <option key={curr.code} value={curr.code}>{curr.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Símbolo de Moneda
                </label>
                <input
                  type="text"
                  value={form.currencySymbol}
                  onChange={e => setForm({ ...form, currencySymbol: e.target.value })}
                  placeholder="S/ o $"
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none font-mono font-bold"
                />
              </div>
            </div>

            {/* 1. SECCIÓN DELIVERY (ENVÍO A DOMICILIO) */}
            <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    form.allowDelivery !== false ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    <Truck className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">
                      Servicio de Delivery / Envío a Domicilio
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {form.storeType === 'virtual'
                        ? 'En Tiendas Virtuales el servicio de Delivery es obligatorio para atender compras.'
                        : (form.allowDelivery !== false
                          ? 'Tus clientes podrán solicitar despacho a domicilio al comprar en el carrito.'
                          : 'Desactivado: El botón "Envío a Domicilio" no se mostrará en el carrito.')}
                    </p>
                  </div>
                </div>

                {form.storeType === 'virtual' ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-sky-100 text-sky-800 text-[10px] font-extrabold border border-sky-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-600" />
                    <span>Obligatorio en Virtual</span>
                  </div>
                ) : (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allowDelivery !== false}
                      onChange={e => setForm({ ...form, allowDelivery: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                )}
              </div>

              {(form.storeType === 'virtual' || form.allowDelivery !== false) ? (
                <div className="pt-2 grid grid-cols-1 sm:grid-cols-2 gap-3 border-t border-neutral-200/60">
                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Costo de Envío Base ({form.currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.deliveryFee}
                      onChange={e => setForm({ ...form, deliveryFee: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-neutral-700 mb-1">
                      Envío Gratis Desde ({form.currencySymbol})
                    </label>
                    <input
                      type="number"
                      min="0"
                      value={form.freeDeliveryThreshold}
                      onChange={e => setForm({ ...form, freeDeliveryThreshold: Number(e.target.value) })}
                      className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                    />
                  </div>
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    El botón <strong>Envío a Domicilio</strong> quedará oculto para los clientes. Solo podrán retirar en tu local.
                  </span>
                </div>
              )}
            </div>

            {/* 2. SECCIÓN RETIRO EN LOCAL / PUNTO DE ENTREGA */}
            <div className="p-4 rounded-2xl border border-neutral-200 bg-neutral-50/50 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${
                    (form.storeType === 'fisica' || form.allowPickup !== false) ? 'bg-emerald-600 text-white' : 'bg-neutral-200 text-neutral-500'
                  }`}>
                    <Store className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-neutral-900">
                      {form.storeType === 'fisica'
                        ? 'Retiro Presencial en Tienda / Local'
                        : 'Punto de Entrega Presencial (Tienda Virtual)'}
                    </h4>
                    <p className="text-[11px] text-neutral-500">
                      {form.storeType === 'fisica'
                        ? 'En Tiendas Físicas el retiro en local es obligatorio por contar con local comercial.'
                        : 'Configura una dirección o punto de encuentro físico para que retiren sus pedidos.'}
                    </p>
                  </div>
                </div>

                {form.storeType === 'fisica' ? (
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 text-[10px] font-extrabold border border-amber-300">
                    <CheckCircle2 className="w-3.5 h-3.5 text-amber-600" />
                    <span>Obligatorio en Tienda Física</span>
                  </div>
                ) : (
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      checked={form.allowPickup !== false}
                      onChange={e => setForm({ ...form, allowPickup: e.target.checked })}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-neutral-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-neutral-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-600"></div>
                  </label>
                )}
              </div>

              {(form.storeType === 'fisica' || form.allowPickup !== false) ? (
                <div className="pt-2 border-t border-neutral-200/60">
                  {form.storeType === 'fisica' ? (
                    <div className="text-xs text-neutral-600 space-y-1">
                      <p className="text-[11px]">
                        Los clientes verán como dirección de retiro la indicada en <strong>Datos Generales</strong>:
                      </p>
                      <div className="flex items-center gap-1.5 p-2.5 rounded-xl bg-white border border-neutral-200 text-neutral-800 font-semibold text-xs">
                        <MapPin className="w-4 h-4 text-emerald-600 shrink-0" />
                        <span className="truncate">{form.address || 'Sin dirección ingresada en Datos Generales'}</span>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-1.5">
                      <label className="block text-xs font-semibold text-neutral-700">
                        Dirección o Referencia del Punto de Entrega
                      </label>
                      <input
                        type="text"
                        placeholder="Ej. Galería Atalaya Stand 12, o Av. Central 450 (Frente al Banco)"
                        value={form.pickupAddress || ''}
                        onChange={e => setForm({ ...form, pickupAddress: e.target.value })}
                        className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                      />
                      <p className="text-[11px] text-neutral-500">
                        * <strong>Importante:</strong> Si dejas este campo en blanco, la opción <strong>"Retiro en Local"</strong> se ocultará automáticamente en el carrito de compras.
                      </p>
                    </div>
                  )}
                </div>
              ) : (
                <div className="p-2.5 rounded-xl bg-amber-50 border border-amber-200 text-[11px] text-amber-800 flex items-center gap-2">
                  <AlertCircle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                  <span>
                    La opción <strong>Retiro en Local</strong> estará deshabilitada para tus clientes.
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* 3. MÉTODOS DE PAGO & MÉTODO PREFERIDO */}
          <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-5 space-y-4">
            <div className="flex items-center gap-2 pb-3 border-b border-neutral-100">
              <div className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-600 flex items-center justify-center">
                <CreditCard className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-xs font-bold text-neutral-900 uppercase tracking-wider">
                  Métodos de Pago & Preferencias
                </h3>
                <p className="text-[11px] text-neutral-500">
                  Establece el método que aparecerá seleccionado por defecto y tus datos para recibir transferencias o billeteras.
                </p>
              </div>
            </div>

            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Método de Pago Preferido de la Tienda
                </label>
                <div className="space-y-2">
                  <select
                    value={form.preferredPaymentMethod || 'Transferencia Bancaria'}
                    onChange={e => setForm({ ...form, preferredPaymentMethod: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 cursor-pointer font-bold text-neutral-900"
                  >
                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                    <option value="Yape">Yape</option>
                    <option value="Plin">Plin</option>
                    <option value="Efectivo contra entrega">Efectivo contra entrega</option>
                    <option value="Tarjeta de Débito / Crédito (Link de Pago)">Tarjeta de Débito / Crédito (Link de Pago)</option>
                    <option value="Pago Móvil / Billetera Digital">Pago Móvil / Billetera Digital</option>
                  </select>
                  <p className="text-[11px] text-neutral-500">
                    Este método de pago aparecerá seleccionado automáticamente cuando tus clientes abran el carrito de compras.
                  </p>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-neutral-700 mb-1">
                  Datos e Instrucciones de Pago para el Cliente (Opcional)
                </label>
                <textarea
                  rows={3}
                  value={form.paymentInstructions || ''}
                  onChange={e => setForm({ ...form, paymentInstructions: e.target.value })}
                  placeholder="Ej. Yape / Plin al 987 654 321 (Titular: Juan Pérez). BCP Soles: 193-XXXXXXX-0-XX CCI: 002193..."
                  className="w-full px-3 py-2 text-xs rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 leading-relaxed resize-none"
                />
                <p className="text-[11px] text-neutral-500">
                  Tus clientes verán estas instrucciones en el carrito para que sepan a dónde transferir o enviar su comprobante.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Live WhatsApp Smartphone Simulator */}
        <div className="lg:col-span-5">
          <div className="sticky top-24 space-y-4">
            <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
                  <Smartphone className="w-4 h-4 text-emerald-600" />
                  Simulador de Mensaje en WhatsApp
                </span>
                <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-2 py-0.5 rounded-full">
                  Vista Previa en Vivo
                </span>
              </div>

              {/* Smartphone Frame */}
              <div className="rounded-3xl border-4 border-neutral-800 bg-[#E5DDD5] overflow-hidden shadow-xl max-w-sm mx-auto">
                {/* Simulated Phone Top Header */}
                <div className="bg-[#075E54] text-white px-4 py-2.5 flex items-center gap-3">
                  <img loading="lazy" decoding="async"
                    src={form.logo || DEFAULT_STORE_LOGO}
                    alt={form.name}
                    className="w-8 h-8 rounded-full object-cover border border-white/40"
                  />
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-bold truncate leading-tight">{form.name}</p>
                    <p className="text-[9px] text-emerald-200 leading-tight">en línea (WhatsApp Business)</p>
                  </div>
                </div>

                {/* WhatsApp Chat Area */}
                <div className="p-3 min-h-[360px] max-h-[480px] overflow-y-auto space-y-2 bg-[radial-gradient(#d5cdc5_1px,transparent_1px)] [background-size:16px_16px]">
                  {/* Date badge */}
                  <div className="text-center">
                    <span className="px-2 py-0.5 rounded-md bg-white/80 shadow-2xs text-[9px] text-neutral-600 font-medium">
                      HOY
                    </span>
                  </div>

                  {/* Customer Sent Message Bubble */}
                  <div className="flex justify-end">
                    <div className="relative max-w-[88%] bg-[#DCF8C6] text-neutral-900 rounded-2xl rounded-tr-xs p-3 shadow-xs text-[11px] font-sans leading-relaxed whitespace-pre-wrap">
                      {previewMessage}
                      <div className="text-right text-[9px] text-neutral-500 mt-1">
                        12:45 PM ✓✓
                      </div>
                    </div>
                  </div>
                </div>

                {/* Simulated Chat Input bar */}
                <div className="bg-[#F0F0F0] px-3 py-2 flex items-center gap-2 border-t border-neutral-300">
                  <div className="flex-1 bg-white rounded-full px-3 py-1.5 text-[11px] text-neutral-400">
                    Mensaje...
                  </div>
                  <div className="w-7 h-7 rounded-full bg-[#128C7E] flex items-center justify-center text-white text-xs">
                    ➤
                  </div>
                </div>
              </div>

              <p className="text-[11px] text-center text-neutral-500 mt-3">
                Así es exactamente como se visualizará el pedido cuando el comprador haga clic en el botón de WhatsApp desde tu catálogo.
              </p>
            </div>
          </div>
        </div>
      </div>
    </form>
  );
};
