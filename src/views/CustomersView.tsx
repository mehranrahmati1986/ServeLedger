import React, { useState } from 'react';
import { Customer, Order } from '../types';
import { Search, Plus, Trophy, Edit, Trash2, Wallet, History, X, Receipt } from 'lucide-react';
import { cn, formatNumber, formatPrice } from '../lib/utils';

interface CustomersViewProps {
  customers: Customer[];
  orders?: Order[];
  onAddCustomer: (c: Omit<Customer, 'id' | 'points'>) => void;
  onEditCustomer: (id: string, c: Partial<Customer>) => void;
  onDeleteCustomer: (id: string) => void;
}

export function CustomersView({ customers, orders = [], onAddCustomer, onEditCustomer, onDeleteCustomer }: CustomersViewProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingCustomer, setEditingCustomer] = useState<Customer | null>(null);
  const [viewingOrdersCustomer, setViewingOrdersCustomer] = useState<Customer | null>(null);

  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    points: 0,
    walletBalance: 0
  });

  const filteredCustomers = customers.filter(c => 
    c.name.includes(searchQuery) || c.phone.includes(searchQuery)
  );

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.phone) return;

    if (editingCustomer) {
      onEditCustomer(editingCustomer.id, formData);
    } else {
      onAddCustomer(formData);
    }

    setIsAddModalOpen(false);
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', points: 0, walletBalance: 0 });
  };

  const openAddModal = () => {
    setEditingCustomer(null);
    setFormData({ name: '', phone: '', points: 0, walletBalance: 0 });
    setIsAddModalOpen(true);
  };

  const openEditModal = (c: Customer) => {
    setEditingCustomer(c);
    setFormData({ name: c.name, phone: c.phone, points: c.points, walletBalance: c.walletBalance || 0 });
    setIsAddModalOpen(true);
  };

  return (
    <div className="h-full flex flex-col gap-6 relative">
      <div className="flex items-center justify-between shrink-0">
        <div>
          <h2 className="text-2xl font-black text-slate-800">باشگاه مشتریان و امتیازات</h2>
          <p className="text-slate-500 mt-1">مدیریت مشتریان و امتیازات وفاداری آن‌ها.</p>
        </div>
        <button 
          onClick={openAddModal}
          className="bg-amber-500 text-white px-5 py-3 rounded-xl font-bold flex items-center gap-2 hover:bg-amber-600 transition-colors shadow-sm"
        >
          <Plus size={20} />
          <span>افزودن مشتری جدید</span>
        </button>
      </div>

      <div className="bg-white rounded-3xl shadow-sm border border-slate-200 flex-1 flex flex-col overflow-hidden">
        {/* Toolbar */}
        <div className="p-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
          <div className="relative w-96">
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400" size={20} />
            <input 
              type="text" 
              placeholder="جستجوی مشتری بر اساس نام یا موبایل..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-white border border-slate-200 rounded-xl py-2.5 pr-12 pl-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow"
            />
          </div>
        </div>

        {/* Table */}
        <div className="flex-1 overflow-auto">
          <table className="w-full text-right text-sm">
            <thead className="bg-slate-50 text-slate-500 sticky top-0">
              <tr>
                <th className="py-4 px-6 font-medium">نام مشتری</th>
                <th className="py-4 px-6 font-medium">شماره موبایل</th>
                <th className="py-4 px-6 font-medium">موجودی کیف پول</th>
                <th className="py-4 px-6 font-medium">امتیاز وفاداری</th>
                <th className="py-4 px-6 font-medium w-32">عملیات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                 <tr>
                    <td colSpan={4} className="py-10 text-center text-slate-500">
                      هیچ مشتری پیدا نشد.
                    </td>
                 </tr>
              ) : filteredCustomers.map(customer => (
                  <tr key={customer.id} className="hover:bg-slate-50/50 transition-colors">
                    <td className="py-4 px-6 font-semibold text-slate-800">{customer.name}</td>
                    <td className="py-4 px-6 text-slate-600 font-mono" dir="ltr">{customer.phone}</td>
                    <td className="py-4 px-6 font-bold text-slate-700 flex items-center gap-2">
                       <Wallet size={16} className="text-slate-400" />
                       {formatPrice(customer.walletBalance || 0)}
                    </td>
                    <td className="py-4 px-6 text-emerald-600 font-bold items-center gap-2">
                       <span className="flex items-center gap-2"><Trophy size={16} /> {formatNumber(customer.points)} امتیاز</span>
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-2">
                        <button onClick={() => setViewingOrdersCustomer(customer)} className="p-2 text-slate-400 hover:text-amber-600 hover:bg-amber-50 rounded-lg transition-colors" title="تاریخچه سفارشات">
                          <History size={18} />
                        </button>
                        <button onClick={() => openEditModal(customer)} className="p-2 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="ویرایش">
                          <Edit size={18} />
                        </button>
                        <button onClick={() => onDeleteCustomer(customer.id)} className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors" title="حذف">
                          <Trash2 size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Orders History Modal */}
      {viewingOrdersCustomer && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-lg flex flex-col overflow-hidden max-h-[80vh]">
            <div className="p-6 pb-4 border-b border-slate-100 flex justify-between items-center bg-slate-50 shrink-0">
              <div>
                <h3 className="text-xl font-bold text-slate-800">تاریخچه سفارشات</h3>
                <p className="text-sm text-slate-500 mt-1">{viewingOrdersCustomer.name} - {viewingOrdersCustomer.phone}</p>
              </div>
              <button onClick={() => setViewingOrdersCustomer(null)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                <X size={20} />
              </button>
            </div>
            
            <div className="p-6 overflow-y-auto flex-1 bg-slate-50">
               {(() => {
                 const customerOrders = orders.filter(o => o.customerId === viewingOrdersCustomer.id).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                 
                 if (customerOrders.length === 0) {
                   return (
                     <div className="text-center py-12">
                       <Receipt size={48} className="mx-auto text-slate-300 mb-4" />
                       <p className="text-slate-500 font-medium">هیچ سفارشی برای این مشتری ثبت نشده است.</p>
                     </div>
                   );
                 }

                 return (
                   <div className="space-y-4">
                     {customerOrders.map(order => (
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
                               {new Intl.DateTimeFormat('fa-IR', { dateStyle: 'medium', hour: '2-digit', minute:'2-digit' }).format(new Date(order.date))}
                             </div>
                           </div>
                           <div className="text-left flex flex-col items-end">
                             <div className="font-bold text-slate-800">{formatPrice(order.total)} تومان</div>
                             <span className="text-[10px] text-slate-500 mt-1">{order.paymentMethod === 'cash' ? 'نقدی' : order.paymentMethod === 'card' ? 'کارت بانکی' : order.paymentMethod === 'wallet' ? 'کیف پول' : 'پرداخت نشده'}</span>
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
                           <div className="mt-4 pt-4 border-t border-slate-100 border-dashed flex flex-col items-center bg-slate-50/50 rounded-xl p-3 relative isolate">
                             <div className="absolute inset-0 bg-white" style={{ zIndex: -1 }}></div>
                             <div className="text-xs text-slate-500 mb-2 w-full text-center">امضای دیجیتال مشتری</div>
                             <img src={order.signatureUrl} alt="Signature" className="h-16 object-contain mix-blend-multiply" />
                           </div>
                         )}
                       </div>
                     ))}
                   </div>
                 );
               })()}
            </div>
          </div>
        </div>
      )}

      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-3xl shadow-xl w-full max-w-md flex flex-col overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
              <h3 className="text-xl font-bold text-slate-800">{editingCustomer ? 'ویرایش مشتری' : 'افزودن مشتری جدید'}</h3>
              <button onClick={() => setIsAddModalOpen(false)} className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-xl transition-colors">
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <form id="customer-form" onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">نام مشتری</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={e => setFormData({...formData, name: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700"
                    placeholder="نام کامل"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">شماره تماس</label>
                  <input
                    type="tel"
                    required
                    value={formData.phone}
                    onChange={e => setFormData({...formData, phone: e.target.value})}
                    className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 font-mono"
                    dir="ltr"
                    placeholder="0912..."
                  />
                </div>
                {editingCustomer && (
                   <div className="grid grid-cols-2 gap-4">
                     <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-2">امتیاز فعلی</label>
                       <input
                         type="number"
                         value={formData.points}
                         onChange={e => setFormData({...formData, points: Number(e.target.value)})}
                         className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 font-mono text-left"
                         dir="ltr"
                       />
                     </div>
                     <div>
                       <label className="block text-sm font-semibold text-slate-700 mb-2">موجودی کیف پول (تومان)</label>
                       <input
                         type="number"
                         value={formData.walletBalance}
                         onChange={e => setFormData({...formData, walletBalance: Number(e.target.value)})}
                         className="w-full bg-white border border-slate-200 rounded-xl py-3 px-4 focus:ring-2 focus:ring-amber-500 outline-none transition-shadow text-slate-700 font-mono text-left"
                         dir="ltr"
                         min="0"
                         step="1000"
                       />
                     </div>
                   </div>
                )}
              </form>
            </div>

            <div className="p-6 border-t border-slate-100 bg-slate-50/50 flex gap-3">
              <button 
                type="button" 
                onClick={() => setIsAddModalOpen(false)}
                className="flex-1 px-4 py-3 bg-white border border-slate-200 text-slate-700 rounded-xl font-bold hover:bg-slate-50 transition-colors"
              >
                انصراف
              </button>
              <button 
                type="submit" 
                form="customer-form"
                className="flex-1 px-4 py-3 bg-amber-500 text-white rounded-xl font-bold hover:bg-amber-600 transition-colors shadow-sm"
              >
                {editingCustomer ? 'ذخیره تغییرات' : 'افزودن مشتری'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
