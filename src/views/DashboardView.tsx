import React, { useRef, useState, useEffect } from 'react';
import { Order, Table, Product, SystemEvent, Feedback } from '../types';
import { formatPrice, formatNumber, cn } from '../lib/utils';
import { ActivityLog } from '../components/ActivityLog';
import { TrendingUp, Users, ShoppingBag, Coffee, Maximize, Minimize, Star, AlertTriangle } from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  tables: Table[];
  products: Product[];
  events: SystemEvent[];
  feedbacks?: Feedback[];
}

export function DashboardView({ orders, tables, products, events, feedbacks = [] }: DashboardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      containerRef.current?.requestFullscreen().catch(err => {
        console.error(`Error attempting to enable fullscreen: ${err.message}`);
      });
    } else {
      document.exitFullscreen();
    }
  };

  const today = new Date().toISOString().split('T')[0];
  
  const todayOrders = orders.filter(o => o.date.startsWith(today) && o.status === 'completed');
  const todaySales = todayOrders.reduce((acc, o) => acc + o.total, 0);
  
  const occupiedTablesCount = tables.filter(t => t.status === 'occupied').length;
  
  const pendingOrdersCount = orders.filter(o => o.status === 'pending').length;

  const alertProducts = products.filter(p => p.stock <= (p.minThreshold || 10));

  const lowStockCount = alertProducts.filter(p => p.stock > 0).length;
  const outOfStockCount = alertProducts.filter(p => p.stock === 0).length;

  // Filter pending orders specifically
  const pendingOrders = orders.filter(o => o.status === 'pending');

  return (
    <div 
      ref={containerRef} 
      className={cn(
        "h-full flex flex-col gap-5 overflow-y-auto lg:overflow-hidden transition-all pb-2",
        isFullscreen ? "bg-slate-100 p-5 sm:p-8" : ""
      )}
    >
      <div className="shrink-0 flex flex-col gap-3 rounded-2xl border border-slate-200/70 bg-white/75 p-4 shadow-sm backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <p className="text-xs font-black uppercase tracking-[0.18em] text-amber-600">Live Operations</p>
          <h2 className="mt-1 text-lg font-black text-slate-900">وضعیت لحظه‌ای سالن و فروش</h2>
          <p className="mt-1 text-sm font-medium text-slate-500">سفارش‌های معلق، هشدارهای موجودی و بازخورد مشتریان در یک نگاه</p>
        </div>
        <button 
          onClick={toggleFullscreen}
          className="inline-flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-600 shadow-sm hover:border-amber-200 hover:bg-amber-50 hover:text-amber-600"
          title={isFullscreen ? "خروج از حالت تمام صفحه" : "تمام صفحه"}
        >
          {isFullscreen ? <Minimize size={22} /> : <Maximize size={22} />}
        </button>
      </div>

      {alertProducts.length > 0 && (
        <div className="shrink-0 bg-red-50/95 border border-red-200 rounded-2xl p-4 flex flex-col sm:flex-row items-start gap-4 shadow-sm relative overflow-hidden">
          <div className="w-1.5 h-full bg-red-500 absolute right-0 top-0"></div>
          <div className="w-12 h-12 rounded-full bg-red-100 text-red-600 flex items-center justify-center shrink-0 mt-1">
            <AlertTriangle size={24} />
          </div>
          <div className="flex-1">
            <h3 className="text-red-900 font-bold text-lg mb-1">هشدار کاهش موجودی انبار</h3>
            <p className="text-red-700 text-sm mb-3">موجودی {formatNumber(alertProducts.length)} محصول به زیر حد آستانه (Threshold) رسیده است. لطفا برای تامین موجودی اقدام کنید.</p>
            <div className="flex flex-wrap gap-2">
              {alertProducts.map(p => (
                <span key={p.id} className="inline-flex items-center gap-1.5 px-3 py-1 bg-white border border-red-200 text-red-700 rounded-lg text-xs font-bold shadow-sm">
                  {p.name}
                  <span className="font-mono bg-red-100 px-1.5 py-0.5 rounded text-red-800 mr-1">{p.stock}</span>
                </span>
              ))}
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 gap-4 shrink-0 sm:grid-cols-2 xl:grid-cols-4">
        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shrink-0">
            <TrendingUp size={28} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-500 mb-1">فروش امروز</p>
            <p className="truncate text-xl font-black text-slate-900">{formatPrice(todaySales)}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shrink-0">
            <ShoppingBag size={28} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-500 mb-1">سفارشات تحویل‌شده (امروز)</p>
            <p className="truncate text-xl font-black text-slate-900">{formatNumber(todayOrders.length)} سفارش</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-100 text-amber-600 flex items-center justify-center shrink-0">
            <Coffee size={28} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-500 mb-1">میزهای پر</p>
            <p className="truncate text-xl font-black text-slate-900">{formatNumber(occupiedTablesCount)} از {formatNumber(tables.length)}</p>
          </div>
        </div>

        <div className="bg-white rounded-3xl p-5 shadow-sm border border-slate-200 flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-rose-100 text-rose-600 flex items-center justify-center shrink-0">
            <Users size={28} />
          </div>
          <div className="min-w-0">
            <p className="text-sm font-bold text-slate-500 mb-1">وضعیت انبار</p>
            <p className="text-sm font-black text-slate-900">{formatNumber(outOfStockCount)} ناموجود | {formatNumber(lowStockCount)} در حال اتمام</p>
          </div>
        </div>
      </div>

      <div className="grid flex-1 min-h-0 grid-cols-1 gap-5 xl:grid-cols-3">
        <div className="min-h-[360px] xl:min-h-0 xl:col-span-1 flex flex-col">
          <ActivityLog events={events} />
        </div>
        
        <div className="min-h-[720px] xl:min-h-0 xl:col-span-2 flex flex-col gap-5">
          <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-0">
            <h3 className="font-bold text-slate-800 mb-4 shrink-0">سفارشات منتظر تایید و آماده‌سازی ({pendingOrdersCount})</h3>
            
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {pendingOrders.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400">
                  هیچ سفارش در حال انتظاری وجود ندارد.
                </div>
              ) : (
                pendingOrders.map(order => (
                  <div key={order.id} className="border border-amber-200 bg-amber-50 rounded-2xl p-4 flex justify-between items-center">
                    <div>
                      <div className="flex items-center gap-2 mb-2">
                         <span className="font-bold text-slate-800">سفارش {order.id}</span>
                         <span className="bg-amber-200 text-amber-800 text-xs px-2 py-0.5 rounded font-bold">منوی دیجیتال</span>
                      </div>
                      <div className="text-sm text-slate-600 mb-2">
                        {order.items.map(item => `${item.quantity}x ${item.name}`).join('، ')}
                      </div>
                      <div className="text-amber-700 font-bold text-sm">
                        میز {order.tableNumber} | {formatPrice(order.total)}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="flex-1 bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col min-h-0">
            <h3 className="font-bold text-slate-800 mb-4 shrink-0">نظرات اخیر مشتریان</h3>
            <div className="flex-1 overflow-y-auto pr-2 space-y-4">
              {feedbacks.length === 0 ? (
                <div className="h-full flex items-center justify-center text-slate-400 text-sm">
                  هنوز نظری ثبت نشده است
                </div>
              ) : (
                feedbacks.slice(0, 50).map(fb => (
                  <div key={fb.id} className="border border-slate-100 bg-slate-50 rounded-2xl p-4">
                    <div className="flex justify-between items-start mb-2">
                      <div className="flex text-amber-400">
                        {[1, 2, 3, 4, 5].map((star) => (
                          <Star 
                            key={star} 
                            size={16} 
                            fill={star <= fb.rating ? "currentColor" : "none"} 
                            className={star <= fb.rating ? "text-amber-400" : "text-slate-300"} 
                          />
                        ))}
                      </div>
                      <span className="text-xs text-slate-400 font-medium font-mono" dir="ltr">
                        {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(fb.date))}
                      </span>
                    </div>
                    <p className="text-slate-700 text-sm font-medium leading-relaxed mb-2">
                      "{fb.comment}"
                    </p>
                    {fb.orderId && (
                      <p className="text-xs font-bold text-indigo-600 bg-indigo-50 inline-block px-2 py-1 rounded-md">
                        مربوط به سفارش: {fb.orderId}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
