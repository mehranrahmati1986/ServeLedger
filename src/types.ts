export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  stock: number;
  image: string;
  barcode?: string;
  isActive?: boolean;
  minThreshold?: number;
}

export interface OrderItem extends Product {
  quantity: number;
}

export interface Order {
  id: string;
  date: string;
  items: OrderItem[];
  total: number;
  status: 'completed' | 'pending' | 'cancelled' | 'draft';
  paymentMethod: 'card' | 'cash' | 'wallet' | 'unpaid';
  tableNumber?: number;
  discount?: number;
  customerId?: string;
  pointsUsed?: number;
  signatureUrl?: string;
  staffId?: string;
}

export interface Table {
  id: string;
  number: number;
  capacity: number;
  status: 'available' | 'occupied' | 'reserved';
  currentOrderId?: string;
  mergedWith?: string[];
  reservation?: {
    customerName: string;
    phone: string;
    date: string;
    time: string;
  };
  position?: { x: number; y: number };
  roomId?: string;
}

export interface Room {
  id: string;
  name: string;
}

export interface Staff {
  id: string;
  name: string;
  role: 'waiter' | 'chef' | 'manager';
  phone: string;
  isActive: boolean;
  shifts?: {
    [day: string]: { startTime: string; endTime: string; isActive: boolean }
  };
}

export interface Customer {
  id: string;
  name: string;
  phone: string;
  points: number;
  walletBalance?: number;
}

export interface SystemEvent {
  id: string;
  message: string;
  type: 'order' | 'table' | 'staff' | 'system';
  timestamp: string;
}

export interface RestaurantInfo {
  name: string;
  logo: string;
  address: string;
  phone: string;
}

export interface Feedback {
  id: string;
  orderId?: string;
  rating: number;
  comment: string;
  date: string;
  customerName?: string;
}

export interface SMSMessage {
  id: string;
  phoneNumber: string;
  message: string;
  date: string;
}

export interface Expense {
  id: string;
  title: string;
  amount: number;
  category: 'salary' | 'rent' | 'supplies' | 'other' | 'waste';
  date: string;
}

export interface Cheque {
  id: string;
  type: 'received' | 'paid';
  amount: number;
  dueDate: string;
  status: 'pending' | 'cleared' | 'bounced';
  bankName: string;
  chequeNumber: string;
  description: string;
}

export type ViewType = 'dashboard' | 'pos' | 'tables' | 'inventory' | 'accounting' | 'tax-audit' | 'qr' | 'staff' | 'customers' | 'reservations' | 'settings' | 'feedback' | 'menu-mgmt';
