import React, { useEffect, useMemo, useRef, useState } from 'react';
import { ResponsiveContainer, BarChart, Bar, Tooltip as RechartsTooltip, XAxis, Cell } from 'recharts';
import { Order, Table, Product, SystemEvent, Feedback } from '../types';
import { formatPrice, formatNumber, cn } from '../lib/utils';
import { ActivityLog } from '../components/ActivityLog';
import {
  AlertTriangle,
  CheckCircle2,
  Clock3,
  Coffee,
  Expand,
  Maximize,
  MessageCircle,
  Minimize,
  Package,
  PackageX,
  ReceiptText,
  Search,
  ShoppingBag,
  Star,
  TrendingUp,
  Users,
  X
} from 'lucide-react';

interface DashboardViewProps {
  orders: Order[];
  tables: Table[];
  products: Product[];
  events: SystemEvent[];
  feedbacks?: Feedback[];
}

type ChartPoint = {
  label: string;
  value: number;
  accent?: string;
};

const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase('fa-IR')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim();

const getLocalDateKey = (value: string | Date) => {
  const date = value instanceof Date ? value : new Date(value);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const getShortDayLabel = (date: Date) =>
  new Intl.DateTimeFormat('fa-IR', { weekday: 'short' }).format(date);

const formatCompactValue = (value: number) => {
  if (value >= 1_000_000) return `${formatNumber(Math.round(value / 100_000) / 10)}م`;
  if (value >= 1000) return `${formatNumber(Math.round(value / 1000))}هزار`;
  return formatNumber(value);
};

const formatDateTime = (value: string) =>
  new Intl.DateTimeFormat('fa-IR', { dateStyle: 'short', timeStyle: 'short' }).format(new Date(value));

const getDonutGradient = (data: ChartPoint[]) => {
  const positiveData = data.filter(point => point.value > 0);
  const total = positiveData.reduce((acc, point) => acc + point.value, 0);

  if (!total) return 'conic-gradient(#e2e8f0 0deg 360deg)';

  let start = 0;
  const segments = positiveData.map((point, index) => {
    const sweep = index === positiveData.length - 1 ? 360 - start : (point.value / total) * 360;
    const end = start + sweep;
    const segment = `${point.accent || '#0f766e'} ${start.toFixed(2)}deg ${end.toFixed(2)}deg`;
    start = end;
    return segment;
  });

  return `conic-gradient(${segments.join(', ')})`;
};

function DonutChart({
  data,
  center,
  caption
}: {
  data: ChartPoint[];
  center: string;
  caption: string;
}) {
  const total = data.reduce((acc, point) => acc + Math.max(point.value, 0), 0);

  return (
    <div className="dashboard-donut-block">
      <div className="dashboard-donut" style={{ background: getDonutGradient(data) }}>
        <div className="dashboard-donut-hole">
          <span>{center}</span>
          <small>{caption}</small>
        </div>
      </div>
      <div className="dashboard-donut-legend">
        {data.slice(0, 3).map(point => {
          const percent = total ? Math.round((Math.max(point.value, 0) / total) * 100) : 0;

          return (
            <div key={point.label} className="flex items-center justify-between gap-2">
              <span className="flex min-w-0 items-center gap-1.5">
                <span className="h-2 w-2 shrink-0 rounded-full" style={{ backgroundColor: point.accent || '#0f766e' }} />
                <span className="truncate">{point.label}</span>
              </span>
              <span className="font-black text-slate-700">{formatNumber(percent)}٪</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function SalesTrendChart({ data, compact = false }: { data: ChartPoint[]; compact?: boolean }) {
  return (
    <div className={cn('min-w-0', compact ? 'h-[172px]' : 'h-[285px]')}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 8, right: 4, left: 4, bottom: 0 }} barCategoryGap={compact ? '34%' : '28%'}>
          <XAxis
            dataKey="label"
            axisLine={false}
            tickLine={false}
            tick={{ fill: '#64748b', fontSize: 12, fontWeight: 800 }}
            interval={0}
          />
          <RechartsTooltip
            cursor={{ fill: 'rgba(20,184,166,0.08)' }}
            content={({ active, payload, label }) => {
              if (!active || !payload?.length) return null;
              const value = Number(payload[0].value || 0);
              return (
                <div className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-800 shadow-xl">
                  <div>{label}</div>
                  <div className="mt-1 text-teal-700">{formatPrice(value)}</div>
                </div>
              );
            }}
          />
          <Bar dataKey="value" minPointSize={5} radius={[10, 10, 3, 3]} isAnimationActive={false}>
            {data.map((entry, index) => (
              <Cell key={`${entry.label}-${index}`} fill={entry.accent || '#0f766e'} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

function MetricCard({
  title,
  value,
  hint,
  icon,
  chartData,
  center,
  caption,
  badge,
  tone
}: {
  title: string;
  value: string;
  hint: string;
  icon: React.ReactNode;
  chartData: ChartPoint[];
  center: string;
  caption: string;
  badge: string;
  tone: string;
}) {
  return (
    <section className="dashboard-card dashboard-stat-card overflow-hidden p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-start gap-3">
          <div className={cn('flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border', tone)}>
            {icon}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-black text-slate-500">{title}</p>
            <p className="mt-1 truncate text-xl font-black tracking-tight text-slate-950">{value}</p>
            <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500">{hint}</p>
          </div>
        </div>
        <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-xs font-black text-slate-600">
          {badge}
        </span>
      </div>
      <DonutChart data={chartData} center={center} caption={caption} />
    </section>
  );
}

function DashboardModal({
  title,
  subtitle,
  search,
  onSearch,
  onClose,
  children,
  count
}: {
  title: string;
  subtitle: string;
  search: string;
  onSearch: (value: string) => void;
  onClose: () => void;
  children: React.ReactNode;
  count: number;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="dashboard-modal-backdrop fixed inset-0 z-[90] p-3 text-slate-950 sm:p-5" role="dialog" aria-modal="true">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-teal-100 bg-white shadow-[0_28px_90px_-44px_rgba(15,23,42,0.65)]">
        <div className="flex shrink-0 flex-col gap-4 border-b border-slate-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-950">{title}</h2>
              <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">
                {formatNumber(count)} مورد
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-500">{subtitle}</p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row lg:max-w-xl">
            <label className="relative flex-1">
              <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={search}
                onChange={(event) => onSearch(event.target.value)}
                placeholder="جستجو..."
                className="h-11 w-full rounded-lg border border-slate-200 bg-white pr-10 pl-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
              />
            </label>
            <button
              onClick={onClose}
              className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-4 text-sm font-black text-slate-700 hover:bg-slate-50"
            >
              <X size={18} />
              بستن
            </button>
          </div>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
      </div>
    </div>
  );
}

function SearchBox({
  value,
  onChange,
  placeholder
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <label className="relative block min-w-0">
      <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
        className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-9 pl-3 text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
      />
    </label>
  );
}

function PanelHeader({
  title,
  subtitle,
  icon,
  count,
  search,
  onSearch,
  onOpen,
  placeholder = 'جستجو...'
}: {
  title: string;
  subtitle: string;
  icon: React.ReactNode;
  count: number;
  search: string;
  onSearch: (value: string) => void;
  onOpen: () => void;
  placeholder?: string;
}) {
  return (
    <div className="flex shrink-0 flex-col gap-3">
      <div className="flex items-start justify-between gap-3">
        <div className="flex min-w-0 items-center gap-3">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
            {icon}
          </div>
          <div className="min-w-0">
            <h3 className="truncate text-base font-black text-slate-950">{title}</h3>
            <p className="mt-0.5 line-clamp-1 text-xs font-bold text-slate-500">{subtitle}</p>
          </div>
        </div>
        <button
          onClick={onOpen}
          className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-teal-200 hover:text-teal-700"
          title="نمای تمام صفحه"
        >
          <Expand size={16} />
          <span className="hidden sm:inline">{formatNumber(count)}</span>
        </button>
      </div>
      <SearchBox value={search} onChange={onSearch} placeholder={placeholder} />
    </div>
  );
}

function EmptyState({ title, description, icon }: { title: string; description: string; icon: React.ReactNode }) {
  return (
    <div className="flex h-full min-h-[180px] flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
      <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg border border-slate-200 bg-white text-slate-400">
        {icon}
      </div>
      <p className="text-sm font-black text-slate-800">{title}</p>
      <p className="mt-1 text-xs font-bold leading-relaxed text-slate-500">{description}</p>
    </div>
  );
}

function OrderItemCard({ order, onOpen }: { order: Order; onOpen?: () => void }) {
  const isDraft = order.status === 'draft';

  return (
    <button onClick={onOpen} className="dashboard-list-item w-full p-4 text-right">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className="font-black text-slate-950">سفارش {order.id}</span>
            <span className={cn(
              'rounded-md border px-2 py-1 text-xs font-black',
              isDraft ? 'border-slate-200 bg-slate-50 text-slate-600' : 'border-amber-200 bg-amber-50 text-amber-700'
            )}>
              {isDraft ? 'پیش نویس' : 'در حال آماده سازی'}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-bold leading-relaxed text-slate-600">
            {order.items.map(item => `${formatNumber(item.quantity)}x ${item.name}`).join('، ')}
          </p>
          <p className="mt-2 text-xs font-bold text-slate-400" dir="ltr">
            {formatDateTime(order.date)}
          </p>
        </div>
        <div className="shrink-0 text-left">
          <p className="text-sm font-black text-teal-700">{formatPrice(order.total)}</p>
          <p className="mt-1 text-xs font-bold text-slate-500">
            {order.tableNumber ? `میز ${formatNumber(order.tableNumber)}` : 'بدون میز'}
          </p>
        </div>
      </div>
    </button>
  );
}

function FeedbackCard({ feedback, onOpen }: { feedback: Feedback; onOpen?: () => void }) {
  return (
    <button onClick={onOpen} className="dashboard-list-item w-full p-4 text-right">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="flex text-amber-400">
          {[1, 2, 3, 4, 5].map((star) => (
            <Star
              key={star}
              size={16}
              fill={star <= feedback.rating ? 'currentColor' : 'none'}
              className={star <= feedback.rating ? 'text-amber-400' : 'text-slate-300'}
            />
          ))}
        </div>
        <span className="text-xs font-bold text-slate-400" dir="ltr">
          {formatDateTime(feedback.date)}
        </span>
      </div>
      <p className="mt-3 line-clamp-2 text-sm font-bold leading-relaxed text-slate-700">
        {feedback.comment || 'بدون متن'}
      </p>
      <div className="mt-3 flex flex-wrap items-center gap-2 text-xs font-black text-teal-700">
        {feedback.customerName && (
          <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1">{feedback.customerName}</span>
        )}
        {feedback.orderId && (
          <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-slate-600">سفارش {feedback.orderId}</span>
        )}
      </div>
    </button>
  );
}

function TableStatusPanel({ tables }: { tables: Table[] }) {
  const total = tables.length;
  const statuses = [
    { label: 'آزاد', value: tables.filter(table => table.status === 'available').length, color: 'bg-emerald-500', text: 'text-emerald-700', bg: 'bg-emerald-50' },
    { label: 'پر', value: tables.filter(table => table.status === 'occupied').length, color: 'bg-rose-500', text: 'text-rose-700', bg: 'bg-rose-50' },
    { label: 'رزرو', value: tables.filter(table => table.status === 'reserved').length, color: 'bg-amber-500', text: 'text-amber-700', bg: 'bg-amber-50' }
  ];

  return (
    <section className="dashboard-panel p-4">
      <div className="mb-4 flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950">وضعیت میزها</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">{formatNumber(total)} میز در سالن</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
          <Coffee size={20} />
        </div>
      </div>
      <div className="flex h-3 overflow-hidden rounded-full bg-slate-100">
        {statuses.map(status => (
          <span
            key={status.label}
            className={status.color}
            style={{ width: total ? `${(status.value / total) * 100}%` : '0%' }}
          />
        ))}
      </div>
      <div className="mt-4 grid grid-cols-3 gap-2">
        {statuses.map(status => {
          const percent = total ? Math.round((status.value / total) * 100) : 0;
          return (
            <div key={status.label} className={cn('rounded-lg border border-slate-200 p-3', status.bg)}>
              <p className={cn('text-lg font-black', status.text)}>{formatNumber(status.value)}</p>
              <p className="mt-1 text-xs font-bold text-slate-500">{status.label}</p>
              <p className="mt-1 text-[11px] font-black text-slate-400">{formatNumber(percent)}٪</p>
            </div>
          );
        })}
      </div>
    </section>
  );
}

function InventoryPanel({ products, compact = false }: { products: Product[]; compact?: boolean }) {
  const alertProducts = products
    .filter(product => product.stock <= (product.minThreshold || 10))
    .sort((a, b) => a.stock - b.stock);
  const healthyCount = Math.max(products.length - alertProducts.length, 0);
  const healthPercent = products.length ? Math.round((healthyCount / products.length) * 100) : 100;

  return (
    <section className={cn('dashboard-panel flex flex-col gap-4 p-4', !compact && 'min-h-[292px]', compact && 'h-full min-h-[17rem]')}>
      <div className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-base font-black text-slate-950">کنترل موجودی</h3>
          <p className="mt-1 text-xs font-bold text-slate-500">سلامت انبار {formatNumber(healthPercent)}٪</p>
        </div>
        <div className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
          <Package size={20} />
        </div>
      </div>

      {alertProducts.length > 0 ? (
        <div className="min-h-0 flex-1 space-y-2 overflow-y-auto pr-1">
          {alertProducts.slice(0, compact ? 4 : 6).map(product => (
            <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-rose-100 bg-rose-50/70 px-3 py-2">
              <div className="min-w-0">
                <p className="truncate text-sm font-black text-slate-800">{product.name}</p>
                <p className="mt-1 text-xs font-bold text-rose-600">
                  حداقل {formatNumber(product.minThreshold || 10)}
                </p>
              </div>
              <span className="shrink-0 rounded-md bg-white px-2 py-1 text-xs font-black text-rose-700 ring-1 ring-rose-100">
                {formatNumber(product.stock)} موجود
              </span>
            </div>
          ))}
        </div>
      ) : (
        <div className={cn('flex-1', compact && '[&>div]:min-h-0 [&>div]:py-5')}>
          <EmptyState
            title="موجودی بحرانی ندارید"
            description="همه محصولات بالاتر از حد هشدار ثبت شده‌اند."
            icon={<CheckCircle2 size={23} />}
          />
        </div>
      )}
    </section>
  );
}

type TopProduct = {
  id: string;
  name: string;
  image: string;
  quantity: number;
  total: number;
};

function ProductThumb({ src, alt }: { src: string; alt: string }) {
  const [failed, setFailed] = useState(false);

  if (failed || !src) {
    return (
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-400">
        <ShoppingBag size={17} />
      </span>
    );
  }

  return (
    <img
      src={src}
      alt={alt}
      onError={() => setFailed(true)}
      className="h-10 w-10 shrink-0 rounded-lg object-cover"
    />
  );
}

function ProductSalesRow({
  product,
  index,
  onClick
}: {
  product: TopProduct;
  index: number;
  onClick?: () => void;
}) {
  return (
    <button onClick={onClick} className="dashboard-list-item flex w-full items-center gap-3 p-2.5 text-right">
      <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-slate-100 text-xs font-black text-slate-600">
        {formatNumber(index + 1)}
      </span>
      <ProductThumb src={product.image} alt={product.name} />
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-black text-slate-800">{product.name}</p>
        <p className="mt-1 text-xs font-bold text-slate-500">{formatNumber(product.quantity)} عدد فروش</p>
      </div>
      <p className="shrink-0 text-xs font-black text-teal-700">{formatCompactValue(product.total)}</p>
    </button>
  );
}

function TopProductsPanel({ orders }: { orders: Order[] }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const topProducts = useMemo(() => {
    const byProduct = new Map<string, { id: string; name: string; image: string; quantity: number; total: number }>();
    orders
      .filter(order => order.status === 'completed')
      .forEach(order => {
        order.items.forEach(item => {
          const current = byProduct.get(item.id) || {
            id: item.id,
            name: item.name,
            image: item.image,
            quantity: 0,
            total: 0
          };
          current.quantity += item.quantity;
          current.total += item.quantity * item.price;
          byProduct.set(item.id, current);
        });
      });

    return Array.from(byProduct.values())
      .sort((a, b) => b.quantity - a.quantity);
  }, [orders]);

  const filteredProducts = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return topProducts;

    return topProducts.filter(product => {
      const haystack = normalizeSearch(`${product.name} ${product.quantity} ${formatPrice(product.total)}`);
      return haystack.includes(needle);
    });
  }, [topProducts, query]);

  return (
    <>
      <section className="dashboard-panel flex min-h-[292px] flex-col gap-4 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="flex min-w-0 items-center gap-3">
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
              <ShoppingBag size={20} />
            </div>
            <div className="min-w-0">
              <h3 className="truncate text-base font-black text-slate-950">محصولات پرفروش</h3>
              <p className="mt-1 line-clamp-1 text-xs font-bold text-slate-500">بر اساس سفارش‌های تکمیل‌شده</p>
            </div>
          </div>
          <button
            onClick={() => setIsOpen(true)}
            className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-teal-200 bg-teal-50 px-3 text-xs font-black text-teal-700 hover:bg-teal-100"
            title="نمایش همه محصولات"
          >
            <Expand size={16} />
            {formatNumber(topProducts.length)}
          </button>
        </div>

        {topProducts.length > 0 ? (
          <div className="space-y-2">
            {topProducts.slice(0, 5).map((product, index) => (
              <ProductSalesRow key={product.id} product={product} index={index} onClick={() => setIsOpen(true)} />
            ))}
          </div>
        ) : (
          <EmptyState
            title="فروش محصولی ثبت نشده"
            description="بعد از تکمیل سفارش‌ها، رتبه‌بندی محصولات اینجا دیده می‌شود."
            icon={<ShoppingBag size={23} />}
          />
        )}
      </section>

      {isOpen && (
        <DashboardModal
          title="محصولات پرفروش"
          subtitle="جستجو بر اساس نام محصول، تعداد فروش و مبلغ"
          search={query}
          onSearch={setQuery}
          onClose={() => setIsOpen(false)}
          count={filteredProducts.length}
        >
          {filteredProducts.length === 0 ? (
            <EmptyState
              title="نتیجه‌ای پیدا نشد"
              description="عبارت جستجو را تغییر دهید."
              icon={<ShoppingBag size={23} />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {filteredProducts.map((product, index) => (
                <ProductSalesRow key={product.id} product={product} index={index} />
              ))}
            </div>
          )}
        </DashboardModal>
      )}
    </>
  );
}

export function DashboardView({ orders, tables, products, events, feedbacks = [] }: DashboardViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pendingSearch, setPendingSearch] = useState('');
  const [feedbackSearch, setFeedbackSearch] = useState('');
  const [activeModal, setActiveModal] = useState<'pending' | 'feedback' | null>(null);

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

  const todayKey = getLocalDateKey(new Date());
  const todayOrders = orders.filter(order => getLocalDateKey(order.date) === todayKey && order.status === 'completed');
  const activeOrders = orders.filter(order => order.status === 'pending' || order.status === 'draft');
  const todaySales = todayOrders.reduce((acc, order) => acc + order.total, 0);
  const occupiedTablesCount = tables.filter(table => table.status === 'occupied').length;
  const reservedTablesCount = tables.filter(table => table.status === 'reserved').length;
  const availableTablesCount = tables.filter(table => table.status === 'available').length;
  const alertProducts = products.filter(product => product.stock <= (product.minThreshold || 10));
  const lowStockCount = alertProducts.filter(product => product.stock > 0).length;
  const outOfStockCount = alertProducts.filter(product => product.stock === 0).length;
  const healthyStockCount = Math.max(products.length - alertProducts.length, 0);
  const totalStock = products.reduce((acc, product) => acc + product.stock, 0);
  const occupancyPercent = tables.length ? Math.round((occupiedTablesCount / tables.length) * 100) : 0;

  const recentDaysChart = useMemo(() => {
    return Array.from({ length: 7 }).map((_, index) => {
      const date = new Date();
      date.setDate(date.getDate() - (6 - index));
      const key = getLocalDateKey(date);
      const dayOrders = orders.filter(order => getLocalDateKey(order.date) === key && order.status === 'completed');
      return {
        label: getShortDayLabel(date),
        sales: dayOrders.reduce((acc, order) => acc + order.total, 0),
        count: dayOrders.length
      };
    });
  }, [orders]);

  const salesChart = recentDaysChart.map(day => ({
    label: day.label,
    value: day.sales,
    accent: day.sales > 0 ? '#0f766e' : '#cbd5e1'
  }));

  const deliveredChart = recentDaysChart.map(day => ({
    label: day.label,
    value: day.count,
    accent: day.count > 0 ? '#2563eb' : '#cbd5e1'
  }));

  const tableChart: ChartPoint[] = [
    { label: 'آزاد', value: availableTablesCount, accent: '#10b981' },
    { label: 'رزرو', value: reservedTablesCount, accent: '#f59e0b' },
    { label: 'پر', value: occupiedTablesCount, accent: '#f43f5e' }
  ];

  const stockChart: ChartPoint[] = [
    { label: 'ایمن', value: healthyStockCount, accent: '#14b8a6' },
    { label: 'کم', value: lowStockCount, accent: '#f59e0b' },
    { label: 'ناموجود', value: outOfStockCount, accent: '#e11d48' }
  ];

  const totalRecentSales = recentDaysChart.reduce((acc, day) => acc + day.sales, 0);
  const totalRecentDelivered = recentDaysChart.reduce((acc, day) => acc + day.count, 0);
  const previousRecentSales = Math.max(totalRecentSales - todaySales, 0);
  const previousRecentDelivered = Math.max(totalRecentDelivered - todayOrders.length, 0);
  const salesSharePercent = totalRecentSales ? Math.round((todaySales / totalRecentSales) * 100) : 0;
  const deliveredSharePercent = totalRecentDelivered ? Math.round((todayOrders.length / totalRecentDelivered) * 100) : 0;
  const stockHealthPercent = products.length ? Math.round((healthyStockCount / products.length) * 100) : 100;

  const salesDonutChart: ChartPoint[] = [
    { label: 'امروز', value: todaySales, accent: '#0f766e' },
    { label: '۶ روز قبل', value: previousRecentSales, accent: '#99f6e4' }
  ];

  const deliveredDonutChart: ChartPoint[] = [
    { label: 'امروز', value: todayOrders.length, accent: '#2563eb' },
    { label: '۶ روز قبل', value: previousRecentDelivered, accent: '#bfdbfe' }
  ];

  const pendingNeedle = normalizeSearch(pendingSearch);
  const filteredActiveOrders = activeOrders.filter(order => {
    if (!pendingNeedle) return true;
    const haystack = normalizeSearch([
      order.id,
      order.status === 'draft' ? 'پیش نویس' : 'در حال آماده سازی',
      order.tableNumber ? `میز ${order.tableNumber}` : '',
      formatPrice(order.total),
      ...order.items.map(item => `${item.name} ${item.quantity}`)
    ].join(' '));
    return haystack.includes(pendingNeedle);
  });

  const feedbackNeedle = normalizeSearch(feedbackSearch);
  const filteredFeedbacks = feedbacks.filter(feedback => {
    if (!feedbackNeedle) return true;
    const haystack = normalizeSearch([
      feedback.comment,
      feedback.customerName || '',
      feedback.orderId || '',
      String(feedback.rating)
    ].join(' '));
    return haystack.includes(feedbackNeedle);
  });

  const averageRating = feedbacks.length
    ? feedbacks.reduce((acc, feedback) => acc + feedback.rating, 0) / feedbacks.length
    : 0;

  return (
    <div
      ref={containerRef}
      className={cn(
        'dashboard-cinema h-full min-h-0 overflow-y-auto rounded-xl p-4 text-slate-950 lg:p-5',
        isFullscreen && 'rounded-none'
      )}
    >
      <div className="mx-auto flex min-h-full max-w-[1600px] flex-col gap-5">
        <section className="dashboard-command-bar p-4">
          <div className="flex flex-col gap-4 xl:flex-row xl:items-center xl:justify-between">
            <div className="min-w-0">
              <h2 className="text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                داشبورد مدیریتی رستوران
              </h2>
              <p className="mt-1 max-w-3xl text-sm font-bold leading-6 text-slate-500">
                فروش، سفارش‌های فعال، میزها، موجودی، رویدادها و تجربه مشتری در یک نمای منظم عملیاتی.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <span className="inline-flex h-10 items-center gap-2 rounded-lg border border-emerald-200 bg-emerald-50 px-3 text-xs font-black text-emerald-700">
                <span className="h-2 w-2 rounded-full bg-emerald-500" />
                آنلاین
              </span>
              <span className="inline-flex h-10 items-center rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-600">
                {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'full' }).format(new Date())}
              </span>
              <button
                onClick={toggleFullscreen}
                className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-teal-200 bg-teal-50 px-3 text-sm font-black text-teal-700 shadow-sm hover:bg-teal-100"
                title={isFullscreen ? 'خروج از حالت تمام صفحه' : 'تمام صفحه'}
              >
                {isFullscreen ? <Minimize size={20} /> : <Maximize size={20} />}
                <span className="hidden sm:inline">{isFullscreen ? 'خروج' : 'تمام صفحه'}</span>
              </button>
            </div>
          </div>
        </section>

        {alertProducts.length > 0 && (
          <section className="dashboard-alert rounded-xl border border-rose-200 bg-rose-50 p-4">
            <div className="flex flex-col gap-4 md:flex-row md:items-center">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg border border-rose-200 bg-white text-rose-600">
                <AlertTriangle size={24} />
              </div>
              <div className="min-w-0 flex-1">
                <h3 className="text-base font-black text-slate-950">هشدار کاهش موجودی انبار</h3>
                <p className="mt-1 text-sm font-bold leading-6 text-rose-700">
                  {formatNumber(alertProducts.length)} محصول در محدوده هشدار قرار دارد.
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {alertProducts.slice(0, 6).map(product => (
                  <span key={product.id} className="rounded-md border border-rose-200 bg-white px-3 py-1.5 text-xs font-black text-rose-700">
                    {product.name}: {formatNumber(product.stock)}
                  </span>
                ))}
              </div>
            </div>
          </section>
        )}

        <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 2xl:grid-cols-4">
          <MetricCard
            title="فروش امروز"
            value={formatPrice(todaySales)}
            hint={`${formatNumber(todayOrders.length)} سفارش تکمیل‌شده امروز`}
            icon={<TrendingUp size={22} />}
            chartData={salesDonutChart}
            center={`${formatNumber(salesSharePercent)}٪`}
            caption="سهم هفته"
            badge="درآمد"
            tone="border-teal-200 bg-teal-50 text-teal-700"
          />
          <MetricCard
            title="سفارش‌های تکمیل‌شده"
            value={`${formatNumber(todayOrders.length)} سفارش`}
            hint="تعداد سفارش‌های نهایی امروز"
            icon={<ShoppingBag size={22} />}
            chartData={deliveredDonutChart}
            center={`${formatNumber(deliveredSharePercent)}٪`}
            caption="سهم امروز"
            badge="تحویل"
            tone="border-blue-200 bg-blue-50 text-blue-700"
          />
          <MetricCard
            title="وضعیت انبار"
            value={`${formatNumber(outOfStockCount)} ناموجود`}
            hint={`${formatNumber(lowStockCount)} محصول کم موجود | ${formatNumber(totalStock)} واحد موجودی`}
            icon={<PackageX size={22} />}
            chartData={stockChart}
            center={`${formatNumber(stockHealthPercent)}٪`}
            caption="سلامت"
            badge="انبار"
            tone="border-rose-200 bg-rose-50 text-rose-700"
          />
          <MetricCard
            title="میزهای پر"
            value={`${formatNumber(occupiedTablesCount)} از ${formatNumber(tables.length)}`}
            hint="تقسیم وضعیت میزهای سالن"
            icon={<Coffee size={22} />}
            chartData={tableChart}
            center={`${formatNumber(occupancyPercent)}٪`}
            caption="اشغال"
            badge="سالن"
            tone="border-amber-200 bg-amber-50 text-amber-700"
          />
        </section>

        <section className="grid grid-cols-1 items-stretch gap-5 lg:grid-cols-3">
          <TableStatusPanel tables={tables} />

          <InventoryPanel products={products} compact />

          <div className="dashboard-panel flex min-h-[17rem] flex-col p-4">
            <div className="mb-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h3 className="text-base font-black text-slate-950">روند فروش ۷ روز اخیر</h3>
                <p className="mt-1 text-xs font-bold text-slate-500">مجموع فروش سفارش‌های تکمیل‌شده</p>
              </div>
              <div className="rounded-lg border border-teal-200 bg-teal-50 px-3 py-2 text-sm font-black text-teal-700">
                امروز: {formatPrice(todaySales)}
              </div>
            </div>
            <div className="min-h-0 flex-1">
              <SalesTrendChart data={salesChart} compact />
            </div>
          </div>
        </section>

        <section>
          <TopProductsPanel orders={orders} />
        </section>

        <section>
          <div className="dashboard-panel flex min-h-[320px] flex-col gap-4 p-4">
            <PanelHeader
              title={`سفارش‌های فعال (${formatNumber(activeOrders.length)})`}
              subtitle="آیتم‌های آماده‌سازی و پیش‌نویس صندوق"
              icon={<ReceiptText size={20} />}
              count={filteredActiveOrders.length}
              search={pendingSearch}
              onSearch={setPendingSearch}
              onOpen={() => setActiveModal('pending')}
              placeholder="جستجو در سفارش‌ها..."
            />
            <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
              {filteredActiveOrders.length === 0 ? (
                <button onClick={() => setActiveModal('pending')} className="block h-full w-full text-right">
                  <EmptyState
                    title="سفارش فعالی ثبت نشده"
                    description="سفارش‌های آماده‌سازی و پیش‌نویس صندوق در این بخش قرار می‌گیرند."
                    icon={<CheckCircle2 size={23} />}
                  />
                </button>
              ) : (
                filteredActiveOrders.slice(0, 6).map(order => (
                  <OrderItemCard key={order.id} order={order} onOpen={() => setActiveModal('pending')} />
                ))
              )}
            </div>
          </div>
        </section>

        <section className="grid grid-cols-1 gap-5 xl:grid-cols-12">
          <div className="xl:col-span-5">
            <ActivityLog events={events} />
          </div>

          <div className="dashboard-panel flex min-h-[360px] flex-col gap-4 p-4 xl:col-span-7">
            <PanelHeader
              title="نظرات اخیر مشتریان"
              subtitle={feedbacks.length ? `میانگین امتیاز ${formatNumber(Number(averageRating.toFixed(1)))} از ۵` : 'بازخوردهای تازه مشتریان'}
              icon={<MessageCircle size={20} />}
              count={filteredFeedbacks.length}
              search={feedbackSearch}
              onSearch={setFeedbackSearch}
              onOpen={() => setActiveModal('feedback')}
              placeholder="جستجو در نظرات..."
            />
            <div className="grid min-h-0 flex-1 grid-cols-1 gap-3 overflow-y-auto pr-1 lg:grid-cols-2">
              {filteredFeedbacks.length === 0 ? (
                <button onClick={() => setActiveModal('feedback')} className="block h-full w-full text-right lg:col-span-2">
                  <EmptyState
                    title="هنوز نظری ثبت نشده"
                    description="امتیازها و متن بازخورد مشتریان در این بخش نمایش داده می‌شود."
                    icon={<Users size={23} />}
                  />
                </button>
              ) : (
                filteredFeedbacks.slice(0, 6).map(feedback => (
                  <FeedbackCard key={feedback.id} feedback={feedback} onOpen={() => setActiveModal('feedback')} />
                ))
              )}
            </div>
          </div>
        </section>
      </div>

      {activeModal === 'pending' && (
        <DashboardModal
          title="سفارش‌های فعال"
          subtitle="سفارش‌های آماده‌سازی و پیش‌نویس صندوق"
          search={pendingSearch}
          onSearch={setPendingSearch}
          onClose={() => setActiveModal(null)}
          count={filteredActiveOrders.length}
        >
          {filteredActiveOrders.length === 0 ? (
            <EmptyState
              title="نتیجه‌ای پیدا نشد"
              description="عبارت جستجو را تغییر دهید."
              icon={<Clock3 size={23} />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {filteredActiveOrders.map(order => (
                <OrderItemCard key={order.id} order={order} />
              ))}
            </div>
          )}
        </DashboardModal>
      )}

      {activeModal === 'feedback' && (
        <DashboardModal
          title="نظرات اخیر مشتریان"
          subtitle="بازخوردها بر اساس نظر، سفارش و نام مشتری"
          search={feedbackSearch}
          onSearch={setFeedbackSearch}
          onClose={() => setActiveModal(null)}
          count={filteredFeedbacks.length}
        >
          {filteredFeedbacks.length === 0 ? (
            <EmptyState
              title="نتیجه‌ای پیدا نشد"
              description="عبارت جستجو را تغییر دهید."
              icon={<MessageCircle size={23} />}
            />
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {filteredFeedbacks.map(feedback => (
                <FeedbackCard key={feedback.id} feedback={feedback} />
              ))}
            </div>
          )}
        </DashboardModal>
      )}
    </div>
  );
}
