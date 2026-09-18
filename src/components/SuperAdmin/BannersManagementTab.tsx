import React, { useState, useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { PromotionalBanner, BannerGradientTheme } from '../../types';
import { DEFAULT_STORE_BANNER } from '../../data/initialData';
import { 
  Megaphone, 
  Plus, 
  Trash2, 
  Edit3, 
  Eye, 
  EyeOff, 
  Check, 
  Sparkles, 
  ExternalLink,
  Store as StoreIcon,
  X,
  Package,
  Upload,
  Loader2
} from 'lucide-react';

const GRADIENT_OPTIONS: { id: BannerGradientTheme; label: string; previewClass: string }[] = [
  { id: 'emerald', label: 'Esmeralda', previewClass: 'from-emerald-950 to-emerald-800' },
  { id: 'indigo', label: 'Índigo / Azul', previewClass: 'from-indigo-950 to-indigo-800' },
  { id: 'amber', label: 'Ámbar / Dorado', previewClass: 'from-amber-950 to-amber-800' },
  { id: 'rose', label: 'Rosa / Carmesí', previewClass: 'from-rose-950 to-rose-800' },
  { id: 'purple', label: 'Púrpura VIP', previewClass: 'from-purple-950 to-purple-800' },
  { id: 'dark', label: 'Negro Minimalista', previewClass: 'from-neutral-950 to-neutral-800' },
];

export const BannersManagementTab: React.FC = () => {
  const { banners, stores, products, addBanner, updateBanner, deleteBanner, toggleBannerActive, uploadImage } = useApp();

  const [modalOpen, setModalOpen] = useState(false);
  const [editingBanner, setEditingBanner] = useState<PromotionalBanner | null>(null);

  // Form State
  const [title, setTitle] = useState('');
  const [subtitle, setSubtitle] = useState('');
  const [badge, setBadge] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [selectedStoreId, setSelectedStoreId] = useState('');
  const [selectedProductId, setSelectedProductId] = useState('');
  const [buttonText, setButtonText] = useState('Ver Producto');
  const [gradientTheme, setGradientTheme] = useState<BannerGradientTheme>('emerald');
  const [order, setOrder] = useState<number>(1);
  const [isActive, setIsActive] = useState(true);
  const [isUploading, setIsUploading] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const openCreateModal = () => {
    setEditingBanner(null);
    setTitle('');
    setSubtitle('');
    setBadge('🔥 Oferta Exclusiva');
    setImageUrl('https://images.unsplash.com/photo-1552346154-21d32810aba3?w=1200&auto=format&fit=crop&q=80');
    setSelectedStoreId(stores[0]?.id || '');
    setSelectedProductId('');
    setButtonText('Ver Oferta');
    setGradientTheme('emerald');
    setOrder(banners.length + 1);
    setIsActive(true);
    setModalOpen(true);
  };

  const openEditModal = (banner: PromotionalBanner) => {
    setEditingBanner(banner);
    setTitle(banner.title);
    setSubtitle(banner.subtitle);
    setBadge(banner.badge);
    setImageUrl(banner.imageUrl);
    setSelectedStoreId(banner.storeId || '');
    setSelectedProductId(banner.productId || '');
    setButtonText(banner.buttonText);
    setGradientTheme(banner.gradientTheme);
    setOrder(banner.order);
    setIsActive(banner.isActive);
    setModalOpen(true);
  };

  // When store changes, optionally pick first product or clear
  const handleStoreChange = (storeId: string) => {
    setSelectedStoreId(storeId);
    const storeProducts = products.filter(p => p.storeId === storeId);
    if (storeProducts.length > 0) {
      setSelectedProductId(storeProducts[0].id);
      if (!imageUrl || imageUrl.includes('unsplash')) {
        setImageUrl(storeProducts[0].imageUrl);
      }
    } else {
      setSelectedProductId('');
    }
  };

  // When product changes, prefill image if applicable
  const handleProductChange = (productId: string) => {
    setSelectedProductId(productId);
    const prod = products.find(p => p.id === productId);
    if (prod) {
      if (!title || editingBanner === null) {
        setTitle(`¡Promoción Especial en ${prod.name}!`);
      }
      setImageUrl(prod.imageUrl);
      if (!subtitle || editingBanner === null) {
        setSubtitle(prod.description);
      }
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setIsUploading(true);
      const res = await uploadImage(file, 'banners');
      setImageUrl(res.url);
    } catch (err) {
      console.error('Error al subir banner a MinIO:', err);
      alert('Error al subir la imagen publicitaria. Verifica la conexión.');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl.trim()) {
      alert('Por favor especifica o sube una imagen para el banner publicitario.');
      return;
    }

    const cleanTitle = title.trim() || 'Anuncio Promocional';
    const cleanSubtitle = subtitle.trim();
    const cleanBadge = badge.trim() || 'OFERTA';
    const cleanBtn = buttonText.trim() || 'Ver Promoción';

    try {
      setIsSubmitting(true);
      if (editingBanner) {
        await updateBanner({
          ...editingBanner,
          title: cleanTitle,
          subtitle: cleanSubtitle,
          badge: cleanBadge,
          imageUrl: imageUrl.trim(),
          storeId: selectedStoreId || undefined,
          productId: selectedProductId || undefined,
          buttonText: cleanBtn,
          gradientTheme,
          order: Number(order) || 1,
          isActive
        });
      } else {
        await addBanner({
          title: cleanTitle,
          subtitle: cleanSubtitle,
          badge: cleanBadge,
          imageUrl: imageUrl.trim(),
          storeId: selectedStoreId || undefined,
          productId: selectedProductId || undefined,
          buttonText: cleanBtn,
          gradientTheme,
          order: Number(order) || 1,
          isActive
        });
      }
      setModalOpen(false);
    } catch (err: any) {
      console.error('Error al guardar banner:', err);
      alert(err.message || 'Error al guardar el banner publicitario en el servidor.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const activeCount = banners.filter(b => b.isActive).length;
  const storeProducts = products.filter(p => !selectedStoreId || p.storeId === selectedStoreId);

  return (
    <div className="space-y-6">
      {/* Header and Add Action */}
      <div className="bg-white rounded-2xl p-5 border border-neutral-200/90 shadow-xs flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold">
              <Megaphone className="w-4 h-4" />
            </div>
            <h2 className="text-base font-bold text-neutral-900">
              Carrusel de Propaganda & Anuncios de Inicio
            </h2>
          </div>
          <p className="text-xs text-neutral-500 mt-1 max-w-xl">
            Gestiona los banners promocionales y anuncios patrocinados que se muestran en la parte superior del inicio del marketplace público.
          </p>
        </div>

        <button
          onClick={openCreateModal}
          className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Crear Nuevo Anuncio</span>
        </button>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-xl p-4 border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Total de Anuncios</span>
          <p className="text-2xl font-black text-neutral-900 mt-1">{banners.length}</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700">Anuncios Visibles</span>
          <p className="text-2xl font-black text-emerald-700 mt-1">{activeCount} activos</p>
        </div>

        <div className="bg-white rounded-xl p-4 border border-neutral-200/80 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-neutral-400">Tiendas Promocionadas</span>
          <p className="text-2xl font-black text-neutral-900 mt-1">
            {new Set(banners.map(b => b.storeId).filter(Boolean)).size}
          </p>
        </div>
      </div>

      {/* Banners List */}
      <div className="space-y-3">
        {banners.length > 0 ? (
          [...banners]
            .sort((a, b) => a.order - b.order)
            .map(banner => {
              const store = stores.find(s => s.id === banner.storeId);
              const product = products.find(p => p.id === banner.productId);

              return (
                <div
                  key={banner.id}
                  className={`bg-white rounded-2xl border p-4 sm:p-5 shadow-2xs transition-all flex flex-col md:flex-row items-start md:items-center justify-between gap-4 ${
                    banner.isActive ? 'border-neutral-200/90' : 'border-neutral-200/50 bg-neutral-50/50 opacity-75'
                  }`}
                >
                  <div className="flex items-start sm:items-center gap-4 w-full md:w-auto">
                    {/* Thumbnail */}
                    <div className="relative w-20 h-16 sm:w-28 sm:h-20 rounded-xl overflow-hidden bg-neutral-100 shrink-0 border border-neutral-200">
                      <img
                        src={banner.imageUrl || DEFAULT_STORE_BANNER}
                        alt={banner.title}
                        className="w-full h-full object-cover"
                      />
                      {!banner.isActive && (
                        <div className="absolute inset-0 bg-neutral-900/60 backdrop-blur-2xs flex items-center justify-center text-[10px] text-white font-bold">
                          Inactivo
                        </div>
                      )}
                    </div>

                    {/* Information */}
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-700">
                          {banner.badge}
                        </span>
                        {store && (
                          <span className="text-[10px] font-bold text-neutral-600 flex items-center gap-1">
                            <StoreIcon className="w-3 h-3" />
                            {store.name}
                          </span>
                        )}
                        <span className="text-[10px] text-neutral-400 font-mono">
                          Orden: #{banner.order}
                        </span>
                      </div>

                      <h4 className="text-sm font-bold text-neutral-900 truncate max-w-md">
                        {banner.title}
                      </h4>

                      <p className="text-xs text-neutral-500 line-clamp-1 max-w-lg">
                        {banner.subtitle}
                      </p>

                      {product && (
                        <p className="text-[11px] text-emerald-700 font-medium flex items-center gap-1">
                          <Package className="w-3 h-3" />
                          <span>Producto vinculado: <strong>{product.name}</strong> ({store?.currencySymbol || 'S/'} {product.price})</span>
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Actions & Status Switch */}
                  <div className="flex items-center gap-2 self-end md:self-center shrink-0">
                    {/* Active toggle button */}
                    <button
                      onClick={() => toggleBannerActive(banner.id)}
                      className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-colors cursor-pointer ${
                        banner.isActive
                          ? 'bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                          : 'bg-neutral-200 text-neutral-600 hover:bg-neutral-300'
                      }`}
                      title={banner.isActive ? 'Pausar anuncio' : 'Activar anuncio'}
                    >
                      {banner.isActive ? <Eye className="w-3.5 h-3.5 text-emerald-600" /> : <EyeOff className="w-3.5 h-3.5" />}
                      <span>{banner.isActive ? 'Visible en Inicio' : 'Pausado'}</span>
                    </button>

                    {/* Edit button */}
                    <button
                      onClick={() => openEditModal(banner)}
                      className="p-2 rounded-xl border border-neutral-200 text-neutral-600 hover:text-neutral-900 hover:bg-neutral-50 transition-colors cursor-pointer"
                      title="Editar anuncio"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>

                    {/* Delete button */}
                    <button
                      onClick={() => {
                        if (confirm(`¿Eliminar anuncio "${banner.title}"?`)) {
                          deleteBanner(banner.id);
                        }
                      }}
                      className="p-2 rounded-xl border border-neutral-200 text-rose-600 hover:bg-rose-50 hover:border-rose-200 transition-colors cursor-pointer"
                      title="Eliminar anuncio"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              );
            })
        ) : (
          <div className="bg-white rounded-2xl p-10 text-center border border-dashed border-neutral-300">
            <Megaphone className="w-10 h-10 text-neutral-300 mx-auto mb-2" />
            <p className="text-sm font-bold text-neutral-800">No hay anuncios configurados</p>
            <p className="text-xs text-neutral-400 mt-0.5">Crea el primer banner promocional para mostrarlo en Inicio.</p>
            <button
              onClick={openCreateModal}
              className="mt-3 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-bold"
            >
              Crear Anuncio Ahora
            </button>
          </div>
        )}
      </div>

      {/* Modal Crear / Editar Anuncio */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl overflow-hidden border border-neutral-200 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            {/* Modal Header */}
            <div className="p-5 border-b border-neutral-200 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Megaphone className="w-5 h-5 text-emerald-600" />
                <h3 className="font-extrabold text-base text-neutral-900">
                  {editingBanner ? 'Editar Anuncio de Inicio' : 'Crear Nuevo Anuncio / Propaganda'}
                </h3>
              </div>
              <button
                onClick={() => setModalOpen(false)}
                className="w-8 h-8 rounded-full bg-neutral-100 hover:bg-neutral-200 flex items-center justify-center text-neutral-500 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
              {/* Tienda & Producto Vinculado */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    Tienda Vendedora:
                  </label>
                  <select
                    value={selectedStoreId}
                    onChange={e => handleStoreChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Sin tienda asociada --</option>
                    {stores.map(s => (
                      <option key={s.id} value={s.id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    Producto a Promocionar:
                  </label>
                  <select
                    value={selectedProductId}
                    onChange={e => handleProductChange(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="">-- Ninguno (Banner general) --</option>
                    {storeProducts.map(p => (
                      <option key={p.id} value={p.id}>{p.name} (S/ {p.price})</option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Título (Opcional) */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Título Principal del Anuncio <span className="text-neutral-400 font-normal">(Opcional)</span>:
                </label>
                <input
                  type="text"
                  placeholder="Ej: ¡50% de Descuento en Zapatillas Urbanas! (Dejar en blanco si el flyer ya tiene texto)"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-bold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Subtítulo (Opcional) */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Subtítulo / Texto Explicativo <span className="text-neutral-400 font-normal">(Opcional)</span>:
                </label>
                <textarea
                  rows={2}
                  placeholder="Describe la oferta o motivo para comprar..."
                  value={subtitle}
                  onChange={e => setSubtitle(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              {/* Badge & Botón */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    Badge / Etiqueta Llamativa <span className="text-neutral-400 font-normal">(Opcional)</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: 🔥 Oferta Relámpago"
                    value={badge}
                    onChange={e => setBadge(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    Texto del Botón CTA <span className="text-emerald-600 font-bold">(Primordial)</span>:
                  </label>
                  <input
                    type="text"
                    placeholder="Ej: Comprar Ahora / Ver Promoción"
                    value={buttonText}
                    onChange={e => setButtonText(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Imagen del Banner (Subir archivo o URL) */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Imagen de la Propaganda / Banner: *
                </label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    required
                    placeholder="https://images.unsplash.com/... o sube tu banner"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    accept="image/*"
                    className="hidden"
                  />
                  <button
                    type="button"
                    disabled={isUploading}
                    onClick={() => fileInputRef.current?.click()}
                    className="px-3.5 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-bold shrink-0 flex items-center gap-1.5 transition-colors disabled:opacity-50 cursor-pointer"
                  >
                    {isUploading ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>Subiendo...</span>
                      </>
                    ) : (
                      <>
                        <Upload className="w-3.5 h-3.5" />
                        <span>Subir Banner</span>
                      </>
                    )}
                  </button>
                </div>
                {imageUrl && (
                  <div className="relative rounded-xl overflow-hidden border border-neutral-200 aspect-[21/9] max-h-40 bg-neutral-100 flex items-center justify-center">
                    <img
                      src={imageUrl}
                      alt="Vista previa del banner"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute top-2 right-2 bg-black/70 text-white text-[10px] font-bold px-2 py-0.5 rounded-full backdrop-blur-sm">
                      Vista previa
                    </div>
                  </div>
                )}
              </div>

              {/* Tema de Gradiente */}
              <div>
                <label className="text-xs font-bold text-neutral-800 block mb-1">
                  Estilo / Tema de Color del Banner:
                </label>
                <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
                  {GRADIENT_OPTIONS.map(opt => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => setGradientTheme(opt.id)}
                      className={`p-2 rounded-xl border text-center transition-all cursor-pointer ${
                        gradientTheme === opt.id
                          ? 'border-emerald-600 ring-2 ring-emerald-500/30 font-bold text-neutral-900 bg-emerald-50/50'
                          : 'border-neutral-200 text-neutral-600 hover:bg-neutral-50'
                      }`}
                    >
                      <div className={`w-full h-4 rounded-md bg-gradient-to-r ${opt.previewClass} mb-1`} />
                      <span className="text-[10px] block leading-tight">{opt.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Orden y Estado Activo */}
              <div className="grid grid-cols-2 gap-3 pt-2 border-t border-neutral-100">
                <div>
                  <label className="text-xs font-bold text-neutral-800 block mb-1">
                    Orden de Visualización:
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="99"
                    value={order}
                    onChange={e => setOrder(Number(e.target.value))}
                    className="w-full px-3 py-1.5 rounded-xl border border-neutral-200 text-xs font-semibold"
                  />
                </div>

                <div className="flex items-center pt-5">
                  <label className="flex items-center gap-2 cursor-pointer text-xs font-bold text-neutral-800">
                    <input
                      type="checkbox"
                      checked={isActive}
                      onChange={e => setIsActive(e.target.checked)}
                      className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
                    />
                    <span>Activar inmediatamente en Inicio</span>
                  </label>
                </div>
              </div>

              {/* Modal Buttons */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-700 text-xs font-bold hover:bg-neutral-50 cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs cursor-pointer flex items-center gap-1.5 disabled:opacity-60"
                >
                  {isSubmitting && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isSubmitting ? 'Guardando...' : (editingBanner ? 'Guardar Cambios' : 'Crear Propaganda')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
