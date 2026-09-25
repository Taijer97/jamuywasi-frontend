import React from 'react';
import { StoreConfig } from '../../types';
import { DEFAULT_STORE_LOGO } from '../../data/initialData';
import { 
  Filter, 
  RotateCcw, 
  Check, 
  Store as StoreIcon, 
  Tag, 
  DollarSign, 
  CheckCircle2, 
  Percent,
  ChevronDown,
  Search,
  X
} from 'lucide-react';

export interface FilterState {
  minPrice: number | '';
  maxPrice: number | '';
  selectedStoreIds: string[];
  selectedCategory: string;
  onlyInStock: boolean;
  onlyOnSale: boolean;
}

interface HomeFiltersSidebarProps {
  filters: FilterState;
  setFilters: React.Dispatch<React.SetStateAction<FilterState>>;
  stores: StoreConfig[];
  categories: { name: string; count: number }[];
  totalProductsCount: number;
  filteredCount: number;
  onReset: () => void;
  /** Búsqueda por texto (opcional): se muestra al inicio de los filtros */
  searchQuery?: string;
  onSearchChange?: (value: string) => void;
  isMobileOpen?: boolean;
  onCloseMobile?: () => void;
}

const PRICE_PRESETS: { label: string; min: number | ''; max: number | '' }[] = [
  { label: 'Todos los precios', min: '', max: '' },
  { label: 'Hasta S/ 50', min: 0, max: 50 },
  { label: 'S/ 50 a S/ 100', min: 50, max: 100 },
  { label: 'S/ 100 a S/ 150', min: 100, max: 150 },
  { label: 'Más de S/ 150', min: 150, max: '' },
];

export const HomeFiltersSidebar: React.FC<HomeFiltersSidebarProps> = ({
  filters,
  setFilters,
  stores,
  categories,
  totalProductsCount,
  filteredCount,
  onReset,
  searchQuery = '',
  onSearchChange,
  isMobileOpen,
  onCloseMobile
}) => {
  const isAnyFilterActive =
    searchQuery.trim() !== '' ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.selectedStoreIds.length > 0 ||
    filters.selectedCategory !== 'all' ||
    filters.onlyInStock ||
    filters.onlyOnSale;

  const handleStoreToggle = (storeId: string) => {
    setFilters(prev => {
      const exists = prev.selectedStoreIds.includes(storeId);
      if (exists) {
        return {
          ...prev,
          selectedStoreIds: prev.selectedStoreIds.filter(id => id !== storeId)
        };
      } else {
        return {
          ...prev,
          selectedStoreIds: [...prev.selectedStoreIds, storeId]
        };
      }
    });
  };

  const handlePricePreset = (min: number | '', max: number | '') => {
    setFilters(prev => ({
      ...prev,
      minPrice: min,
      maxPrice: max
    }));
  };

  const content = (
    <div className="space-y-6">
      {/* Header and Reset Action */}
      <div className="flex items-center justify-between pb-3 border-b border-neutral-200">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-600" />
          <h3 className="font-bold text-sm text-neutral-900">Filtros de Búsqueda</h3>
        </div>

        {isAnyFilterActive && (
          <button
            onClick={onReset}
            className="inline-flex items-center gap-1 text-xs text-rose-600 hover:text-rose-700 font-semibold cursor-pointer"
          >
            <RotateCcw className="w-3 h-3" />
            <span>Limpiar</span>
          </button>
        )}
      </div>

      {/* Búsqueda por texto */}
      {onSearchChange && (
        <div className="space-y-2">
          <label htmlFor="filters-search" className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
            <Search className="w-3.5 h-3.5 text-emerald-600" />
            Buscar
          </label>
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              id="filters-search"
              type="search"
              enterKeyHint="search"
              placeholder="Producto, marca, categoría…"
              value={searchQuery}
              onChange={e => onSearchChange(e.target.value)}
              className="w-full pl-9 pr-9 py-2.5 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white text-base sm:text-sm text-neutral-900 placeholder:text-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-500 transition-colors [&::-webkit-search-cancel-button]:hidden"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => onSearchChange('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 w-7 h-7 flex items-center justify-center rounded-lg text-neutral-400 hover:text-neutral-700 hover:bg-neutral-100 cursor-pointer"
                aria-label="Limpiar búsqueda"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {/* Rango de Precios */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
            <DollarSign className="w-3.5 h-3.5 text-emerald-600" />
            Rango de Precio (S/)
          </label>
        </div>

        {/* Min & Max Inputs */}
        <div className="grid grid-cols-2 gap-2">
          <div>
            <span className="text-[10px] text-neutral-400 font-medium block mb-1">Mínimo</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">S/</span>
              <input
                type="number"
                min="0"
                placeholder="0"
                value={filters.minPrice}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    minPrice: e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                  }))
                }
                className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>

          <div>
            <span className="text-[10px] text-neutral-400 font-medium block mb-1">Máximo</span>
            <div className="relative">
              <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-neutral-400">S/</span>
              <input
                type="number"
                min="0"
                placeholder="Sin límite"
                value={filters.maxPrice}
                onChange={e =>
                  setFilters(prev => ({
                    ...prev,
                    maxPrice: e.target.value === '' ? '' : Math.max(0, Number(e.target.value))
                  }))
                }
                className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
              />
            </div>
          </div>
        </div>

        {/* Quick presets */}
        <div className="flex flex-wrap gap-1.5 pt-1">
          {PRICE_PRESETS.map((p, idx) => {
            const isSelected = filters.minPrice === p.min && filters.maxPrice === p.max;
            return (
              <button
                key={idx}
                type="button"
                onClick={() => handlePricePreset(p.min, p.max)}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-all cursor-pointer font-medium ${
                  isSelected
                    ? 'bg-emerald-600 text-white font-bold shadow-xs'
                    : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200 hover:text-neutral-900'
                }`}
              >
                {p.label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Filtrar por Tiendas */}
      <div className="space-y-2.5 pt-3 border-t border-neutral-100">
        <div className="flex items-center justify-between">
          <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
            <StoreIcon className="w-3.5 h-3.5 text-emerald-600" />
            Filtrar por Tienda
          </label>
          {filters.selectedStoreIds.length > 0 && (
            <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">
              {filters.selectedStoreIds.length} selec.
            </span>
          )}
        </div>

        <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
          {stores.map(store => {
            const isChecked = filters.selectedStoreIds.includes(store.id);
            return (
              <label
                key={store.id}
                onClick={() => handleStoreToggle(store.id)}
                className={`flex items-center justify-between p-2 rounded-xl transition-colors cursor-pointer border ${
                  isChecked
                    ? 'bg-emerald-50/60 border-emerald-300 text-emerald-950 font-semibold'
                    : 'bg-white hover:bg-neutral-50 border-neutral-200/80 text-neutral-700'
                }`}
              >
                <div className="flex items-center gap-2 truncate">
                  <img loading="lazy" decoding="async"
                    src={store.logo || DEFAULT_STORE_LOGO}
                    alt={store.name}
                    className="w-5 h-5 rounded-full object-cover shrink-0"
                  />
                  <span className="text-xs truncate">{store.name}</span>
                </div>

                <div
                  className={`w-4 h-4 rounded flex items-center justify-center border transition-colors ${
                    isChecked
                      ? 'bg-emerald-600 border-emerald-600 text-white'
                      : 'border-neutral-300 bg-white'
                  }`}
                >
                  {isChecked && <Check className="w-3 h-3 stroke-[3]" />}
                </div>
              </label>
            );
          })}
        </div>
      </div>

      {/* Categoría Seleccionada */}
      <div className="space-y-2 pt-3 border-t border-neutral-100">
        <label className="text-xs font-bold text-neutral-800 flex items-center gap-1.5">
          <Tag className="w-3.5 h-3.5 text-emerald-600" />
          Categorías
        </label>

        <div className="space-y-1">
          <button
            type="button"
            onClick={() => setFilters(prev => ({ ...prev, selectedCategory: 'all' }))}
            className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
              filters.selectedCategory === 'all'
                ? 'bg-emerald-600 text-white font-bold'
                : 'text-neutral-600 hover:bg-neutral-100'
            }`}
          >
            <span>Todas las categorías</span>
            <span className="text-[10px] opacity-80">{totalProductsCount}</span>
          </button>

          {categories.map(cat => {
            const isCurrent = filters.selectedCategory === cat.name;
            return (
              <button
                key={cat.name}
                type="button"
                onClick={() => setFilters(prev => ({ ...prev, selectedCategory: cat.name }))}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors cursor-pointer text-left ${
                  isCurrent
                    ? 'bg-emerald-600 text-white font-bold'
                    : 'text-neutral-600 hover:bg-neutral-100'
                }`}
              >
                <span>{cat.name}</span>
                <span className="text-[10px] opacity-80">{cat.count}</span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Disponibilidad y Ofertas */}
      <div className="space-y-2 pt-3 border-t border-neutral-100">
        <label className="text-xs font-bold text-neutral-800">
          Disponibilidad y Ofertas
        </label>

        <div className="space-y-2">
          <label className="flex items-center justify-between text-xs text-neutral-700 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
              Solo productos con stock
            </span>
            <input
              type="checkbox"
              checked={filters.onlyInStock}
              onChange={e =>
                setFilters(prev => ({ ...prev, onlyInStock: e.target.checked }))
              }
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between text-xs text-neutral-700 cursor-pointer">
            <span className="flex items-center gap-1.5">
              <Percent className="w-3.5 h-3.5 text-rose-500" />
              Solo productos en oferta
            </span>
            <input
              type="checkbox"
              checked={filters.onlyOnSale}
              onChange={e =>
                setFilters(prev => ({ ...prev, onlyOnSale: e.target.checked }))
              }
              className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
            />
          </label>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Desktop Sticky Sidebar */}
      <aside 
        className="hidden lg:block w-72 shrink-0 self-start sticky top-20 z-10"
        style={{ position: 'sticky', top: '5rem' }}
      >
        <div className="bg-white rounded-2xl border border-neutral-200/90 p-5 shadow-xs max-h-[calc(100vh-6.5rem)] overflow-y-auto">
          {content}
        </div>
      </aside>

      {/* Mobile Drawer */}
      {isMobileOpen && (
        <div className="fixed inset-0 z-50 lg:hidden flex">
          <div
            className="fixed inset-0 bg-black/50 backdrop-blur-xs"
            onClick={onCloseMobile}
          />
          <div className="relative ml-auto w-full max-w-xs bg-white h-full shadow-2xl p-6 overflow-y-auto flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-4 border-b border-neutral-200 mb-4">
                <h3 className="font-bold text-base text-neutral-900">Filtros</h3>
                <button
                  onClick={onCloseMobile}
                  className="text-neutral-400 hover:text-neutral-700 font-bold text-sm px-2 py-1"
                >
                  Cerrar ✕
                </button>
              </div>
              {content}
            </div>

            <div className="pt-4 border-t border-neutral-200 mt-6">
              <button
                onClick={onCloseMobile}
                className="w-full py-2.5 rounded-xl bg-emerald-600 text-white font-bold text-xs shadow-sm hover:bg-emerald-700 transition-colors"
              >
                Ver {filteredCount} resultados
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
