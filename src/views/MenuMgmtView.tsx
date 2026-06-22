import React, { useState, useMemo } from 'react';
import { Product } from '../types';
import { cn } from '../lib/utils';
import { Search, LayoutList, ToggleLeft, ToggleRight } from 'lucide-react';

interface MenuMgmtViewProps {
  products: Product[];
  onUpdateProduct: (product: Product) => void;
}

export function MenuMgmtView({ products, onUpdateProduct }: MenuMgmtViewProps) {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredProducts = useMemo(() => {
    return products.filter(p => 
      p.name.includes(searchQuery) || p.category.includes(searchQuery)
    );
  }, [products, searchQuery]);

  return (
    <div className="h-full flex flex-col gap-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مدیریت منوی دیجیتال</h2>
          <p className="text-slate-500 mt-1">مشاهده و مدیریت وضعیت نمایش محصولات در منوی مشتریان</p>
        </div>
        
        <div className="flex items-center gap-3 w-full sm:w-auto">
          <div className="w-full sm:w-80 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input
              type="text"
              placeholder="جستجوی محصول..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent transition-all"
            />
          </div>
        </div>
      </div>

      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm overflow-hidden flex flex-col flex-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-12 h-12 bg-amber-50 text-amber-600 rounded-2xl flex items-center justify-center">
            <LayoutList size={24} />
          </div>
          <h3 className="text-xl font-bold text-slate-800">آیتم‌های منو</h3>
        </div>

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
      </div>
    </div>
  );
}
