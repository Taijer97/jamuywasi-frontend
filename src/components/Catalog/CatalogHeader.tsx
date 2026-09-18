import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { DEFAULT_STORE_BANNER, DEFAULT_STORE_LOGO } from '../../data/initialData';
import {
  MessageCircle,
  MapPin,
  Clock,
  Truck,
  CheckCircle2,
  Share2,
  PhoneCall,
  Check,
  Store,
  Globe
} from 'lucide-react';
import { formatPrice } from '../../utils/whatsapp';
import { StoreStatusBadge } from '../Common/StoreStatusBadge';

export const CatalogHeader: React.FC = () => {
  const { currentStore } = useApp();
  const [copied, setCopied] = useState(false);

  const handleOpenDirectWhatsApp = () => {
    const cleanPhone = `${currentStore.countryCode}${currentStore.phone}`.replace(/\D/g, '');
    const welcomeMsg = encodeURIComponent(
      `¡Hola ${currentStore.name}! Estoy viendo su catálogo web y me gustaría hacerles una consulta.`
    );
    window.open(`https://wa.me/${cleanPhone}?text=${welcomeMsg}`, '_blank');
  };

  const handleShareLink = () => {
    const storeUrl = `${window.location.origin}${window.location.pathname}?view=catalog&store=${currentStore.slug || currentStore.id}`;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(storeUrl);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="relative bg-white border-b border-neutral-200">
      {/* Store Banner */}
      <div className="relative h-44 sm:h-60 w-full overflow-hidden bg-neutral-900">
        <img
          src={currentStore.banner || DEFAULT_STORE_BANNER}
          alt={currentStore.name}
          className="w-full h-full object-cover opacity-80"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-neutral-950/80 via-neutral-950/30 to-transparent" />
      </div>

      {/* Store Information Profile Container */}
      <div className="w-full px-4 sm:px-6 lg:px-8 xl:px-12 bg-white">
        <div className="relative pt-3 pb-5">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            {/* Logo and Identity */}
            <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4 sm:gap-5 w-full sm:w-auto">
              <div className="relative -mt-10 sm:-mt-14 w-20 h-20 sm:w-26 sm:h-26 rounded-2xl p-1 bg-white shadow-lg border-2 border-white ring-1 ring-neutral-200 shrink-0 z-10">
                <img
                  src={currentStore.logo || DEFAULT_STORE_LOGO}
                  alt={currentStore.name}
                  className="w-full h-full object-cover rounded-xl"
                />
                <span className="absolute -bottom-1 -right-1 p-1 bg-emerald-500 rounded-full text-white shadow-md ring-2 ring-white" title="Tienda verificada">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                </span>
              </div>

              {/* Store Name and Details: 100% en fondo blanco, sin montarse en la portada */}
              <div className="space-y-1 flex-1">
                <div className="flex items-center gap-2.5 flex-wrap">
                  <h1 className="text-xl sm:text-2xl lg:text-3xl font-black text-neutral-900 tracking-tight leading-tight">
                    {currentStore.name}
                  </h1>
                  <StoreStatusBadge
                    schedule={currentStore.schedule}
                    storeName={currentStore.name}
                    size="sm"
                    interactive={true}
                  />
                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-neutral-100 text-neutral-700 border border-neutral-200">
                    {currentStore.storeType === 'fisica' ? (
                      <>
                        <Store className="w-3.5 h-3.5 text-amber-600" />
                        <span>Tienda Física</span>
                      </>
                    ) : (
                      <>
                        <Globe className="w-3.5 h-3.5 text-sky-600" />
                        <span>Tienda Virtual</span>
                      </>
                    )}
                  </span>
                </div>
                {currentStore.tagline && (
                  <p className="text-xs sm:text-sm text-neutral-600 font-medium leading-snug">
                    {currentStore.tagline}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons: Compartir Enlace & Quick WhatsApp */}
            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                type="button"
                onClick={handleShareLink}
                className="inline-flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-neutral-200 bg-white hover:bg-neutral-50 text-neutral-700 text-xs font-semibold shadow-2xs transition-colors cursor-pointer"
                title="Copiar enlace directo de esta tienda"
              >
                {copied ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-700 font-bold">¡Copiado!</span>
                  </>
                ) : (
                  <>
                    <Share2 className="w-3.5 h-3.5 text-neutral-500" />
                    <span className="hidden sm:inline">Compartir Tienda</span>
                    <span className="sm:hidden">Compartir</span>
                  </>
                )}
              </button>

              <button
                onClick={handleOpenDirectWhatsApp}
                className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition-colors cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 fill-white" />
                <span>Hablar por WhatsApp</span>
              </button>
            </div>
          </div>

          {/* Description and Metadata Badges */}
          <p className="mt-4 text-xs sm:text-sm text-neutral-600 max-w-3xl leading-relaxed">
            {currentStore.description}
          </p>

          <div className="mt-4 pt-4 border-t border-neutral-100 flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-neutral-500">
            <div className="flex items-center gap-1.5">
              <MapPin className="w-3.5 h-3.5 text-neutral-400" />
              <span>{currentStore.address}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400" />
              <span>{currentStore.schedule}</span>
            </div>
            <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
              <Truck className="w-3.5 h-3.5 text-emerald-600" />
              <span>
                Envío gratis en compras mayores a{' '}
                {formatPrice(currentStore.freeDeliveryThreshold, currentStore.currency, currentStore.currencySymbol)}
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
