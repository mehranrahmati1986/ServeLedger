import React from 'react';
import {
  BadgeDollarSign,
  CalendarDays,
  ContactRound,
  LayoutDashboard,
  LayoutGrid,
  LayoutList,
  LucideIcon,
  MessageSquare,
  Package,
  PieChart,
  QrCode,
  ShieldCheck,
  Settings,
  ShoppingBag,
  Users
} from 'lucide-react';
import { ViewType } from '../types';
import { cn } from '../lib/utils';

interface SidebarProps {
  currentView: ViewType;
  onChangeView: (view: ViewType) => void;
}

type NavItem = {
  id: ViewType;
  label: string;
  icon: LucideIcon;
};

const menuItems: NavItem[] = [
  { id: 'dashboard', label: 'داشبورد', icon: LayoutDashboard },
  { id: 'pos', label: 'صندوق فروش', icon: ShoppingBag },
  { id: 'tables', label: 'مدیریت میزها', icon: LayoutGrid },
  { id: 'reservations', label: 'رزروها', icon: CalendarDays },
  { id: 'inventory', label: 'انبار و محصولات', icon: Package },
  { id: 'menu-mgmt', label: 'منوی دیجیتال', icon: LayoutList },
  { id: 'customers', label: 'باشگاه مشتریان', icon: ContactRound },
  { id: 'feedback', label: 'نظرسنجی', icon: MessageSquare },
  { id: 'staff', label: 'پرسنل', icon: Users },
  { id: 'accounting', label: 'حسابداری', icon: PieChart },
  { id: 'tax-audit', label: 'حسابرسی مالیاتی', icon: ShieldCheck },
  { id: 'qr', label: 'QR میزها', icon: QrCode },
  { id: 'settings', label: 'تنظیمات', icon: Settings }
];

export function Sidebar({ currentView, onChangeView }: SidebarProps) {
  return (
    <>
      <aside className="app-sidebar hidden w-[17.5rem] shrink-0 flex-col print:hidden lg:flex">
        <div className="sidebar-brand">
          <div className="sidebar-logo">
            <BadgeDollarSign size={24} />
          </div>
          <div className="min-w-0">
            <h1 className="truncate text-base font-black tracking-tight text-white">ServeLedger</h1>
            <p className="mt-1 truncate text-xs font-semibold text-slate-400">مدیریت یکپارچه رستوران</p>
          </div>
        </div>

        <nav className="sidebar-scroll flex-1 px-3 py-4">
          <p className="mb-3 px-3 text-xs font-bold uppercase tracking-[0.18em] text-slate-500">
            عملیات
          </p>
          <div className="flex flex-col gap-1.5">
            {menuItems.map((item) => {
              const Icon = item.icon;
              const isActive = currentView === item.id;

              return (
                <button
                  key={item.id}
                  onClick={() => onChangeView(item.id)}
                  className={cn('sidebar-link', isActive && 'sidebar-link-active')}
                  title={item.label}
                >
                  <span className="sidebar-icon">
                    <Icon size={20} />
                  </span>
                  <span className="truncate">{item.label}</span>
                </button>
              );
            })}
          </div>
        </nav>

        <div className="sidebar-footer">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white/10 text-sm font-black text-white ring-1 ring-white/10">
            م
          </div>
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-bold text-white">مدیر سیستم</p>
            <p className="truncate text-xs text-slate-400">admin@cafe.ir</p>
          </div>
          <span className="h-2.5 w-2.5 rounded-full bg-emerald-400 shadow-[0_0_0_4px_rgba(52,211,153,0.12)]" />
        </div>
      </aside>

      <nav className="mobile-nav no-print lg:hidden" aria-label="ناوبری اصلی">
        <div className="mobile-nav-scroll">
          {menuItems.map((item) => {
            const Icon = item.icon;
            const isActive = currentView === item.id;

            return (
              <button
                key={item.id}
                onClick={() => onChangeView(item.id)}
                className={cn('mobile-nav-item', isActive && 'mobile-nav-item-active')}
                title={item.label}
              >
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </div>
      </nav>
    </>
  );
}
