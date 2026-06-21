import React, { useState, useMemo, useEffect, useRef } from 'react';
import SignatureCanvas from 'react-signature-canvas';
import { Product, OrderItem, Order } from '../types';
import { categories } from '../data';
import { formatPrice, cn } from '../lib/utils';
import { playNotificationSound } from '../lib/audio';
import { Search, Plus, Minus, Trash2, ShoppingBasket, CreditCard, Banknote, Printer, CheckCircle, X, Bookmark, Clock, TrendingUp, Wallet, Loader2, MonitorSmartphone, AlertCircle } from 'lucide-react';

interface POSViewProps {
  products: Product[];
  tables: import('../types').Table[];
  orders: Order[];
  customers: import('../types').Customer[];
  restaurantInfo: import('../types').RestaurantInfo;
  onCheckout: (items: OrderItem[], method: 'cash' | 'card' | 'wallet' | 'unpaid', tableNumber?: number, discountPercent?: number, status?: 'completed' | 'draft' | 'pending', customerId?: string, pointsUsed?: number) => Order;
  onUpdateOrderStatus?: (orderId: string, newStatus: Order['status']) => void;
  onUpdateOrder?: (order: Order) => void;
}

export function POSView({ products, tables, orders, customers, restaurantInfo, onCheckout, onUpdateOrderStatus, onUpdateOrder }: POSViewProps) {
  const [activeCategory, setActiveCategory] = useState('همه');
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [completedOrder, setCompletedOrder] = useState<Order | null>(null);
  const [selectedTableId, setSelectedTableId] = useState<string | null>(null);
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [isDraftsModalOpen, setIsDraftsModalOpen] = useState(false);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string>('');
  const [usePoints, setUsePoints] = useState<boolean>(false);
  
  // POS simulation state
  const [isPosModalOpen, setIsPosModalOpen] = useState(false);
  const [posStatus, setPosStatus] = useState<'connecting' | 'waiting' | 'processing' | 'success' | 'failed'>('connecting');

  // Signature state
  const sigCanvas = useRef<SignatureCanvas>(null);
  const [signatureSaved, setSignatureSaved] = useState(false);

  const clearSignature = () => {
    sigCanvas.current?.clear();
    setSignatureSaved(false);
  };

  const saveSignature = () => {
    if (sigCanvas.current && !sigCanvas.current.isEmpty() && completedOrder && onUpdateOrder) {
      const dataUrl = sigCanvas.current.getTrimmedCanvas().toDataURL('image/png');
      const updatedOrder = { ...completedOrder, signatureUrl: dataUrl };
      setCompletedOrder(updatedOrder);
      onUpdateOrder(updatedOrder);
      setSignatureSaved(true);
    }
  };

  const pendingOrders = useMemo(() => {
    return orders.filter(o => o.status === 'draft' || o.status === 'pending');
  }, [orders]);

  const digitalMenuPendingOrders = useMemo(() => {
    return orders.filter(o => o.status === 'pending');
  }, [orders]);

  const prevPendingCountRef = useRef(digitalMenuPendingOrders.length);

  useEffect(() => {
    if (digitalMenuPendingOrders.length > prevPendingCountRef.current) {
      playNotificationSound();
    }
    prevPendingCountRef.current = digitalMenuPendingOrders.length;
  }, [digitalMenuPendingOrders.length]);

  const bestSellers = useMemo(() => {
    const currentMonth = new Date().toISOString().substring(0, 7); // YYYY-MM
    const itemCounts: Record<string, number> = {};
    
    orders.forEach(order => {
      if (order.status === 'completed' && order.date.startsWith(currentMonth)) {
        order.items.forEach(item => {
          itemCounts[item.id] = (itemCounts[item.id] || 0) + item.quantity;
        });
      }
    });

    const sortedIds = Object.entries(itemCounts)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 4)
      .map(entry => entry[0]);

    return sortedIds.map(id => products.find(p => p.id === id)).filter(Boolean) as Product[];
  }, [orders, products]);

  const filteredProducts = useMemo(() => {
    if (activeCategory === 'پیشنهاد ویژه') {
      return bestSellers.filter(p => p.name.includes(searchQuery));
    }
    return products.filter(p => {
      const matchesCat = activeCategory === 'همه' || p.category === activeCategory;
      const matchesSearch = p.name.includes(searchQuery) || p.category.includes(searchQuery);
      return matchesCat && matchesSearch;
    });
  }, [products, activeCategory, searchQuery, bestSellers]);

  const addToCart = (product: Product) => {
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        if (existing.quantity >= product.stock) return prev; // check stock limits
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
    }));
  };

  const removeFromCart = (id: string) => {
    setCart(prev => prev.filter(item => item.id !== id));
  };

  const decrementCartItem = (id: string) => {
    const item = cart.find(cartItem => cartItem.id === id);
    if (!item) return;
    if (item.quantity > 1) {
      updateQuantity(id, -1);
      return;
    }
    removeFromCart(id);
  };

  const clearCart = () => setCart([]);

  const pointsUsedCount = usePoints && selectedCustomerId ? (customers.find(c => c.id === selectedCustomerId)?.points || 0) : 0;
  const pointsDiscountAmount = pointsUsedCount * 10000;

  const subtotal = cart.reduce((acc, item) => acc + (item.price * item.quantity), 0);
  const discountAmount = (subtotal * discountPercent) / 100;
  const subtotalAfterDiscount = subtotal - discountAmount;
  
  const finalSubtotalAfterPoints = Math.max(0, subtotalAfterDiscount - pointsDiscountAmount);
  
  const tax = finalSubtotalAfterPoints * 0.09; // 9% tax
  const total = finalSubtotalAfterPoints + tax;

  const executePayment = (method: 'cash' | 'card' | 'wallet') => {
    const tableNumber = selectedTableId ? tables.find(t => t.id === selectedTableId)?.number : undefined;
    const newOrder = onCheckout(cart, method, tableNumber, discountPercent, 'completed', selectedCustomerId || undefined, pointsUsedCount);
    setCompletedOrder(newOrder);
    setCart([]);
    setSelectedTableId(null);
    setDiscountPercent(0);
    setSelectedCustomerId('');
    setUsePoints(false);
  };

  const handlePay = (method: 'cash' | 'card' | 'wallet') => {
    if (cart.length === 0) return;
    if (method === 'wallet') {
      if (!selectedCustomerId) {
        alert('برای پرداخت با کیف پول باید مشتری انتخاب شود.');
        return;
      }
      const customer = customers.find(c => c.id === selectedCustomerId);
      if (!customer || (customer.walletBalance || 0) < total) {
        alert('موجودی کیف پول مشتری کافی نیست.');
        return;
      }
    }

    if (method === 'card') {
      setIsPosModalOpen(true);
      setPosStatus('connecting');
      // Simulate connection to POS
      setTimeout(() => {
        setPosStatus('waiting');
      }, 1500);
      return;
    }

    executePayment(method);
  };

  const simulateCardSwipe = () => {
    setPosStatus('processing');
    setTimeout(() => {
      // 90% success rate
      if (Math.random() > 0.1) {
        setPosStatus('success');
        playNotificationSound();
        setTimeout(() => {
          setIsPosModalOpen(false);
          executePayment('card');
        }, 2000);
      } else {
        setPosStatus('failed');
      }
    }, 2500);
  };

  const cancelPosTransaction = () => {
    setIsPosModalOpen(false);
    setPosStatus('connecting');
  };

  const handleSaveDraft = () => {
    if (cart.length === 0) return;
    const tableNumber = selectedTableId ? tables.find(t => t.id === selectedTableId)?.number : undefined;
    onCheckout(cart, 'unpaid', tableNumber, discountPercent, 'draft', selectedCustomerId || undefined, pointsUsedCount);
    setCart([]);
    setSelectedTableId(null);
    setDiscountPercent(0);
    setSelectedCustomerId('');
    setUsePoints(false);
    alert('سفارش به‌عنوان پیش‌نویس ذخیره شد.');
  };

  const loadDraftToCart = (draft: Order) => {
    setCart(draft.items);
    setDiscountPercent(draft.discount || 0);
    const table = tables.find(t => t.number === draft.tableNumber);
    if (table) setSelectedTableId(table.id);
    setIsDraftsModalOpen(false);
  };

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="flex h-full flex-col gap-5 relative overflow-hidden xl:flex-row">
      {/* Receipt Modal */}
      {completedOrder && (
        <div className="absolute inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm print:bg-transparent print:p-0">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-sm flex flex-col overflow-hidden max-h-full print:shadow-none print:w-[80mm] print:relative">
            <div className="p-6 pb-2 text-center relative border-b border-slate-100 flex-shrink-0 no-print">
              <button 
                onClick={() => setCompletedOrder(null)}
                className="absolute top-4 left-4 p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-full transition-colors"
              >
                <X size={20} />
              </button>
              <div className="w-16 h-16 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle size={32} />
              </div>
              <h2 className="text-xl font-bold text-slate-800">سفارش ثبت شد!</h2>
              <p className="text-sm text-slate-500 mt-1">شماره فاکتور: {completedOrder.id}</p>
            </div>
            
            <div className="p-6 overflow-y-auto" id="print-receipt">
              <div className="text-center mb-6 hidden md:block print:block">
                {restaurantInfo?.logo ? (
                  <img src={restaurantInfo.logo} alt={restaurantInfo.name} className="h-16 mx-auto mb-2" />
                ) : null}
                <h3 className="font-bold text-xl text-slate-800">{restaurantInfo?.name || 'رستوران پلاس'}</h3>
                {restaurantInfo?.address && <p className="text-sm text-slate-500 mt-1">{restaurantInfo.address}</p>}
                {restaurantInfo?.phone && <p className="text-sm text-slate-500 mt-1">تلفن: {restaurantInfo.phone}</p>}
                <div className="mt-4 pt-4 border-t border-slate-100">
                  <p className="text-xs text-slate-500 font-mono">{new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full', timeStyle: 'short' }).format(new Date(completedOrder.date))}</p>
                  <p className="text-xs text-slate-500 mt-1 font-mono">شماره سفارش: {completedOrder.id}</p>
                  {completedOrder.tableNumber && (
                    <p className="text-sm font-bold text-slate-800 mt-2">میز: {completedOrder.tableNumber}</p>
                  )}
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {completedOrder.items.map(item => (
                  <div key={item.id} className="flex justify-between text-sm items-start">
                    <div className="flex-1">
                      <span className="font-semibold text-slate-800">{item.name}</span>
                      <div className="text-slate-500 text-xs mt-0.5">{item.quantity} عدد × {formatPrice(item.price)}</div>
                    </div>
                    <span className="font-bold border-b border-slate-100 pb-1">{formatPrice(item.price * item.quantity)}</span>
                  </div>
                ))}
              </div>
              <div className="pt-4 border-t border-slate-200 border-dashed space-y-2">
                <div className="flex justify-between text-sm text-slate-600">
                  <span>جمع سفارش:</span>
                  <span>{formatPrice(completedOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0))}</span>
                </div>
                {completedOrder.discount ? (
                  <div className="flex justify-between text-sm text-red-500">
                    <span>تخفیف ({completedOrder.discount}٪):</span>
                    <span>-{formatPrice((completedOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0)) * completedOrder.discount / 100)}</span>
                  </div>
                ) : null}
                {completedOrder.pointsUsed ? (
                  <div className="flex justify-between text-sm text-red-500 font-medium">
                    <span>تخفیف امتیاز ({completedOrder.pointsUsed} امتیاز):</span>
                    <span>-{formatPrice(completedOrder.pointsUsed * 10000)}</span>
                  </div>
                ) : null}
                <div className="flex justify-between text-sm text-slate-600">
                  <span>مالیات (۹٪):</span>
                  <span>{formatPrice(completedOrder.total - Math.max(0, (completedOrder.items.reduce((acc, item) => acc + (item.price * item.quantity), 0) * (1 - (completedOrder.discount || 0) / 100)) - (completedOrder.pointsUsed || 0) * 10000))}</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-slate-900 mt-2">
                  <span>مبلغ پرداختی:</span>
                  <span>{formatPrice(completedOrder.total)}</span>
                </div>
                <div className="text-center text-xs text-slate-500 mt-6 pt-4 border-t border-slate-100 hidden md:block">
                  از خرید شما سپاسگزاریم
                </div>

                {/* Signature Block */}
                <div className="mt-8 pt-4 border-t border-slate-200 border-dashed text-center">
                  <h4 className="text-sm font-semibold text-slate-700 mb-2">تاییدیه و امضای فاکتور</h4>
                  {completedOrder.signatureUrl ? (
                    <div className="flex flex-col items-center">
                      <img src={completedOrder.signatureUrl} alt="Signature" className="h-24 object-contain mb-2" />
                      <p className="text-xs text-emerald-600 font-medium no-print">✓ امضا ثبت شد</p>
                    </div>
                  ) : (
                    <div className="no-print">
                      <div className="border-2 border-dashed border-slate-200 rounded-xl bg-slate-50 mb-2 overflow-hidden mx-auto" style={{ width: '100%', maxWidth: '300px' }}>
                        <SignatureCanvas 
                          ref={sigCanvas} 
                          canvasProps={{ className: 'w-full h-32 cursor-crosshair' }} 
                          backgroundColor="#f8fafc"
                        />
                      </div>
                      <div className="flex gap-2 justify-center">
                        <button onClick={clearSignature} className="px-4 py-1.5 text-xs font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors">
                          پاک کردن
                        </button>
                        <button onClick={saveSignature} className="px-4 py-1.5 text-xs font-bold text-white bg-slate-800 hover:bg-slate-900 rounded-lg transition-colors">
                          ثبت امضا
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="p-6 bg-slate-50 border-t border-slate-100 flex gap-4 flex-shrink-0 no-print">
              <button 
                onClick={handlePrint}
                className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-zinc-900 text-white hover:bg-zinc-800 transition-colors"
              >
                <Printer size={18} /> چاپ رسید
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Drafts / Pending Orders Modal */}
      {isDraftsModalOpen && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-slate-950/30 p-4 backdrop-blur-md no-print">
          <div className="w-full max-w-3xl overflow-hidden rounded-3xl border border-white/60 bg-white shadow-[0_30px_90px_-42px_rgba(15,23,42,0.72)] max-h-[82vh] flex flex-col">
            <div className="relative overflow-hidden border-b border-slate-100 bg-gradient-to-l from-amber-50 via-white to-teal-50 p-6">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-lg border border-amber-200 bg-white/80 px-3 py-1.5 text-xs font-black text-amber-700">
                    <Clock size={15} />
                    {pendingOrders.length} سفارش باز
                  </div>
                  <h2 className="text-2xl font-black tracking-tight text-slate-950">سفارشاتِ جاری و پیش‌نویس</h2>
                  <p className="mt-3 text-sm font-bold leading-6 text-slate-500">سفارشاتی که منتظر تایید یا پرداخت هستند</p>
                </div>
                <button 
                  onClick={() => setIsDraftsModalOpen(false)}
                  className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-500 shadow-sm transition-colors hover:bg-slate-50 hover:text-slate-800"
                  title="بستن"
                >
                  <X size={20} />
                </button>
              </div>
            </div>
            
            <div className="flex-1 overflow-y-auto bg-slate-50/70 p-5">
              {pendingOrders.length === 0 ? (
                <div className="flex min-h-[18rem] flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-white text-slate-400">
                  <Clock size={48} className="mb-4 opacity-50 text-slate-300" />
                  <p className="font-bold">هیچ سفارش منتظر یا پیش‌نویسی وجود ندارد.</p>
                </div>
              ) : (
                <div className="grid gap-3">
                  {pendingOrders.map(order => (
                    <div key={order.id} className="group flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white p-4 shadow-sm transition-all hover:-translate-y-0.5 hover:border-amber-300 hover:shadow-xl hover:shadow-slate-950/8 sm:flex-row sm:items-center">
                      <div className={cn(
                        "flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl border",
                        order.status === 'draft' ? "border-slate-200 bg-slate-50 text-slate-600" : "border-amber-200 bg-amber-50 text-amber-600"
                      )}>
                        {order.status === 'draft' ? <Bookmark size={24} /> : <Clock size={24} />}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="mb-2 flex flex-wrap items-center gap-2">
                          <h4 className="font-black text-slate-950">سفارش {order.id}</h4>
                          <span className={cn(
                            "rounded-lg px-2.5 py-1 text-xs font-black",
                            order.status === 'draft' ? "bg-slate-100 text-slate-700" : "bg-amber-100 text-amber-800"
                          )}>
                            {order.status === 'draft' ? 'پیش‌نویس' : 'ثبت‌شده مشتری'}
                          </span>
                        </div>
                        <p className="text-sm font-bold leading-6 text-slate-500">
                          {order.items.length} قلم <span className="mx-2 text-slate-300">|</span> میز: {order.tableNumber || 'ندارد'} <span className="mx-2 text-slate-300">|</span> {formatPrice(order.total)}
                        </p>
                        <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-400">
                          {order.items.map(item => `${item.quantity}× ${item.name}`).join('، ')}
                        </p>
                      </div>
                      <button
                        onClick={() => loadDraftToCart(order)}
                        className="inline-flex h-12 shrink-0 items-center justify-center gap-2 rounded-xl bg-slate-950 px-5 text-sm font-black text-white shadow-lg shadow-slate-950/10 transition-colors hover:bg-slate-800"
                      >
                        بارگذاری در سبد
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main Content (Products) */}
      <div className="flex-1 min-w-0 flex flex-col h-full overflow-hidden no-print">
        
        {digitalMenuPendingOrders.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 mb-6 shrink-0 flex flex-col gap-3">
            <div className="flex items-center gap-2 text-amber-800 font-bold">
              <Clock size={20} />
              <h3>سفارشات جدید سیستم منوی دیجیتال (نیازمند تایید)</h3>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none">
              {digitalMenuPendingOrders.map(order => (
                <div key={order.id} className="bg-white border text-sm border-amber-200 rounded-xl p-3 min-w-[280px] shrink-0 shadow-sm flex flex-col">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-bold text-slate-800">سفارش {order.id}</span>
                    {order.tableNumber && (
                      <span className="bg-amber-100 text-amber-800 px-2 py-0.5 rounded text-xs font-bold">میز {order.tableNumber}</span>
                    )}
                  </div>
                  <div className="text-slate-600 mb-3 text-xs leading-relaxed max-h-12 overflow-y-auto pr-1">
                    {order.items.map(item => `${item.quantity}x ${item.name}`).join('، ')}
                  </div>
                  <div className="flex items-center justify-between mt-auto pt-2 border-t border-slate-50">
                    <span className="font-bold text-amber-700 text-sm">{formatPrice(order.total)}</span>
                    <button 
                      onClick={() => onUpdateOrderStatus && onUpdateOrderStatus(order.id, 'completed')}
                      className="bg-zinc-900 text-white px-3 py-1.5 rounded-lg text-xs font-bold hover:bg-zinc-800 transition-colors"
                    >
                      تایید سفارش
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Top Header & Filters */}
        <div className="bg-white rounded-2xl shadow-sm p-4 mb-5 shrink-0 flex flex-col gap-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input 
                type="text" 
                placeholder="جستجوی محصول بر اساس نام یا دسته‌بندی..." 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-slate-100 border-none rounded-xl py-3 pr-12 pl-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow"
              />
            </div>
            
            <button 
              onClick={() => setIsDraftsModalOpen(true)}
              className="bg-amber-100 text-amber-700 px-4 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-200 transition-colors whitespace-nowrap"
            >
              <Clock size={20} />
              <span className="hidden sm:inline">سفارشاتِ جاری</span>
              {pendingOrders.length > 0 && (
                <span className="bg-amber-500 text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-sm">
                  {pendingOrders.length}
                </span>
              )}
            </button>
          </div>
          
          <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
            {['پیشنهاد ویژه', ...categories].map(cat => (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                className={cn(
                  "px-5 py-2.5 rounded-xl whitespace-nowrap font-medium transition-all flex items-center gap-2",
                  activeCategory === cat 
                    ? "bg-zinc-900 text-white shadow-md" 
                    : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                )}
              >
                {cat === 'پیشنهاد ویژه' && <TrendingUp size={16} className={activeCategory === cat ? "text-amber-400" : "text-slate-400"} />}
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Products Grid */}
        <div className="flex-1 overflow-y-auto pb-3">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
            {filteredProducts.map(product => {
              const cartItem = cart.find(c => c.id === product.id);
              const isOutOfStock = product.stock <= 0;

              return (
                <div 
                  key={product.id} 
                  onClick={() => !isOutOfStock && addToCart(product)}
                  className={cn(
                    "group relative cursor-pointer overflow-hidden rounded-2xl border border-white/80 bg-white/95 p-2.5 shadow-[0_18px_50px_-38px_rgba(15,23,42,0.7)] transition-all",
                    isOutOfStock ? "opacity-55 cursor-not-allowed" : "hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-[0_24px_64px_-36px_rgba(15,23,42,0.72)]"
                  )}
                >
                  <div className="relative aspect-square overflow-hidden rounded-xl bg-slate-100">
                    <img 
                      src={product.image} 
                      alt={product.name}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                    />
                    {cartItem && (
                      <div className="absolute inset-x-2 top-2 flex items-center justify-between gap-2">
                        <div className="flex h-9 min-w-9 items-center justify-center rounded-xl bg-amber-400 px-2 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/25 ring-2 ring-white/70">
                          {cartItem.quantity}
                        </div>
                        <div className="flex items-center gap-1 rounded-xl bg-white/92 p-1 shadow-lg ring-1 ring-slate-200 backdrop-blur">
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              decrementCartItem(product.id);
                            }}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-rose-600 hover:bg-rose-50"
                            title="کاهش تعداد"
                          >
                            <Minus size={15} />
                          </button>
                          <button
                            onClick={(event) => {
                              event.stopPropagation();
                              addToCart(product);
                            }}
                            disabled={cartItem.quantity >= product.stock}
                            className="flex h-8 w-8 items-center justify-center rounded-lg text-emerald-700 hover:bg-emerald-50 disabled:opacity-40"
                            title="افزایش تعداد"
                          >
                            <Plus size={15} />
                          </button>
                        </div>
                      </div>
                    )}
                    {isOutOfStock && (
                      <div className="absolute inset-0 bg-white/60 flex items-center justify-center font-bold text-red-600 backdrop-blur-[2px]">
                        ناموجود
                      </div>
                    )}
                  </div>
                  <div className="p-2.5">
                    <h3 className="mb-2 line-clamp-1 text-base font-black text-slate-900" title={product.name}>
                      {product.name}
                    </h3>
                    <div className="flex items-end justify-between gap-2 rounded-xl bg-slate-50 px-3 py-2 ring-1 ring-slate-100">
                      <span className="text-sm font-black leading-6 text-amber-600">{formatPrice(product.price)}</span>
                      <span className="shrink-0 text-[11px] font-bold text-slate-400">موجودی: {product.stock}</span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
          {filteredProducts.length === 0 && (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <ShoppingBasket size={48} className="mb-4 opacity-50" />
              <p>موردی یافت نشد!</p>
            </div>
          )}
        </div>
      </div>

      {/* Cart (Order Sidebar) - Visually on the left due to RTL */}
      <div className="w-full bg-white rounded-3xl shadow-sm border border-slate-200 flex flex-col overflow-hidden shrink-0 h-[44vh] min-h-[360px] xl:h-full xl:w-[380px] no-print">
        <div className="p-5 border-b border-slate-100 flex justify-between items-center bg-zinc-900 text-white">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <ShoppingBasket size={20} className="text-amber-500" /> سفارش جاری
          </h2>
          <button 
            onClick={clearCart}
            disabled={cart.length === 0}
            className="text-white/60 hover:text-red-400 transition-colors disabled:opacity-30 flex items-center gap-1 text-sm font-medium"
          >
            <Trash2 size={16} /> پاک کردن
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-slate-400">
              <div className="w-24 h-24 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                <ShoppingBasket size={40} className="text-slate-300" />
              </div>
              <p>سبد سفارش خالی است</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-amber-200">
                <div className="flex gap-3">
                  <img src={item.image} alt={item.name} className="h-16 w-16 shrink-0 rounded-xl object-cover ring-1 ring-slate-100" />
                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h4 className="line-clamp-2 text-sm font-black leading-6 text-slate-900">{item.name}</h4>
                        <p className="mt-1 text-xs font-bold text-slate-400">هر عدد {formatPrice(item.price)}</p>
                      </div>
                      <span className="shrink-0 rounded-lg bg-slate-50 px-2.5 py-1 text-sm font-black text-slate-800 ring-1 ring-slate-100">
                        {formatPrice(item.price * item.quantity)}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-3 flex items-center justify-between gap-3">
                  <button
                    onClick={() => removeFromCart(item.id)}
                    className="inline-flex h-9 items-center gap-2 rounded-lg border border-rose-100 bg-rose-50 px-3 text-xs font-black text-rose-600 hover:bg-rose-100"
                  >
                    <Trash2 size={14} />
                    حذف از سبد
                  </button>

                  <div className="flex items-center gap-2 rounded-xl border border-slate-200 bg-slate-50 p-1">
                    <button 
                      onClick={() => updateQuantity(item.id, 1)}
                      disabled={item.quantity >= item.stock}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-emerald-700 shadow-sm hover:bg-emerald-50 disabled:opacity-50"
                    >
                      <Plus size={14} />
                    </button>
                    <span className="w-7 text-center text-sm font-black text-slate-800">{item.quantity}</span>
                    <button 
                      onClick={() => decrementCartItem(item.id)}
                      className="flex h-8 w-8 items-center justify-center rounded-lg bg-white text-rose-600 shadow-sm hover:bg-rose-50"
                    >
                      <Minus size={14} />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <div className="p-5 bg-slate-50 border-t border-slate-100">
          <div className="mb-4 space-y-3">
            <select
              value={selectedTableId || ''}
              onChange={(e) => setSelectedTableId(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700"
            >
              <option value="">انتخاب میز در صورت نیاز (سفارش بیرون‌بر)</option>
              {tables.map(table => (
                <option key={table.id} value={table.id} disabled={table.status === 'occupied'}>
                  میز {table.number} - {table.status === 'occupied' ? 'در حال استفاده' : 'آزاد'} 
                </option>
              ))}
            </select>

            <select
              value={selectedCustomerId}
              onChange={(e) => {
                setSelectedCustomerId(e.target.value);
                setUsePoints(false);
              }}
              className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700"
            >
              <option value="">انتخاب مشتری (باشگاه مشتریان)</option>
              {customers.map(customer => (
                <option key={customer.id} value={customer.id}>
                  {customer.name} (امتیاز: {customer.points} | اعتبار: {formatPrice(customer.walletBalance || 0)})
                </option>
              ))}
            </select>
          </div>

          <div className="mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm text-slate-600 font-medium whitespace-nowrap">تخفیف (٪):</span>
              <input
                type="number"
                min="0"
                max="100"
                value={discountPercent || ''}
                onChange={(e) => setDiscountPercent(Number(e.target.value) || 0)}
                placeholder="0"
                className="w-full bg-white border border-slate-200 rounded-xl py-2 px-3 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 text-left"
                dir="ltr"
              />
            </div>
          </div>
          
          {selectedCustomerId && customers.find(c => c.id === selectedCustomerId)?.points ? (
             <div className="mb-4 flex items-center justify-between bg-emerald-50 px-3 py-2 rounded-xl text-sm border border-emerald-100">
               <label className="flex items-center gap-2 cursor-pointer text-emerald-800 font-medium">
                 <input 
                   type="checkbox" 
                   checked={usePoints}
                   onChange={(e) => setUsePoints(e.target.checked)}
                   disabled={customers.find(c => c.id === selectedCustomerId)!.points <= 0}
                   className="accent-emerald-600 w-4 h-4"
                 />
                 استفاده از تمام امتیازات ({customers.find(c => c.id === selectedCustomerId)?.points} امتیاز)
               </label>
             </div>
          ) : null}

          <div className="space-y-3 mb-6">
            <div className="flex justify-between text-slate-500 text-sm">
              <span>جمع سفارش</span>
              <span>{formatPrice(subtotal)}</span>
            </div>
            {discountAmount > 0 && (
              <div className="flex justify-between text-red-500 text-sm">
                <span>تخفیف ({discountPercent}٪)</span>
                <span>-{formatPrice(discountAmount)}</span>
              </div>
            )}
            {pointsDiscountAmount > 0 && (
              <div className="flex justify-between text-emerald-600 font-medium text-sm">
                <span>تخفیف باشگاه ({pointsUsedCount} امتیاز)</span>
                <span>-{formatPrice(pointsDiscountAmount)}</span>
              </div>
            )}
            <div className="flex justify-between text-slate-500 text-sm">
              <span>مالیات بر ارزش افزوده (۹٪)</span>
              <span>{formatPrice(tax)}</span>
            </div>
            <div className="pt-3 border-t border-slate-200 flex justify-between font-bold text-lg text-slate-900">
              <span>مبلغ قابل پرداخت</span>
              <span>{formatPrice(total)}</span>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3 mb-3">
            <button 
              disabled={cart.length === 0}
              onClick={() => handlePay('cash')}
              className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-white border-2 border-slate-200 text-slate-700 hover:border-slate-300 hover:bg-slate-50 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <Banknote size={20} /> نقدی
            </button>
            <button 
              disabled={cart.length === 0}
              onClick={() => handlePay('card')}
              className="flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-amber-500 text-zinc-900 hover:bg-amber-400 shadow-md shadow-amber-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <CreditCard size={20} /> کارت‌خوان
            </button>
            <button 
              disabled={cart.length === 0}
              onClick={() => handlePay('wallet')}
              className="col-span-2 flex items-center justify-center gap-2 py-4 rounded-xl font-bold bg-indigo-500 text-white hover:bg-indigo-600 shadow-md shadow-indigo-500/20 disabled:opacity-50 disabled:pointer-events-none transition-all"
            >
              <Wallet size={20} /> پرداخت با کیف پول
            </button>
          </div>
          
          <button 
            disabled={cart.length === 0}
            onClick={handleSaveDraft}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-xl font-bold bg-slate-200 text-slate-700 hover:bg-slate-300 disabled:opacity-50 disabled:pointer-events-none transition-all"
          >
            <Bookmark size={18} /> ذخیره پیش‌نویس
          </button>
        </div>
      </div>

      {/* POS Simulation Modal */}
      {isPosModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-sm shadow-xl overflow-hidden flex flex-col pt-6 pb-8 px-6 text-center animate-in zoom-in-95 duration-200 relative">
            <button 
              onClick={cancelPosTransaction}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={24} />
            </button>
            <div className="flex justify-center mb-6">
              <div className={cn(
                "w-24 h-24 rounded-full flex items-center justify-center relative",
                posStatus === 'connecting' ? 'bg-blue-50 text-blue-500' :
                posStatus === 'waiting' ? 'bg-amber-50 text-amber-500' :
                posStatus === 'processing' ? 'bg-indigo-50 text-indigo-500' :
                posStatus === 'success' ? 'bg-emerald-50 text-emerald-500' :
                'bg-red-50 text-red-500'
              )}>
                {posStatus === 'connecting' && <Loader2 size={48} className="animate-spin" />}
                {posStatus === 'waiting' && <CreditCard size={48} className="animate-pulse" />}
                {posStatus === 'processing' && (
                  <>
                    <MonitorSmartphone size={48} className="absolute z-10" />
                    <Loader2 size={72} className="animate-spin text-indigo-200 absolute" />
                  </>
                )}
                {posStatus === 'success' && <CheckCircle size={48} />}
                {posStatus === 'failed' && <AlertCircle size={48} />}
              </div>
            </div>

            <h3 className="text-xl font-bold text-slate-800 mb-2">
              {posStatus === 'connecting' && 'در حال اتصال به کارت‌خوان...'}
              {posStatus === 'waiting' && 'لطفاً کارت را بکشید'}
              {posStatus === 'processing' && 'در حال پردازش تراکنش...'}
              {posStatus === 'success' && 'تراکنش با موفقیت انجام شد'}
              {posStatus === 'failed' && 'خطا در انجام تراکنش'}
            </h3>

            <div className="flex items-center justify-center gap-2 mb-8">
              <span className="text-3xl font-black text-slate-900 tracking-tight">{formatPrice(total)}</span>
              <span className="text-slate-500 font-medium">تومان</span>
            </div>

            <p className="text-sm text-slate-500 font-medium h-12 flex items-center justify-center px-4">
              {posStatus === 'connecting' && 'در حال ارسال مبلغ به دستگاه. لطفاً منتظر بمانید.'}
              {posStatus === 'waiting' && 'مبلغ به دستگاه منتقل شد. رمز کارت را وارد کنید.'}
              {posStatus === 'processing' && 'در حال ارتباط با شبکه شاپرک'}
              {posStatus === 'success' && 'پرداخت تایید شد. در حال چاپ رسید...'}
              {posStatus === 'failed' && 'موجودی کافی نیست، یا ارتباط با بانک قطع شده است.'}
            </p>

            {posStatus === 'waiting' && (
              <button 
                onClick={simulateCardSwipe}
                className="w-full mt-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-4 font-bold text-lg shadow-md transition-all active:scale-[0.98]"
              >
                شبیه‌سازی کشیدن کارت
              </button>
            )}

            {posStatus === 'failed' && (
              <div className="flex gap-3 mt-4">
                <button 
                  onClick={cancelPosTransaction}
                  className="flex-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-2xl py-3.5 font-bold transition-all active:scale-[0.98]"
                >
                  انصراف
                </button>
                <button 
                  onClick={() => setPosStatus('connecting')}
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl py-3.5 font-bold transition-all active:scale-[0.98] shadow-md shadow-slate-900/20"
                >
                  تلاش مجدد
                </button>
              </div>
            )}
            
            {/* Simulation Notice Indicator */}
            <div className="absolute bottom-3 left-0 right-0 text-[10px] text-slate-400 font-medium flex justify-center items-center gap-1 opacity-60">
              <MonitorSmartphone size={10} /> محیط شبیه‌ساز POS
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
