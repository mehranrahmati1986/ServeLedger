import React, { useEffect, useMemo, useState } from 'react';
import { SystemEvent } from '../types';
import { Clock, Info, Users, Coffee, Utensils, Search, Expand, X } from 'lucide-react';
import { formatNumber } from '../lib/utils';

const normalizeSearch = (value: string) =>
  value
    .toLocaleLowerCase('fa-IR')
    .replace(/ي/g, 'ی')
    .replace(/ك/g, 'ک')
    .trim();

function getTimeAgo(timestampStr: string) {
  const timestamp = new Date(timestampStr).getTime();
  const now = new Date().getTime();
  const diff = Math.floor((now - timestamp) / 1000);

  if (diff < 60) return 'چند لحظه پیش';
  if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
  if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
  return `${Math.floor(diff / 86400)} روز پیش`;
}

function getTypeLabel(type: SystemEvent['type']) {
  switch (type) {
    case 'order':
      return 'سفارش';
    case 'table':
      return 'میز';
    case 'staff':
      return 'پرسنل';
    default:
      return 'سیستم';
  }
}

function EventIcon({ type }: { type: SystemEvent['type'] }) {
  switch (type) {
    case 'order':
      return <Utensils size={16} className="text-amber-600" />;
    case 'table':
      return <Coffee size={16} className="text-teal-600" />;
    case 'staff':
      return <Users size={16} className="text-emerald-600" />;
    default:
      return <Info size={16} className="text-slate-600" />;
  }
}

function EventRow({ event, onOpen }: { event: SystemEvent; onOpen?: () => void }) {
  return (
    <button onClick={onOpen} className="dashboard-list-item group w-full p-3 text-right">
      <div className="flex gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50">
          <EventIcon type={event.type} />
        </div>
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start justify-between gap-2">
            <span className="rounded-md border border-slate-200 bg-slate-50 px-2 py-1 text-[0.68rem] font-black text-slate-600">
              {getTypeLabel(event.type)}
            </span>
            <span className="text-xs font-bold text-slate-400" dir="ltr">
              {getTimeAgo(event.timestamp)}
            </span>
          </div>
          <p className="mt-2 line-clamp-2 text-sm font-bold leading-relaxed text-slate-700 group-hover:text-slate-950">
            {event.message}
          </p>
        </div>
      </div>
    </button>
  );
}

function ActivityModal({
  events,
  query,
  onQuery,
  onClose
}: {
  events: SystemEvent[];
  query: string;
  onQuery: (value: string) => void;
  onClose: () => void;
}) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose();
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-[90] bg-slate-900/20 p-3 text-slate-950 backdrop-blur-md sm:p-5" role="dialog" aria-modal="true">
      <div className="flex h-full min-h-0 flex-col overflow-hidden rounded-xl border border-teal-100 bg-white shadow-[0_28px_90px_-44px_rgba(15,23,42,0.65)]">
        <div className="flex shrink-0 flex-col gap-4 border-b border-slate-100 bg-white p-4 lg:flex-row lg:items-center lg:justify-between">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-2">
              <h2 className="text-xl font-black tracking-tight text-slate-950">گزارش رویدادها</h2>
              <span className="rounded-md border border-teal-200 bg-teal-50 px-2 py-1 text-xs font-black text-teal-700">
                {formatNumber(events.length)} رویداد
              </span>
            </div>
            <p className="mt-1 text-sm font-bold text-slate-500">آخرین فعالیت‌های سیستم</p>
          </div>
          <div className="flex min-w-0 flex-1 flex-col gap-3 sm:flex-row lg:max-w-xl">
            <label className="relative flex-1">
              <Search size={17} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={query}
                onChange={(event) => onQuery(event.target.value)}
                placeholder="جستجو در رویدادها..."
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

        <div className="min-h-0 flex-1 overflow-y-auto p-4">
          {events.length === 0 ? (
            <div className="flex min-h-[240px] items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center">
              <div>
                <Clock size={28} className="mx-auto mb-3 text-slate-400" />
                <p className="text-sm font-black text-slate-800">رویدادی پیدا نشد</p>
                <p className="mt-1 text-xs font-bold text-slate-500">عبارت جستجو نتیجه‌ای نداشت.</p>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-3 xl:grid-cols-2">
              {events.map(event => (
                <EventRow key={event.id} event={event} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export function ActivityLog({ events }: { events: SystemEvent[] }) {
  const [query, setQuery] = useState('');
  const [isOpen, setIsOpen] = useState(false);

  const filteredEvents = useMemo(() => {
    const needle = normalizeSearch(query);
    if (!needle) return events;

    return events.filter(event => {
      const haystack = normalizeSearch(`${event.message} ${getTypeLabel(event.type)} ${getTimeAgo(event.timestamp)}`);
      return haystack.includes(needle);
    });
  }, [events, query]);

  return (
    <>
      <section className="dashboard-panel flex h-full min-h-[360px] flex-col gap-4 p-4">
        <div className="flex shrink-0 flex-col gap-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex min-w-0 items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg border border-slate-200 bg-slate-50 text-slate-700">
                <Clock size={20} />
              </div>
              <div className="min-w-0">
                <h3 className="truncate text-base font-black text-slate-950">گزارش رویدادها</h3>
                <p className="mt-0.5 line-clamp-1 text-xs font-bold text-slate-500">آخرین فعالیت‌های سیستم</p>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(true)}
              className="inline-flex h-10 shrink-0 items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white px-3 text-xs font-black text-slate-700 hover:border-teal-200 hover:text-teal-700"
              title="نمای تمام صفحه"
            >
              <Expand size={16} />
              <span className="hidden sm:inline">{formatNumber(filteredEvents.length)}</span>
            </button>
          </div>

          <label className="relative block min-w-0">
            <Search size={15} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="جستجو در رویدادها..."
              className="h-10 w-full rounded-lg border border-slate-200 bg-white pr-9 pl-3 text-xs font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-teal-300 focus:ring-4 focus:ring-teal-100"
            />
          </label>
        </div>

        <div className="min-h-0 flex-1 space-y-3 overflow-y-auto pr-1">
          {filteredEvents.length === 0 ? (
            <button
              onClick={() => setIsOpen(true)}
              className="flex h-full min-h-[180px] w-full flex-col items-center justify-center rounded-lg border border-dashed border-slate-300 bg-slate-50/70 p-6 text-center"
            >
              <Clock size={28} className="mb-3 text-slate-400" />
              <p className="text-sm font-black text-slate-800">رویدادی پیدا نشد</p>
              <p className="mt-1 text-xs font-bold text-slate-500">عبارت جستجو نتیجه‌ای نداشت.</p>
            </button>
          ) : (
            filteredEvents.slice(0, 8).map(event => (
              <EventRow key={event.id} event={event} onOpen={() => setIsOpen(true)} />
            ))
          )}
        </div>
      </section>

      {isOpen && (
        <ActivityModal
          events={filteredEvents}
          query={query}
          onQuery={setQuery}
          onClose={() => setIsOpen(false)}
        />
      )}
    </>
  );
}
