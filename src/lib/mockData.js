import { OrderStatus } from './utils';

export const MOCK_USERS = [
  {
    id: 'u1',
    name: 'Alex Admin',
    email: 'admin@logiflow.com',
    role: 'ADMIN',
    active: true,
    password: '123456'
  },
  {
    id: 'u2',
    name: 'Sarah Client',
    email: 'sarah@boutique.com',
    role: 'CLIENT',
    active: true,
    password: '123456',
    companyDetails: {
      companyName: "Sarah's Boutique",
      billingEmail: 'billing@sarah.com',
      phone: '555-0199',
      address: {
        street: '123 Fashion Ave',
        city: 'NYC',
        state: 'NY',
        zip: '10001'
      },
      feeType: 'FIXED',
      feeValue: 15
    }
  },
  {
    id: 'u3',
    name: 'John Tech',
    email: 'john@techcorp.com',
    role: 'CLIENT',
    active: true,
    password: '123456',
    companyDetails: {
      companyName: 'TechCorp Solutions',
      billingEmail: 'accounts@techcorp.com',
      phone: '555-0200',
      address: {
        street: '101 Tech Blvd',
        city: 'San Jose',
        state: 'CA',
        zip: '95101'
      },
      feeType: 'PERCENTAGE',
      feeValue: 1.5
    }
  }
];


export const MOCK_DRIVERS = [
  { id: 'd1', name: 'Mike Mover', email: 'mike@logiflow.com', role: 'DRIVER', active: true, phone: '+1234567890', vehicleNumber: 'V-102', cashInHand: 450, deliveryHistoryIds: [] },
  { id: 'd2', name: 'Dave Delivery', email: 'dave@logiflow.com', role: 'DRIVER', active: true, phone: '+1234567891', vehicleNumber: 'V-105', cashInHand: 120, deliveryHistoryIds: [] },
];

export const MOCK_ORDERS = [
  {
    id: 'ord1',
    trackingId: 'LF-98231',
    clientId: 'u2',
    clientName: 'Sarah\'s Boutique',
    status: OrderStatus.IN_TRANSIT,
    driverId: 'd1',
    driverName: 'Mike Mover',
    orderValue: 1200,
    codAmount: 1200,
    deliveryFee: 15,
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    updatedAt: new Date().toISOString(),
    customerName: 'Alice Johnson',
    customerPhone: '+1999888777',
    pickupAddress: { street: '123 Fashion Ave', city: 'New York', state: 'NY', zip: '10001' },
    deliveryAddress: { street: '456 Residential St', city: 'Brooklyn', state: 'NY', zip: '11201' },
    timeline: [
      { status: OrderStatus.PENDING, timestamp: new Date(Date.now() - 90000000).toISOString() },
      { status: OrderStatus.ASSIGNED, timestamp: new Date(Date.now() - 88000000).toISOString() },
      { status: OrderStatus.PICKED_UP, timestamp: new Date(Date.now() - 86400000).toISOString() },
      { status: OrderStatus.IN_TRANSIT, timestamp: new Date(Date.now() - 43200000).toISOString() },
    ]
  },
  {
    id: 'ord2',
    trackingId: 'LF-98232',
    clientId: 'u2',
    clientName: 'Sarah\'s Boutique',
    status: OrderStatus.PENDING,
    orderValue: 800,
    codAmount: 0,
    deliveryFee: 15,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    customerName: 'Bob Smith',
    customerPhone: '+1777666555',
    pickupAddress: { street: '123 Fashion Ave', city: 'New York', state: 'NY', zip: '10001' },
    deliveryAddress: { street: '789 Business Rd', city: 'Queens', state: 'NY', zip: '11101' },
    timeline: [{ status: OrderStatus.PENDING, timestamp: new Date().toISOString() }]
  },
  {
    id: 'ord3',
    trackingId: 'LF-98233',
    clientId: 'u3',
    clientName: 'TechCorp Solutions',
    status: OrderStatus.DELIVERED,
    driverId: 'd2',
    driverName: 'Dave Delivery',
    orderValue: 5000,
    codAmount: 0,
    deliveryFee: 50,
    createdAt: new Date(Date.now() - 172800000).toISOString(),
    updatedAt: new Date(Date.now() - 86400000).toISOString(),
    customerName: 'Charlie Data',
    customerPhone: '+1555444333',
    pickupAddress: { street: '101 Tech Blvd', city: 'San Jose', state: 'CA', zip: '95101' },
    deliveryAddress: { street: '202 Server Ln', city: 'Palo Alto', state: 'CA', zip: '94301' },
    timeline: [
      { status: OrderStatus.PENDING, timestamp: new Date(Date.now() - 172800000).toISOString() },
      { status: OrderStatus.DELIVERED, timestamp: new Date(Date.now() - 86400000).toISOString() },
    ]
  }
];

export const MOCK_INVOICES = [
  {
    id: 'inv1',
    clientId: 'u2',
    clientName: 'Sarah\'s Boutique',
    amount: 450,
    outstandingBalance: 150,
    status: 'UNPAID',
    dueDate: new Date(Date.now() + 604800000).toISOString(),
    orders: ['ord1', 'ord2'],
    createdAt: new Date().toISOString()
  }
];
