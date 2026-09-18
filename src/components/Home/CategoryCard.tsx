import React from 'react';
import { 
  Shirt, 
  ShoppingBag, 
  Footprints, 
  Coffee, 
  Sparkles, 
  Tag
} from 'lucide-react';

interface CategoryCardProps {
  name: string;
  count: number;
  isSelected: boolean;
  onClick: () => void;
}

const CATEGORY_META: Record<string, { image: string; icon: React.ComponentType<{ className?: string }> }> = {
  'Ropa': {
    image: 'https://images.unsplash.com/photo-1489987707025-afc232f7ea0f?w=600&auto=format&fit=crop&q=80',
    icon: Shirt
  },
  'Accesorios': {
    image: 'https://images.unsplash.com/photo-1523293182086-7651a899d37f?w=600&auto=format&fit=crop&q=80',
    icon: ShoppingBag
  },
  'Calzado': {
    image: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=600&auto=format&fit=crop&q=80',
    icon: Footprints
  },
  'Café en Grano': {
    image: 'https://images.unsplash.com/photo-1447933601403-0c6688de566e?w=600&auto=format&fit=crop&q=80',
    icon: Coffee
  },
  'Café & Bebidas': {
    image: 'https://images.unsplash.com/photo-1509785307050-d4066910ec1e?w=600&auto=format&fit=crop&q=80',
    icon: Coffee
  }
};

const DEFAULT_CATEGORY_META = {
  image: 'https://images.unsplash.com/photo-1441986300917-64674bd600d8?w=600&auto=format&fit=crop&q=80',
  icon: Tag
};

export const CategoryCard: React.FC<CategoryCardProps> = ({
  name,
  count,
  isSelected,
  onClick
}) => {
  const meta = CATEGORY_META[name] || DEFAULT_CATEGORY_META;
  const IconComponent = meta.icon;

  return (
    <button
      onClick={onClick}
      className={`group relative text-left overflow-hidden rounded-2xl p-3 sm:p-4 transition-all duration-300 flex flex-col justify-between h-28 sm:h-36 md:h-40 cursor-pointer shadow-xs ${
        isSelected
          ? 'ring-3 ring-emerald-500 shadow-md scale-[1.02]'
          : 'hover:shadow-md hover:scale-[1.02] border border-neutral-200/80 bg-white'
      }`}
    >
      {/* Background Image with Gradient Overlay */}
      <div className="absolute inset-0 z-0">
        <img
          src={meta.image}
          alt={name}
          className="w-full h-full object-cover object-center group-hover:scale-110 transition-transform duration-500"
        />
        <div 
          className={`absolute inset-0 transition-opacity duration-300 ${
            isSelected
              ? 'bg-gradient-to-t from-emerald-950/90 via-emerald-900/60 to-emerald-950/40'
              : 'bg-gradient-to-t from-neutral-950/85 via-neutral-900/50 to-neutral-950/30 group-hover:from-neutral-950/90'
          }`}
        />
      </div>

      {/* Top row: Icon and Selection indicator */}
      <div className="relative z-10 flex items-center justify-between w-full">
        <div
          className={`w-8 h-8 rounded-xl flex items-center justify-center backdrop-blur-md transition-colors ${
            isSelected
              ? 'bg-emerald-500 text-neutral-950'
              : 'bg-white/20 text-white group-hover:bg-white group-hover:text-neutral-900'
          }`}
        >
          <IconComponent className="w-4 h-4" />
        </div>

        {isSelected ? (
          <span className="inline-flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-500 text-neutral-950 shadow-xs">
            <Sparkles className="w-2.5 h-2.5" />
            Activa
          </span>
        ) : (
          <span className="text-[10px] font-medium text-white/80 bg-black/30 backdrop-blur-xs px-2 py-0.5 rounded-full">
            {count} {count === 1 ? 'producto' : 'productos'}
          </span>
        )}
      </div>

      {/* Bottom row: Category Name & details */}
      <div className="relative z-10">
        <h4 className="text-white font-bold text-sm sm:text-base leading-tight group-hover:text-emerald-300 transition-colors drop-shadow-xs">
          {name}
        </h4>
        <p className="text-white/80 text-[11px] mt-0.5 font-medium">
          Explorar catálogo →
        </p>
      </div>
    </button>
  );
};
