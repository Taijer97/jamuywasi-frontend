import React from 'react';
import { StoreConfig } from '../../types';
import { useApp } from '../../context/AppContext';
import { DEFAULT_STORE_BANNER, DEFAULT_STORE_LOGO } from '../../data/initialData';
import { 
  Store, 
  MapPin, 
  Clock, 
  ArrowRight, 
  ShoppingBag,
  Truck,
  ExternalLink,
  Globe 
} from 'lucide-react';
import { StoreStatusBadge } from '../Common/StoreStatusBadge';

interface StoreCardProps {
  store: StoreConfig;
  productCount?: number;
}

export const StoreCard: React.FC<StoreCardProps> = ({ store, productCount }) => {
  const { openStoreCatalog, navigateToMarketplaceWithStore } = useApp();

  const handleGoToStore = () => {
    openStoreCatalog(store.id);
  };

  const handleExploreProducts = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigateToMarketplaceWithStore(store.id);
  };

  return (
    <div 
      onClick={handleGoToStore}
      className="group relative flex flex-col bg-white rounded-3xl border border-neutral-200/90 hover:border-emerald-500/40 hover:shadow-xl transition-all duration-300 overflow-hidden cursor-pointer h-full"
    >
      {/* Store Banner */}
      <div className="relative h-32 sm:h-36 w-full overflow-hidden bg-neutral-900">
        <img 
          src={store.banner || DEFAULT_STORE_BANNER} 
          alt={store.name} 
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700 opacity-80"
          loading="lazy"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />

        {/* Floating Smart Status Tag */}
        <div className="absolute top-3 left-3 z-10">
          <StoreStatusBadge
            schedule={store.schedule}
            storeName={store.name}
            size="xs"
            interactive={true}
          />
        </div>

        {/* Floating Store Type Badge */}
        <div className="absolute top-3 right-3 z-10">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-black/60 backdrop-blur-md text-[10px] sm:text-xs font-bold text-white border border-white/20 shadow-xs">
            {store.storeType === 'fisica' ? (
              <>
                <Store className="w-3.5 h-3.5 text-amber-400" />
                <span>Tienda Física</span>
              </>
            ) : (
              <>
                <Globe className="w-3.5 h-3.5 text-sky-400" />
                <span>Tienda Virtual</span>
              </>
            )}
          </span>
        </div>
      </div>

      {/* Store Info Container */}
      <div className="relative p-5 pt-0 flex-1 flex flex-col justify-between -mt-8">
        <div>
          {/* Store Logo Avatar */}
          <div className="relative inline-block mb-3">
            <div className="w-16 h-16 rounded-2xl overflow-hidden bg-white p-1 shadow-md border-2 border-white ring-2 ring-emerald-500/20 group-hover:ring-emerald-500/50 transition-all">
              <img 
                src={store.logo || DEFAULT_STORE_LOGO} 
                alt={store.name} 
                className="w-full h-full object-cover rounded-xl"
              />
            </div>
          </div>

          {/* Title & Tagline */}
          <div className="space-y-1">
            <h3 className="text-base sm:text-lg font-black text-neutral-900 group-hover:text-emerald-700 transition-colors flex items-center justify-between">
              <span>{store.name}</span>
              <ArrowRight className="w-4 h-4 text-neutral-400 group-hover:text-emerald-600 group-hover:translate-x-1 transition-all" />
            </h3>
            <p className="text-xs text-neutral-500 line-clamp-2 leading-relaxed">
              {store.tagline || store.description}
            </p>
          </div>

          {/* Metadata: Location, Delivery & Schedule */}
          <div className="mt-4 pt-3 border-t border-neutral-100 space-y-1.5 text-[11px] text-neutral-600">
            <div className="flex items-center gap-1.5 truncate">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{store.address}</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Envío: <strong>{store.currencySymbol}{store.deliveryFee}</strong> (Gratis desde {store.currencySymbol}{store.freeDeliveryThreshold})</span>
            </div>

            <div className="flex items-center gap-1.5">
              <Clock className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
              <span className="truncate">{store.schedule}</span>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-5 pt-3 border-t border-neutral-100 grid grid-cols-2 gap-2">
          <button
            onClick={handleExploreProducts}
            className="w-full py-2 px-3 rounded-xl border border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-800 text-xs font-bold transition-colors cursor-pointer text-center truncate"
            title="Ver productos de esta tienda en el Catálogo Multitienda"
          >
            Ver Productos
          </button>
          <button
            onClick={handleGoToStore}
            className="w-full py-2 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition-colors cursor-pointer text-center flex items-center justify-center gap-1 shadow-xs"
          >
            <span>Ir a Tienda</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>
    </div>
  );
};
