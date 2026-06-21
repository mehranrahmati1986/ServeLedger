import { Product, Order } from './types';

export const initialProducts: Product[] = [
  { id: '1', name: 'چلو کباب کوبیده', price: 250000, category: 'غذای اصلی', stock: 50, image: 'https://images.unsplash.com/photo-1628198759560-6dc74523e10f?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: '2', name: 'جوجه کباب ویژه', price: 220000, category: 'غذای اصلی', stock: 40, image: 'https://images.unsplash.com/photo-1598514982205-f36b96d1e8d4?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: '3', name: 'قورمه سبزی', price: 180000, category: 'غذای اصلی', stock: 30, image: 'https://images.unsplash.com/photo-1588673892790-21a423985b88?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: '4', name: 'سالاد سزار', price: 120000, category: 'پیش غذا', stock: 20, image: 'https://images.unsplash.com/photo-1512621776951-a57141f2eefd?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: '5', name: 'سیب زمینی سرخ کرده', price: 70000, category: 'پیش غذا', stock: 100, image: 'https://images.unsplash.com/photo-1576107232684-1279f3908594?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: '6', name: 'دوغ محلی لیوانی', price: 30000, category: 'نوشیدنی', stock: 150, image: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: '7', name: 'نوشابه قوطی', price: 25000, category: 'نوشیدنی', stock: 300, image: 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?auto=format&fit=crop&q=80&w=300&h=300' },
  { id: '8', name: 'اسپرسو سینگل', price: 60000, category: 'کافه', stock: 200, image: 'https://images.unsplash.com/photo-1510113165028-5694c9f7a930?auto=format&fit=crop&q=80&w=300&h=300' },
];

export const categories = ['همه', 'غذای اصلی', 'پیش غذا', 'نوشیدنی', 'کافه'];

// Generate some mock orders for initial accounting view
const generateMockOrders = (): Order[] => {
  const orders: Order[] = [];
  const today = new Date();
  
  for (let i = 0; i < 30; i++) {
    const isToday = i < 5;
    const date = new Date(today);
    if (!isToday) {
      date.setDate(date.getDate() - Math.floor(Math.random() * 10)); // Random date within last 10 days
    }
    
    // Pick 1-3 random items
    const items = [];
    const numItems = Math.floor(Math.random() * 3) + 1;
    let total = 0;
    
    for (let j = 0; j < numItems; j++) {
      const product = initialProducts[Math.floor(Math.random() * initialProducts.length)];
      const quantity = Math.floor(Math.random() * 3) + 1;
      items.push({ ...product, quantity });
      total += product.price * quantity;
    }

    orders.push({
      id: `ORD-${1000 + i}`,
      date: date.toISOString(),
      items,
      total,
      status: 'completed',
      paymentMethod: Math.random() > 0.3 ? 'card' : 'cash',
    });
  }
  
  return orders;
};

export const initialOrders = generateMockOrders();

export const initialTables: import('./types').Table[] = Array.from({ length: 12 }).map((_, i) => ({
  id: `TBL-${i + 1}`,
  number: i + 1,
  capacity: i % 3 === 0 ? 6 : (i % 2 === 0 ? 4 : 2),
  status: Math.random() > 0.7 ? 'occupied' : 'available',
  roomId: 'room-1'
}));

export const initialRooms: import('./types').Room[] = [
  { id: 'room-1', name: 'سالن اصلی' }
];

export const initialStaff: import('./types').Staff[] = [
  { id: 'STF-1', name: 'علی احمدی', role: 'manager', phone: '09121111111', isActive: true },
  { id: 'STF-2', name: 'رضا محمدی', role: 'chef', phone: '09122222222', isActive: true },
  { id: 'STF-3', name: 'سارا امینی', role: 'waiter', phone: '09123333333', isActive: true }
];

export const initialEvents: import('./types').SystemEvent[] = [
  { id: 'evt-1', message: 'شیفت کاری صندوق باز شد', type: 'system', timestamp: new Date(Date.now() - 3600000).toISOString() },
  { id: 'evt-2', message: 'پرسنل جدید (علی احمدی) وارد سیستم شد', type: 'staff', timestamp: new Date(Date.now() - 1800000).toISOString() },
  { id: 'evt-3', message: 'سفارش ORD-1002 تغییر وضعیت به تکمیل داد', type: 'order', timestamp: new Date(Date.now() - 600000).toISOString() },
];
