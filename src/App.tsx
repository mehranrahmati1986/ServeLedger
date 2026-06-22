import React, { useState, useEffect } from 'react';
import { initialProducts, initialOrders, initialTables, initialStaff, initialEvents, initialRooms } from './data';
import { ViewType, Product, OrderItem, Order, Table, Staff, Room } from './types';
import { Sidebar } from './components/Sidebar';
import { POSView } from './views/POSView';
import { InventoryView } from './views/InventoryView';
import { AccountingView } from './views/AccountingView';
import { QRView } from './views/QRView';
import { TablesView } from './views/TablesView';
import { CustomerMenuView } from './views/CustomerMenuView';
import { StaffView } from './views/StaffView';
import { CustomerReservationView } from './views/CustomerReservationView';
import { simulateSMS, MANAGER_PHONE } from './lib/sms';
import { ReservationsView } from './views/ReservationsView';
import { SettingsView } from './views/SettingsView';
import { MenuMgmtView } from './views/MenuMgmtView';

import { CustomersView } from './views/CustomersView';
import { FeedbackView } from './views/FeedbackView';
import { DashboardView } from './views/DashboardView';

const getInitialState = <T,>(key: string, defaultVal: T): T => {
  try {
    const stored = localStorage.getItem(key);
    return stored ? JSON.parse(stored) : defaultVal;
  } catch {
    return defaultVal;
  }
};

export default function App() {
  const [currentView, setCurrentView] = useState<ViewType>('dashboard');
  const [products, setProducts] = useState<Product[]>(() => getInitialState('app_products', initialProducts));
  const [orders, setOrders] = useState<Order[]>(() => getInitialState('app_orders', initialOrders));
  const [tables, setTables] = useState<Table[]>(() => getInitialState('app_tables', initialTables));
  const [rooms, setRooms] = useState<Room[]>(() => getInitialState('app_rooms', initialRooms));
  const [staff, setStaff] = useState<Staff[]>(() => getInitialState('app_staff', initialStaff));
  const [events, setEvents] = useState<import('./types').SystemEvent[]>(() => getInitialState('app_events', initialEvents));
  const [customers, setCustomers] = useState<import('./types').Customer[]>(() => getInitialState('app_customers', []));
  const [feedbacks, setFeedbacks] = useState<import('./types').Feedback[]>(() => getInitialState('app_feedbacks', []));
  const [smsMessages, setSmsMessages] = useState<import('./types').SMSMessage[]>(() => getInitialState('app_sms', []));
  const [expenses, setExpenses] = useState<import('./types').Expense[]>(() => getInitialState('app_expenses', []));
  const [cheques, setCheques] = useState<import('./types').Cheque[]>(() => getInitialState('app_cheques', []));
  const [restaurantInfo, setRestaurantInfo] = useState<import('./types').RestaurantInfo>(() => getInitialState('app_restaurant_info', {
    name: 'رستوران پلاس',
    logo: 'https://images.unsplash.com/photo-1514933651103-005eec06c04b?auto=format&fit=crop&q=80&w=150',
    address: 'تهران، خیابان ولیعصر، نرسیده به پارکش وی',
    phone: '۰۲۱-۸۸۸۸۸۸۸۸'
  }));
  
  const [isMenuRoute, setIsMenuRoute] = useState(false);
  const [isReserveRoute, setIsReserveRoute] = useState(false);
  const [tableParam, setTableParam] = useState<string | null>(null);

  useEffect(() => {
    localStorage.setItem('app_products', JSON.stringify(products));
  }, [products]);
  useEffect(() => {
    localStorage.setItem('app_orders', JSON.stringify(orders));
  }, [orders]);
  useEffect(() => {
    localStorage.setItem('app_tables', JSON.stringify(tables));
  }, [tables]);
  useEffect(() => {
    localStorage.setItem('app_rooms', JSON.stringify(rooms));
  }, [rooms]);
  useEffect(() => {
    localStorage.setItem('app_staff', JSON.stringify(staff));
  }, [staff]);
  useEffect(() => {
    localStorage.setItem('app_events', JSON.stringify(events));
  }, [events]);
  useEffect(() => {
    localStorage.setItem('app_customers', JSON.stringify(customers));
  }, [customers]);
  useEffect(() => {
    localStorage.setItem('app_feedbacks', JSON.stringify(feedbacks));
  }, [feedbacks]);
  useEffect(() => {
    localStorage.setItem('app_sms', JSON.stringify(smsMessages));
  }, [smsMessages]);
  useEffect(() => {
    localStorage.setItem('app_expenses', JSON.stringify(expenses));
  }, [expenses]);
  useEffect(() => {
    localStorage.setItem('app_cheques', JSON.stringify(cheques));
  }, [cheques]);
  useEffect(() => {
    localStorage.setItem('app_restaurant_info', JSON.stringify(restaurantInfo));
  }, [restaurantInfo]);

  const logEvent = (message: string, type: import('./types').SystemEvent['type']) => {
    const newEvent: import('./types').SystemEvent = {
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
      if (e.key === 'app_products' && e.newValue) setProducts(JSON.parse(e.newValue));
      if (e.key === 'app_orders' && e.newValue) setOrders(JSON.parse(e.newValue));
      if (e.key === 'app_tables' && e.newValue) setTables(JSON.parse(e.newValue));
      if (e.key === 'app_rooms' && e.newValue) setRooms(JSON.parse(e.newValue));
      if (e.key === 'app_staff' && e.newValue) setStaff(JSON.parse(e.newValue));
      if (e.key === 'app_events' && e.newValue) setEvents(JSON.parse(e.newValue));
      if (e.key === 'app_customers' && e.newValue) setCustomers(JSON.parse(e.newValue));
      if (e.key === 'app_feedbacks' && e.newValue) setFeedbacks(JSON.parse(e.newValue));
      if (e.key === 'app_sms' && e.newValue) setSmsMessages(JSON.parse(e.newValue));
      if (e.key === 'app_expenses' && e.newValue) setExpenses(JSON.parse(e.newValue));
      if (e.key === 'app_cheques' && e.newValue) setCheques(JSON.parse(e.newValue));
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

  return (
    <>
      {isReserveRoute ? (
        <CustomerReservationView tables={tables} onReserve={handleReserveTable} />
      ) : isMenuRoute ? (
        <CustomerMenuView 
          products={products} 
          tableNumber={tableParam} 
          restaurantInfo={restaurantInfo}
          orders={orders}
          onPlaceOrder={handleCustomerPlaceOrder}
          onAddFeedback={handleAddFeedback}
        />
      ) : (
        <div className="flex h-screen bg-slate-100 overflow-hidden font-sans print:h-auto print:bg-white print:overflow-visible">
          <Sidebar currentView={currentView} onChangeView={setCurrentView} />
          <main className="flex-1 p-6 h-full overflow-hidden print:h-auto print:overflow-visible print:p-0">
            {renderView()}
          </main>
        </div>
      )}
    </>
  );
}
