import React, { useMemo, useState } from 'react';
import { Feedback } from '../types';
import { Search, Star, MessageSquare } from 'lucide-react';
import { cn } from '../lib/utils';

interface FeedbackViewProps {
  feedbacks: Feedback[];
}

export function FeedbackView({ feedbacks }: FeedbackViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const averageRating = feedbacks.length 
    ? (feedbacks.reduce((sum, f) => sum + f.rating, 0) / feedbacks.length).toFixed(1)
    : '0';
  const filteredFeedbacks = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return feedbacks;
    return feedbacks.filter(feedback => [
      feedback.customerName || '',
      feedback.orderId || '',
      feedback.comment || '',
      String(feedback.rating)
    ].join(' ').toLowerCase().includes(query));
  }, [feedbacks, searchQuery]);

  return (
    <div className="h-full flex flex-col gap-6 overflow-y-auto pb-8">
      {/* Header */}
      <div className="shrink-0 flex justify-between items-center bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
        <div>
          <h2 className="text-2xl font-bold text-slate-800 flex items-center gap-2">
            <MessageSquare className="text-amber-500" />
            نظرسنجی مشتریان
          </h2>
          <p className="text-slate-500 mt-1">مشاهده امتیازات و نظرات ثبت شده توسط مشتریان</p>
        </div>
        <div className="flex gap-4">
          <div className="bg-amber-50 border border-amber-100 px-4 py-2 rounded-xl flex flex-col items-center">
            <span className="text-sm font-medium text-amber-700">میانگین امتیاز</span>
            <div className="flex items-center gap-1 mt-1">
               <Star size={18} className="text-amber-500" fill="currentColor" />
               <span className="text-xl font-bold text-amber-900">{averageRating}</span>
            </div>
          </div>
          <div className="bg-slate-50 border border-slate-200 px-4 py-2 rounded-xl flex flex-col items-center">
            <span className="text-sm font-medium text-slate-600">تعداد نظرات</span>
            <span className="text-xl font-bold text-slate-800 mt-1">{feedbacks.length}</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl p-6 shadow-sm border border-slate-100 overflow-hidden flex-1 flex flex-col">
          <div className="mb-5 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h3 className="text-lg font-black text-slate-900">فهرست نظرات</h3>
              <p className="mt-1 text-sm font-bold text-slate-500">{filteredFeedbacks.length} نظر مطابق فیلتر</p>
            </div>
            <label className="relative w-full sm:w-96">
              <Search size={18} className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                value={searchQuery}
                onChange={event => setSearchQuery(event.target.value)}
                placeholder="جستجو در نام، سفارش، نظر یا امتیاز..."
                className="h-11 w-full rounded-xl border border-slate-200 bg-white pr-10 pl-3 text-sm font-bold text-slate-800 outline-none placeholder:text-slate-400 focus:border-amber-300 focus:ring-4 focus:ring-amber-100"
              />
            </label>
          </div>
          <div className="overflow-x-auto flex-1">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50">
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-r-xl border-b border-slate-100">سفارش/مشتری</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100">امتیاز</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 border-b border-slate-100 w-1/2">نظر</th>
                  <th className="py-4 px-4 font-semibold text-slate-600 rounded-l-xl border-b border-slate-100">تاریخ</th>
                </tr>
              </thead>
              <tbody>
                {filteredFeedbacks.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="py-12 text-center text-slate-500">
                      نظری مطابق جستجو یافت نشد.
                    </td>
                  </tr>
                ) : (
                  filteredFeedbacks.map(feedback => (
                    <tr key={feedback.id} className="border-b border-slate-50 hover:bg-slate-50/50 transition-colors">
                      <td className="py-4 px-4 text-slate-800 font-medium">
                        {feedback.customerName || (feedback.orderId ? `شماره سفارش: ${feedback.orderId.replace('ORD-', '')}` : 'مشتری ناشناس')}
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex text-amber-400 gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star 
                              key={i} 
                              size={16} 
                              fill={i < feedback.rating ? "currentColor" : "none"} 
                              className={cn(i >= feedback.rating && "text-slate-200")} 
                            />
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-600 whitespace-normal">
                         <div className="bg-slate-50 rounded-xl p-3 border border-slate-100 text-sm leading-relaxed max-w-full">
                           {feedback.comment || <span className="text-slate-400 italic">بدون متن</span>}
                         </div>
                      </td>
                      <td className="py-4 px-4 text-slate-500 whitespace-nowrap" dir="ltr">
                        {new Intl.DateTimeFormat('fa-IR', { 
                          year: 'numeric', 
                          month: 'short', 
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit'
                        }).format(new Date(feedback.date))}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
      </div>
    </div>
  );
}
