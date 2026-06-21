import React, { useState, useMemo } from 'react';
import { Product, Expense, Order } from '../types';
import { initialProducts, categories } from '../data';
import { formatPrice, formatNumber, cn } from '../lib/utils';
import { Search, Plus, Minus, Filter, Edit, Trash2, AlertTriangle, X, UploadCloud, Hash, CheckCircle, Bell, Trash, CalendarClock } from 'lucide-react';
import { PieChart, Pie, Cell, Tooltip as RechartsTooltip, ResponsiveContainer, Legend, LineChart, Line, XAxis, YAxis, CartesianGrid } from 'recharts';
import { ImageUploadModal } from '../components/ImageUploadModal';

interface InventoryViewProps {
  products: Product[];
  orders?: Order[];
  expenses?: Expense[];
  onAddProduct?: (product: Omit<Product, 'id'>) => void;
  onUpdateProduct?: (product: Product) => void;
  onAddExpense?: (expense: Expense) => void;
}

export function InventoryView({ products, orders = [], expenses = [], onAddProduct, onUpdateProduct, onAddExpense }: InventoryViewProps) {
  const [activeMainTab, setActiveMainTab] = useState<'products' | 'waste'>('products');
  const [searchQuery, setSearchQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState<string>('همه');
  const [sortBy, setSortBy] = useState<'default' | 'stock-asc' | 'stock-desc'>('default');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImageModalOpen, setIsImageModalOpen] = useState(false);

  interface ToastState {
    id: number;
    message: string;
    productName: string;
    type: 'warning' | 'success';
  }
  const [toasts, setToasts] = useState<ToastState[]>([]);
  const LOW_STOCK_THRESHOLD = 10;

  const showToast = (message: string, productName: string, type: 'warning' | 'success') => {
    const id = Date.now();
    setToasts(prev => [...prev, { id, message, productName, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const handleAdjustStock = (product: Product, delta: number) => {
    if (!onUpdateProduct) return;
    const newStock = Math.max(0, product.stock + delta);
    const threshold = product.minThreshold ?? 10;
    
    // Only fire toast when it crosses the threshold going down
    if (newStock < product.stock && newStock <= threshold && newStock > 0) {
      showToast(`موجودی به زیر آستانه هشدار (${threshold}) رسید`, product.name, 'warning');
    } else if (newStock === 0 && product.stock > 0) {
      showToast('موجودی انبار به اتمام رسید', product.name, 'warning');
    }

    onUpdateProduct({ ...product, stock: newStock });
  };
  
  // Form states
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: categories[1], // skip 'همه'
    price: '',
    stock: '',
    minThreshold: '10',
    barcode: '',
    image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
  });

  const filteredProducts = useMemo(() => {
    let result = products.filter(p => {
      const matchesSearch = p.name.includes(searchQuery) || (p.barcode && p.barcode.includes(searchQuery));
      const matchesCategory = activeCategory === 'همه' || p.category === activeCategory;
      return matchesSearch && matchesCategory;
    });

    if (sortBy === 'stock-asc') {
      result.sort((a, b) => a.stock - b.stock);
    } else if (sortBy === 'stock-desc') {
      result.sort((a, b) => b.stock - a.stock);
    }

    return result;
  }, [products, searchQuery, activeCategory, sortBy]);

  const categoryStockData = useMemo(() => {
    const data: Record<string, number> = {};
    products.forEach(p => {
      data[p.category] = (data[p.category] || 0) + p.stock;
    });
    return Object.entries(data).map(([name, value]) => ({ name, value })).filter(item => item.value > 0);
  }, [products]);

  const inventoryTrendData = useMemo(() => {
    // Mock 30-day trend data for top 3 consumed products for the chart
    const data = [];
    const topProducts = ['برگر کلاسیک', 'پیتزا پپرونی', 'نوشابه قوطی'];
    const now = new Date();
    
    for (let i = 29; i >= 0; i--) {
      const d = new Date(now);
      d.setDate(d.getDate() - i);
      const dateStr = new Intl.DateTimeFormat('fa-IR', { month: 'short', day: 'numeric' }).format(d);
      
      data.push({
        date: dateStr,
        [topProducts[0]]: Math.floor(Math.random() * 50) + 20,
        [topProducts[1]]: Math.floor(Math.random() * 40) + 15,
        [topProducts[2]]: Math.floor(Math.random() * 80) + 50,
      });
    }
    return {
      products: topProducts,
      data
    };
  }, []);

  const productConsumptionStats = useMemo(() => {
    // Calculate average daily consumption over the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const consumptionMap: Record<string, number> = {};
    
    orders.forEach(order => {
      if (order.status !== 'completed') return;
      const orderDate = new Date(order.date);
      if (orderDate >= thirtyDaysAgo) {
        order.items.forEach(item => {
          consumptionMap[item.id] = (consumptionMap[item.id] || 0) + item.quantity;
        });
      }
    });

    const stats: Record<string, { avgDaily: number, daysRemaining: number | null }> = {};
    products.forEach(p => {
      const thirtyDayTotal = consumptionMap[p.id] || 0;
      const avgDaily = thirtyDayTotal / 30;
      let daysRemaining = null;
      if (avgDaily > 0) {
        daysRemaining = Math.floor(p.stock / avgDaily);
      }
      stats[p.id] = { avgDaily, daysRemaining };
    });
    return stats;
  }, [orders, products]);

  const COLORS = ['#f59e0b', '#3b82f6', '#10b981', '#ef4444', '#8b5cf6', '#ec4899', '#64748b', '#14b8a6'];

  const generateBarcode = () => {
    const randomBarcode = Math.floor(Math.random() * 8999999999999 + 1000000000000).toString();
    setNewProduct(prev => ({ ...prev, barcode: randomBarcode }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProduct.name || !newProduct.price || !newProduct.stock) return;

    if (onAddProduct) {
      onAddProduct({
        name: newProduct.name,
        category: newProduct.category,
        price: parseInt(newProduct.price, 10),
        stock: parseInt(newProduct.stock, 10),
        barcode: newProduct.barcode || undefined,
        image: newProduct.image,
        minThreshold: newProduct.minThreshold ? parseInt(newProduct.minThreshold, 10) : undefined,
      });
    }

    setIsAddModalOpen(false);
    setNewProduct({
      name: '',
      category: categories[1],
      price: '',
      stock: '',
      minThreshold: '10',
      barcode: '',
      image: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?auto=format&fit=crop&q=80&w=400',
    });
  };

  const [isWasteModalOpen, setIsWasteModalOpen] = useState(false);
  const [wasteForm, setWasteForm] = useState({
    productId: '',
    quantity: '',
    reason: ''
  });

  const handleWasteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const product = products.find(p => p.id === wasteForm.productId);
    if (!product || !wasteForm.quantity || !onUpdateProduct || !onAddExpense) return;

    const qty = parseInt(wasteForm.quantity, 10);
    if (isNaN(qty) || qty <= 0 || qty > product.stock) {
      showToast('مقدار ضایعات نامعتبر است', '', 'warning');
      return;
    }

    // Deduct stock
    const newStock = product.stock - qty;
    onUpdateProduct({ ...product, stock: newStock });

    // Calculate waste cost
    const wasteCost = product.price * qty;

    // Record as expense
    onAddExpense({
      id: Math.random().toString(36).substr(2, 9),
      title: `ضایعات: ${product.name} - ${wasteForm.reason}`,
      amount: wasteCost,
      category: 'waste',
      date: new Date().toISOString()
    });

    showToast(`ثبت ${qty} عدد ضایعات با موفقیت انجام شد`, product.name, 'success');
    setIsWasteModalOpen(false);
    setWasteForm({ productId: '', quantity: '', reason: '' });
  };

  return (
    <div className="h-full flex flex-col gap-6 relative overflow-y-auto pb-8">
      {/* Header */}
      <div className="inventory-hero flex flex-col items-start justify-between gap-4 shrink-0 lg:flex-row lg:items-center">
        <div>
          <h2 className="text-2xl font-bold text-slate-800">انبار و ضایعات</h2>
          <p className="text-slate-500 mt-1">مدیریت موجودی، محصولات، و تاریخچه ضایعات مواد اولیه</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={() => setIsWasteModalOpen(true)}
            className="bg-rose-50 text-rose-600 flex items-center gap-2 px-5 py-3 rounded-xl hover:bg-rose-100 transition-colors font-medium shadow-sm border border-rose-100"
          >
            <Trash2 size={20} />
            ثبت ضایعات
          </button>
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-zinc-900 text-white flex items-center gap-2 px-5 py-3 rounded-xl hover:bg-zinc-800 transition-colors font-medium shadow-sm"
          >
            <Plus size={20} />
            افزودن محصول جدید
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="inventory-tabs app-tabs">
        <button
          onClick={() => setActiveMainTab('products')}
          className={cn(
            "app-tab",
            activeMainTab === 'products' && "app-tab-active"
          )}
        >
          موجودی محصولات
        </button>
        <button
          onClick={() => setActiveMainTab('waste')}
          className={cn(
            "app-tab",
            activeMainTab === 'waste' && "app-tab-active text-rose-600"
          )}
        >
          گزارش و تاریخچه ضایعات
        </button>
      </div>

      {activeMainTab === 'products' ? (
        <>
          {/* Advanced Trend Chart */}
          {inventoryTrendData.data.length > 0 && (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 shrink-0">
          <div className="mb-6">
            <h3 className="font-bold text-lg text-slate-800">روند مصرف مواد اولیه (۳۰ روز گذشته)</h3>
            <p className="text-sm text-slate-500 mt-1">نمودار تغییرات موجودی محصولات پرمصرف برای برنامه‌ریزی خرید</p>
          </div>
          
          <div className="h-72 w-full" dir="ltr">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={inventoryTrendData.data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis 
                  dataKey="date" 
                  axisLine={false} 
                  tickLine={false} 
                  tickMargin={10}
                  tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Vazirmatn' }} 
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false}
                  tick={{ fontSize: 12, fill: '#64748b', fontFamily: 'Vazirmatn' }}
                />
                <RechartsTooltip 
                  contentStyle={{ backgroundColor: '#18181b', borderRadius: '0.75rem', border: '1px solid #27272a', direction: 'rtl', textAlign: 'right' }} 
                  itemStyle={{ color: '#fff', fontSize: '0.875rem' }}
                  labelStyle={{ color: '#cbd5e1', marginBottom: '0.25rem' }}
                />
                <Legend wrapperStyle={{ fontFamily: 'Vazirmatn', fontSize: '13px', paddingTop: '10px' }} />
                
                {inventoryTrendData.products.map((item, index) => {
                  const colors = ['#f59e0b', '#3b82f6', '#10b981'];
                  return <Line key={`trend-${item}`} type="monotone" name={item} dataKey={item} stroke={colors[index] || '#22c55e'} strokeWidth={3} dot={false} activeDot={{ r: 6 }} />;
                })}
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      {/* Content Layout */}

      <div className="flex-1 flex flex-col lg:flex-row gap-6 min-h-[500px]">
        {/* Table Container */}
        <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden order-2 lg:order-1">
          {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex flex-col gap-4 bg-slate-50/50">
          <div className="flex flex-col md:flex-row items-center justify-between gap-4">
            <div className="relative w-full md:w-96">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="جستجو بر اساس نام یا بارکد..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-12 pl-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow"
              />
            </div>
            <div className="flex items-center gap-3 w-full md:w-auto">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as any)}
                className="bg-white border border-slate-200 rounded-xl py-2.5 px-4 focus:ring-2 focus:ring-amber-500 outline-none shadow-sm min-w-[160px]"
              >
                <option value="default">مرتب‌سازی (پیش‌فرض)</option>
                <option value="stock-asc">موجودی کم به زیاد</option>
                <option value="stock-desc">موجودی زیاد به کم</option>
              </select>
            </div>
          </div>
          
          <div className="flex items-center gap-2 overflow-x-auto pb-2 -mx-5 px-5 hide-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-bold whitespace-nowrap transition-colors",
                  activeCategory === cat 
                    ? "bg-slate-800 text-white" 
                    : "bg-white border text-slate-600 hover:bg-slate-50"
                )}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Grid View */}
        <div className="flex-1 overflow-auto p-5">
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5">
            {filteredProducts.map(product => {
              const threshold = product.minThreshold ?? 10;
              const isLowStock = product.stock > 0 && product.stock <= threshold;
              const isOutOfStock = product.stock === 0;
              const needsRestock = isLowStock || isOutOfStock;
              
              return (
                <div key={product.id} className={cn(
                  "group overflow-hidden rounded-3xl border bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:shadow-xl hover:shadow-slate-950/8",
                  needsRestock ? "border-rose-200 ring-1 ring-rose-100" : "border-slate-200"
                )}>
                  <div className="flex gap-4">
                     <img src={product.image} className="w-24 h-24 rounded-2xl object-cover bg-slate-100 shrink-0 ring-1 ring-slate-100 transition-transform group-hover:scale-[1.02]" alt="" />
                     <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className={cn("font-black text-lg leading-7", needsRestock ? "text-rose-900" : "text-slate-900")}>{product.name}</h3>
                        </div>
                        <span className="inline-block mt-2 px-2.5 py-1 bg-slate-100 text-slate-600 rounded-lg text-xs font-black">
                          {product.category}
                        </span>
                        {product.barcode && (
                           <div className="text-xs text-slate-400 mt-1 font-mono" dir="ltr">{product.barcode}</div>
                        )}
                     </div>
                  </div>
                  
                  <div className="mt-4 grid grid-cols-2 gap-3">
                     <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <span className="text-xs text-slate-500 block mb-1">قیمت فروش</span>
                        <span className={cn("font-black", needsRestock ? "text-rose-900" : "text-slate-800")}>{formatPrice(product.price)}</span>
                     </div>
                     <div className="rounded-2xl bg-slate-50 p-3 ring-1 ring-slate-100">
                        <span className="text-xs text-slate-500 block mb-1">موجودی انبار</span>
                        <div className="flex items-center justify-between">
                           <div className="flex items-center gap-2">
                             <span className={cn(
                                "font-bold font-mono text-lg",
                                isOutOfStock ? "text-red-600" : isLowStock ? "text-red-500" : "text-emerald-600"
                             )}>
                                {formatNumber(product.stock)}
                             </span>
                             {needsRestock && (
                                <span className={cn(
                                  "text-xs font-bold px-2 py-0.5 rounded",
                                  isOutOfStock ? "bg-red-100 text-red-700" : "bg-red-100 text-red-600"
                                )}>
                                  {isOutOfStock ? 'ناموجود' : 'کمبود'}
                                </span>
                             )}
                           </div>
                           <div className="flex shrink-0 items-center gap-1.5" dir="ltr">
                              <button onClick={() => handleAdjustStock(product, -1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-rose-100 bg-white text-rose-600 shadow-sm hover:bg-rose-50" title="کاهش موجودی">
                                 <Minus size={16}/>
                              </button>
                              <button onClick={() => handleAdjustStock(product, 1)} className="flex h-8 w-8 items-center justify-center rounded-xl border border-emerald-100 bg-white text-emerald-700 shadow-sm hover:bg-emerald-50" title="افزایش موجودی">
                                 <Plus size={16}/>
                              </button>
                           </div>
                        </div>
                     </div>
                  </div>

                  {productConsumptionStats[product.id] && productConsumptionStats[product.id].daysRemaining !== null && (
                    <div className={cn(
                      "mt-3 text-xs p-2 rounded-lg flex items-start gap-2",
                      productConsumptionStats[product.id].daysRemaining! <= 3 ? "bg-red-50 text-red-700" :
                      productConsumptionStats[product.id].daysRemaining! <= 7 ? "bg-amber-50 text-amber-700" : "bg-slate-50 text-slate-600"
                    )}>
                      <CalendarClock size={14} className="shrink-0 mt-0.5" />
                      <div>
                        پیش‌بینی اتمام موجودی: <strong className="font-mono ml-1">{productConsumptionStats[product.id].daysRemaining}</strong> روز دیگر
                        {productConsumptionStats[product.id].daysRemaining! <= 3 && " (نیاز فوری به سفارش)"}
                      </div>
                    </div>
                  )}
                  
                  <div className="mt-4 flex items-center gap-2">
                    <button className="flex-1 py-2 flex justify-center items-center gap-2 text-sm font-bold text-slate-600 bg-slate-50 hover:bg-slate-100 rounded-xl transition-colors">
                      <Edit size={16} />
                      ویرایش
                    </button>
                    <button className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors">
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>
              );
            })}
            
            {filteredProducts.length === 0 && (
              <div className="col-span-full py-12 flex flex-col items-center justify-center text-slate-400">
                <Search size={48} className="mb-4 opacity-50" />
                <p className="text-lg">هیچ محصولی با این مشخصات یافت نشد.</p>
              </div>
            )}
          </div>
        </div>
        
        <div className="p-4 border-t border-slate-100 bg-white flex justify-between items-center text-sm text-slate-500">
          <span>نمایش {formatNumber(filteredProducts.length)} محصول</span>
        </div>
      </div>

      {/* Chart Section */}
        {categoryStockData.length > 0 && (
          <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 shrink-0 order-1 lg:order-2 lg:w-[400px] flex flex-col h-auto lg:h-full overflow-hidden">
            <h3 className="font-bold text-slate-800 mb-4 shrink-0">توزیع موجودی بر اساس دسته‌بندی</h3>
            <div className="flex-1 w-full min-h-[250px]" dir="ltr">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryStockData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={5}
                    dataKey="value"
                  >
                    {categoryStockData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} stroke="transparent" />
                    ))}
                  </Pie>
                  <RechartsTooltip 
                    formatter={(value: number) => [`${formatNumber(value)} عدد`, 'موجودی']}
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                  />
                  <Legend 
                    verticalAlign="bottom" 
                    align="center"
                    layout="horizontal"
                    wrapperStyle={{ direction: 'rtl', fontFamily: 'inherit', paddingTop: '20px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}
      </div>
        </>
      ) : (
        <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 flex-1 overflow-hidden flex flex-col">
          <div className="mb-6 flex items-center justify-between shrink-0">
            <div>
              <h3 className="font-bold text-lg text-slate-800">تاریخچه ثبت ضایعات</h3>
              <p className="text-sm text-slate-500 mt-1">لیست مواد اولیه دورریز شده و ثبت شده در هزینه‌ها</p>
            </div>
            <button 
              onClick={() => setIsWasteModalOpen(true)}
              className="bg-rose-50 text-rose-600 flex items-center gap-2 px-4 py-2 rounded-xl hover:bg-rose-100 transition-colors font-medium shadow-sm border border-rose-100"
            >
              <Trash2 size={16} />
              ثبت ضایعات جدید
            </button>
          </div>
          <div className="flex-1 overflow-auto rounded-2xl border border-slate-100">
            <table className="w-full text-right">
              <thead className="bg-slate-50 sticky top-0">
                <tr>
                  <th className="py-4 px-4 font-bold text-slate-600 border-b border-slate-100">تاریخ ثبت</th>
                  <th className="py-4 px-4 font-bold text-slate-600 border-b border-slate-100">عنوان کالا / دلیل</th>
                  <th className="py-4 px-4 font-bold text-slate-600 border-b border-slate-100 text-left">هزینه تخمینی متضرر شده</th>
                </tr>
              </thead>
              <tbody>
                {expenses.filter(e => e.category === 'waste').length === 0 ? (
                  <tr>
                    <td colSpan={3} className="py-12 text-center text-slate-500">هیچ سابقه ضایعاتی تاکنون ثبت نشده است.</td>
                  </tr>
                ) : expenses.filter(e => e.category === 'waste').sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(expense => (
                  <tr key={expense.id} className="border-b border-slate-50 hover:bg-slate-50/50">
                    <td className="py-4 px-4 text-slate-800" dir="ltr">{new Intl.DateTimeFormat('fa-IR', { year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit' }).format(new Date(expense.date))}</td>
                    <td className="py-4 px-4 font-medium text-slate-800">{expense.title.replace('ضایعات: ', '')}</td>
                    <td className="py-4 px-4 font-bold text-rose-600 text-left" dir="ltr">{formatPrice(expense.amount)} تومان</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden max-h-[90vh]">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50">
              <h2 className="text-xl font-bold text-slate-800">افزودن محصول جدید</h2>
              <button 
                onClick={() => setIsAddModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto">
              <form id="add-product-form" onSubmit={handleAddSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">نام محصول</label>
                  <input
                    type="text"
                    required
                    value={newProduct.name}
                    onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700"
                    placeholder="مثال: همبرگر مخصوص"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">دسته‌بندی</label>
                  <select
                    required
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700"
                  >
                    {categories.filter(c => c !== 'همه').map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">قیمت (تومان)</label>
                    <input
                      type="number"
                      required
                      min="0"
                      step="1000"
                      value={newProduct.price}
                      onChange={e => setNewProduct({...newProduct, price: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 text-left"
                      dir="ltr"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">موجودی انبار</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.stock}
                      onChange={e => setNewProduct({...newProduct, stock: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 text-left"
                      dir="ltr"
                      placeholder="0"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-2">آستانه هشدار موجودی</label>
                    <input
                      type="number"
                      required
                      min="0"
                      value={newProduct.minThreshold}
                      onChange={e => setNewProduct({...newProduct, minThreshold: e.target.value})}
                      className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 text-left"
                      dir="ltr"
                      placeholder="10"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">بارکد (اختیاری)</label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newProduct.barcode}
                      onChange={e => setNewProduct({...newProduct, barcode: e.target.value})}
                      className="flex-1 bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 text-left font-mono"
                      dir="ltr"
                      placeholder="مثال: 6261234567890"
                    />
                    <button type="button" onClick={generateBarcode} className="px-4 bg-slate-100 border border-slate-200 text-slate-600 rounded-xl font-bold text-sm hover:bg-slate-200 flex items-center justify-center gap-2 transition-colors">
                      <Hash size={18} /> تولید تصادفی
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">تصویر محصول</label>
                  {newProduct.image ? (
                    <div className="flex items-center gap-4 p-3 border border-slate-200 rounded-xl bg-slate-50">
                      <img src={newProduct.image} className="w-16 h-16 rounded-lg object-cover border border-slate-200 bg-white" alt="Preview" />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-emerald-600 font-bold mb-1 flex items-center gap-1">تصویر انتخاب شد</p>
                        <p className="text-xs text-slate-400 truncate" dir="ltr">{newProduct.image.substring(0, 30)}...</p>
                      </div>
                      <button 
                        type="button" 
                        onClick={() => setNewProduct({...newProduct, image: ''})} 
                        className="p-2 text-red-500 hover:bg-red-50 rounded-lg transition-colors"
                        title="حذف تصویر"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  ) : (
                    <button 
                      type="button" 
                      onClick={() => setIsImageModalOpen(true)} 
                      className="w-full flex items-center justify-center gap-2 py-4 bg-slate-50 border border-slate-200 border-dashed rounded-xl text-slate-600 hover:bg-slate-100 hover:text-amber-600 hover:border-amber-300 transition-colors font-bold text-sm"
                    >
                      <UploadCloud size={20} />
                      انتخاب یا آپلود تصویر
                    </button>
                  )}
                </div>
              </form>
            </div>
            
            <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto">
              <button
                type="submit"
                form="add-product-form"
                className="w-full py-4 bg-zinc-900 text-white rounded-xl font-bold hover:bg-zinc-800 transition-colors shadow-sm"
              >
                ذخیره محصول
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Waste Modal */}
      {isWasteModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-slate-100">
              <h3 className="text-xl font-bold text-slate-800 flex items-center gap-2">
                <Trash2 className="text-rose-500" size={24} />
                ثبت ضایعات مواد اولیه
              </h3>
              <button 
                onClick={() => setIsWasteModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors bg-slate-50 hover:bg-slate-100 p-2 rounded-full"
              >
                <X size={20} />
              </button>
            </div>
            
            <form id="waste-form" onSubmit={handleWasteSubmit} className="p-6 flex flex-col gap-5">
              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">انتخاب محصول</label>
                <select 
                  required
                  value={wasteForm.productId}
                  onChange={e => setWasteForm({...wasteForm, productId: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-medium text-slate-700"
                >
                  <option value="">یک محصول انتخاب کنید...</option>
                  {products.filter(p => p.stock > 0).map(p => (
                    <option key={p.id} value={p.id}>{p.name} (موجودی: {p.stock})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">تعداد ضایعات</label>
                <input 
                  type="number" 
                  required
                  min="1"
                  max={wasteForm.productId ? products.find(p => p.id === wasteForm.productId)?.stock : ""}
                  value={wasteForm.quantity}
                  onChange={e => setWasteForm({...wasteForm, quantity: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent font-mono text-left"
                  placeholder="0"
                />
              </div>

              <div>
                <label className="block text-sm font-bold text-slate-700 mb-2">دلیل / توضیحات</label>
                <input 
                  type="text" 
                  required
                  value={wasteForm.reason}
                  onChange={e => setWasteForm({...wasteForm, reason: e.target.value})}
                  className="w-full border border-slate-200 rounded-xl px-4 py-3 bg-slate-50 focus:bg-white transition-colors focus:outline-none focus:ring-2 focus:ring-amber-500 focus:border-transparent"
                  placeholder="مثال: تاریخ گذشته، سوخته، خراب شده..."
                />
              </div>
            </form>

            <div className="p-6 border-t border-slate-100 bg-slate-50 mt-auto">
              <button
                type="submit"
                form="waste-form"
                className="w-full py-4 bg-rose-600 text-white rounded-xl font-bold hover:bg-rose-700 transition-colors shadow-sm"
              >
                ثبت ضایعات و کسر از موجودی
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Image Upload Modal */}
      {isImageModalOpen && (
        <ImageUploadModal 
          onClose={() => setIsImageModalOpen(false)}
          onUpload={(url) => setNewProduct({...newProduct, image: url})}
        />
      )}

      {/* Toast Notifications */}
      <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
        {toasts.map(toast => (
          <div 
            key={toast.id} 
            className={cn(
              "flex items-center gap-3 px-4 py-3 rounded-xl shadow-lg animate-in slide-in-from-bottom-2 duration-300 min-w-80 border",
              toast.type === 'warning' ? "bg-amber-50 border-amber-200 text-amber-800" : "bg-emerald-50 border-emerald-200 text-emerald-800"
            )}
          >
            <div className={cn("flex items-center justify-center w-8 h-8 rounded-full shrink-0", toast.type === 'warning' ? "bg-amber-100 text-amber-600" : "bg-emerald-100 text-emerald-600")}>
              <Bell size={16} />
            </div>
            <div className="flex-1">
              <h4 className="font-bold text-sm leading-none mb-1">{toast.message}</h4>
              <p className="text-xs font-medium opacity-80">{toast.productName}</p>
            </div>
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="p-1.5 hover:bg-black/5 rounded-md transition-colors"
            >
              <X size={16} />
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
