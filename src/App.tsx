import React, { Suspense, useState, useEffect } from 'react';
import { CalendarDays, CircleDot, Sparkles } from 'lucide-react';
import { initialProducts, initialOrders, initialTables, initialStaff, initialEvents, initialRooms } from './data';
import { ViewType, Product, OrderItem, Order, Table, Staff, Room, SystemEvent, Customer, Feedback, SMSMessage, Expense, Cheque, RestaurantInfo } from './types';
import { Sidebar } from './components/Sidebar';
import { simulateSMS, MANAGER_PHONE } from './lib/sms';
import { formatNumber } from './lib/utils';

const AccountingView = React.lazy(() => import('./views/AccountingView').then(module => ({ default: module.AccountingView })));
const CustomerMenuView = React.lazy(() => import('./views/CustomerMenuView').then(module => ({ default: module.CustomerMenuView })));
const CustomerReservationView = React.lazy(() => import('./views/CustomerReservationView').then(module => ({ default: module.CustomerReservationView })));
const CustomersView = React.lazy(() => import('./views/CustomersView').then(module => ({ default: module.CustomersView })));
const DashboardView = React.lazy(() => import('./views/DashboardView').then(module => ({ default: module.DashboardView })));
const FeedbackView = React.lazy(() => import('./views/FeedbackView').then(module => ({ default: module.FeedbackView })));
const InventoryView = React.lazy(() => import('./views/InventoryView').then(module => ({ default: module.InventoryView })));
const MenuMgmtView = React.lazy(() => import('./views/MenuMgmtView').then(module => ({ default: module.MenuMgmtView })));
const POSView = React.lazy(() => import('./views/POSView').then(module => ({ default: module.POSView })));
const QRView = React.lazy(() => import('./views/QRView').then(module => ({ default: module.QRView })));
const ReservationsView = React.lazy(() => import('./views/ReservationsView').then(module => ({ default: module.ReservationsView })));
const SettingsView = React.lazy(() => import('./views/SettingsView').then(module => ({ default: module.SettingsView })));
const StaffView = React.lazy(() => import('./views/StaffView').then(module => ({ default: module.StaffView })));
const TablesView = React.lazy(() => import('./views/TablesView').then(module => ({ default: module.TablesView })));
const TaxAuditView = React.lazy(() => import('./views/TaxAuditView').then(module => ({ default: module.TaxAuditView })));

const getInitialState = <T,>(key: string, defaultVal: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultVal;
  } catch {
    return defaultVal;
  }
};

const usePersistentState = <T,>(key: string, defaultVal: T) => {
  const [value, setValue] = useState<T>(() => getInitialState(key, defaultVal));

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value));
  }, [key, value]);

  return [value, setValue] as const;
};

const parseStoredValue = <T,>(value: string | null): T | null => {
  if (!value) return null;

  try {
    return JSON.parse(value) as T;
  } catch {
    return null;
  }
};

function AppLoading() {
  return (
    <div className="flex h-full min-h-[18rem] items-center justify-center rounded-2xl border border-slate-200/70 bg-white/70 p-8 text-center shadow-sm backdrop-blur">
      <div>
        <div className="mx-auto mb-4 h-10 w-10 animate-spin rounded-full border-4 border-slate-200 border-t-amber-500" />
        <p className="text-sm font-black text-slate-800">در حال آماده‌سازی صفحه...</p>
        <p className="mt-1 text-xs font-semibold text-slate-500">چند لحظه صبر کنید</p>
      </div>
    </div>
  );
}

const pageMeta: Record<ViewType, { title: string; description: string }> = {
  dashboard: {
    title: 'داشبورد اصلی',
    description: 'نمای زنده فروش، سفارش‌ها، موجودی و رویدادهای مهم سیستم'
  },
  pos: {
    title: 'صندوق فروش',
    description: 'ثبت سریع سفارش، پرداخت، فاکتور و مدیریت سفارش‌های جاری'
  },
  tables: {
    title: 'مدیریت میزها',
    description: 'چیدمان سالن، وضعیت میزها و ظرفیت رزرو را کنترل کنید'
  },
  reservations: {
    title: 'تقویم رزروها',
    description: 'پیگیری رزروها، پیامک‌ها و وضعیت حضور مهمان‌ها'
  },
  inventory: {
    title: 'انبار و محصولات',
    description: 'کنترل موجودی، هشدار کمبود، ضایعات و دسته‌بندی کالاها'
  },
  'menu-mgmt': {
    title: 'مدیریت منوی دیجیتال',
    description: 'نمایش، قیمت‌گذاری و فعال‌سازی آیتم‌های منوی آنلاین'
  },
  customers: {
    title: 'باشگاه مشتریان',
    description: 'پروفایل مشتری، امتیاز وفاداری و سابقه سفارش‌ها'
  },
  feedback: {
    title: 'نظرسنجی مشتریان',
    description: 'مرور بازخوردها و امتیاز تجربه مشتری'
  },
  staff: {
    title: 'پرسنل و شیفت‌ها',
    description: 'مدیریت تیم، وضعیت حضور و برنامه‌ریزی شیفت کاری'
  },
  accounting: {
    title: 'حسابداری و گزارش‌ها',
    description: 'درآمد، هزینه، چک‌ها، مالیات و سود و زیان رستوران'
  },
  'tax-audit': {
    title: 'حسابرسی مالیاتی',
    description: 'کنترل هوشمند مالیات عملکرد، ارزش افزوده، حقوق و ریسک اسناد'
  },
  qr: {
    title: 'منوی QR',
    description: 'ساخت و شخصی‌سازی QR هر میز برای سفارش‌گیری دیجیتال'
  },
  settings: {
    title: 'تنظیمات و پشتیبان‌گیری',
    description: 'اطلاعات رستوران، نسخه پشتیبان و تنظیمات پایه سیستم'
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [products, setProducts] = usePersistentState<Product[]>('app_products', initialProducts);
  const [orders, setOrders] = usePersistentState<Order[]>('app_orders', initialOrders);
  const [tables, setTables] = usePersistentState<Table[]>('app_tables', initialTables);
  const [rooms, setRooms] = usePersistentState<Room[]>('app_rooms', initialRooms);
  const [staff, setStaff] = usePersistentState<Staff[]>('app_staff', initialStaff);
  const [events, setEvents] = usePersistentState<SystemEvent[]>('app_events', initialEvents);
  const [customers, setCustomers] = usePersistentState<Customer[]>('app_customers', []);
  const [feedbacks, setFeedbacks] = usePersistentState<Feedback[]>('app_feedbacks', []);
  const [smsMessages, setSmsMessages] = usePersistentState<SMSMessage[]>('app_sms', []);
  const [expenses, setExpenses] = usePersistentState<Expense[]>('app_expenses', []);
  const [cheques, setCheques] = usePersistentState<Cheque[]>('app_cheques', []);
  const [restaurantInfo, setRestaurantInfo] = usePersistentState<RestaurantInfo>('app_restaurant_info', {
    name: 'رستوران پلاس',
    logo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=150',
    address: 'تهران، خیابان ولیعصر، نرسیده به پارکش وی',
    phone: '۰۲۱-۸۸۸۸۸۸۸۸'
  });
  
  const [isMenuRoute, setIsMenuRoute] = useState(false);
  const [isReserveRoute, setIsReserveRoute] = useState(false);
  const [tableParam, setTableParam] = useState<string | null>(null);

  const logEvent = (message: string, type: SystemEvent['type']) => {
    const newEvent: SystemEvent = {
        id: `evt-${Date.now()}`,
        message,
        type,
        timestamp: new Date().toISOString()
    };
    setEvents(prev => [newEvent, ...prev].slice(0, 50));
  };

  useEffect(() => {
    const handleSmsSent = (e: CustomEvent) => {
      setSmsMessages(prev => [e.detail, ...prev]);
    };
    window.addEventListener('onSmsSent', handleSmsSent as EventListener);
    return () => window.removeEventListener('onSmsSent', handleSmsSent as EventListener);
  }, []);

  useEffect(() => {
    const handleStorageChange = (e: StorageEvent) => {
      switch (e.key) {
        case 'app_products': {
          const value = parseStoredValue<Product[]>(e.newValue);
          if (value) setProducts(value);
          break;
        }
        case 'app_orders': {
          const value = parseStoredValue<Order[]>(e.newValue);
          if (value) setOrders(value);
          break;
        }
        case 'app_tables': {
          const value = parseStoredValue<Table[]>(e.newValue);
          if (value) setTables(value);
          break;
        }
        case 'app_rooms': {
          const value = parseStoredValue<Room[]>(e.newValue);
          if (value) setRooms(value);
          break;
        }
        case 'app_staff': {
          const value = parseStoredValue<Staff[]>(e.newValue);
          if (value) setStaff(value);
          break;
        }
        case 'app_events': {
          const value = parseStoredValue<SystemEvent[]>(e.newValue);
          if (value) setEvents(value);
          break;
        }
        case 'app_customers': {
          const value = parseStoredValue<Customer[]>(e.newValue);
          if (value) setCustomers(value);
          break;
        }
        case 'app_feedbacks': {
          const value = parseStoredValue<Feedback[]>(e.newValue);
          if (value) setFeedbacks(value);
          break;
        }
        case 'app_sms': {
          const value = parseStoredValue<SMSMessage[]>(e.newValue);
          if (value) setSmsMessages(value);
          break;
        }
        case 'app_expenses': {
          const value = parseStoredValue<Expense[]>(e.newValue);
          if (value) setExpenses(value);
          break;
        }
        case 'app_cheques': {
          const value = parseStoredValue<Cheque[]>(e.newValue);
          if (value) setCheques(value);
          break;
        }
        case 'app_restaurant_info': {
          const value = parseStoredValue<RestaurantInfo>(e.newValue);
          if (value) setRestaurantInfo(value);
          break;
        }
      }
    };
    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  useEffect(() => {
    if (window.location.pathname === '/menu') {
      setIsMenuRoute(true);
      const params = new URLSearchParams(window.location.search);
      setTableParam(params.get('table'));
    } else if (window.location.pathname === '/reserve') {
      setIsReserveRoute(true);
    }
  }, []);

  const chequesChecked = React.useRef(false);

  useEffect(() => {
    if (!chequesChecked.current && cheques.length > 0) {
      chequesChecked.current = true;
      const today = new Date().getTime();
      let hasNotification = false;
      cheques.forEach(cheque => {
        if (cheque.status === 'pending') {
          const daysToDue = Math.ceil((new Date(cheque.dueDate).getTime() - today) / (1000 * 3600 * 24));
          if (daysToDue >= 0 && daysToDue <= 3) {
            logEvent(`یادآوری سررسید چک: چک ${cheque.type === 'received' ? 'دریافتی' : 'پرداختی'} به مبلغ ${cheque.amount.toLocaleString()} تومان (${daysToDue === 0 ? 'امروز' : `${daysToDue} روز دیگر`})`, 'system');
            hasNotification = true;
          } else if (daysToDue < 0) {
            logEvent(`هشدار: چک ${cheque.type === 'received' ? 'دریافتی' : 'پرداختی'} به مبلغ ${cheque.amount.toLocaleString()} تومان (${Math.abs(daysToDue)} روز گذشته) تعیین تکلیف نشده است`, 'system');
            hasNotification = true;
          }
        }
      });
      if (hasNotification) {
         simulateSMS(MANAGER_PHONE, 'شما دارای چک‌های در آستانه سررسید یا گذشته هستید. لطفا پنل خود را بررسی کنید.');
      }
    }
  }, [cheques]);

  // Handle a new order from POS
  const handleCheckout = (
    items: OrderItem[], 
    method: 'cash' | 'card' | 'wallet' | 'unpaid', 
    tableNumber?: number, 
    discountPercent: number = 0,
    status: 'completed' | 'draft' | 'pending' = 'completed',
    customerId?: string,
    pointsUsed: number = 0
  ) => {
    const subtotal = items.reduce((acc, item) => acc + (item.price * item.quantity), 0);
    const discountAmount = (subtotal * discountPercent) / 100;
    const subtotalAfterDiscount = subtotal - discountAmount;
    
    // Points discount (1 point = 10,000 toman discount)
    const pointsDiscountAmount = pointsUsed * 10000;
    
    // Ensure we don't drop below 0 before tax
    const finalSubtotalAfterPoints = Math.max(0, subtotalAfterDiscount - pointsDiscountAmount);
    
    const tax = finalSubtotalAfterPoints * 0.09;
    const finalTotal = finalSubtotalAfterPoints + tax;

    const newOrder: Order = {
      id: `ORD-${Math.floor(Math.random() * 10000)}`,
      date: new Date().toISOString(),
      items,
      total: finalTotal,
      status,
      paymentMethod: method,
      tableNumber,
      discount: discountPercent,
      customerId,
      pointsUsed
    };

    setOrders(prev => [newOrder, ...prev]);

    // Update table status if a table was selected and order is NOT a draft
    if (tableNumber && status !== 'draft') {
      setTables(prev => prev.map(t => 
        t.number === tableNumber ? { ...t, status: 'occupied', currentOrderId: newOrder.id } : t
      ));
    }

    // Update stock and customer points if order is actually completed
    if (status === 'completed') {
      simulateSMS(MANAGER_PHONE, `سفارش جدید ${newOrder.id} ثبت و تکمیل شد. مبلغ کل: ${finalTotal}`);
      setProducts(prev => prev.map(product => {
        const orderItem = items.find(i => i.id === product.id);
        if (orderItem) {
          return { ...product, stock: Math.max(0, product.stock - orderItem.quantity) };
        }
        return product;
      }));
      
      // Update customer points and wallet balance
      if (customerId) {
        const earnedPoints = Math.floor(finalTotal / 100000); // 1 point per 100,000 toman
        setCustomers(prev => prev.map(c => 
          c.id === customerId ? { 
            ...c, 
            points: c.points - pointsUsed + earnedPoints,
            walletBalance: method === 'wallet' ? (c.walletBalance || 0) - finalTotal : (c.walletBalance || 0)
          } : c
        ));
      }
    }
    
    return newOrder;
  };

  const handleUpdateOrder = (updatedOrder: Order) => {
    setOrders(prev => prev.map(o => o.id === updatedOrder.id ? updatedOrder : o));
  };

  const handleUpdateOrderStatus = (orderId: string, newStatus: Order['status']) => {
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status: newStatus } : o));
    
    // Log event
    if (newStatus === 'completed') {
       logEvent(`سفارش ${orderId} تکمیل شد`, 'order');
       simulateSMS(MANAGER_PHONE, `وضعیت سفارش ${orderId} به تکمیل شده تغییر یافت.`);
    }

    // Provide a simple logic if confirming an order
    const order = orders.find(o => o.id === orderId);
    if (order && newStatus === 'completed' && order.status !== 'completed') {
      setProducts(prev => prev.map(product => {
        const orderItem = order.items.find(i => i.id === product.id);
        if (orderItem) {
          return { ...product, stock: Math.max(0, product.stock - orderItem.quantity) };
        }
        return product;
      }));
      
      // Notify customer if customerId exists
      if (order.customerId) {
        const customer = customers.find(c => c.id === order.customerId);
        if (customer && customer.phone) {
          simulateSMS(customer.phone, `کاربر گرامی ${customer.name}، سفارش شما به شماره ${order.id.slice(-4)} تکمیل و آماده شد. نوش جان! - رستوران پلاس`);
        }
      } else if (order.tableNumber) {
        // Find if this table has a reservation to possibly get the customer phone
        const table = tables.find(t => t.number === order.tableNumber && t.status === 'occupied');
        if (table && table.currentOrderId === order.id && table.reservation) {
          simulateSMS(table.reservation.phone, `کاربر گرامی ${table.reservation.customerName}، سفارش شما به شماره ${order.id.slice(-4)} برای میز ${order.tableNumber} تکمیل و آماده شد. نوش جان! - رستوران پلاس`);
        }
      }
    }
  };

  // Called from CustomerMenuView
  const handleCustomerPlaceOrder = (items: OrderItem[], tableNum: number) => {
    const order = handleCheckout(items, 'unpaid', tableNum, 0, 'pending');
    logEvent(`سفارش جدید ${order.id} از منوی دیجیتال برای میز ${tableNum} ثبت شد`, 'order');
    alert(`سفارش شما با شماره ${order.id} ثبت شد و در حال آماده‌سازی است.`);
    return order.id;
  };

  const handleAddFeedback = (feedback: Omit<import('./types').Feedback, 'id'>) => {
    const newFeedback: import('./types').Feedback = {
      ...feedback,
      id: `fb-${Date.now()}`
    };
    setFeedbacks(prev => [newFeedback, ...prev]);
    logEvent(`نظرسنجی جدید ثبت شد`, 'system');
  };

  const handleAddTable = (capacity: number, tableNumber: number, roomId?: string) => {
    if (tables.some(t => t.number === tableNumber)) {
      alert('میزی با این شماره قبلا ثبت شده است!');
      return;
    }
    const newTable: Table = {
      id: `tbl-${Date.now()}`,
      number: tableNumber,
      capacity,
      status: 'available',
      roomId
    };
    setTables(prev => [...prev, newTable]);
    logEvent(`میز شماره ${tableNumber} به سیستم اضافه شد`, 'table');
  };

  const handleMergeTables = (masterId: string, childId: string) => {
    setTables(prev => {
      const master = prev.find(t => t.id === masterId);
      const child = prev.find(t => t.id === childId);
      if (!master || !child) return prev;
      
      return prev.map(t => {
        if (t.id === masterId) {
          const existingMerged = t.mergedWith || [];
          return { ...t, mergedWith: Array.from(new Set([...existingMerged, childId])) };
        }
        if (t.id === childId) {
          const existingMerged = t.mergedWith || [];
          return { ...t, mergedWith: Array.from(new Set([...existingMerged, masterId])) };
        }
        return t;
      });
    });
    logEvent(`ادغام میزها انجام شد.`, 'table');
  };

  const handleUnmergeTables = (tableId: string) => {
    setTables(prev => {
      const table = prev.find(t => t.id === tableId);
      if (!table || !table.mergedWith) return prev;
      
      const mergedIds = table.mergedWith;
      
      return prev.map(t => {
        if (t.id === tableId) {
          return { ...t, mergedWith: undefined };
        }
        if (mergedIds.includes(t.id)) {
          const newMerged = (t.mergedWith || []).filter(id => id !== tableId);
          return { ...t, mergedWith: newMerged.length > 0 ? newMerged : undefined };
        }
        return t;
      });
    });
    logEvent(`لغو ادغام میز انجام شد.`, 'table');
  };

  const handleUpdateProduct = (updatedProduct: Product) => {
    setProducts(prev => prev.map(p => p.id === updatedProduct.id ? updatedProduct : p));
    logEvent(`اطلاعات محصول: ${updatedProduct.name} بروزرسانی شد`, 'system');
  };

  const handleAddProduct = (productData: Omit<Product, 'id'>) => {
    const newProduct: Product = {
      ...productData,
      id: `prod-${Date.now()}`
    };
    setProducts(prev => [newProduct, ...prev]);
    logEvent(`محصول جدید: ${productData.name} اضافه شد`, 'system');
  };

  const handleAddStaff = (staffInfo: Omit<Staff, 'id'>) => {
    const newPerson: Staff = {
      ...staffInfo,
      id: `stf-${Date.now()}`
    };
    setStaff(prev => [...prev, newPerson]);
    logEvent(`پرسنل جدید: ${staffInfo.name} به سیستم افزوده شد`, 'staff');
  };

  const handleToggleStaffStatus = (id: string) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, isActive: !s.isActive } : s));
  };

  const handleUpdateStaffShifts = (id: string, shifts: Staff['shifts']) => {
    setStaff(prev => prev.map(s => s.id === id ? { ...s, shifts } : s));
    const person = staff.find(s => s.id === id);
    if (person) {
      logEvent(`زمان‌بندی شیفت برای ${person.name} تغییر یافت`, 'staff');
    }
  };

  const handleReserveTable = (tableId: string, customerName: string, phone: string, date: string, time: string) => {
    setTables(prev => prev.map(t => 
      t.id === tableId 
        ? { ...t, status: 'reserved', reservation: { customerName, phone, date, time } } 
        : t
    ));
    const tableNumber = tables.find(t => t.id === tableId)?.number;
    logEvent(`ثبت رزرو برای میز ${tableNumber} به نام ${customerName}`, 'table');
    
    // Add customer to loyalty if not exists
    setCustomers(prev => {
      if (!prev.find(c => c.phone === phone)) {
        return [...prev, { id: `cus-${Date.now()}`, name: customerName, phone, points: 0 }];
      }
      return prev;
    });

    // Send SMS
    simulateSMS(phone, `کاربر گرامی ${customerName}، رزرو شما برای میز ${tableNumber} در تاریخ ${date} ساعت ${time} با موفقیت ثبت شد. رستوران پلاس`);
    simulateSMS(MANAGER_PHONE, `رزرو جدید: میز ${tableNumber} به نام ${customerName} برای تاریخ ${date} ساعت ${time} (تماس: ${phone})`);
  };

  const handleAddCustomer = (c: Omit<import('./types').Customer, 'id' | 'points'>) => {
    setCustomers(prev => [...prev, { ...c, id: `cus-${Date.now()}`, points: 0 }]);
  };

  const handleEditCustomer = (id: string, c: Partial<import('./types').Customer>) => {
    setCustomers(prev => prev.map(cust => cust.id === id ? { ...cust, ...c } : cust));
  };

  const handleDeleteCustomer = (id: string) => {
    setCustomers(prev => prev.filter(c => c.id !== id));
  };

  const handleUpdateTableStatus = (tableId: string, status: 'available' | 'occupied' | 'reserved', clearReservation?: boolean) => {
    setTables(prev => prev.map(t => {
      if (t.id === tableId) {
        const { reservation, ...rest } = t;
        return { ...rest, status, ...(clearReservation ? {} : { reservation }) };
      }
      return t;
    }));
  };

  const handleBackup = () => {
    const data = {
      products,
      orders,
      tables,
      staff,
      events,
      customers,
      feedbacks,
    };
    const jsonString = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `restaurant_backup_${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    URL.revokeObjectURL(url);
    logEvent('تهیه نسخه پشتیبان از اطلاعات سیستم', 'system');
  };

  const handleRestore = (jsonData: string) => {
    try {
      const data = JSON.parse(jsonData);
      if (data.products) setProducts(data.products);
      if (data.orders) setOrders(data.orders);
      if (data.tables) setTables(data.tables);
      if (data.staff) setStaff(data.staff);
      if (data.events) setEvents(data.events);
      if (data.customers) setCustomers(data.customers);
      if (data.feedbacks) setFeedbacks(data.feedbacks);
      logEvent('بازیابی اطلاعات سیستم از فایل پشتیبان', 'system');
      alert('بازیابی اطلاعات با موفقیت انجام شد.');
    } catch (error) {
      alert('خطا در بازیابی اطلاعات. فایل نامعتبر است.');
    }
  };

  const renderView = () => {
    switch (currentView) {
      case 'dashboard':
        return <DashboardView orders={orders} tables={tables} products={products} events={events} feedbacks={feedbacks} />;
      case 'pos':
        return <POSView 
                 products={products} 
                 tables={tables} 
                 orders={orders}
                 customers={customers}
                 restaurantInfo={restaurantInfo}
                 onCheckout={handleCheckout} 
                 onUpdateOrderStatus={handleUpdateOrderStatus}
                 onUpdateOrder={handleUpdateOrder}
               />;
      case 'tables':
        return <TablesView 
                 tables={tables} 
                 rooms={rooms}
                 onAddTable={handleAddTable} 
                 onMergeTables={handleMergeTables}
                 onUnmergeTables={handleUnmergeTables}
                 onUpdateTablePosition={(id: string, x: number, y: number) => setTables(prev => prev.map(t => t.id === id ? { ...t, position: { x, y } } : t))}
                 onAddRoom={(name: string) => setRooms(prev => [...prev, { id: `room-${Date.now()}`, name }])}
                 onUpdateTableRoom={(tableId: string, roomId: string) => setTables(prev => prev.map(t => t.id === tableId ? { ...t, roomId } : t))}
               />;
      case 'reservations':
        return <ReservationsView tables={tables} smsMessages={smsMessages} onUpdateTableStatus={handleUpdateTableStatus} onLogEvent={logEvent} />;
      case 'inventory':
        return <InventoryView products={products} orders={orders} expenses={expenses} onAddProduct={handleAddProduct} onUpdateProduct={handleUpdateProduct} onAddExpense={(expense) => setExpenses(prev => [expense, ...prev])} />;
      case 'settings':
        return <SettingsView restaurantInfo={restaurantInfo} onUpdateRestaurantInfo={setRestaurantInfo} onBackup={handleBackup} onRestore={handleRestore} products={products} onUpdateProduct={handleUpdateProduct} />;
      case 'menu-mgmt':
        return <MenuMgmtView products={products} onUpdateProduct={handleUpdateProduct} />;
      case 'feedback':
        return <FeedbackView feedbacks={feedbacks} />;
      case 'customers':
        return <CustomersView 
                 customers={customers} 
                 orders={orders}
                 onAddCustomer={handleAddCustomer} 
                 onEditCustomer={handleEditCustomer} 
                 onDeleteCustomer={handleDeleteCustomer} 
               />;
      case 'accounting':
        return <AccountingView 
                 orders={orders} 
                 restaurantInfo={restaurantInfo} 
                 expenses={expenses}
                 onAddExpense={(expense) => setExpenses(prev => [expense, ...prev])}
                 cheques={cheques}
                 onAddCheque={(cheque) => setCheques(prev => [cheque, ...prev])}
                 onUpdateChequeStatus={(id, status) => setCheques(prev => prev.map(c => c.id === id ? { ...c, status } : c))}
               />;
      case 'tax-audit':
        return <TaxAuditView orders={orders} expenses={expenses} restaurantInfo={restaurantInfo} />;
      case 'qr':
        return <QRView tables={tables} />;
      case 'staff':
        return <StaffView 
                 staff={staff} 
                 orders={orders}
                 restaurantInfo={restaurantInfo}
                 onAddStaff={handleAddStaff} 
                 onToggleStatus={handleToggleStaffStatus} 
                 onUpdateStaffShifts={handleUpdateStaffShifts}
               />;
      default:
        return null;
    }
  };

  const currentMeta = pageMeta[currentView];
  const todayLabel = new Intl.DateTimeFormat('fa-IR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long'
  }).format(new Date());
  const activeOrdersCount = orders.filter(order => order.status === 'pending' || order.status === 'draft').length;
  const occupiedTablesCount = tables.filter(table => table.status === 'occupied').length;

  return (
    <>
      {isReserveRoute ? (
        <div className="public-page min-h-dvh">
          <Suspense fallback={<AppLoading />}>
            <CustomerReservationView tables={tables} onReserve={handleReserveTable} />
          </Suspense>
        </div>
      ) : isMenuRoute ? (
        <div className="public-page min-h-dvh">
          <Suspense fallback={<AppLoading />}>
            <CustomerMenuView 
              products={products} 
              tableNumber={tableParam} 
              restaurantInfo={restaurantInfo}
              orders={orders}
              onPlaceOrder={handleCustomerPlaceOrder}
              onAddFeedback={handleAddFeedback}
            />
          </Suspense>
        </div>
      ) : (
        <div className="admin-shell flex h-dvh overflow-hidden font-sans print:h-auto print:bg-white print:overflow-visible">
          <Sidebar currentView={currentView} onChangeView={setCurrentView} />
          <main className="app-main flex-1 min-w-0 h-full overflow-hidden print:h-auto print:overflow-visible print:p-0">
            <div className="app-main-inner h-full flex flex-col gap-5 print:p-0">
              <header className="app-topbar no-print">
                <div className="min-w-0 flex items-center gap-4">
                  <div className="brand-mark shrink-0">
                    {restaurantInfo.logo ? (
                      <img src={restaurantInfo.logo} alt={restaurantInfo.name} className="h-full w-full object-cover" />
                    ) : (
                      <Sparkles size={22} />
                    )}
                  </div>
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <h1 className="truncate text-xl font-black tracking-tight text-slate-950 sm:text-2xl">
                        {currentMeta.title}
                      </h1>
                      <span className="live-pill">
                        <CircleDot size={12} />
                        آنلاین
                      </span>
                    </div>
                    <p className="mt-1 line-clamp-1 text-sm font-medium text-slate-500">
                      {currentMeta.description}
                    </p>
                  </div>
                </div>

                <div className="topbar-metrics">
                  <div className="topbar-chip hidden md:flex">
                    <CalendarDays size={16} />
                    <span>{todayLabel}</span>
                  </div>
                  <div className="topbar-chip">
                    <span className="metric-dot bg-amber-400"></span>
                    <span>{formatNumber(activeOrdersCount)} سفارش فعال</span>
                  </div>
                  <div className="topbar-chip hidden sm:flex">
                    <span className="metric-dot bg-emerald-400"></span>
                    <span>{formatNumber(occupiedTablesCount)} میز مشغول</span>
                  </div>
                </div>
              </header>
              <section className="app-page-frame flex-1 min-h-0 overflow-hidden">
                <Suspense fallback={<AppLoading />}>
                  {renderView()}
                </Suspense>
              </section>
            </div>
          </main>
        </div>
      )}
    </>
  );
}
