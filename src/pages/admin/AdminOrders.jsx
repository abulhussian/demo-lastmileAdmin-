import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { StatusBadge } from '../../components/Cards';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { Search, MoreVertical, MapPin, Phone, User as UserIcon, Plus, Package, X, Truck, Download, Upload, FileSpreadsheet, CheckCircle2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { api } from '../../lib/api';

const OrderStatus = {
  PENDING: 'PENDING',
  ASSIGNED: 'ASSIGNED',
  PICKED_UP: 'PICKED_UP',
  IN_TRANSIT: 'IN_TRANSIT',
  DELIVERED: 'DELIVERED',
  CANCELLED: 'CANCELLED'
};

export const AdminOrders = () => {
  const { orders, drivers, users, updateOrderStatus, assignDriver, createOrder, deleteOrder, cancelOrder, currentUser, bulkCreateOrders } = useLogistics();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showAssignForm, setShowAssignForm] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const navigate = useNavigate();
  const [isAssigning, setIsAssigning] = useState(false);
  const isAdmin = currentUser?.role === 'ADMIN';

  const getOrderCurrency = (order) => {
    if (!order) return 'SAR';
    if (order.currency) {
      return order.currency;
    }
    if (currentUser?.role === 'CLIENT') {
      return currentUser.currency || 'SAR';
    }
    const client = users?.find(u => u.id === order.clientId);
    return client?.currency || 'SAR';
  };

  const [driverLocation, setDriverLocation] = useState(null);
  const [loadingLocation, setLoadingLocation] = useState(false);

  useEffect(() => {
    let active = true;
    const fetchDriverLocation = async () => {
      if (!selectedOrder?.driverId) {
        setDriverLocation(null);
        return;
      }
      setLoadingLocation(true);
      try {
        const response = await api.get(`/drivers/${selectedOrder.driverId}/location`);
        if (active) {
          setDriverLocation(response.data || response || null);
        }
      } catch (err) {
        console.error('Failed to fetch driver location:', err);
        if (active) {
          setDriverLocation(null);
        }
      } finally {
        if (active) {
          setLoadingLocation(false);
        }
      }
    };

    fetchDriverLocation();

    return () => {
      active = false;
    };
  }, [selectedOrder?.driverId]);

  const openInMap = (lat, lng, address) => {
    if (lat && lng) {
      window.open(`https://www.google.com/maps?q=${lat},${lng}`, '_blank');
    } else if (address) {
      window.open(`https://www.google.com/maps?q=${encodeURIComponent(address)}`, '_blank');
    }
  };

  const filteredOrders = orders.filter(order => {
    // Client security filter
    if (!isAdmin && order.clientId !== currentUser?.id) return false;

    const matchesSearch =
      (order.trackingId || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.customerName || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.clientName || '').toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'ALL' || order.status.toUpperCase() === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const handleExport = () => {
    const headers = [
      'Tracking ID',
      'Client',
      'Customer',
      'Phone',
      'Status',
      'Order Value',
      'COD Amount',
      'Delivery Fee',
      'Driver',
      'Created At',
      'Delivery Address'
    ];

    const csvRows = [
      headers.join(','),
      ...filteredOrders.map(order => [
        `"${order.trackingId || ''}"`,
        `"${order.clientName || ''}"`,
        `"${order.customerName || ''}"`,
        `"${order.customerPhone || ''}"`,
        `"${order.status || ''}"`,
        order.orderValue || 0,
        order.codAmount || 0,
        order.deliveryFee || 0,
        `"${order.driverName || 'Unassigned'}"`,
        `"${order.createdAt ? new Date(order.createdAt).toLocaleString() : ''}"`,
        `"${order.deliveryAddress?.street || ''} ${order.deliveryAddress?.city || ''}"`.trim()
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `orders-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout title="Logistics Operations">
      <div className="bg-white rounded-[16px] border border-slate-200 shadow-sm overflow-hidden">
        {/* Table Controls */}
        <div className="px-6 py-5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={14} />
              <input
                type="text"
                placeholder="Tracking ID, Name..."
                className="pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-medium outline-none focus:border-blue-500 w-56 focus:bg-white transition-all shadow-inner"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-600 outline-none hover:bg-white cursor-pointer transition-all"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="ALL">All Statuses</option>
              {Object.values(OrderStatus).map(status => (
                <option key={status} value={status}>{status.replace('_', ' ')}</option>
              ))}
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/create-order', { state: { activeTab: 'BULK' } })}
              className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              <Upload size={14} />
              Bulk Upload
            </button>
            <button
              onClick={handleExport}
              className="flex items-center gap-2 bg-white text-slate-600 border border-slate-200 px-4 py-2.5 rounded-lg text-xs font-bold hover:bg-slate-50 transition-colors"
            >
              <Download size={14} />
              Export
            </button>
            <button
              onClick={() => navigate('/create-order')}
              className="flex items-center gap-2 bg-indigo-600 text-white px-5 py-2.5 rounded-lg text-xs font-bold hover:bg-indigo-700 transition-colors shadow-md"
            >
              <Plus size={14} />
              New Order
            </button>
          </div>
        </div>

        {/* Table */}
        <div className="overflow-x-auto min-h-[300px]">
          <table className="w-full text-left">
            <thead className="bg-[#F8FAFC] border-b border-slate-200">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Order Details</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Client / Destination</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Driver</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Status</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest">Fee / COD</th>
                <th className="px-6 py-4 text-[10px] font-bold text-slate-400 uppercase tracking-widest text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredOrders.map((order) => (
                <tr
                  key={order.id}
                  className={cn(
                    "hover:bg-[#F8FAFC] transition-colors group",
                    isAdmin ? "cursor-pointer" : "cursor-default"
                  )}
                  onClick={() => isAdmin && setSelectedOrder(order)}
                >
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-500">
                        <Package size={16} />
                      </div>
                      <div>
                        <p className="text-[13px] font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">#{order.trackingId}</p>
                        <p className="text-[11px] text-slate-400 font-medium uppercase tracking-tighter">{formatDate(order.createdAt)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[13px] font-bold text-slate-700">
                      {currentUser?.role === 'CLIENT' ? order.customerName : order.clientName}
                    </p>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-0.5">
                      <MapPin size={10} className="flex-shrink-0" />
                      <span className="text-[11px] font-medium truncate max-w-[140px]">
                        {order.deliveryAddress?.city
                          ? `${order.deliveryAddress.street}, ${order.deliveryAddress.city}`
                          : order.deliveryAddress?.street || 'N/A'}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-5">
                    {order.driverName ? (
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-bold">
                          {order.driverName.charAt(0)}
                        </div>
                        <span className="text-[12px] font-medium text-slate-800">{order.driverName}</span>
                      </div>
                    ) : (
                      <span className="inline-flex items-center px-2 py-0.5 rounded bg-amber-50 text-amber-700 text-[10px] font-bold uppercase border border-amber-100">Unassigned</span>
                    )}
                  </td>
                  <td className="px-6 py-5">
                    <StatusBadge status={order.status} />
                  </td>
                  <td className="px-6 py-5">
                    <p className="text-[12px] font-bold text-slate-700">{formatCurrency(order.deliveryFee, getOrderCurrency(order))}</p>
                    {order.codAmount > 0 && <p className="text-[10px] text-emerald-600 font-bold uppercase">COD: {formatCurrency(order.codAmount, getOrderCurrency(order))}</p>}
                  </td>
                  <td className="px-6 py-5 text-right" onClick={(e) => e.stopPropagation()}>
                    <button className="p-2 text-slate-300 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-all">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {filteredOrders.length === 0 && (
            <div className="p-16 text-center">
              <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 text-slate-300 mb-4 animate-pulse">
                <Package size={40} />
              </div>
              <h4 className="text-lg font-bold text-slate-900 mb-1">No Orders Found</h4>
              <p className="text-slate-500 text-sm">No orders matching your criteria.</p>
            </div>
          )}
        </div>
      </div>

      {/* Detail Modal */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center">
                  <Package size={24} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Order #{selectedOrder.trackingId}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <StatusBadge status={selectedOrder.status} />
                    <span className="text-[11px] text-slate-400 font-medium tracking-tighter">Created: {formatDate(selectedOrder.createdAt)}</span>
                  </div>
                </div>
              </div>
              <button onClick={() => setSelectedOrder(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl border border-slate-100 shadow-sm transition-all focus:outline-none">
                <X size={20} />
              </button>
            </div>

            <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-10">
              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Recipient</h4>
                  <div className="bg-slate-50 rounded-xl p-4 border border-slate-100 space-y-3">
                    <p className="text-sm font-bold text-slate-900 flex items-center gap-2">
                      <UserIcon size={14} className="text-slate-400" /> {selectedOrder.customerName}
                    </p>
                    <p className="text-sm font-medium text-slate-600 flex items-center gap-2">
                      <Phone size={14} className="text-slate-400" /> {selectedOrder.customerPhone}
                    </p>
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Route Progress</h4>
                  <div className="space-y-4">
                    <div className="relative pl-6">
                      <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-indigo-500 border-2 border-white shadow-sm z-10" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Pickup Address</p>
                      <button 
                        onClick={() => openInMap(selectedOrder.pickupAddress?.lat, selectedOrder.pickupAddress?.lng, selectedOrder.pickupAddress?.street)}
                        className="text-[12px] font-medium text-slate-700 mt-0.5 hover:text-indigo-600 transition-colors text-left block w-full"
                      >
                        {selectedOrder.pickupAddress?.city
                          ? `${selectedOrder.pickupAddress.street}, ${selectedOrder.pickupAddress.city}`
                          : selectedOrder.pickupAddress?.street || 'N/A'}
                      </button>
                    </div>

                    {selectedOrder.driverId && (
                      <div className="relative pl-6">
                        <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-amber-500 border-2 border-white shadow-sm z-10 animate-pulse" />
                        <p className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Driver Location (Now)</p>
                        {loadingLocation ? (
                          <div className="text-[12px] font-medium text-slate-400 mt-0.5 flex items-center gap-1.5 animate-pulse">
                            <span className="inline-block w-2.5 h-2.5 border-2 border-slate-300 border-t-indigo-600 rounded-full animate-spin"></span>
                            Fetching live location...
                          </div>
                        ) : (() => {
                          const driver = drivers.find(d => d.id === selectedOrder.driverId);
                          const driverName = driver?.name || 'Driver';
                          
                          if (driverLocation) {
                            const timeStr = driverLocation.updated_at || driverLocation.created_at
                              ? new Date(driverLocation.updated_at || driverLocation.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                              : '';
                            return (
                              <button 
                                onClick={() => openInMap(driverLocation.latitude, driverLocation.longitude)}
                                className="text-[12px] font-medium text-slate-700 mt-0.5 hover:text-indigo-600 transition-colors text-left block w-full group"
                              >
                                <span className="font-semibold text-indigo-600 group-hover:underline">
                                  {driverName} is currently here:
                                </span>
                                <span className="block text-slate-500 text-[11px] mt-0.5">
                                  Lat: {parseFloat(driverLocation.latitude).toFixed(6)}, Lng: {parseFloat(driverLocation.longitude).toFixed(6)}
                                  {timeStr && ` (Updated at ${timeStr})`}
                                </span>
                                <span className="text-[10px] text-indigo-500 font-bold block mt-1 hover:underline">
                                  👉 Click to track on Google Maps
                                </span>
                              </button>
                            );
                          }
                          
                          // Fallback to static location from drivers context
                          if (driver?.lat && driver?.lng) {
                            return (
                              <button 
                                onClick={() => openInMap(driver.lat, driver.lng)}
                                className="text-[12px] font-medium text-slate-700 mt-0.5 hover:text-indigo-600 transition-colors text-left block w-full group"
                              >
                                <span className="font-semibold text-slate-600">
                                  {driverName} is currently here:
                                </span>
                                <span className="block text-slate-500 text-[11px] mt-0.5">
                                  Lat: {parseFloat(driver.lat).toFixed(6)}, Lng: {parseFloat(driver.lng).toFixed(6)} (Static Fallback)
                                </span>
                                <span className="text-[10px] text-indigo-500 font-bold block mt-1 hover:underline">
                                  👉 Click to track on Google Maps
                                </span>
                              </button>
                            );
                          }
                          
                          return (
                            <span className="text-[12px] font-medium text-slate-400 mt-0.5 block">
                              {driverName} location unavailable
                            </span>
                          );
                        })()}
                      </div>
                    )}

                    <div className="relative pl-6">
                      <div className="absolute left-0 top-1 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white shadow-sm z-10" />
                      <p className="text-[10px] font-bold text-slate-400 uppercase whitespace-nowrap">Delivery Address</p>
                      <button 
                        onClick={() => openInMap(selectedOrder.deliveryAddress?.lat, selectedOrder.deliveryAddress?.lng, selectedOrder.deliveryAddress?.street)}
                        className="text-[12px] font-medium text-slate-700 mt-0.5 hover:text-indigo-600 transition-colors text-left block w-full"
                      >
                        {selectedOrder.deliveryAddress?.city
                          ? `${selectedOrder.deliveryAddress.street}, ${selectedOrder.deliveryAddress.city}`
                          : selectedOrder.deliveryAddress?.street || 'N/A'}
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Finance Summary</h4>
                  <div className="bg-slate-900 rounded-xl p-5 text-white space-y-3 shadow-xl">
                    <div className="flex justify-between items-center">
                      <span className="text-[11px] text-slate-400 font-medium">Service Fee</span>
                      <span className="text-sm font-bold">{formatCurrency(selectedOrder.deliveryFee, getOrderCurrency(selectedOrder))}</span>
                    </div>
                    {selectedOrder.codAmount > 0 && (
                      <div className="flex justify-between items-center border-t border-slate-800 pt-3">
                        <span className="text-[11px] text-slate-400 font-medium">Cash to Collect (COD)</span>
                        <span className="text-sm font-bold text-emerald-400">{formatCurrency(selectedOrder.codAmount, getOrderCurrency(selectedOrder))}</span>
                      </div>
                    )}
                  </div>
                </div>

                <div>
                  <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-3">Driver Assignment</h4>
                  <div className="space-y-3">
                    {selectedOrder.driverId ? (
                      <div className="flex items-center justify-between p-3 bg-indigo-50 rounded-xl border border-indigo-100">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-700 text-xs font-bold border border-indigo-200">
                            {selectedOrder.driverName?.charAt(0)}
                          </div>
                          <p className="text-sm font-bold text-indigo-950">{selectedOrder.driverName}</p>
                        </div>
                        <button onClick={() => setShowAssignForm(true)} className="text-[11px] font-bold text-indigo-600 hover:underline">Change</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setShowAssignForm(true)}
                        className="w-full py-4 border-2 border-dashed border-slate-200 rounded-xl text-slate-400 hover:border-indigo-300 hover:text-indigo-600 hover:bg-indigo-50 transition-all text-xs font-bold flex flex-col items-center gap-2"
                      >
                        <Truck size={24} />
                        Assign Driver
                      </button>
                    )}

                    {showAssignForm && (
                      <div className="mt-2 p-4 bg-white border border-slate-200 rounded-xl shadow-lg space-y-3">
                        <p className="text-[10px] font-bold text-slate-400 uppercase">Available Drivers</p>
                        <div className="max-h-40 overflow-y-auto space-y-1">
                          {drivers.filter(d => d.active).map(driver => (
                            <button
                              key={driver.id}
                              disabled={isAssigning}
                              onClick={async () => {
                                setIsAssigning(true);
                                try {
                                  // Instant UI update
                                  setSelectedOrder({ ...selectedOrder, driverId: driver.id, driverName: driver.name });
                                  setShowAssignForm(false);
                                  
                                  await assignDriver(selectedOrder.id, driver.id);
                                } catch (err) {
                                  console.error(err);
                                } finally {
                                  setIsAssigning(false);
                                }
                              }}
                              className={cn(
                                "w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors",
                                isAssigning ? "opacity-50 cursor-not-allowed bg-slate-50" : "hover:bg-slate-50 text-slate-700"
                              )}
                            >
                              {isAssigning ? 'Assigning...' : driver.name}
                            </button>
                          ))}
                        </div>
                        <button onClick={() => setShowAssignForm(false)} className="w-full text-xs font-bold text-rose-500 py-1 hover:bg-rose-50 rounded-lg">Cancel</button>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="px-8 py-5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
              <button
                onClick={async () => {
                  if (confirm('Cancel this order?')) {
                    await cancelOrder(selectedOrder.id);
                    setSelectedOrder(null);
                  }
                }}
                className="text-rose-600 font-bold text-xs hover:underline"
              >
                Cancel Order
              </button>
              <div className="flex gap-3">
                <select
                  className="bg-white border border-slate-200 rounded-xl px-4 py-2 text-xs font-bold outline-none cursor-pointer focus:ring-2 focus:ring-indigo-600/10"
                  onChange={async (e) => {
                    const newStatus = e.target.value;
                    try {
                      setSelectedOrder({ ...selectedOrder, status: newStatus });
                      await updateOrderStatus(selectedOrder.id, newStatus);
                    } catch (err) {
                      console.error(err);
                    }
                  }}
                  value={selectedOrder.status?.toUpperCase()}
                >
                  {Object.values(OrderStatus).map(st => (
                    <option key={st} value={st}>{st.replace('_', ' ')}</option>
                  ))}
                </select>
                <button onClick={() => setSelectedOrder(null)} className="px-8 py-2 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md">Done</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {isCreating && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Create New Logistics Order</h3>
              <button onClick={() => setIsCreating(false)} className="p-2 text-slate-400 hover:text-slate-600 bg-slate-50 rounded-lg">
                <X size={20} />
              </button>
            </div>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                const formData = new FormData(e.currentTarget);
                const codAmount = Number(formData.get('codAmount'));
                let deliveryFee = 0;
                
                if (currentUser?.role === 'CLIENT' && currentUser?.companyDetails) {
                  const { feeType, feeValue } = currentUser.companyDetails;
                  deliveryFee = feeType === 'PERCENTAGE' 
                    ? (codAmount * (feeValue || 0)) / 100 
                    : (feeValue || 0);
                }

                await createOrder({
                  customerName: formData.get('customerName'),
                  customerPhone: formData.get('customerPhone'),
                  orderValue: Number(formData.get('orderValue')),
                  codAmount: codAmount,
                  pickupAddress: { street: 'Main Warehouse', city: 'NYC', state: 'NY', zip: '10001' },
                  deliveryAddress: {
                    street: formData.get('deliveryStreet'),
                    city: formData.get('deliveryCity'),
                    state: 'NY',
                    zip: formData.get('deliveryZip')
                  },
                  deliveryFee: deliveryFee,
                  currency: currentUser?.currency || 'SAR'
                });
                setIsCreating(false);
              }}


              className="p-6 space-y-4"
            >
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Customer Name</label>
                  <input name="customerName" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Phone</label>
                  <input name="customerPhone" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="space-y-1">
                <label className="text-[10px] font-bold text-slate-400 uppercase">Delivery Street</label>
                <input name="deliveryStreet" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">City</label>
                  <input name="deliveryCity" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Zip</label>
                  <input name="deliveryZip" required className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">Value ({currentUser?.currency || 'SAR'})</label>
                  <input name="orderValue" type="number" defaultValue="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] font-bold text-slate-400 uppercase">COD ({currentUser?.currency || 'SAR'})</label>
                  <input name="codAmount" type="number" defaultValue="0" className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:border-blue-500" />
                </div>
              </div>
              <div className="pt-4 flex gap-3">
                <button type="button" onClick={() => setIsCreating(false)} className="flex-1 py-2.5 bg-slate-100 text-slate-600 rounded-xl text-sm font-bold hover:bg-slate-200 transition-all">Cancel</button>
                <button type="submit" className="flex-2 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100">Create Order</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
