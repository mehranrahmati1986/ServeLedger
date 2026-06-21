import React from 'react';
import { SystemEvent } from '../types';
import { Clock, Info, CheckCircle, Users, Coffee, Utensils } from 'lucide-react';
import { cn } from '../lib/utils';

export function ActivityLog({ events }: { events: SystemEvent[] }) {
  const getIcon = (type: SystemEvent['type']) => {
    switch (type) {
      case 'order': return <Utensils size={16} className="text-amber-500" />;
      case 'table': return <Coffee size={16} className="text-blue-500" />;
      case 'staff': return <Users size={16} className="text-green-500" />;
      default: return <Info size={16} className="text-slate-500" />;
    }
  };

  const getTimeAgo = (timestampStr: string) => {
    const timestamp = new Date(timestampStr).getTime();
    const now = new Date().getTime();
    const diff = Math.floor((now - timestamp) / 1000); // in seconds
    
    if (diff < 60) return `چند لحظه پیش`;
    if (diff < 3600) return `${Math.floor(diff / 60)} دقیقه پیش`;
    if (diff < 86400) return `${Math.floor(diff / 3600)} ساعت پیش`;
    return `${Math.floor(diff / 86400)} روز پیش`;
  };

  return (
    <div className="bg-white rounded-3xl shadow-sm border border-slate-200 p-6 flex flex-col h-full overflow-hidden">
      <div className="flex items-center gap-3 mb-6 shrink-0">
        <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-slate-700">
          <Clock size={20} />
        </div>
        <div>
          <h3 className="font-bold text-slate-800">گزارش رویدادها</h3>
          <p className="text-xs text-slate-500">آخرین فعالیت‌های سیستم</p>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto pr-2 space-y-4">
        {events.length === 0 ? (
          <div className="text-center text-slate-400 py-10">
            <p className="text-sm">هنوز رویدادی ثبت نشده است.</p>
          </div>
        ) : (
          events.map(event => (
            <div key={event.id} className="flex gap-4">
              <div className="flex flex-col items-center">
                <div className="w-8 h-8 rounded-full bg-slate-50 border border-slate-100 flex items-center justify-center shrink-0 z-10">
                  {getIcon(event.type)}
                </div>
                <div className="w-px h-full bg-slate-100 mt-1"></div>
              </div>
              <div className="pb-3 flex-1">
                <p className="text-sm font-medium text-slate-700 leading-relaxed max-w-full break-words">{event.message}</p>
                <span className="text-xs text-slate-400 mt-1 block" dir="ltr">{getTimeAgo(event.timestamp)}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
