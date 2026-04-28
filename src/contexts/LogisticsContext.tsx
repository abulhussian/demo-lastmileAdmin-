import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Driver, Order, Invoice, Settlement, OrderStatus } from '../types';
import { MOCK_USERS, MOCK_DRIVERS, MOCK_ORDERS, MOCK_INVOICES } from '../lib/mockData';

interface LogisticsContextType {
  currentUser: User | null;
  users: User[];
  drivers: Driver[];
  orders: Order[];
  invoices: Invoice[];
  settlements: Settlement[];
  login: (email: string) => void;
  logout: () => void;
  // Order Actions
  updateOrderStatus: (orderId: string, status: OrderStatus) => Promise<void>;
  assignDriver: (orderId: string, driverId: string) => Promise<void>;
  createOrder: (order: Partial<Order>) => Promise<void>;
  deleteOrder: (orderId: string) => Promise<void>;
  // Driver/Cash Actions
  settleDriverCash: (driverId: string, amount?: number) => Promise<void>;
  toggleUserStatus: (userId: string) => Promise<void>;
  // User Actions
  addUser: (user: Partial<User>) => Promise<void>;
  deleteUser: (userId: string) => Promise<void>;
  // Billing
  generateInvoices: () => Promise<void>;
  markInvoicePaid: (invoiceId: string) => Promise<void>;
}

const LogisticsContext = createContext<LogisticsContextType | undefined>(undefined);

export const LogisticsProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentUser, setCurrentUser] = useState<User | null>(() => {
    const saved = localStorage.getItem('logiflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState<User[]>(MOCK_USERS);
  const [drivers, setDrivers] = useState<Driver[]>(MOCK_DRIVERS);
  const [orders, setOrders] = useState<Order[]>(MOCK_ORDERS);
  const [invoices, setInvoices] = useState<Invoice[]>(MOCK_INVOICES);
  const [settlements, setSettlements] = useState<Settlement[]>([]);

  const login = (email: string) => {
    const user = [...users, ...drivers].find(u => u.email === email);
    if (user) {
      setCurrentUser(user);
      localStorage.setItem('logiflow_user', JSON.stringify(user));
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('logiflow_user');
  };

  // Generic Mock API sleep
  const apiDelay = () => new Promise(resolve => setTimeout(resolve, 800));

  const updateOrderStatus = async (orderId: string, status: OrderStatus) => {
    await apiDelay();
    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            status, 
            updatedAt: new Date().toISOString(),
            timeline: [...order.timeline, { status, timestamp: new Date().toISOString() }]
          } 
        : order
    ));

    const order = orders.find(o => o.id === orderId);
    if (status === OrderStatus.DELIVERED && order?.codAmount && order.driverId) {
      setDrivers(prev => prev.map(d => 
        d.id === order.driverId 
          ? { ...d, cashInHand: d.cashInHand + order.codAmount } 
          : d
      ));
    }
  };

  const assignDriver = async (orderId: string, driverId: string) => {
    await apiDelay();
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;

    setOrders(prev => prev.map(order => 
      order.id === orderId 
        ? { 
            ...order, 
            driverId, 
            driverName: driver.name,
            status: OrderStatus.ASSIGNED,
            timeline: [...order.timeline, { status: OrderStatus.ASSIGNED, timestamp: new Date().toISOString() }]
          } 
        : order
    ));
  };

  const createOrder = async (newOrder: Partial<Order>) => {
    await apiDelay();
    const client = users.find(u => u.id === (newOrder.clientId || currentUser?.id)) as User;
    const feeType = client?.companyDetails?.feeType || 'FIXED';
    const feeVal = client?.companyDetails?.feeValue || 15;
    
    const deliveryFee = feeType === 'FIXED' 
      ? feeVal 
      : (Number(newOrder.orderValue || 0) * (feeVal / 100));

    const order: Order = {
      id: `ord-${Math.random().toString(36).substr(2, 9)}`,
      trackingId: `LF-${Math.floor(10000 + Math.random() * 90000)}`,
      clientId: client?.id || 'u2',
      clientName: client?.companyDetails?.companyName || client?.name || 'Unknown Client',
      status: OrderStatus.PENDING,
      orderValue: 0,
      codAmount: 0,
      deliveryFee,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      customerName: '',
      customerPhone: '',
      pickupAddress: { street: '', city: '', state: '', zip: '' },
      deliveryAddress: { street: '', city: '', state: '', zip: '' },
      timeline: [{ status: OrderStatus.PENDING, timestamp: new Date().toISOString() }],
      ...newOrder as Order
    };
    setOrders(prev => [order, ...prev]);
  };

  const deleteOrder = async (orderId: string) => {
    await apiDelay();
    setOrders(prev => prev.filter(o => o.id !== orderId));
  };

  const settleDriverCash = async (driverId: string, amount?: number) => {
    await apiDelay();
    const driver = drivers.find(d => d.id === driverId);
    if (!driver) return;
    
    const settleAmt = amount || driver.cashInHand;
    if (settleAmt <= 0) return;

    const settlement: Settlement = {
      id: `set-${Date.now()}`,
      driverId,
      amount: settleAmt,
      date: new Date().toISOString(),
      adminId: currentUser?.id || 'admin',
      status: 'COMPLETED'
    };

    setSettlements(prev => [settlement, ...prev]);
    setDrivers(prev => prev.map(d => d.id === driverId ? { ...d, cashInHand: d.cashInHand - settleAmt } : d));
  };

  const toggleUserStatus = async (userId: string) => {
    await apiDelay();
    setUsers(prev => prev.map(u => u.id === userId ? { ...u, active: !u.active } : u));
    setDrivers(prev => prev.map(d => d.id === userId ? { ...d, active: !d.active } : d));
  };

  const addUser = async (userData: Partial<User>) => {
    await apiDelay();
    const newUser: User = {
      id: `u-${Math.random().toString(36).substr(2, 9)}`,
      name: 'New User',
      email: '',
      role: 'CLIENT',
      active: true,
      ...userData as User
    };
    if (newUser.role === 'DRIVER') {
      const newDriver: Driver = {
        ...newUser,
        role: 'DRIVER',
        phone: '',
        vehicleNumber: '',
        cashInHand: 0,
        deliveryHistoryIds: []
      };
      setDrivers(prev => [...prev, newDriver]);
    } else {
      setUsers(prev => [...prev, newUser]);
    }
  };

  const deleteUser = async (userId: string) => {
    await apiDelay();
    setUsers(prev => prev.filter(u => u.id !== userId));
    setDrivers(prev => prev.filter(d => d.id !== userId));
  };

  const generateInvoices = async () => {
    await apiDelay();
    // Simplified: Generate one invoice per client for un-invoiced delivered orders
    const clients = users.filter(u => u.role === 'CLIENT');
    const newInvoices: Invoice[] = [];

    clients.forEach(client => {
      const pendingOrders = orders.filter(o => 
        o.clientId === client.id && 
        o.status === OrderStatus.DELIVERED
      );

      if (pendingOrders.length > 0) {
        const amount = pendingOrders.reduce((sum, o) => sum + o.deliveryFee, 0);
        newInvoices.push({
          id: `INV-${Math.floor(1000 + Math.random() * 9000)}`,
          clientId: client.id,
          clientName: client.companyDetails?.companyName || client.name,
          amount,
          outstandingBalance: amount,
          dueDate: new Date(Date.now() + 15 * 86400000).toISOString(),
          status: 'UNPAID',
          orders: pendingOrders.map(o => o.id),
          createdAt: new Date().toISOString()
        });
      }
    });

    setInvoices(prev => [...newInvoices, ...prev]);
  };

  const markInvoicePaid = async (invoiceId: string) => {
    await apiDelay();
    setInvoices(prev => prev.map(inv => 
      inv.id === invoiceId 
        ? { ...inv, status: 'PAID', outstandingBalance: 0 } 
        : inv
    ));
  };

  return (
    <LogisticsContext.Provider value={{
      currentUser, users, drivers, orders, invoices, settlements,
      login, logout, updateOrderStatus, assignDriver, createOrder, deleteOrder,
      settleDriverCash, toggleUserStatus, addUser, deleteUser,
      generateInvoices, markInvoicePaid
    }}>
      {children}
    </LogisticsContext.Provider>
  );
};

export const useLogistics = () => {
  const context = useContext(LogisticsContext);
  if (context === undefined) {
    throw new Error('useLogistics must be used within a LogisticsProvider');
  }
  return context;
};
