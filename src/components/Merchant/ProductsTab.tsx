import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Product, ProductVariant, VariantOption, ProductCombination } from '../../types';
import {
  Plus,
  Search,
  Edit2,
  Trash2,
  Image as ImageIcon,
  Check,
  X,
  Sparkles,
  Layers,
  AlertCircle,
  Eye,
  Upload,
  Loader2
} from 'lucide-react';
import { formatPrice } from '../../utils/whatsapp';
import { DEFAULT_PRODUCT_IMAGE } from '../../data/initialData';

const PRESET_IMAGES = [
  { label: 'Sudadera / Ropa', url: 'https://images.unsplash.com/photo-1556905055-8f358a7a47b2?w=800&auto=format&fit=crop&q=80' },
  { label: 'Pantalón Urbano', url: 'https://images.unsplash.com/photo-1624378439575-d8705ad7ae80?w=800&auto=format&fit=crop&q=80' },
  { label: 'Tote Bag', url: 'https://images.unsplash.com/photo-1544816155-12df9643f363?w=800&auto=format&fit=crop&q=80' },
  { label: 'Gorra / Accesorio', url: 'https://images.unsplash.com/photo-1588850561407-ed78c282e89b?w=800&auto=format&fit=crop&q=80' },
  { label: 'Chaqueta Denim', url: 'https://images.unsplash.com/photo-1576995853123-5a10305d93c0?w=800&auto=format&fit=crop&q=80' },
  { label: 'Calzado / Zapatos', url: 'https://images.unsplash.com/photo-1533867617858-e7b97e060509?w=800&auto=format&fit=crop&q=80' },
  { label: 'Café de Especialidad', url: 'https://images.unsplash.com/photo-1587734195503-904fca47e0e9?w=800&auto=format&fit=crop&q=80' },
  { label: 'Reloj / Joyería', url: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800&auto=format&fit=crop&q=80' },
  { label: 'Taza Artesanal', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=800&auto=format&fit=crop&q=80' }
];

export interface FormVariantOption {
  id: string;
  name: string;      // 2do apartado: detalle (ej: Negro, L)
  imageUrl: string;  // 3er apartado: imagen (subida o url)
  price?: string | number; // opcional: si modifica el precio principal
  uploading?: boolean;
}

export interface FormVariantGroup {
  id: string;
  name: string;      // 1er apartado: título (ej: Colores o Tallas)
  options: FormVariantOption[];
}

export const ProductsTab: React.FC = () => {
  const {
    currentStoreProducts,
    currentStore,
    addProduct,
    updateProduct,
    deleteProduct,
    toggleProductStock,
    currentUser,
    uploadImage
  } = useApp();

  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const productFileInputRef = React.useRef<HTMLInputElement>(null);

  // Form state
  const [name, setName] = useState('');
  const [category, setCategory] = useState('Ropa');
  const [price, setPrice] = useState<number>(0);
  const [compareAtPrice, setCompareAtPrice] = useState<number | undefined>(undefined);
  const [sku, setSku] = useState('');
  const [description, setDescription] = useState('');
  const [imageUrl, setImageUrl] = useState(PRESET_IMAGES[0].url);
  const [inStock, setInStock] = useState(true);
  const [isFeatured, setIsFeatured] = useState(false);
  const [variantGroups, setVariantGroups] = useState<FormVariantGroup[]>([]);
  const [combinations, setCombinations] = useState<ProductCombination[]>([]);
  const [formError, setFormError] = useState<string | null>(null);

  // Variant management handlers
  const handleAddVariantGroup = (name: string = '', presetOpts: string[] = ['']) => {
    const newGroup: FormVariantGroup = {
      id: `var_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name,
      options: presetOpts.map((optName, idx) => ({
        id: `opt_${Date.now()}_${idx}_${Math.random().toString(36).slice(2, 7)}`,
        name: optName,
        imageUrl: '',
        price: ''
      }))
    };
    setVariantGroups(prev => [...prev, newGroup]);
  };

  const handleRemoveVariantGroup = (groupId: string) => {
    setVariantGroups(prev => prev.filter(g => g.id !== groupId));
  };

  const handleUpdateGroupName = (groupId: string, newName: string) => {
    setVariantGroups(prev => prev.map(g => g.id === groupId ? { ...g, name: newName } : g));
  };

  const handleAddOption = (groupId: string, optName: string = '') => {
    const newOption: FormVariantOption = {
      id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
      name: optName,
      imageUrl: '',
      price: ''
    };
    setVariantGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return { ...g, options: [...g.options, newOption] };
      }
      return g;
    }));
  };

  const handleRemoveOption = (groupId: string, optionId: string) => {
    setVariantGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        const remaining = g.options.filter(o => o.id !== optionId);
        return {
          ...g,
          options: remaining.length > 0 ? remaining : [{
            id: `opt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
            name: '',
            imageUrl: '',
            price: ''
          }]
        };
      }
      return g;
    }));
  };

  const handleUpdateOption = (groupId: string, optionId: string, updates: Partial<FormVariantOption>) => {
    setVariantGroups(prev => prev.map(g => {
      if (g.id === groupId) {
        return {
          ...g,
          options: g.options.map(o => o.id === optionId ? { ...o, ...updates } : o)
        };
      }
      return g;
    }));
  };

  const handleOptionImageUpload = async (groupId: string, optionId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    handleUpdateOption(groupId, optionId, { uploading: true });
    try {
      const res = await uploadImage(file, 'products');
      if (res && res.url) {
        handleUpdateOption(groupId, optionId, { imageUrl: res.url, uploading: false });
      }
    } catch (err: any) {
      alert(err.message || 'Error al subir la imagen');
      handleUpdateOption(groupId, optionId, { uploading: false });
    }
  };

  const handleProductImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsUploadingImage(true);
    try {
      const res = await uploadImage(file, 'products');
      setImageUrl(res.url);
    } catch (err: any) {
      alert(err.message || 'Error al subir imagen a MinIO');
    } finally {
      setIsUploadingImage(false);
    }
  };

  // Combinations generator and handlers
  const handleGenerateCombinations = () => {
    const validGroups = variantGroups
      .map(g => ({
        name: g.name.trim(),
        options: g.options.map(o => o.name.trim()).filter(n => n.length > 0)
      }))
      .filter(g => g.name.length > 0 && g.options.length > 0);

    if (validGroups.length < 2) {
      alert('Debes tener al menos 2 grupos de variantes con opciones (ej: Capacidad y Color) para generar la matriz de combinaciones.');
      return;
    }

    const cartesian = (arrays: { name: string; options: string[] }[]): Record<string, string>[] => {
      return arrays.reduce<Record<string, string>[]>(
        (acc, curr) => {
          const res: Record<string, string>[] = [];
          for (const prev of acc) {
            for (const opt of curr.options) {
              res.push({ ...prev, [curr.name]: opt });
            }
          }
          return res;
        },
        [{}]
      );
    };

    const allCombinationsOptions = cartesian(validGroups);

    // Merge with existing combinations if they already have customized price, image, or inStock
    const merged: ProductCombination[] = allCombinationsOptions.map(opts => {
      const existing = combinations.find(c => {
        const keys = Object.keys(opts);
        return keys.every(k => c.options[k] === opts[k]);
      });

      if (existing) {
        return existing;
      }

      const idKey = Object.values(opts).join('_').toLowerCase().replace(/[^a-z0-9]/g, '_');
      return {
        id: `comb_${Date.now()}_${idKey}_${Math.random().toString(36).slice(2, 6)}`,
        options: opts,
        inStock: true,
        price: undefined,
        imageUrl: undefined,
        sku: undefined
      };
    });

    setCombinations(merged);
  };

  const handleUpdateCombination = (combId: string, updates: Partial<ProductCombination>) => {
    setCombinations(prev => prev.map(c => c.id === combId ? { ...c, ...updates } : c));
  };

  const handleToggleAllCombinationsStock = (newStock: boolean) => {
    setCombinations(prev => prev.map(c => ({ ...c, inStock: newStock })));
  };

  const handleClearCombinations = () => {
    if (confirm('¿Deseas eliminar la matriz de combinaciones y volver al modo simple de variantes?')) {
      setCombinations([]);
    }
  };

  const handleCombinationImageUpload = async (combId: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const res = await uploadImage(file, 'products');
      if (res && res.url) {
        handleUpdateCombination(combId, { imageUrl: res.url });
      }
    } catch (err: any) {
      alert(err.message || 'Error al subir la imagen');
    }
  };

  // Category list
  const categories = Array.from(new Set(currentStoreProducts.map(p => p.category)));

  const handleOpenNewModal = () => {
    setEditingProduct(null);
    setName('');
    setCategory(categories[0] || 'General');
    setPrice(250);
    setCompareAtPrice(undefined);
    setSku(`SKU-${Math.floor(100 + Math.random() * 900)}`);
    setDescription('');
    setImageUrl(PRESET_IMAGES[Math.floor(Math.random() * PRESET_IMAGES.length)].url);
    setInStock(true);
    setIsFeatured(false);
    setVariantGroups([]);
    setCombinations([]);
    setFormError(null);
    setModalOpen(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingProduct(product);
    setName(product.name);
    setCategory(product.category);
    setPrice(product.price);
    setCompareAtPrice(product.compareAtPrice);
    setSku(product.sku || '');
    setDescription(product.description);
    setImageUrl(product.imageUrl);
    setInStock(product.inStock);
    setIsFeatured(!!product.isFeatured);

    // Convert variants array to FormVariantGroup representation
    if (product.variants && product.variants.length > 0) {
      const loaded: FormVariantGroup[] = product.variants.map((v, vIdx) => ({
        id: `var_${Date.now()}_${vIdx}_${Math.random().toString(36).slice(2, 7)}`,
        name: v.name,
        options: (v.options && v.options.length > 0)
          ? v.options.map((opt, oIdx) => {
              if (typeof opt === 'string') {
                return {
                  id: `opt_${Date.now()}_${vIdx}_${oIdx}_${Math.random().toString(36).slice(2, 7)}`,
                  name: opt,
                  imageUrl: '',
                  price: ''
                };
              }
              return {
                id: `opt_${Date.now()}_${vIdx}_${oIdx}_${Math.random().toString(36).slice(2, 7)}`,
                name: opt.name || '',
                imageUrl: opt.imageUrl || '',
                price: opt.price !== undefined ? opt.price : ''
              };
            })
          : [{
              id: `opt_${Date.now()}_${vIdx}_0_${Math.random().toString(36).slice(2, 7)}`,
              name: '',
              imageUrl: '',
              price: ''
            }]
      }));
      setVariantGroups(loaded);
    } else {
      setVariantGroups([]);
    }

    if (product.combinations && product.combinations.length > 0) {
      setCombinations(product.combinations);
    } else {
      setCombinations([]);
    }

    setFormError(null);
    setModalOpen(true);
  };

  const handleSaveProduct = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      setFormError('El nombre del producto es obligatorio.');
      return;
    }
    if (price <= 0) {
      setFormError('El precio debe ser mayor a 0.');
      return;
    }

    // Process clean structured variants:
    // 1er apartado: Título (group.name)
    // 2do apartado: Detalle (opt.name)
    // Precio específico opcional (opt.price)
    // 3er apartado: Imagen (opt.imageUrl)
    const cleanVariants: ProductVariant[] = variantGroups
      .map(g => ({
        name: g.name.trim(),
        options: g.options
          .filter(o => o.name.trim().length > 0)
          .map(o => {
            const hasImg = !!o.imageUrl.trim();
            const numericPrice = (o.price !== undefined && o.price !== '' && !isNaN(Number(o.price)) && Number(o.price) > 0)
              ? Number(o.price)
              : undefined;

            if (hasImg || numericPrice !== undefined) {
              const optObj: VariantOption = {
                name: o.name.trim()
              };
              if (hasImg) optObj.imageUrl = o.imageUrl.trim();
              if (numericPrice !== undefined) optObj.price = numericPrice;
              return optObj;
            }
            return o.name.trim();
          })
      }))
      .filter(g => g.name.length > 0 && g.options.length > 0);

    const cleanCombinations = combinations.length > 0
      ? combinations.map(c => ({
          ...c,
          price: (c.price !== undefined && c.price !== null && !isNaN(Number(c.price)) && Number(c.price) > 0)
            ? Number(c.price)
            : undefined,
          imageUrl: c.imageUrl?.trim() || undefined,
          sku: c.sku?.trim() || undefined
        }))
      : undefined;

    if (editingProduct) {
      updateProduct({
        ...editingProduct,
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
        category: category.trim(),
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        sku: sku.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        inStock,
        isFeatured,
        variants: cleanVariants,
        combinations: cleanCombinations
      });
    } else {
      addProduct({
        name: name.trim(),
        slug: name.trim().toLowerCase().replace(/\s+/g, '-'),
        category: category.trim(),
        price: Number(price),
        compareAtPrice: compareAtPrice ? Number(compareAtPrice) : undefined,
        sku: sku.trim(),
        description: description.trim(),
        imageUrl: imageUrl.trim(),
        inStock,
        isFeatured,
        variants: cleanVariants,
        combinations: cleanCombinations
      });
    }

    setModalOpen(false);
  };

  // Deduplicación defensiva por ID para garantizar keys únicas en React
  const uniqueStoreProducts = Array.from(
    new Map(currentStoreProducts.map(p => [p.id, p])).values()
  );

  const filtered = uniqueStoreProducts.filter(p => {
    const matchesSearch =
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(search.toLowerCase())) ||
      p.category.toLowerCase().includes(search.toLowerCase());
    const matchesCategory = categoryFilter === 'all' || p.category === categoryFilter;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-base font-extrabold text-neutral-900">
            Catálogo de Productos ({uniqueStoreProducts.length})
          </h2>
          <p className="text-xs text-neutral-500">
            Administra los ítems visibles para tus clientes en la tienda y en WhatsApp.
          </p>
        </div>

        <button
          onClick={handleOpenNewModal}
          className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition-colors cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>Nuevo Producto</span>
        </button>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center gap-3 bg-white p-3 rounded-2xl border border-neutral-200/80 shadow-2xs">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-neutral-400" />
          <input
            type="text"
            placeholder="Buscar por nombre, SKU o categoría..."
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full pl-9 pr-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
          />
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <select
            value={categoryFilter}
            onChange={e => setCategoryFilter(e.target.value)}
            className="w-full sm:w-auto px-3 py-1.5 text-xs rounded-lg border border-neutral-200 bg-white text-neutral-700 focus:outline-none"
          >
            <option value="all">Todas las categorías</option>
            {categories.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-2xl border border-neutral-200/80 shadow-xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-neutral-50 border-b border-neutral-200 text-neutral-500 font-semibold uppercase tracking-wider text-[10px]">
              <tr>
                <th className="py-3 px-4">Producto</th>
                <th className="py-3 px-4">Categoría</th>
                <th className="py-3 px-4">Precio</th>
                <th className="py-3 px-4">Variantes</th>
                <th className="py-3 px-4 text-center">Disponibilidad</th>
                <th className="py-3 px-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-100">
              {filtered.map(product => (
                <tr key={product.id} className="hover:bg-neutral-50/50 transition-colors">
                  <td className="py-3 px-4">
                    <div className="flex items-center gap-3">
                      <img loading="lazy" decoding="async"
                        src={product.imageUrl || DEFAULT_PRODUCT_IMAGE}
                        alt={product.name}
                        className="w-11 h-11 rounded-lg object-cover bg-neutral-100 shrink-0"
                      />
                      <div>
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-neutral-900">{product.name}</span>
                          {product.isFeatured && (
                            <span className="p-0.5 rounded bg-amber-100 text-amber-800" title="Destacado">
                              <Sparkles className="w-3 h-3" />
                            </span>
                          )}
                        </div>
                        {product.sku && (
                          <span className="text-[10px] text-neutral-400 font-mono">SKU: {product.sku}</span>
                        )}
                      </div>
                    </div>
                  </td>

                  <td className="py-3 px-4 text-neutral-600 font-medium">
                    <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 text-[11px]">
                      {product.category}
                    </span>
                  </td>

                  <td className="py-3 px-4">
                    <div className="font-extrabold text-neutral-900">
                      {formatPrice(product.price, currentStore.currency, currentStore.currencySymbol)}
                    </div>
                    {product.compareAtPrice && (
                      <div className="text-[10px] text-neutral-400 line-through">
                        {formatPrice(product.compareAtPrice, currentStore.currency, currentStore.currencySymbol)}
                      </div>
                    )}
                  </td>

                  <td className="py-3 px-4">
                    {product.variants && product.variants.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {product.variants.map((v, i) => (
                          <span key={i} className="text-[10px] px-1.5 py-0.5 rounded bg-neutral-100 text-neutral-600">
                            {v.name} ({v.options.length})
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[11px] text-neutral-400">Sin variantes</span>
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    <button
                      onClick={() => toggleProductStock(product.id)}
                      className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-bold transition-colors cursor-pointer ${
                        product.inStock
                          ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                          : 'bg-rose-50 text-rose-700 hover:bg-rose-100'
                      }`}
                    >
                      <span className={`w-1.5 h-1.5 rounded-full ${product.inStock ? 'bg-emerald-500' : 'bg-rose-500'}`} />
                      <span>{product.inStock ? 'En stock' : 'Agotado'}</span>
                    </button>
                  </td>

                  <td className="py-3 px-4 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => handleOpenEditModal(product)}
                        className="p-1.5 rounded-lg text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 transition-colors cursor-pointer"
                        title="Editar producto"
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => {
                          if (confirm(`¿Estás seguro de eliminar "${product.name}"?`)) {
                            deleteProduct(product.id);
                          }
                        }}
                        className="p-1.5 rounded-lg text-neutral-400 hover:text-rose-600 hover:bg-rose-50 transition-colors cursor-pointer"
                        title="Eliminar producto"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Product Modal */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-neutral-950/60 backdrop-blur-xs overflow-y-auto animate-in fade-in duration-150">
          <div
            className="relative w-full max-w-2xl lg:max-w-4xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-neutral-100 max-h-[90vh] flex flex-col"
            onClick={e => e.stopPropagation()}
          >
            <div className="p-4 border-b border-neutral-200 flex items-center justify-between bg-neutral-50/50">
              <h3 className="text-sm font-bold text-neutral-900">
                {editingProduct ? 'Editar Producto' : 'Crear Nuevo Producto'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="w-7 h-7 rounded-lg text-neutral-500 hover:text-neutral-900 hover:bg-neutral-200 flex items-center justify-center cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="p-5 overflow-y-auto space-y-4 text-xs">
              {formError && (
                <div className="p-2.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              {/* Title & SKU */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="sm:col-span-2">
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Nombre del producto <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Sudadera Oversize..."
                    value={name}
                    onChange={e => setName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Código SKU
                  </label>
                  <input
                    type="text"
                    placeholder="PROD-01"
                    value={sku}
                    onChange={e => setSku(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-mono"
                  />
                </div>
              </div>

              {/* Category & Pricing */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Ej. Ropa, Café..."
                    value={category}
                    onChange={e => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Precio Venta ({currentStore.currencySymbol}) <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    required
                    value={price || ''}
                    onChange={e => setPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 font-bold"
                  />
                </div>

                <div>
                  <label className="block font-semibold text-neutral-700 mb-1">
                    Precio Anterior (Oferta)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    placeholder="Opcional"
                    value={compareAtPrice ?? ''}
                    onChange={e => setCompareAtPrice(e.target.value ? Number(e.target.value) : undefined)}
                    className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              {/* Description */}
              <div>
                <label className="block font-semibold text-neutral-700 mb-1">
                  Descripción del producto
                </label>
                <textarea
                  rows={2}
                  placeholder="Materiales, cuidados, notas de sabor o características..."
                  value={description}
                  onChange={e => setDescription(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 resize-none"
                />
              </div>

              {/* Image URL & Preset picker */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="block font-semibold text-neutral-700">
                    Foto del Producto (URL o Subir a MinIO)
                  </label>
                  <input
                    type="file"
                    ref={productFileInputRef}
                    hidden
                    accept="image/*"
                    onChange={handleProductImageUpload}
                  />
                  <button
                    type="button"
                    onClick={() => productFileInputRef.current?.click()}
                    disabled={isUploadingImage}
                    className="inline-flex items-center gap-1.5 px-3 py-1 text-[11px] font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 rounded-lg transition-colors cursor-pointer"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>{isUploadingImage ? 'Subiendo a MinIO...' : 'Subir Imagen (MinIO)'}</span>
                  </button>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    placeholder="https://images.unsplash.com/... o enlace de MinIO"
                    value={imageUrl}
                    onChange={e => setImageUrl(e.target.value)}
                    className="flex-1 px-3 py-2 rounded-xl border border-neutral-200 bg-neutral-50 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                  {imageUrl && (
                    <img loading="lazy" decoding="async"
                      src={imageUrl}
                      alt="Preview"
                      className="w-9 h-9 rounded-lg object-cover border border-neutral-200"
                    />
                  )}
                </div>

                {/* Preset image quick selectors */}
                <div className="pt-1">
                  <span className="text-[10px] text-neutral-500 font-medium block mb-1">
                    O selecciona una imagen predefinida de alta calidad:
                  </span>
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                    {PRESET_IMAGES.map((img, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setImageUrl(img.url)}
                        className={`px-2 py-1 rounded-lg border text-[10px] whitespace-nowrap transition-colors cursor-pointer ${
                          imageUrl === img.url
                            ? 'border-emerald-600 bg-emerald-50 text-emerald-800 font-bold'
                            : 'border-neutral-200 bg-neutral-50 hover:bg-neutral-100 text-neutral-600'
                        }`}
                      >
                        {img.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Variantes estructuradas: 3 apartados (Título, Detalle, Imagen) */}
              <div className="pt-2 border-t border-neutral-200">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-3">
                  <div>
                    <label className="font-bold text-neutral-800 flex items-center gap-2 text-sm">
                      <Layers className="w-4 h-4 text-emerald-600" />
                      Variantes del Producto (Tallas, Colores, Opciones)
                    </label>
                    <p className="text-xs text-neutral-500 mt-0.5">
                      3 apartados: <b>1. Título</b> (ej: Colores), <b>2. Detalle</b> (ej: Negro), <b>Precio opcional</b> (si este detalle cambia el precio base) e <b>3. Imagen</b> (para que cambie la foto al seleccionarla).
                    </p>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleAddVariantGroup('', [''])}
                    className="self-start sm:self-auto inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-700 font-semibold text-xs transition-colors border border-emerald-200"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    Nueva Variante
                  </button>
                </div>

                {variantGroups.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-neutral-300 bg-neutral-50/70 text-center">
                    <p className="text-xs text-neutral-500 mb-2">Este producto no tiene variantes aún. Puedes crear una o usar un atajo rápido:</p>
                    <div className="flex flex-wrap items-center justify-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleAddVariantGroup('Colores', ['Negro', 'Blanco', 'Azul'])}
                        className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-emerald-500 hover:text-emerald-700 text-neutral-600 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                      >
                        + Colores (Negro, Blanco, Azul)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddVariantGroup('Tallas', ['S', 'M', 'L', 'XL'])}
                        className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-emerald-500 hover:text-emerald-700 text-neutral-600 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                      >
                        + Tallas (S, M, L, XL)
                      </button>
                      <button
                        type="button"
                        onClick={() => handleAddVariantGroup('Calzado', ['38', '39', '40', '41'])}
                        className="px-2.5 py-1 rounded-lg bg-white border border-neutral-200 hover:border-emerald-500 hover:text-emerald-700 text-neutral-600 text-xs font-medium transition-all shadow-2xs cursor-pointer"
                      >
                        + Calzado (38, 39, 40, 41)
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {variantGroups.map((group) => (
                      <div
                        key={group.id}
                        className="p-3.5 rounded-2xl border border-neutral-200 bg-neutral-50/60 shadow-2xs space-y-3"
                      >
                        {/* 1er Apartado: Título */}
                        <div className="flex items-start justify-between gap-3 pb-3 border-b border-neutral-200/80">
                          <div className="flex-1">
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <span className="w-5 h-5 rounded-full bg-emerald-600 text-white text-[11px] font-bold flex items-center justify-center">
                                1
                              </span>
                              <label className="text-xs font-bold text-neutral-700 uppercase tracking-wider">
                                1er Apartado: Título de la Variante
                              </label>
                            </div>
                            <div className="flex flex-wrap sm:flex-nowrap items-center gap-2">
                              <input
                                type="text"
                                value={group.name}
                                onChange={e => handleUpdateGroupName(group.id, e.target.value)}
                                placeholder="Ej. Colores, Tallas, Modelo, Capacidad..."
                                className="w-full sm:w-64 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white text-sm font-semibold text-neutral-800 placeholder-neutral-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/30"
                              />
                              <div className="flex items-center gap-1">
                                {['Colores', 'Tallas', 'Modelo'].map(preset => (
                                  <button
                                    key={preset}
                                    type="button"
                                    onClick={() => handleUpdateGroupName(group.id, preset)}
                                    className="px-2 py-1 text-[11px] bg-white border border-neutral-200 hover:bg-neutral-100 rounded-lg text-neutral-600 font-medium transition-colors cursor-pointer"
                                  >
                                    {preset}
                                  </button>
                                ))}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => handleRemoveVariantGroup(group.id)}
                            title="Eliminar este grupo de variantes"
                            className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        </div>

                        {/* Apartados 2 y 3: Lista de Detalles, Precios e Imágenes */}
                        <div className="space-y-2">
                          <div className="grid grid-cols-12 gap-2 px-1 text-[11px] font-bold text-neutral-500 uppercase tracking-wider">
                            <div className="col-span-12 sm:col-span-4 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold flex items-center justify-center">
                                2
                              </span>
                              <span>2do: Detalle / Opción</span>
                            </div>
                            <div className="col-span-12 sm:col-span-3 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold flex items-center justify-center">
                                $
                              </span>
                              <span>Precio S/ (opc.)</span>
                            </div>
                            <div className="col-span-10 sm:col-span-4 flex items-center gap-1.5">
                              <span className="w-4 h-4 rounded-full bg-neutral-200 text-neutral-700 text-[10px] font-bold flex items-center justify-center">
                                3
                              </span>
                              <span>3er: Imagen (Subir o URL)</span>
                            </div>
                            <div className="col-span-2 sm:col-span-1"></div>
                          </div>

                          {group.options.map((opt) => (
                            <div
                              key={opt.id}
                              className="p-2.5 rounded-xl bg-white border border-neutral-200 shadow-2xs hover:border-neutral-300 transition-colors"
                            >
                              <div className="grid grid-cols-12 gap-2 items-center">
                                {/* 2do Apartado: Detalle */}
                                <div className="col-span-12 sm:col-span-4">
                                  <input
                                    type="text"
                                    value={opt.name}
                                    onChange={e => handleUpdateOption(group.id, opt.id, { name: e.target.value })}
                                    placeholder="Ej. Negro, Rojo, XL, 128GB..."
                                    className="w-full px-2.5 py-1.5 rounded-lg border border-neutral-300 bg-neutral-50/50 text-xs font-semibold text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>

                                {/* Precio opcional de la variante */}
                                <div className="col-span-12 sm:col-span-3">
                                  <div className="relative flex items-center">
                                    <span className="absolute left-2.5 text-[11px] font-bold text-neutral-400 select-none">
                                      S/
                                    </span>
                                    <input
                                      type="number"
                                      step="0.01"
                                      min="0"
                                      value={opt.price ?? ''}
                                      onChange={e => handleUpdateOption(group.id, opt.id, { price: e.target.value })}
                                      placeholder={`Base (${price || 0})`}
                                      title="Opcional: Si este detalle modifica el precio del producto (déjalo vacío para usar el precio base)"
                                      className="w-full pl-7 pr-2 py-1.5 rounded-lg border border-neutral-300 bg-neutral-50/50 text-xs font-semibold text-neutral-800 placeholder-neutral-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                    />
                                  </div>
                                </div>

                                {/* 3er Apartado: Subir imagen o URL */}
                                <div className="col-span-10 sm:col-span-4 flex items-center gap-2">
                                  {/* Preview miniatura */}
                                  {opt.imageUrl ? (
                                    <div className="relative group/preview shrink-0">
                                      <img loading="lazy" decoding="async"
                                        src={opt.imageUrl}
                                        alt={opt.name || 'preview'}
                                        className="w-8 h-8 rounded-lg object-cover border border-neutral-300 shadow-2xs"
                                        onError={e => {
                                          (e.target as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                                        }}
                                      />
                                      <button
                                        type="button"
                                        onClick={() => handleUpdateOption(group.id, opt.id, { imageUrl: '' })}
                                        title="Quitar foto"
                                        className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/preview:opacity-100 transition-opacity shadow-xs cursor-pointer"
                                      >
                                        <X className="w-2.5 h-2.5" />
                                      </button>
                                    </div>
                                  ) : (
                                    <div className="w-8 h-8 rounded-lg bg-neutral-100 border border-neutral-200 shrink-0 flex items-center justify-center text-neutral-400">
                                      <ImageIcon className="w-4 h-4" />
                                    </div>
                                  )}

                                  {/* Botón subir archivo */}
                                  <label
                                    title="Subir foto desde tu dispositivo a MinIO"
                                    className={`shrink-0 inline-flex items-center gap-1 px-2 py-1.5 rounded-lg border text-xs font-semibold cursor-pointer transition-colors ${
                                      opt.uploading
                                        ? 'bg-neutral-100 text-neutral-400 border-neutral-200 cursor-not-allowed'
                                        : 'bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border-emerald-200'
                                    }`}
                                  >
                                    {opt.uploading ? (
                                      <Loader2 className="w-3.5 h-3.5 animate-spin text-emerald-600" />
                                    ) : (
                                      <Upload className="w-3.5 h-3.5 text-emerald-600" />
                                    )}
                                    <span className="hidden xl:inline">
                                      {opt.uploading ? '...' : 'Subir'}
                                    </span>
                                    <input
                                      type="file"
                                      accept="image/*"
                                      disabled={opt.uploading}
                                      onChange={e => handleOptionImageUpload(group.id, opt.id, e)}
                                      className="hidden"
                                    />
                                  </label>

                                  {/* Input para URL opcional */}
                                  <input
                                    type="text"
                                    value={opt.imageUrl}
                                    onChange={e => handleUpdateOption(group.id, opt.id, { imageUrl: e.target.value })}
                                    placeholder="URL..."
                                    className="flex-1 min-w-0 px-2 py-1.5 rounded-lg border border-neutral-200 bg-white text-xs text-neutral-700 placeholder-neutral-400 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                                  />
                                </div>

                                {/* Botón eliminar detalle */}
                                <div className="col-span-2 sm:col-span-1 flex justify-end">
                                  <button
                                    type="button"
                                    onClick={() => handleRemoveOption(group.id, opt.id)}
                                    title="Eliminar este detalle"
                                    className="p-1.5 text-neutral-400 hover:text-red-600 hover:bg-neutral-100 rounded-lg transition-colors cursor-pointer"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              </div>
                            </div>
                          ))}

                          <button
                            type="button"
                            onClick={() => handleAddOption(group.id)}
                            className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-emerald-700 hover:text-emerald-800 hover:bg-emerald-50 rounded-lg transition-colors cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            Agregar otro detalle a este grupo
                          </button>
                        </div>
                      </div>
                    ))}

                    <div className="flex justify-end pt-1">
                      <button
                        type="button"
                        onClick={() => handleAddVariantGroup('', [''])}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-neutral-300 bg-white hover:bg-neutral-50 text-neutral-700 font-semibold text-xs transition-colors cursor-pointer"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        + Agregar otro grupo de variantes
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Sección: Matriz de Combinaciones y Stock Real */}
              {variantGroups.length >= 2 && (
                <div className="pt-4 border-t border-neutral-200 space-y-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <div className="flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <label className="font-bold text-neutral-800 text-sm">
                          Matriz de Combinaciones & Stock Real
                        </label>
                        {combinations.length > 0 && (
                          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                            {combinations.length} combinaciones
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 mt-0.5">
                        Define qué combinaciones existen realmente (ej: si un color solo viene en cierta capacidad o talla) y personaliza su precio o foto.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      {combinations.length > 0 && (
                        <button
                          type="button"
                          onClick={handleClearCombinations}
                          className="px-2.5 py-1.5 rounded-xl border border-neutral-200 text-neutral-500 hover:text-red-600 hover:bg-red-50 text-xs font-semibold transition-colors cursor-pointer"
                        >
                          Limpiar Matriz
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={handleGenerateCombinations}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        {combinations.length > 0 ? 'Sincronizar Combinaciones' : '⚡ Generar Combinaciones'}
                      </button>
                    </div>
                  </div>

                  {combinations.length > 0 ? (
                    <div className="space-y-2 border border-neutral-200 rounded-2xl p-3 bg-neutral-50/50">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 border-b border-neutral-200 text-xs text-neutral-500">
                        <span>Marca qué combinaciones tienes disponibles y cuáles están agotadas o no existen:</span>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => handleToggleAllCombinationsStock(true)}
                            className="text-[11px] font-semibold text-emerald-700 hover:underline cursor-pointer"
                          >
                            Activar todas
                          </button>
                          <span>•</span>
                          <button
                            type="button"
                            onClick={() => handleToggleAllCombinationsStock(false)}
                            className="text-[11px] font-semibold text-neutral-500 hover:underline cursor-pointer"
                          >
                            Desactivar todas
                          </button>
                        </div>
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-2 pr-1">
                        {combinations.map((comb) => (
                          <div
                            key={comb.id}
                            className={`p-2.5 rounded-xl border transition-all ${
                              comb.inStock
                                ? 'bg-white border-neutral-200 shadow-2xs'
                                : 'bg-neutral-100/70 border-neutral-200 opacity-60'
                            }`}
                          >
                            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                              {/* Left: Options badges + inStock switch */}
                              <div className="flex items-center gap-2.5 min-w-0">
                                <label className="flex items-center gap-1.5 cursor-pointer shrink-0">
                                  <input
                                    type="checkbox"
                                    checked={comb.inStock}
                                    onChange={e => handleUpdateCombination(comb.id, { inStock: e.target.checked })}
                                    className="rounded text-emerald-600 focus:ring-emerald-500 w-4 h-4 cursor-pointer"
                                  />
                                  <span className={`text-xs font-bold ${comb.inStock ? 'text-emerald-700' : 'text-neutral-400'}`}>
                                    {comb.inStock ? 'En Stock' : 'Agotado'}
                                  </span>
                                </label>

                                <div className="flex flex-wrap items-center gap-1.5">
                                  {Object.entries(comb.options).map(([vName, vVal]) => (
                                    <span
                                      key={vName}
                                      className="inline-flex items-center gap-1 px-2 py-0.5 rounded-lg bg-neutral-100 border border-neutral-200 text-neutral-800 text-[11px] font-semibold"
                                    >
                                      <span className="text-neutral-400 font-normal">{vName}:</span>
                                      <span>{vVal}</span>
                                    </span>
                                  ))}
                                </div>
                              </div>

                              {/* Right: Specific Price and Image */}
                              <div className="flex items-center gap-2 shrink-0">
                                {/* Precio específico */}
                                <div className="relative w-28">
                                  <span className="absolute left-2 top-1/2 -translate-y-1/2 text-[11px] font-bold text-neutral-400">
                                    S/
                                  </span>
                                  <input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={comb.price ?? ''}
                                    onChange={e => handleUpdateCombination(comb.id, { price: e.target.value ? Number(e.target.value) : undefined })}
                                    placeholder={`Base (${price || 0})`}
                                    title="Precio específico para esta combinación"
                                    className="w-full pl-6 pr-2 py-1 rounded-lg border border-neutral-300 bg-white text-xs font-semibold text-neutral-800 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                                  />
                                </div>

                                {/* Preview / Image */}
                                {comb.imageUrl ? (
                                  <div className="relative group/combimg shrink-0">
                                    <img loading="lazy" decoding="async"
                                      src={comb.imageUrl}
                                      alt="comb"
                                      className="w-7 h-7 rounded-lg object-cover border border-neutral-300"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleUpdateCombination(comb.id, { imageUrl: undefined })}
                                      className="absolute -top-1.5 -right-1.5 w-4 h-4 rounded-full bg-red-500 text-white flex items-center justify-center opacity-0 group-hover/combimg:opacity-100 transition-opacity cursor-pointer"
                                    >
                                      <X className="w-2.5 h-2.5" />
                                    </button>
                                  </div>
                                ) : (
                                  <label
                                    title="Subir foto específica para esta combinación"
                                    className="w-7 h-7 rounded-lg bg-white border border-neutral-200 hover:border-neutral-300 text-neutral-400 hover:text-neutral-700 flex items-center justify-center cursor-pointer transition-colors"
                                  >
                                    <Upload className="w-3.5 h-3.5" />
                                    <input
                                      type="file"
                                      accept="image/*"
                                      className="hidden"
                                      onChange={e => handleCombinationImageUpload(comb.id, e)}
                                    />
                                  </label>
                                )}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 rounded-xl border border-dashed border-amber-300/80 bg-amber-50/40 text-center">
                      <p className="text-xs text-amber-900 font-medium mb-1">
                        Tienes {variantGroups.length} grupos de variantes configurados.
                      </p>
                      <p className="text-[11px] text-amber-800/80 mb-2">
                        Puedes generar la matriz de combinaciones para definir exactamente qué cruces de opciones existen en tu inventario.
                      </p>
                      <button
                        type="button"
                        onClick={handleGenerateCombinations}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold text-xs shadow-xs transition-colors cursor-pointer"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        Generar Matriz de Combinaciones
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Toggles */}
              <div className="flex items-center gap-6 pt-2 border-t border-neutral-100">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={inStock}
                    onChange={e => setInStock(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-neutral-700">Disponible en stock</span>
                </label>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isFeatured}
                    onChange={e => setIsFeatured(e.target.checked)}
                    className="rounded text-emerald-600 focus:ring-emerald-500"
                  />
                  <span className="font-semibold text-neutral-700">Producto Destacado</span>
                </label>
              </div>

              {/* Bottom Actions */}
              <div className="pt-4 border-t border-neutral-200 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-neutral-200 text-neutral-600 hover:bg-neutral-100 font-semibold cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold cursor-pointer"
                >
                  {editingProduct ? 'Guardar Cambios' : 'Crear Producto'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
