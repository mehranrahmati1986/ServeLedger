import React, { useMemo, useState } from 'react';
import { categories } from '../data';
import { Feedback, OrderItem, Product } from '../types';
import { cn, formatPrice, formatNumber } from '../lib/utils';
import {
  ArrowLeft,
  CalendarDays,
  ChefHat,
  Coffee,
  Minus,
  Plus,
  Receipt,
  Search,
  ShoppingBag,
  SlidersHorizontal,
  Sparkles,
  Star,
  X
} from 'lucide-react';

interface CustomerMenuViewProps {
  products: Product[];
  tableNumber: string | null;
  restaurantInfo: import('../types').RestaurantInfo;
  orders?: import('../types').Order[];
  onPlaceOrder?: (items: OrderItem[], tableNum: number) => string | void;
  onAddFeedback?: (feedback: Omit<Feedback, 'id'>) => void;
}

const normalizeText = (value: string) => value.trim().toLocaleLowerCase('fa-IR');

export function CustomerMenuView({
  products,
  tableNumber,
  restaurantInfo,
  orders = [],
  onPlaceOrder,
  onAddFeedback
}: CustomerMenuViewProps) {
  const allCategory = categories[0] || 'همه';
  const [activeCategory, setActiveCategory] = useState(allCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [isCartModalOpen, setIsCartModalOpen] = useState(false);
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [placedOrderId, setPlacedOrderId] = useState<string | null>(null);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState('');

  const availableProducts = useMemo(
    () => products.filter(product => product.isActive !== false && product.stock > 0),
    [products]
  );

  const tableOrders = useMemo(() => {
    const currentTable = tableNumber ? parseInt(tableNumber, 10) : undefined;
    return orders.filter(order => order.tableNumber === currentTable);
  }, [orders, tableNumber]);

  const categoryStats = useMemo(() => {
    const countByCategory = new Map<string, number>();
    availableProducts.forEach(product => {
      countByCategory.set(product.category, (countByCategory.get(product.category) || 0) + 1);
    });

    return categories.map(category => ({
      name: category,
      count: category === allCategory ? availableProducts.length : countByCategory.get(category) || 0
    })).filter(item => item.name === allCategory || item.count > 0);
  }, [allCategory, availableProducts]);

  const query = normalizeText(searchQuery);

  const filteredProducts = useMemo(() => {
    return availableProducts.filter(product => {
      const matchesCategory = activeCategory === allCategory || product.category === activeCategory;
      const searchableText = normalizeText(`${product.name} ${product.category} ${product.price}`);
      return matchesCategory && (!query || searchableText.includes(query));
    });
  }, [activeCategory, allCategory, availableProducts, query]);

  const featuredProduct = filteredProducts[0] || availableProducts[0];

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
        return { ...item, quantity: item.quantity + delta };
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
      alert('لطفا منو را از طریق QR روی میز اسکن کنید.');
      return;
    }

    if (cart.length === 0) return;

    const orderId = onPlaceOrder?.(cart, parseInt(tableNumber, 10));
    setPlacedOrderId(typeof orderId === 'string' ? orderId : 'ORD-TEMP');
    setCart([]);
  };

  const handleSubmitFeedback = (e: React.FormEvent) => {
    e.preventDefault();

    onAddFeedback?.({
      rating,
      comment,
      date: new Date().toISOString(),
      orderId: placedOrderId || undefined
    });

    alert('نظر شما با موفقیت ثبت شد. ممنون از همراهی شما.');
    setPlacedOrderId(null);
    setIsCartModalOpen(false);
    setRating(5);
    setComment('');
  };

  return (
    <div className="min-h-dvh bg-[#f8fafc] font-sans text-slate-950" dir="rtl">
      <header className="relative overflow-hidden bg-slate-950 text-white">
        {featuredProduct?.image && (
          <img
            src={featuredProduct.image}
            alt=""
            className="absolute inset-0 h-full w-full object-cover opacity-28"
          />
        )}
        <div className="absolute inset-0 bg-gradient-to-b from-slate-950/78 via-slate-950/76 to-slate-950" />

        <div className="relative mx-auto flex min-h-[22rem] w-full max-w-6xl flex-col px-5 pb-7 pt-5 sm:px-7">
          <div className="flex items-center justify-between gap-3">
            <button
              onClick={() => setIsOrdersModalOpen(true)}
              className="relative flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/15"
              title="سفارش‌های من"
            >
              <Receipt size={19} />
              {tableOrders.length > 0 && (
                <span className="absolute -right-1.5 -top-1.5 flex h-5 min-w-5 items-center justify-center rounded-full bg-amber-400 px-1 text-[10px] font-black text-slate-950 ring-2 ring-slate-950">
                  {formatNumber(tableOrders.length)}
                </span>
              )}
            </button>

            <div className="flex items-center gap-3 rounded-2xl border border-white/10 bg-white/10 px-3 py-2 backdrop-blur-md">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-amber-400 text-slate-950">
                {restaurantInfo?.logo ? (
                  <img src={restaurantInfo.logo} alt={restaurantInfo.name} className="h-full w-full object-cover" />
                ) : (
                  <Coffee size={24} />
                )}
              </div>
              <div className="max-w-[11rem] text-right sm:max-w-xs">
                <p className="truncate text-sm font-black">{restaurantInfo?.name || 'رستوران پلاس'}</p>
                <p className="truncate text-xs font-semibold text-white/58">
                  {tableNumber ? `میز ${tableNumber}` : restaurantInfo?.phone || 'منوی دیجیتال'}
                </p>
              </div>
            </div>

            <button
              onClick={() => { window.location.href = '/reserve'; }}
              className="flex h-11 w-11 items-center justify-center rounded-xl border border-white/10 bg-white/10 text-white backdrop-blur hover:bg-white/15"
              title="رزرو میز"
            >
              <CalendarDays size={19} />
            </button>
          </div>

          <div className="mt-auto grid gap-5 pt-12 lg:grid-cols-[1fr_22rem] lg:items-end">
            <div>
              <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-amber-300/20 bg-amber-300/12 px-3 py-1 text-xs font-black text-amber-200">
                <ChefHat size={14} />
                منوی امروز
              </div>
              <h1 className="max-w-3xl text-4xl font-black leading-tight tracking-tight sm:text-5xl">
                انتخاب غذا، بدون انتظار
              </h1>
              <p className="mt-4 max-w-2xl text-sm font-medium leading-7 text-white/70 sm:text-base">
                {tableNumber
                  ? `سفارش میز ${tableNumber} مستقیم برای آشپزخانه ثبت می‌شود.`
                  : restaurantInfo?.address || 'برای ثبت سفارش، QR روی میز را اسکن کنید.'}
              </p>
            </div>

            {featuredProduct && (
              <div className="hidden overflow-hidden rounded-2xl border border-white/12 bg-white/10 p-3 shadow-2xl shadow-black/20 backdrop-blur lg:block">
                <img src={featuredProduct.image} alt={featuredProduct.name} className="h-44 w-full rounded-xl object-cover" />
                <div className="mt-3 flex items-end justify-between gap-3">
                  <div className="min-w-0">
                    <p className="text-xs font-black text-amber-200">پیشنهاد سریع</p>
                    <h2 className="mt-1 truncate text-lg font-black text-white">{featuredProduct.name}</h2>
                  </div>
                  <button
                    onClick={() => addToCart(featuredProduct)}
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20"
                    title="افزودن"
                  >
                    <Plus size={20} />
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="relative z-10 mx-auto -mt-6 w-full max-w-6xl px-4 pb-32 sm:px-6">
        <section className="sticky top-3 z-30 rounded-2xl border border-slate-200/80 bg-white/92 p-3 shadow-xl shadow-slate-950/8 backdrop-blur-xl">
          <div className="grid gap-3 lg:grid-cols-[1fr_auto] lg:items-center">
            <div className="relative">
              <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
              <input
                type="search"
                placeholder="جست‌وجوی غذا، نوشیدنی یا دسته‌بندی"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="h-12 w-full rounded-xl border border-slate-200 bg-slate-50 pr-12 pl-12 text-sm font-bold text-slate-900 outline-none transition focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
              />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute left-3 top-1/2 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 hover:text-slate-700"
                  title="پاک کردن جست‌وجو"
                >
                  <X size={17} />
                </button>
              )}
            </div>

            <div className="flex items-center gap-2 rounded-xl bg-slate-100 px-3 py-2 text-xs font-black text-slate-600">
              <SlidersHorizontal size={16} />
              {formatNumber(filteredProducts.length)} آیتم
            </div>
          </div>

          <div className="mt-3 flex gap-2 overflow-x-auto pb-1 scrollbar-none" style={{ WebkitOverflowScrolling: 'touch' }}>
            {categoryStats.map(category => (
              <button
                key={category.name}
                onClick={() => setActiveCategory(category.name)}
                className={cn(
                  'flex min-h-10 shrink-0 items-center gap-2 rounded-xl border px-4 text-sm font-black transition',
                  activeCategory === category.name
                    ? 'border-slate-950 bg-slate-950 text-white shadow-lg shadow-slate-950/12'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-amber-300 hover:text-slate-950'
                )}
              >
                <span>{category.name}</span>
                <span className={cn(
                  'rounded-full px-2 py-0.5 text-[10px] font-black',
                  activeCategory === category.name ? 'bg-white/15 text-amber-200' : 'bg-slate-100 text-slate-500'
                )}>
                  {formatNumber(category.count)}
                </span>
              </button>
            ))}
          </div>
        </section>

        {query && (
          <div className="mt-5 flex items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm font-bold text-amber-900">
            <span>نتیجه جست‌وجو برای «{searchQuery}»</span>
            <button onClick={() => setSearchQuery('')} className="rounded-lg bg-white px-3 py-1 text-xs font-black text-amber-700 shadow-sm">
              نمایش همه
            </button>
          </div>
        )}

        <section className="mt-6 grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
          {filteredProducts.map(product => {
            const cartItem = cart.find(item => item.id === product.id);

            return (
              <article
                key={product.id}
                className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:border-amber-200 hover:shadow-xl hover:shadow-slate-950/8"
              >
                <div className="relative aspect-[4/3] overflow-hidden bg-slate-100">
                  <img
                    src={product.image}
                    alt={product.name}
                    className="h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
                    loading="lazy"
                  />
                  <div className="absolute right-3 top-3 rounded-full bg-white/92 px-3 py-1 text-xs font-black text-slate-700 shadow-sm backdrop-blur">
                    {product.category}
                  </div>
                  {cartItem && (
                    <div className="absolute left-3 top-3 flex h-9 min-w-9 items-center justify-center rounded-full bg-slate-950 px-2 text-sm font-black text-white ring-4 ring-white/45">
                      {formatNumber(cartItem.quantity)}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <h2 className="line-clamp-1 text-lg font-black text-slate-950" title={product.name}>
                        {product.name}
                      </h2>
                      <p className="mt-1 text-xs font-bold text-slate-400">
                        موجودی امروز: {formatNumber(product.stock)}
                      </p>
                    </div>
                    <div className="shrink-0 text-left">
                      <p className="text-base font-black text-amber-600">{formatPrice(product.price)}</p>
                    </div>
                  </div>

                  {cartItem ? (
                    <div className="grid grid-cols-[2.5rem_1fr_2.5rem] items-center rounded-xl border border-amber-200 bg-amber-50 p-1">
                      <button
                        onClick={() => updateQuantity(product.id, -1)}
                        className="flex h-10 items-center justify-center rounded-lg bg-white text-amber-700 shadow-sm"
                        title="کم کردن"
                      >
                        <Minus size={16} />
                      </button>
                      <span className="text-center text-sm font-black text-amber-950">
                        {formatNumber(cartItem.quantity)} عدد
                      </span>
                      <button
                        onClick={() => addToCart(product)}
                        disabled={cartItem.quantity >= product.stock}
                        className="flex h-10 items-center justify-center rounded-lg bg-amber-400 text-slate-950 shadow-sm disabled:opacity-40"
                        title="افزودن"
                      >
                        <Plus size={16} />
                      </button>
                    </div>
                  ) : (
                    <button
                      onClick={() => addToCart(product)}
                      className="flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-slate-950 text-sm font-black text-white shadow-lg shadow-slate-950/12 hover:bg-slate-800"
                    >
                      <Plus size={17} />
                      افزودن به سفارش
                    </button>
                  )}
                </div>
              </article>
            );
          })}
        </section>

        {filteredProducts.length === 0 && (
          <section className="mt-10 rounded-3xl border border-slate-200 bg-white px-6 py-14 text-center shadow-sm">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">
              <Search size={26} />
            </div>
            <h2 className="text-lg font-black text-slate-900">آیتمی پیدا نشد</h2>
            <p className="mt-2 text-sm font-medium text-slate-500">عبارت جست‌وجو یا دسته‌بندی را تغییر دهید.</p>
          </section>
        )}
      </main>

      {totalItems > 0 && (
        <div className="fixed inset-x-0 bottom-4 z-40 px-4">
          <button
            onClick={() => setIsCartModalOpen(true)}
            className="mx-auto flex w-full max-w-xl items-center justify-between gap-3 rounded-2xl border border-white/10 bg-slate-950 p-3 text-white shadow-2xl shadow-slate-950/30 backdrop-blur active:scale-[0.99]"
          >
            <div className="flex items-center gap-3">
              <div className="relative flex h-12 w-12 items-center justify-center rounded-xl bg-amber-400 text-slate-950">
                <ShoppingBag size={21} />
                <span className="absolute -right-2 -top-2 flex h-6 min-w-6 items-center justify-center rounded-full bg-white px-1 text-xs font-black text-slate-950 ring-2 ring-slate-950">
                  {formatNumber(totalItems)}
                </span>
              </div>
              <div className="text-right">
                <p className="text-sm font-black">مشاهده سفارش</p>
                <p className="text-xs font-bold text-white/55">برای تکمیل سفارش</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-amber-300">
              <span className="text-sm font-black">{formatPrice(total)}</span>
              <ArrowLeft size={18} />
            </div>
          </button>
        </div>
      )}

      {isCartModalOpen && !placedOrderId && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-5">
          <div className="flex max-h-[88dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">سفارش شما</h2>
                <p className="mt-1 text-xs font-bold text-slate-500">{formatNumber(totalItems)} آیتم در سبد</p>
              </div>
              <button
                onClick={() => setIsCartModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                title="بستن"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5">
              <div className="space-y-4">
                {cart.map(item => (
                  <div key={item.id} className="grid grid-cols-[5rem_1fr] gap-4 rounded-2xl border border-slate-100 bg-slate-50/80 p-3">
                    <img src={item.image} alt={item.name} className="h-20 w-20 rounded-xl object-cover" />
                    <div className="min-w-0">
                      <div className="flex items-start justify-between gap-3">
                        <h3 className="line-clamp-2 text-sm font-black text-slate-900">{item.name}</h3>
                        <span className="shrink-0 text-sm font-black text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                      </div>
                      <div className="mt-4 inline-grid grid-cols-[2.25rem_3rem_2.25rem] items-center rounded-xl border border-slate-200 bg-white p-1">
                        <button onClick={() => updateQuantity(item.id, -1)} className="flex h-9 items-center justify-center rounded-lg text-slate-600 hover:bg-slate-100">
                          <Minus size={15} />
                        </button>
                        <span className="text-center text-sm font-black text-slate-900">{formatNumber(item.quantity)}</span>
                        <button onClick={() => addToCart(item)} disabled={item.quantity >= item.stock} className="flex h-9 items-center justify-center rounded-lg bg-slate-950 text-white disabled:opacity-40">
                          <Plus size={15} />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-5">
              <div className="mb-5 space-y-3 rounded-2xl bg-white p-4 text-sm font-bold shadow-sm">
                <div className="flex justify-between text-slate-500">
                  <span>جمع سفارش</span>
                  <span>{formatPrice(subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-500">
                  <span>مالیات ۹٪</span>
                  <span>{formatPrice(tax)}</span>
                </div>
                <div className="flex justify-between border-t border-slate-100 pt-3 text-base font-black text-slate-950">
                  <span>مبلغ قابل پرداخت</span>
                  <span>{formatPrice(total)}</span>
                </div>
              </div>

              <button
                onClick={handlePlaceOrder}
                className="flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-amber-400 text-base font-black text-slate-950 shadow-lg shadow-amber-500/18"
              >
                <Sparkles size={18} />
                ثبت سفارش
              </button>
            </div>
          </div>
        </div>
      )}

      {isOrdersModalOpen && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-5">
          <div className="flex max-h-[84dvh] w-full max-w-xl flex-col overflow-hidden rounded-t-3xl bg-white shadow-2xl md:rounded-3xl">
            <div className="flex items-center justify-between border-b border-slate-100 p-5">
              <div>
                <h2 className="text-xl font-black text-slate-950">سفارش‌های من</h2>
                <p className="mt-1 text-xs font-bold text-slate-500">{tableNumber ? `میز ${tableNumber}` : 'بدون میز فعال'}</p>
              </div>
              <button
                onClick={() => setIsOrdersModalOpen(false)}
                className="flex h-10 w-10 items-center justify-center rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200"
                title="بستن"
              >
                <X size={19} />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto bg-slate-50 p-5">
              {tableOrders.length === 0 ? (
                <div className="rounded-2xl border border-slate-200 bg-white px-6 py-12 text-center">
                  <Receipt size={42} className="mx-auto mb-4 text-slate-300" />
                  <p className="font-bold text-slate-500">هنوز سفارشی ثبت نشده است.</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {tableOrders
                    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
                    .map(order => (
                      <article key={order.id} className="rounded-2xl border border-slate-100 bg-white p-4 shadow-sm">
                        <div className="mb-4 flex items-start justify-between gap-3">
                          <div>
                            <h3 className="font-black text-slate-900">سفارش {order.id.slice(-4)}</h3>
                            <p className="mt-1 text-xs font-bold text-slate-400">
                              {new Intl.DateTimeFormat('fa-IR', { hour: '2-digit', minute: '2-digit' }).format(new Date(order.date))}
                            </p>
                          </div>
                          <span className={cn(
                            'rounded-full px-3 py-1 text-xs font-black',
                            order.status === 'completed' ? 'bg-emerald-100 text-emerald-700' :
                              order.status === 'pending' ? 'bg-amber-100 text-amber-700' :
                                'bg-slate-100 text-slate-600'
                          )}>
                            {order.status === 'completed' ? 'تکمیل شده' : order.status === 'pending' ? 'در حال آماده‌سازی' : 'پیش‌نویس'}
                          </span>
                        </div>

                        <div className="space-y-2">
                          {order.items.map((item, index) => (
                            <div key={`${order.id}-${item.id}-${index}`} className="flex items-center justify-between gap-3 text-sm font-bold">
                              <span className="line-clamp-1 text-slate-600">{formatNumber(item.quantity)} × {item.name}</span>
                              <span className="shrink-0 text-slate-900">{formatPrice(item.price * item.quantity)}</span>
                            </div>
                          ))}
                        </div>

                        <div className="mt-4 flex justify-between border-t border-slate-100 pt-3 font-black">
                          <span>جمع</span>
                          <span className="text-amber-600">{formatPrice(order.total)}</span>
                        </div>

                        {order.signatureUrl && (
                          <div className="mt-4 rounded-xl border border-dashed border-slate-200 bg-slate-50 p-3 text-center">
                            <p className="mb-2 text-xs font-bold text-slate-400">امضای دیجیتال</p>
                            <img src={order.signatureUrl} alt="Signature" className="mx-auto h-14 object-contain mix-blend-multiply" />
                          </div>
                        )}
                      </article>
                    ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {placedOrderId && (
        <div className="fixed inset-0 z-50 flex flex-col justify-end bg-slate-950/60 p-0 backdrop-blur-sm md:items-center md:justify-center md:p-5">
          <div className="w-full max-w-md overflow-hidden rounded-t-3xl bg-white shadow-2xl md:rounded-3xl">
            <div className="bg-slate-950 p-6 text-center text-white">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-amber-400 text-slate-950 shadow-lg shadow-amber-500/20">
                <Star size={32} fill="currentColor" />
              </div>
              <h2 className="text-2xl font-black">نظر شما مهم است</h2>
              <p className="mt-2 text-sm font-medium leading-6 text-white/65">بعد از ثبت سفارش، تجربه خود را برای ما ثبت کنید.</p>
            </div>

            <form onSubmit={handleSubmitFeedback} className="p-6">
              <div className="mb-6 flex justify-center gap-2">
                {[1, 2, 3, 4, 5].map(star => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRating(star)}
                    className="rounded-xl p-1 transition hover:scale-110 focus:outline-none"
                    title={`${star}`}
                  >
                    <Star
                      size={38}
                      className={star <= rating ? 'text-amber-400' : 'text-slate-200'}
                      fill={star <= rating ? 'currentColor' : 'none'}
                    />
                  </button>
                ))}
              </div>

              <textarea
                value={comment}
                onChange={e => setComment(e.target.value)}
                placeholder="کیفیت غذا، سرویس‌دهی و تجربه شما چطور بود؟"
                className="mb-5 h-32 w-full resize-none rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm font-bold text-slate-800 outline-none focus:border-amber-400 focus:bg-white focus:ring-4 focus:ring-amber-100"
                required
              />

              <div className="grid grid-cols-[1fr_2fr] gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setPlacedOrderId(null);
                    setIsCartModalOpen(false);
                  }}
                  className="h-12 rounded-xl bg-slate-100 text-sm font-black text-slate-600 hover:bg-slate-200"
                >
                  انصراف
                </button>
                <button
                  type="submit"
                  className="h-12 rounded-xl bg-amber-400 text-sm font-black text-slate-950 shadow-lg shadow-amber-500/18"
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
