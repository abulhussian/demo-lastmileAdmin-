
export type UserRole = 'ADMIN' | 'CLIENT' | 'DRIVER';

export enum OrderStatus {
  PENDING = 'PENDING',
  ASSIGNED = 'ASSIGNED',
  PICKED_UP = 'PICKED_UP',
  IN_TRANSIT = 'IN_TRANSIT',
  DELIVERED = 'DELIVERED',
  CANCELLED = 'CANCELLED'
}

export interface ClientDetails {
  companyName: string;
  billingEmail: string;
  phone: string;
  address: Address;
  feeType: 'FIXED' | 'PERCENTAGE';
  feeValue: number; // e.g. 15 for $15 or 5 for 5%
}

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatar?: string;
  active: boolean;
  companyDetails?: ClientDetails; // For clients
}

export interface Driver extends User {
  role: 'DRIVER';
  phone: string;
  vehicleNumber: string;
  cashInHand: number;
  deliveryHistoryIds: string[];
}

export interface Address {
  street: string;
  city: string;
  state: string;
  zip: string;
  lat?: number;
  lng?: number;
}

export interface Order {
  id: string;
  trackingId: string;
  clientId: string;
  clientName: string;
  driverId?: string;
  driverName?: string;
  status: OrderStatus;
  orderValue: number;
  codAmount: number; // COD amount to collect
  deliveryFee: number;
  createdAt: string;
  updatedAt: string;
  
  customerName: string;
  customerPhone: string;
  
  pickupAddress: Address;
  deliveryAddress: Address;
  
  timeline: {
    status: OrderStatus;
    timestamp: string;
    note?: string;
  }[];
}

export interface Settlement {
  id: string;
  driverId: string;
  amount: number;
  date: string;
  adminId: string;
  status: 'PENDING' | 'COMPLETED';
}

export interface Invoice {
  id: string;
  clientId: string;
  clientName: string;
  amount: number;
  outstandingBalance: number;
  dueDate: string;
  status: 'PAID' | 'UNPAID' | 'OVERDUE';
  orders: string[]; // Order IDs included in this invoice
  createdAt: string;
}
