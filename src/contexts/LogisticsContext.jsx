import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api } from '../lib/api';

const LogisticsContext = createContext(undefined);

export const LogisticsProvider = ({ children }) => {
  const [currentUser, setCurrentUser] = useState(() => {
    const saved = localStorage.getItem('logiflow_user');
    return saved ? JSON.parse(saved) : null;
  });
  const [users, setUsers] = useState([]);
  const [drivers, setDrivers] = useState([]);
  const [orders, setOrders] = useState([]);
  const [invoices, setInvoices] = useState([]);
  const [settlements, setSettlements] = useState([]);
  const [toast, setToast] = useState({ show: false, message: '', type: 'success' });

  const mapOrder = (o) => {
    const normalizeAddress = (addr) => {
      if (!addr) return { street: '', city: '', state: '', zip: '' };
      if (typeof addr === 'string') return { street: addr, city: '', state: '', zip: '' };
      return {
        street: addr.address || addr.street || '',
        city: addr.city || '',
        state: addr.state || '',
        zip: addr.zip || '',
        lat: addr.lat,
        lng: addr.long || addr.lng
      };
    };

    return {
      id: o.id,
      trackingId: o.tracking_id,
      clientId: o.client_id,
      clientName: o.client_name,
      driverId: o.driver_id,
      driverName: o.driver_name,
      status: o.status ? o.status.toUpperCase().replace(/-/g, '_') : 'PENDING',
      orderValue: Number(o.order_value) || 0,
      codAmount: Number(o.cod_amount) || 0,
      deliveryFee: Number(o.delivery_fee) || 0,
      currency: o.currency || null,
      createdAt: o.created_at,
      updatedAt: o.updated_at,
      customerName: o.customer_name,
      customerPhone: o.customer_phone,
      pickupAddress: normalizeAddress(o.pickup_address),
      deliveryAddress: normalizeAddress(o.delivery_address),
      timeline: o.timeline || []
    };
  };

  const mapUser = (u) => {
    const roleNormalization = {
      'Admin': 'ADMIN',
      'Client': 'CLIENT',
      'Driver': 'DRIVER',
      'ADMIN': 'ADMIN',
      'CLIENT': 'CLIENT',
      'DRIVER': 'DRIVER',
      'admin': 'ADMIN',
      'client': 'CLIENT',
      'driver': 'DRIVER'
    };

    return {
      id: u.id,
      name: u.name,
      email: u.email,
      role: roleNormalization[u.role] || u.role,
      avatar: u.avatar,
      phone: u.phone || u.mobile_number || u.contact_number || u.phone_number || u.company_details?.phone,
      active: !!u.active,
      rating: u.rating,
      currency: u.currency || 'SAR',
      companyDetails: u.company_details ? {
        companyName: u.company_details.companyName,
        billingEmail: u.company_details.billingEmail,
        phone: u.company_details.phone,
        address: u.company_details.address,
        feeType: u.company_details.feeType ? u.company_details.feeType.toUpperCase() : undefined,
        feeValue: Number(u.company_details.feeValue) || 0,
      } : undefined,
      vehicleNumber: u.vehicle_number,
      vehicleType: u.vehicle_type,
      lat: u.lat,
      lng: u.long || u.lng
    };
  };

  const mapDriver = (d) => ({
    ...mapUser(d),
    role: 'DRIVER',
    vehicleNumber: d.vehicle_number || d.vehiclePlate,

    vehicleType: d.vehicle_type || d.vehicleType,
    cashInHand: Number(d.cash_in_hand) || 0,
    totalDeliveries: d.total_deliveries,
  });

  const orderToApi = (o) => {
    const formatAddr = (addr) => {
      if (!addr) return undefined;
      return {
        lat: addr.lat,
        long: addr.lng,
        address: `${addr.street}${addr.city ? ', ' + addr.city : ''}${addr.zip ? ', ' + addr.zip : ''}`,
        city: addr.city,
        zip: addr.zip,
        state: addr.state
      };
    };

    return {
      tracking_id: o.trackingId,
      client_id: o.clientId,
      driver_id: o.driverId,
      status: o.status?.toLowerCase().replace(/_/g, '-'),
      order_value: o.orderValue,
      cod_amount: o.codAmount,
      delivery_fee: o.deliveryFee,
      fee_type: o.feeType,
      fee_value: o.feeValue,
      currency: o.currency || currentUser?.currency || 'SAR',
      customer_name: o.customerName,
      customer_phone: o.customerPhone,
      pickup_address: formatAddr(o.pickupAddress),
      delivery_address: formatAddr(o.deliveryAddress),
    };
  };

  const userToApi = (u) => {
    const roleMapping = {
      'ADMIN': 'admin',
      'CLIENT': 'client',
      'DRIVER': 'driver'
    };

    const role = u.role ? (roleMapping[u.role.toUpperCase()] || u.role.toLowerCase()) : 'client';

    return {
      name: u.name,
      email: u.email,
      password: u.password,
      role: role,
      active: !!u.active,
      phone: u.phone || "",
      currency: u.currency || 'SAR',
      ...(role === 'driver' && {
        vehicle_number: u.vehicleNumber || "",
        vehicle_type: u.vehicleType || "Van",
      }),
      company_details: (role === 'client' || u.companyDetails) ? {
        companyName: u.companyDetails?.companyName || "",
        billingEmail: u.companyDetails?.billingEmail || u.email,
        phone: u.companyDetails?.phone || u.phone || "",
        address: {
          street: u.companyDetails?.address?.street || "",
          city: u.companyDetails?.address?.city || "",
          state: u.companyDetails?.address?.state || "",
          zip: u.companyDetails?.address?.zip || ""
        },
        feeType: (u.companyDetails?.feeType || "fixed").toLowerCase(),
        feeValue: Number(u.companyDetails?.feeValue) || 0,
      } : undefined
    };
  };

  const mapInvoice = (inv) => ({
    id: inv.id,
    clientId: inv.client_id,
    clientName: inv.client_name || inv.client?.name || 'Unknown Client',
    amount: Number(inv.total_amount) || Number(inv.amount) || 0,
    outstandingBalance: Number(inv.outstanding_balance) || 0,
    status: inv.status,
    dueDate: inv.due_date,
    billingPeriod: inv.billing_period,
    extraCharges: Number(inv.extra_charges) || 0,
    currency: inv.currency || 'SAR',
    createdAt: inv.created_at,
    updatedAt: inv.updated_at
  });

  const mapSettlement = (s) => ({
    id: s.id,
    amount: Number(s.amount) || 0,
    status: s.status,
    date: s.created_at,
    driverName: s.driver_name,
    driverEmail: s.driver_email,
    adminName: s.admin_name,
    driverId: s.driver_id, // Adding this if it exists in the real response, otherwise we use driverName
    currency: s.currency || 'SAR'
  });

  const [revenueStats, setRevenueStats] = useState(null);

  const fetchRevenueStats = useCallback(async () => {
    try {
      const response = await api.get('/billing/revenue-chart');
      setRevenueStats(response.data || response);
    } catch (err) {
      console.error('Failed to fetch revenue stats:', err);
    }
  }, []);

  const fetchData = useCallback(async () => {
    if (!currentUser) return;
    const isAdmin = currentUser.role === 'ADMIN';

    try {
      const ordersResponse = await api.get('/orders');
      setOrders((ordersResponse.data || []).map(mapOrder));

      if (isAdmin) {
        fetchRevenueStats(); // Initial fetch for admin
        try {
          const usersResponse = await api.get('/users');
          setUsers((usersResponse.data || [])
            .filter((u) => u.role?.toUpperCase() !== 'DRIVER')
            .map(mapUser)
          );

          const driversResponse = await api.get('/users/drivers');
          setDrivers((driversResponse.data || []).map(mapDriver));

          const allInvoicesResponse = await api.get('/billing');
          setInvoices((allInvoicesResponse.data || []).map(mapInvoice));

          const settlementsResponse = await api.get('/cashflow/settlements');
          setSettlements((settlementsResponse.data || []).map(mapSettlement));
        } catch (adminErr) {
          console.error('Admin data fetch failed:', adminErr);
        }
      }

      if (currentUser.role === 'CLIENT') {
        const billingResponse = await api.get('/billing/my-invoices');
        setInvoices((billingResponse.data || []).map(mapInvoice));
      }
    } catch (err) {
      console.error('Failed to fetch data:', err);
    }
  }, [currentUser?.id, currentUser?.role, fetchRevenueStats]);

  useEffect(() => {
    const refreshUser = async () => {
      const saved = localStorage.getItem('logiflow_user');
      const token = saved ? JSON.parse(saved).token : null;

      if (token) {
        try {
          const response = await api.get('/auth/me');
          const userData = response.data || response;
          if (userData) {
            const updatedUser = { ...mapUser(userData), token };
            setCurrentUser(updatedUser);
            localStorage.setItem('logiflow_user', JSON.stringify(updatedUser));
          }
        } catch (err) {
          console.error('Failed to refresh user profile:', err);
        }
      }
    };
    refreshUser();
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const login = async (email, password) => {
    const response = await api.post('/auth/login', { email, password });
    const { token, user } = response.data || response;

    
    // Set token in localStorage first so subsequent calls have it
    localStorage.setItem('logiflow_user', JSON.stringify({ token, ...mapUser(user) }));
    
    // Immediately fetch full profile details
    try {
      const profileResponse = await api.get('/auth/me');
      const fullUser = { ...mapUser(profileResponse.data || profileResponse), token };
      setCurrentUser(fullUser);
      localStorage.setItem('logiflow_user', JSON.stringify(fullUser));
    } catch (err) {
      // Fallback to login response if /me fails
      const userWithToken = { ...mapUser(user), token };
      setCurrentUser(userWithToken);
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('logiflow_user');
  };

  const updateOrderStatus = async (orderId, status) => {
    // Optimistic Update
    setOrders(prev => prev.map(o => o.id === orderId ? { ...o, status } : o));
    
    try {
      const apiStatus = status.toLowerCase().replace(/_/g, '-');
      await api.patch(`/orders/${orderId}/status`, { status: apiStatus });
      // Optional: silent refresh in background
      fetchData(); 
    } catch (err) {
      await fetchData(); // Rollback/Sync on error
      throw err;
    }
  };

  const assignDriver = async (orderId, driverId) => {
    const driver = drivers.find(d => d.id === driverId);
    
    // Optimistic Update
    setOrders(prev => prev.map(o => 
      o.id === orderId ? { ...o, driverId, driverName: driver?.name || 'Assigned' } : o
    ));

    try {
      await api.patch(`/orders/${orderId}/assign`, { driver_id: driverId });
      fetchData(); // background refresh
    } catch (err) {
      await fetchData(); // Rollback/Sync on error
      throw err;
    }
  };

  const createOrder = async (newOrder) => {
    await api.post('/orders', orderToApi(newOrder));
    await fetchData();
  };

  const bulkCreateOrders = async (file) => {
    const formData = new FormData();
    formData.append('file', file);
    await api.post('/orders/bulk', formData);
    await fetchData();
  };

  const deleteOrder = async (orderId) => {
    try {
      await api.delete(`/orders/${orderId}`);
      await fetchData();
      showToast('Order deleted successfully', 'success');
    } catch (err) {
      console.error('Failed to delete order:', err);
      showToast(err.message || 'Failed to delete order', 'error');
    }
  };

  const cancelOrder = async (orderId) => {
    try {
      await api.patch(`/orders/${orderId}/cancel`, { orderId });
      await fetchData();
      showToast('Order cancelled successfully', 'success');
    } catch (err) {
      console.error('Failed to cancel order:', err);
      showToast(err.message || 'Failed to cancel order', 'error');
    }
  };

  const settleDriverCash = async (driverId, amount) => {
    await api.post('/cashflow/settle-driver', { driverId, amount });
    await fetchData();
  };

  const toggleUserStatus = async (userId, currentStatus) => {
    await api.put(`/users/drivers/${userId}/status`, { active: !currentStatus });
    await fetchData();
  };

  const addUser = async (userData) => {
    await api.post('/auth/register', userToApi(userData));
    await fetchData();
  };

  const deleteUser = async (userId) => {
    await api.delete(`/users/${userId}`);
    await fetchData();
  };

  const updateUser = async (userId, userData) => {
    await api.put(`/users/${userId}`, userToApi(userData));
    await fetchData();
  };

  const generateInvoices = async () => {
    await api.post('/billing/generate', {});
    await fetchData();
  };

  const markInvoicePaid = async (invoiceId) => {
    try {
      await api.patch(`/billing/${invoiceId}/paid`, {});
      await fetchData();
      showToast('Invoice marked as paid', 'success');
    } catch (err) {
      console.error('Failed to mark invoice as paid:', err);
      showToast(err.message || 'Failed to mark invoice as paid', 'error');
    }
  };

  const forgotPassword = async (email) => {
    await api.post('/auth/forgot-password', { email });
  };

  const resetPassword = async (email, otp, newPassword) => {
    await api.post('/auth/reset-password', { email, otp, newPassword });
  };

  const showToast = (message, type = 'success') => {
    setToast({ show: true, message, type });
    setTimeout(() => setToast(prev => ({ ...prev, show: false })), 5000);
  };

  return (
    <LogisticsContext.Provider value={{
      currentUser, users, drivers, orders, invoices, settlements, toast,
      revenueStats, fetchRevenueStats,
      login, logout, updateOrderStatus, assignDriver, createOrder, deleteOrder, cancelOrder,
      settleDriverCash, toggleUserStatus, addUser, updateUser, deleteUser,
      generateInvoices, markInvoicePaid, fetchData,
      forgotPassword, resetPassword,
      bulkCreateOrders, showToast
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
