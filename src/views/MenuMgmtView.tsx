import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { cn, formatNumber, formatPrice } from '../lib/utils';
import { Eye, EyeOff, Grid3X3, Info, LayoutList, Search, ToggleLeft, ToggleRight } from 'lucide-react';

interface MenuMgmtViewProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
}

export function MenuMgmtView({ products, onUpdateProduct }: MenuMgmtViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [viewMode, setViewMode] = useState<'cards' | 'table'>('cards');

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.includes(searchQuery) || p.category.includes(searchQuery)
    );
  }, [products, searchQuery]);

  return (
    <div className="h-full flex flex-col gap-5 overflow-y-auto pb-8">
      {/* Header */}
      <div className="rounded-3xl border border-slate-200 bg-white/88 p-5 shadow-sm">
        <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مدیریت منوی دیجیتال</h2>
          <p className="text-slate-500 mt-1">مشاهده و مدیریت وضعیت نمایش محصولات در منوی مشتریان</p>
        </div>
        
        <div className="flex w-full flex-col gap-3 sm:flex-row xl:w-auto">
          <div className="relative w-full sm:w-80">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="جستجوی محصول..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
          <div className="app-tabs app-tabs-compact">
            <button onClick={() => setViewMode('cards')} className={cn('app-tab', viewMode === 'cards' && 'app-tab-active')}>
              <Grid3X3 size={17} />
              کارت
            </button>
            <button onClick={() => setViewMode('table')} className={cn('app-tab', viewMode === 'table' && 'app-tab-active')}>
              <LayoutList size={17} />
              جدول
            </button>
          </div>
        </div>
        </div>
      </div>

      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <section className="rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              <Info size={23} />
            </div>
            <div>
              <h3 className="text-lg font-black text-slate-900">راهنمای استفاده</h3>
              <p className="mt-1 text-sm font-bold text-slate-500">آیتم‌های فعال در منوی مشتری نمایش داده می‌شوند.</p>
            </div>
          </div>
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-2xl border border-emerald-100 bg-emerald-50 p-4 text-sm font-bold leading-6 text-emerald-800">
              محصولات فعال برای مشتری قابل مشاهده هستند.
            </div>
            <div className="rounded-2xl border border-amber-100 bg-amber-50 p-4 text-sm font-bold leading-6 text-amber-800">
              محصول ناموجود را می‌توانید مخفی کنید تا سفارش اشتباه ثبت نشود.
            </div>
            <div className="rounded-2xl border border-blue-100 bg-blue-50 p-4 text-sm font-bold leading-6 text-blue-800">
              از جستجو برای پیدا کردن سریع نام محصول یا دسته‌بندی استفاده کنید.
            </div>
          </div>
        </section>

        <section className="grid gap-3 rounded-3xl border border-slate-200 bg-white/90 p-5 shadow-sm sm:grid-cols-3 xl:grid-cols-1">
          <div>
            <p className="text-2xl font-black text-slate-950">{formatNumber(products.length)}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">کل آیتم‌ها</p>
          </div>
          <div>
            <p className="text-2xl font-black text-emerald-700">{formatNumber(products.filter(product => product.isActive !== false).length)}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">فعال در منو</p>
          </div>
          <div>
            <p className="text-2xl font-black text-rose-700">{formatNumber(products.filter(product => product.stock === 0).length)}</p>
            <p className="mt-1 text-xs font-bold text-slate-500">ناموجود</p>
          </div>
        </section>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="mb-6 flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-amber-50 text-amber-600">
              {viewMode === 'cards' ? <Grid3X3 size={24} /> : <LayoutList size={24} />}
            </div>
            <h3 className="text-xl font-black text-slate-800">آیتم‌های منو</h3>
          </div>
          <span className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-black text-slate-600">
            {formatNumber(filteredProducts.length)} آیتم
          </span>
        </div>

        {viewMode === 'cards' ? (
          <div className="grid grid-cols-1 gap-4 overflow-auto p-1 md:grid-cols-2 xl:grid-cols-3">
            {filteredProducts.map(product => {
              const isActive = product.isActive !== false;
              const isOutOfStock = product.stock === 0;

              return (
                <article key={product.id} className={cn(
                  'overflow-hidden rounded-3xl border bg-white shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/8',
                  isActive ? 'border-slate-200' : 'border-slate-200 opacity-70'
                )}>
                  <div className="relative aspect-[4/3] bg-slate-100">
                    <img src={product.image} className="h-full w-full object-cover" alt={product.name} />
                    <span className={cn(
                      'absolute right-3 top-3 rounded-xl px-3 py-1 text-xs font-black shadow-sm backdrop-blur',
                      isActive ? 'bg-emerald-50/90 text-emerald-700 ring-1 ring-emerald-200' : 'bg-slate-100/90 text-slate-600 ring-1 ring-slate-200'
                    )}>
                      {isActive ? 'فعال' : 'غیرفعال'}
                    </span>
                  </div>
                  <div className="p-4">
                    <div className="mb-4 flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="line-clamp-2 text-lg font-black leading-7 text-slate-950">{product.name}</h4>
                        <p className="mt-1 text-xs font-bold text-slate-500">{product.category}</p>
                      </div>
                      <span className={cn(
                        'shrink-0 rounded-xl px-2.5 py-1 text-xs font-black',
                        isOutOfStock ? 'bg-rose-50 text-rose-700' : 'bg-emerald-50 text-emerald-700'
                      )}>
                        {formatNumber(product.stock)}
                      </span>
                    </div>
                    <div className="mb-4 rounded-2xl bg-slate-50 p-3 text-sm font-black text-slate-800">
                      {formatPrice(product.price)}
                    </div>
                    <button
                      onClick={() => onUpdateProduct({ ...product, isActive: !isActive })}
                      className={cn(
                        'flex h-12 w-full items-center justify-center gap-2 rounded-2xl text-sm font-black transition-colors',
                        isActive ? 'bg-emerald-600 text-white hover:bg-emerald-700' : 'bg-slate-900 text-white hover:bg-slate-800'
                      )}
                    >
                      {isActive ? <EyeOff size={18} /> : <Eye size={18} />}
                      {isActive ? 'مخفی کردن از منو' : 'نمایش در منو'}
                    </button>
                  </div>
                </article>
              );
            })}
          </div>
        ) : (
        <div className="overflow-auto border border-slate-100 rounded-2xl flex-1 relative">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-50 sticky top-0 z-10 shadow-sm">
              <tr>
                <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-200">#</th>
                <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-200">نام محصول</th>
                <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-200">دسته‌بندی</th>
                <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-200">موجودی انبار</th>
                <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-200 w-32 text-center">وضعیت نمایش</th>
              </tr>
            </thead>
            <tbody>
              {filteredProducts.map((product, index) => {
                const isActive = product.isActive !== false;
                const isOutOfStock = product.stock === 0;
                
                return (
                  <tr key={product.id} className={cn("border-b border-slate-100 transition-colors", !isActive ? "bg-slate-50 opacity-70" : "hover:bg-slate-50/50")}>
                    <td className="py-3 px-4 text-slate-500">{index + 1}</td>
                    <td className="py-3 px-4 font-bold text-slate-800 flex items-center gap-3">
                      <img src={product.image} className="w-10 h-10 rounded-lg object-cover" alt="" />
                      {product.name}
                    </td>
                    <td className="py-3 px-4 text-slate-600 text-sm">{product.category}</td>
                    <td className="py-3 px-4">
                      <span className={cn("font-mono font-bold px-2 py-1 rounded text-sm", isOutOfStock ? "bg-red-100 text-red-600" : "bg-emerald-100 text-emerald-700")}>
                        {product.stock}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button 
                        onClick={() => onUpdateProduct({ ...product, isActive: !isActive })}
                        className={cn(
                          "inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-bold transition-all w-28 justify-center",
                          isActive ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200" : "bg-slate-200 text-slate-500 hover:bg-slate-300"
                        )}
                      >
                        {isActive ? (
                          <>فعال <ToggleRight size={18} /></>
                        ) : (
                          <>غیرفعال <ToggleLeft size={18} /></>
                        )}
                      </button>
                    </td>
                  </tr>
                );
              })}
              {filteredProducts.length === 0 && (
                <tr>
                  <td colSpan={5} className="py-8 text-center text-slate-500">
                    هیچ محصولی در انبار یافت نشد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        )}
      </div>
    </div>
  );
}
