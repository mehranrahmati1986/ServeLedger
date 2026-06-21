import React from 'react';
import { ViewType } from '../types';
import { LayoutDashboard, ShoppingBag, Package, PieChart, QrCode, LayoutGrid, Users, CalendarDays, Settings, MessageSquare, LayoutList } from 'lucide-react';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  const menuItems: { id: ViewType | 'dashboard'; label: string; icon: React.ReactNode }[] = [
    { id: 'dashboard', label: 'داشبورد', icon: <LayoutDashboard size={22} /> },
    { id: 'pos', label: 'صندوق فروش', icon: <ShoppingBag size={22} /> },
    { id: 'tables', label: 'مدیریت میزها', icon: <LayoutGrid size={22} /> },
    { id: 'reservations', label: 'تقویم رزروها', icon: <CalendarDays size={22} /> },
    { id: 'inventory', label: 'انبار و محصولات', icon: <Package size={22} /> },
    { id: 'menu-mgmt', label: 'مدیریت منوی دیجیتال', icon: <LayoutList size={22} /> },
    { id: 'customers', label: 'باشگاه مشتریان', icon: <Users size={22} /> },
    { id: 'feedback', label: 'نظرسنجی مشتریان', icon: <MessageSquare size={22} /> },
    { id: 'staff', label: 'پرسنل و خدمه', icon: <Users size={22} /> },
    { id: 'accounting', label: 'حسابداری و گزارشات', icon: <PieChart size={22} /> },
    { id: 'qr', label: 'منوی دیجیتال (QR)', icon: <QrCode size={22} /> },
    { id: 'settings', label: 'تنظیمات و پشتیبان‌گیری', icon: <Settings size={22} /> },
  ];

  return (
    <div className="flex flex-col w-64 bg-zinc-900 text-white shadow-xl h-screen sticky top-0 shrink-0 print:hidden">
      <div className="flex items-center gap-3 p-6 border-b border-zinc-800">
        <div className="w-10 h-10 bg-amber-500 rounded-xl flex items-center justify-center shadow-lg shadow-amber-500/20">
          <LayoutDashboard size={24} className="text-zinc-900" />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-tight text-white">رستوران پلاس</h1>
          <p className="text-xs text-zinc-400 mt-0.5">سیستم مدیریت یکپارچه</p>
        </div>
      </div>

      <nav className="flex-1 p-4 flex flex-col gap-2 overflow-y-auto">
        <p className="text-xs font-semibold text-zinc-500 mb-2 px-2">منوی اصلی</p>
        {menuItems.map((item) => {
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onChangeView(item.id)}
              className={cn(
                "flex items-center gap-3 px-4 py-3.5 rounded-xl transition-all duration-200 w-full text-right",
                isActive 
                  ? "bg-amber-500 text-zinc-900 shadow-md font-semibold" 
                  : "text-zinc-400 hover:bg-zinc-800 hover:text-white"
              )}
            >
              {item.icon}
              <span>{item.label}</span>
            </button>
          );
        })}
      </nav>

      <div className="p-4 border-t border-zinc-800">
        <div className="bg-zinc-800 rounded-xl p-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-zinc-700 rounded-full flex items-center justify-center font-bold text-sm">
            م‌ق
          </div>
          <div className="text-right flex-1 overflow-hidden">
            <p className="font-medium text-sm text-white truncate">مدیر سیستم</p>
            <p className="text-xs text-zinc-400 truncate">admin@cafe.ir</p>
          </div>
        </div>
      </div>
    </div>
  );
}
