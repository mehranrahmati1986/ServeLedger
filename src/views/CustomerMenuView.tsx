import React, { useState, useMemo } from 'react';
import { Product, OrderItem, Feedback } from '../types';
import { categories } from '../data';
import { formatPrice, cn } from '../lib/utils';
import { Search, Coffee, Plus, Minus, ShoppingBag, X, Star, Receipt } from 'lucide-react';

interface CustomerMenuViewProps {
  products: Product[];
  tableNumber: string | null;
  restaurantInfo: import('../types').RestaurantInfo;
  orders?: import('../types').Order[];
  onPlaceOrder?: (items: OrderItem[], tableNum: number) => string | void;
  onAddFeedback?: (feedback: Omit<Feedback, 'id'>) => void;
}

export function CustomerMenuView({ products, tableNumber, restaurantInfo, orders = [], onPlaceOrder, onAddFeedback }: CustomerMenuViewProps) {
  const [activeCategory, setActiveCategory] = useState('همه');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const tableOrders = useMemo(() => {
    return orders.filter(o => o.tableNumber === (tableNumber ? parseInt(tableNumber, 10) : undefined));
  }, [orders, tableNumber]);

  const filteredProducts = useMemo(() => {
    return products.filter(p => {
      // Only show products that are active and in stock
      if (p.isActive === false || p.stock <= 0) return false;
      const matchesCat = activeCategory === 'همه' || p.category === activeCategory;
      const matchesSearch = p.name.includes(searchQuery) || p.category.includes(searchQuery);
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchQuery]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { ...product, quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQ = item.quantity + delta;
        return newQ > 0 ? { ...item, quantity: newQ } : item;
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const totalItems = cart.reduce((acc, item) => acc + item.quantity, 0);
  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const tax = subtotal * 0.09;
  const total = subtotal + tax;

  const handlePlaceOrder = () => {
    if (!tableNumber) {
      alert('لطفا منو را از طریق بارکد روی میز اسکن کنید.');
      return;
    }
    if (onPlaceOrder) {
      const oid = onPlaceOrder(cart, parseInt(tableNumber, 10));
      if (typeof oid === 'string') {
        setPlacedOrderId(oid);
      } else {
        setPlacedOrderId('ORD-TEMP');
      }
      setCart([]);
    }
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();
    if (onAddFeedback) {
      onAddFeedback({
        rating,
        comment,
        date: new Date().toISOString(),
        orderId: placedOrderId || undefined
      });
      alert('نظر شما با موفقیت ثبت شد. با تشکر!');
      setPlacedOrderId(null);
      setIsCartModalOpen(false);
      setRating(5);
      setComment('');
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 font-sans pb-24 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-zinc-900 text-white pt-12 pb-6 px-6 text-center rounded-b-[40px] shadow-lg sticky top-0 z-20">
        <div className="flex justify-between items-center w-full max-w-md mx-auto mb-4 px-2">
           <button 
             onClick={() => setIsOrdersModalOpen(true)}
             className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors relative"
             title="سفارشات من"
           >
             <Receipt size={18} />
             {tableOrders.length > 0 && (
               <span className="absolute -top-1 -right-1 bg-amber-500 text-zinc-900 w-4 h-4 rounded-full text-[10px] font-bold flex items-center justify-center">
                 {tableOrders.length}
               </span>
             )}
           </button>
           <div className="w-16 h-16 bg-amber-500 rounded-2xl flex items-center justify-center shadow-lg shadow-amber-500/20 text-zinc-900 mx-auto overflow-hidden">
             {restaurantInfo?.logo ? (
                <img src={restaurantInfo.logo} alt={restaurantInfo.name} className="w-full h-full object-cover" />
             ) : (
                <Coffee size={32} />
             )}
           </div>
           <button 
             onClick={() => window.location.href = '/reserve'}
             className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center hover:bg-white/20 transition-colors"
             title="رزرو میز"
           >
             <span className="text-xl">📅</span>
           </button>
        </div>
        <h1 className="text-2xl font-bold mb-1">{restaurantInfo?.name || 'رستوران پلاس'}</h1>
        {tableNumber ? (
          <p className="text-amber-400 font-medium text-sm">شما در حال مشاهده منوی میز {tableNumber} هستید</p>
        ) : (
          <p className="text-slate-400 font-medium text-sm">{restaurantInfo?.address || 'منوی دیجیتال رستوران'}</p>
        )}
      </header>

      <main className="px-5 flex-1 -mt-4 relative z-10">
        {/* Search */}
        <div className="bg-white rounded-2xl shadow-sm p-2 mb-6">
          <div className="relative">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="جستجوی غذا یا نوشیدنی..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-transparent border-none py-3 pr-12 pl-4 focus:outline-none text-slate-800"
            />
          </div>
        </div>

        {/* Categories */}
        <div className="flex gap-3 overflow-x-auto pb-4 mb-2 scrollbar-none snap-x" style={{ WebkitOverflowScrolling: 'touch' }}>
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setActiveCategory(cat)}
              className={cn(
                "px-5 py-2.5 rounded-full whitespace-nowrap font-medium transition-all shadow-sm snap-center",
                activeCategory === cat 
                  ? "bg-amber-500 text-zinc-900 shadow-amber-500/30" 
                  : "bg-white text-slate-600 border border-slate-100"
              )}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Products List */}
        <div className="space-y-4">
          {filteredProducts.map(product => {
            const isOutOfStock = product.stock <= 0;
            const cartItem = cart.find(c => c.id === product.id);

            return (
              <div 
                key={product.id} 
                className={cn(
                  "bg-white rounded-3xl p-3 shadow-sm border border-slate-100 flex gap-4 items-center overflow-hidden transition-all relative",
                  isOutOfStock ? "opacity-60 grayscale-[0.5]" : ""
                )}
              >
                <div className="relative w-24 h-24 rounded-2xl overflow-hidden shrink-0 bg-slate-100">
                  <img 
                    src={product.image} 
                    alt={product.name}
                    className="w-full h-full object-cover"
                  />
                  {isOutOfStock && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                      <span className="text-white text-xs font-bold bg-black/60 px-2 py-1 rounded">ناموجود</span>
                    </div>
                  )}
                </div>
                
                <div className="flex-1 py-1 pr-1 flex flex-col h-full">
                  <h3 className="font-bold text-slate-800 mb-1 leading-tight">{product.name}</h3>
                  <p className="text-xs text-slate-400 font-medium mb-3">{product.category}</p>
                  
                  <div className="flex justify-between items-center mt-auto">
                    <span className="text-amber-600 font-bold">{formatPrice(product.price)}</span>
                    
                    {!isOutOfStock && (
                      cartItem ? (
                        <div className="flex items-center gap-2 bg-amber-50 rounded-full px-2 py-1 border border-amber-100">
                          <button onClick={() => updateQuantity(product.id, 1)} className="w-6 h-6 rounded-full bg-amber-500 text-white flex items-center justify-center">
                            <Plus size={14} />
                          </button>
                          <span className="font-bold text-amber-900 w-4 text-center text-sm">{cartItem.quantity}</span>
                          <button onClick={() => updateQuantity(product.id, -1)} className="w-6 h-6 rounded-full bg-white text-amber-500 shadow-sm flex items-center justify-center">
                            <Minus size={14} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={() => addToCart(product)}
                          className="bg-amber-100 text-amber-700 w-8 h-8 rounded-full flex items-center justify-center hover:bg-amber-200 transition-colors"
                        >
                          <Plus size={18} />
                        </button>
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </main>

      {/* Floating Cart Button */}
      {totalItems > 0 && (
        <div className="fixed bottom-6 left-0 right-0 px-6 z-30 flex justify-center">
          <button 
            onClick={() => setIsCartModalOpen(true)}
            className="w-full max-w-sm bg-zinc-900 text-white shadow-xl shadow-zinc-900/20 rounded-2xl p-4 flex items-center justify-between group active:scale-[0.98] transition-transform"
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-amber-500 text-zinc-900 rounded-xl flex items-center justify-center relative">
                <ShoppingBag size={20} />
                <span className="absolute -top-2 -right-2 bg-white text-zinc-900 text-xs font-bold w-5 h-5 rounded-full flex items-center justify-center border-2 border-zinc-900">
                  {totalItems}
                </span>
              </div>
              <span className="font-bold">مشاهده سبد خرید</span>
            </div>
            <span className="font-bold text-amber-400">{formatPrice(total)}</span>
          </button>
        </div>
      )}

      {/* Cart Modal */}
      {isCartModalOpen && !placedOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/40 backdrop-blur-sm flex flex-col justify-end">
          <div className="bg-white rounded-t-3xl h-[85vh] flex flex-col">
            <div className="p-5 border-b border-slate-100 flex justify-between items-center">
              <h2 className="text-xl font-bold text-slate-800">سفارش شما</h2>
              <button 
                onClick={() => setIsCartModalOpen(false)}
                className="w-10 h-10 bg-slate-100 text-slate-500 rounded-full flex items-center justify-center"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-5">
              {cart.map(item => (
                <div key={item.id} className="flex gap-4 mb-5 border-b border-slate-50 pb-5 last:border-0 last:mb-0">
                  <img src={item.image} alt={item.name} className="w-20 h-20 rounded-2xl object-cover bg-slate-100" />
                  <div className="flex-1 flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <h4 className="font-bold text-slate-800 text-sm leading-tight pl-2">{item.name}</h4>
                      <span className="font-bold text-slate-800 whitespace-nowrap">{formatPrice(item.price * item.quantity)}</span>
                    </div>
                    <div className="flex items-center gap-3 mt-3">
                      <div className="flex items-center gap-2 bg-slate-100 rounded-full px-2 py-1">
                        <button onClick={() => updateQuantity(item.id, 1)} className="w-7 h-7 rounded-full bg-white text-slate-700 shadow-sm flex items-center justify-center">
                          <Plus size={14} />
                        </button>
                        <span className="font-bold w-4 text-center text-sm">{item.quantity}</span>
                        <button onClick={() => updateQuantity(item.id, -1)} className="w-7 h-7 rounded-full bg-white text-slate-700 shadow-sm flex items-center justify-center">
                          <Minus size={14} />
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 rounded-t-3xl shadow-[0_-10px_40px_rgba(0,0,0,0.05)]">
              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-slate-500 text-sm font-medium">
                  <span>جمع سفارش</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500 text-sm font-medium">
                  <span>مالیات (۹٪)</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-lg text-slate-900">
                  <span>مبلغ قابل پرداخت</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>
              
              <button 
                onClick={handlePlaceOrder}
                className="w-full py-4 bg-amber-500 text-zinc-900 rounded-2xl font-bold text-lg shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-transform"
              >
                ثبت سفارش به آشپزخانه
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Orders Modal */}
      {isOrdersModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center p-4">
          <div className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl overflow-hidden flex flex-col max-h-[80vh]">
            <div className="p-6 pb-2 border-b border-slate-100 flex items-center justify-between shrink-0">
              <h2 className="text-xl font-bold text-slate-800">سفارشات من</h2>
              <button 
                onClick={() => setIsOrdersModalOpen(false)}
                className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
              {tableOrders.length === 0 ? (
                <div className="text-center py-12">
                  <Receipt size={48} className="mx-auto text-slate-300 mb-4" />
                  <p className="text-slate-500 font-medium">هنوز سفارشی ثبت نکرده‌اید.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tableOrders.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime()).map(order => (
                    <div key={order.id} className="bg-white rounded-2xl p-5 border border-slate-100 shadow-sm relative overflow-hidden">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <div className="font-bold text-slate-800 mb-1 flex items-center gap-2">
                             شماره سفارش: {order.id.slice(-4)}
                             <span className={cn(
                               "text-[10px] px-2 py-0.5 rounded-full",
                               order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                               order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                               'bg-slate-100 text-slate-700'
                             )}>
                               {order.status === 'completed' ? 'تکمیل شده' : order.status === 'pending' ? 'در حال آماده‌سازی' : 'پیش‌نویس'}
                             </span>
                          </div>
                          <div className="text-xs text-slate-500">
                            {new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute:'2-digit' }).format(new Date(order.date))}
                          </div>
                        </div>
                        <div className="text-left">
                          <div className="font-bold text-slate-800">{formatPrice(order.total)} تومان</div>
                        </div>
                      </div>
                      
                      <div className="space-y-2 mb-4">
                        {order.items.map((item, idx) => (
                           <div key={idx} className="flex justify-between text-sm">
                             <div className="flex items-center gap-2">
                               <span className="w-5 h-5 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center text-[10px] font-bold">{item.quantity}</span>
                               <span className="text-slate-600">{item.name}</span>
                             </div>
                             <span className="text-slate-500">{formatPrice(item.price * item.quantity)}</span>
                           </div>
                        ))}
                      </div>

                      {order.signatureUrl && (
                        <div className="mt-4 pt-4 border-t border-slate-100 border-dashed flex flex-col items-center bg-slate-50/50 rounded-xl p-3">
                          <div className="text-xs text-slate-500 mb-2 w-full text-center">امضای دیجیتال / تاییدیه</div>
                          <img src={order.signatureUrl} alt="Signature" className="h-16 object-contain mix-blend-multiply" />
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Feedback Modal */}
      {placedOrderId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex flex-col justify-end md:justify-center md:items-center px-4 pb-6 md:pb-0">
          <div className="bg-white rounded-3xl w-full max-w-md mx-auto shadow-2xl overflow-hidden">
            <div className="bg-amber-500 text-zinc-900 p-6 text-center">
              <div className="w-16 h-16 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg shadow-amber-500/30">
                <Star size={32} className="text-amber-500" fill="currentColor" />
              </div>
              <h2 className="text-2xl font-bold mb-1">لطفا نظر خود را ثبت کنید</h2>
              <p className="opacity-90 font-medium">ما دوست داریم نظر شما را در مورد سفارش بدانیم</p>
            </div>
            
            <form onSubmit={handleSubmitFeedback} className="p-6">
              <div className="mb-6 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="p-1 transition-transform hover:scale-110 focus:outline-none"
                  >
                    <Star 
                      size={40} 
                      className={cn(
                        star <= rating ? "text-amber-400" : "text-slate-200"
                      )} 
                      fill={star <= rating ? "currentColor" : "none"} 
                    />
                  </button>
                ))}
              </div>
              
              <div className="mb-6">
                <label className="block text-sm font-bold text-slate-700 mb-2">نظرات یا پیشنهادات شما</label>
                <textarea
                  value={comment}
                  onChange={e => setComment(e.target.value)}
                  placeholder="کیفیت غذا، سرویس‌دهی و فضای رستوران چگونه بود؟"
                  className="w-full bg-slate-50 border border-slate-200 rounded-2xl py-3 px-4 h-32 resize-none focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white transition-all text-slate-700"
                  required
                />
              </div>
              
              <div className="flex gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPlacedOrderId(null);
                    setIsCartModalOpen(false);
                  }}
                  className="w-1/3 py-3.5 bg-slate-100 text-slate-600 rounded-xl font-bold hover:bg-slate-200 transition-colors"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="w-2/3 py-3.5 bg-amber-500 text-zinc-900 rounded-xl font-bold shadow-lg shadow-amber-500/20 active:scale-[0.98] transition-all"
                >
                  ثبت نظر
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
