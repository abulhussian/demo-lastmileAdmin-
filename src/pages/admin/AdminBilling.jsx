import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { StatusBadge } from '../../components/Cards';
import { formatCurrency, formatDate, cn } from '../../lib/utils';
import { FileText, Download, Filter, MoreVertical, CreditCard, Clock } from 'lucide-react';

export const AdminBilling = () => {
  const { invoices, generateInvoices, markInvoicePaid, currentUser, fetchInvoices } = useLogistics();
  const [isGenerating, setIsGenerating] = useState(false);

  React.useEffect(() => {
    fetchInvoices();
  }, [fetchInvoices]);

  // Manual Batch States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState('');
  const [uninvoicedOrders, setUninvoicedOrders] = useState([]);
  const [selectedOrderIds, setSelectedOrderIds] = useState([]);
  const [extraCharges, setExtraCharges] = useState(0);
  const [billingPeriod, setBillingPeriod] = useState(() => {
    const d = new Date();
    return d.toLocaleString('default', { month: 'long', year: 'numeric' });
  });
  const [dueDate, setDueDate] = useState(() => {
    const d = new Date();
    d.setDate(d.getDate() + 15);
    return d.toISOString().split('T')[0];
  });
  const [fetchingClients, setFetchingClients] = useState(false);
  const [fetchingOrders, setFetchingOrders] = useState(false);
  const [creatingManual, setCreatingManual] = useState(false);
  const [showFilters, setShowFilters] = useState(false);
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [searchQuery, setSearchQuery] = useState('');

  const isAdmin = currentUser?.role === 'ADMIN';

  // If client, filter invoices
  const displayInvoices = (isAdmin
    ? invoices
    : invoices.filter(inv => inv.clientId === currentUser?.id)
  ).filter(inv => {
    const matchesStatus = statusFilter === 'ALL' || inv.status.toUpperCase() === statusFilter;
    const matchesSearch = inv.clientName.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         inv.id.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesStatus && matchesSearch;
  });

  const totalOutstanding = displayInvoices.reduce((sum, inv) => sum + inv.outstandingBalance, 0);

  const selectedOrders = uninvoicedOrders.filter(o => selectedOrderIds.includes(o.id));
  const totalServiceFee = selectedOrders.reduce((sum, o) => sum + (Number(o.delivery_fee) || 0), 0);

  const handleGenerate = async () => {
    setFetchingClients(true);
    setIsModalOpen(true);
    try {
      const { api } = await import('../../lib/api');
      const response = await api.get('/users/clients');
      setClients(response.data || response);
    } catch (err) {
      console.error('Failed to fetch clients:', err);
    } finally {
      setFetchingClients(false);
    }
  };

  const handleClientChange = async (clientId) => {
    setSelectedClient(clientId);
    if (!clientId) {
      setUninvoicedOrders([]);
      setSelectedOrderIds([]);
      return;
    }

    setFetchingOrders(true);
    try {
      const { api } = await import('../../lib/api');
      const response = await api.get(`/billing/uninvoiced-orders?clientId=${clientId}`);
      const orders = response.data || response || [];
      setUninvoicedOrders(orders);
      setSelectedOrderIds(orders.map(o => o.id)); // Select all by default
    } catch (err) {
      console.error('Failed to fetch orders:', err);
    } finally {
      setFetchingOrders(false);
    }
  };

  const handleToggleOrder = (orderId) => {
    setSelectedOrderIds(prev =>
      prev.includes(orderId)
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleCreateManual = async () => {
    if (!selectedClient || selectedOrderIds.length === 0) return;

    setCreatingManual(true);
    try {
      const { api } = await import('../../lib/api');
      const payload = {
        clientId: selectedClient,
        orderIds: selectedOrderIds,
        billingPeriod: billingPeriod,
        dueDate: new Date(dueDate).toISOString(),
        extraCharges: Number(extraCharges)
      };

      await api.post('/billing/create-manual', payload);
      await fetchInvoices(); // Refresh table
      setIsModalOpen(false);
      resetModal();
    } catch (err) {
      console.error('Failed to create manual invoice:', err);
      alert('Error: ' + err.message);
    } finally {
      setCreatingManual(false);
    }
  };

  const resetModal = () => {
    setSelectedClient('');
    setUninvoicedOrders([]);
    setSelectedOrderIds([]);
    setExtraCharges(0);
  };

  const handleDownload = (invoice) => {
    const htmlContent = `
      <html xmlns:o="urn:schemas-microsoft-com:office:office" 
            xmlns:x="urn:schemas-microsoft-com:office:excel" 
            xmlns="http://www.w3.org/TR/REC-html40">
      <head>
        <meta http-equiv="content-type" content="text/plain; charset=UTF-8"/>
        <!--[if gte mso 9]>
        <xml>
          <x:ExcelWorkbook>
            <x:ExcelWorksheets>
              <x:ExcelWorksheet>
                <x:Name>Invoice ${invoice.id}</x:Name>
                <x:WorksheetOptions>
                  <x:DisplayGridlines/>
                </x:WorksheetOptions>
              </x:ExcelWorksheet>
            </x:ExcelWorksheets>
          </x:ExcelWorkbook>
        </xml>
        <![endif]-->
        <style>
          table { border-collapse: collapse; width: 100%; font-family: sans-serif; }
          th { background-color: #4F46E5; color: white; font-weight: bold; }
          th, td { border: 1px solid #E2E8F0; padding: 10px; text-align: left; font-size: 13px; }
          .title { font-size: 18px; font-weight: bold; margin-bottom: 15px; color: #1E293B; }
        </style>
      </head>
      <body>
        <div class="title">LogiFlow Invoice Details</div>
        <table>
          <thead>
            <tr>
              <th>Invoice ID</th>
              <th>Client Name</th>
              <th>Billing Period</th>
              <th>Amount</th>
              <th>Extra Charges</th>
              <th>Status</th>
              <th>Due Date</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>${invoice.id}</td>
              <td>${invoice.clientName}</td>
              <td>${invoice.billingPeriod || 'N/A'}</td>
              <td>${formatCurrency(invoice.amount, invoice.currency)}</td>
              <td>${formatCurrency(invoice.extraCharges || 0, invoice.currency)}</td>
              <td>${invoice.status}</td>
              <td>${invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}</td>
            </tr>
          </tbody>
        </table>
      </body>
      </html>
    `;

    const blob = new Blob([htmlContent], { type: 'application/vnd.ms-excel;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", `invoice-${invoice.id}.xls`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <MainLayout title={isAdmin ? "Invoicing & Master Billing" : "My Invoices"}>
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
            <p className="text-xs font-bold text-slate-400 uppercase mb-1 relative z-10">Outstanding Balance</p>
            <h3 className="text-3xl font-bold text-rose-600 relative z-10">{formatCurrency(totalOutstanding, displayInvoices[0]?.currency || currentUser?.currency)}</h3>
            <div className="mt-4 flex items-center gap-2 text-[10px] text-slate-400 font-bold uppercase relative z-10">
              <Clock size={12} />
              <span>Pending Settlement</span>
            </div>
          </div>

          {isAdmin && (
            <>
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-indigo-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                <p className="text-xs font-bold text-slate-400 uppercase mb-1 relative z-10">Monthly Logi Revenue</p>
                <h3 className="text-3xl font-bold text-slate-900 relative z-10">{formatCurrency(12450, currentUser?.currency)}</h3>
                <p className="mt-4 text-[10px] text-emerald-600 font-bold uppercase relative z-10 italic">Growing +18.4% since last month</p>
              </div>
              <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
                <div className="absolute right-0 top-0 w-24 h-24 bg-emerald-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
                <p className="text-xs font-bold text-slate-400 uppercase mb-1 relative z-10">Collection Rate</p>
                <h3 className="text-3xl font-bold text-slate-900 relative z-10">94.2%</h3>
                <div className="mt-4 h-1.5 w-full bg-slate-100 rounded-full overflow-hidden relative z-10">
                  <div className="h-full bg-emerald-500 w-[94.2%]" />
                </div>
              </div>
            </>
          )}
        </div>

        {/* Invoice List */}
        <div className="bg-white rounded-[24px] border border-slate-200 shadow-sm overflow-hidden">
          <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
            <div>
              <h3 className="font-bold text-slate-900 text-lg">System Invoices</h3>
              <p className="text-slate-400 text-xs font-medium">Auto-generated batches for delivered orders</p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className={cn(
                  "p-2.5 border rounded-xl transition-all",
                  showFilters
                    ? "bg-indigo-50 border-indigo-200 text-indigo-600 shadow-inner"
                    : "border-slate-200 text-slate-400 hover:bg-slate-50"
                )}
              >
                <Filter size={18} />
              </button>
              {isAdmin && (
                <button
                  onClick={handleGenerate}
                  disabled={isGenerating}
                  className="bg-indigo-600 text-white px-6 py-2.5 rounded-xl text-xs font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-100 active:scale-95 disabled:opacity-50"
                >
                  <FileText size={16} />
                  {isGenerating ? 'Generating...' : 'Generate New Batch'}
                </button>
              )}
            </div>
          </div>

          {/* Filter Bar */}
          {showFilters && (
            <div className="px-8 py-4 bg-slate-50/50 border-b border-slate-100 flex flex-wrap items-center gap-4 animate-in slide-in-from-top-2 duration-200">
              <div className="flex-1 min-w-[240px] relative">
                <input
                  type="text"
                  placeholder="Search by client name or invoice ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-white border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-medium focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none"
                />
                <div className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <FileText size={14} />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Status:</span>
                <div className="flex bg-white p-1 rounded-lg border border-slate-200">
                  {['ALL', 'UNPAID', 'PAID', 'OVERDUE'].map((status) => (
                    <button
                      key={status}
                      onClick={() => setStatusFilter(status)}
                      className={cn(
                        "px-3 py-1 rounded-md text-[10px] font-bold transition-all",
                        statusFilter === status
                          ? "bg-slate-900 text-white shadow-sm"
                          : "text-slate-500 hover:bg-slate-50"
                      )}
                    >
                      {status}
                    </button>
                  ))}
                </div>
              </div>

              {(statusFilter !== 'ALL' || searchQuery) && (
                <button
                  onClick={() => { setStatusFilter('ALL'); setSearchQuery(''); }}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-700 underline"
                >
                  Clear Filters
                </button>
              )}
            </div>
          )}
          <div className="overflow-x-auto min-h-[300px]">
            <table className="w-full text-left">
              <thead className="bg-[#F8FAFC] text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200">
                <tr>
                  <th className="px-8 py-4">ID</th>
                  <th className="px-8 py-4">Business Client</th>
                  <th className="px-8 py-4">Invoice Total</th>
                  <th className="px-8 py-4">Status</th>
                  <th className="px-8 py-4">Due On</th>
                  <th className="px-8 py-4 text-right">Settings</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {displayInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-8 py-5 font-bold text-indigo-600 text-xs tracking-widest">{inv.id}</td>
                    <td className="px-8 py-5">
                      <p className="text-sm font-bold text-slate-900 group-hover:text-indigo-600 transition-colors">{inv.clientName}</p>
                      <p className="text-[10px] font-medium text-slate-400 italic">Net 15 Terms</p>
                    </td>
                    <td className="px-8 py-5">
                      <p className="text-xs font-bold text-slate-900">{formatCurrency(inv.amount, inv.currency)}</p>
                      <p className="text-[10px] text-rose-500 font-bold uppercase mt-0.5">{inv.outstandingBalance > 0 ? `${formatCurrency(inv.outstandingBalance, inv.currency)} Unpaid` : 'Fully Settled'}</p>
                    </td>
                    <td className="px-8 py-5"><StatusBadge status={inv.status} /></td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3">
                        {isAdmin && inv.status.toUpperCase() !== 'PAID' && (
                          <button
                            onClick={async () => {
                              if (confirm('Confirm payment for this batch?')) {
                                await markInvoicePaid(inv.id);
                              }
                            }}
                            className="p-2 text-emerald-500 hover:bg-emerald-50 rounded-lg transition-colors border border-transparent hover:border-emerald-100"
                            title="Mark as Paid"
                          >
                            <CreditCard size={18} />
                          </button>
                        )}
                        <button
                          onClick={() => handleDownload(inv)}
                          className="p-2 text-indigo-500 hover:bg-indigo-50 rounded-lg transition-colors border border-transparent hover:border-indigo-100"
                          title="Download Excel"
                        >
                          <Download size={18} />
                        </button>
                        <button className="p-2 text-slate-300 hover:text-slate-900 rounded-lg">
                          <MoreVertical size={18} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {displayInvoices.length === 0 && (
              <div className="p-20 text-center">
                <div className="inline-flex items-center justify-center w-20 h-20 rounded-full bg-slate-50 text-slate-200 mb-4">
                  <FileText size={40} />
                </div>
                <h4 className="text-lg font-bold text-slate-900">No Invoices Yet</h4>
                <p className="text-slate-500 text-sm">Once orders are delivered, new billable batches will appear here.</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Manual Generation Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="px-8 py-6 border-b border-slate-100 flex items-center justify-between bg-white">
              <div>
                <h2 className="text-xl font-bold text-slate-900">Generate Manual Invoice</h2>
                <p className="text-xs text-slate-400 font-medium">Create a custom billing batch for a specific client</p>
              </div>
              <button
                onClick={() => { setIsModalOpen(false); resetModal(); }}
                className="w-10 h-10 flex items-center justify-center rounded-xl hover:bg-slate-50 text-slate-400 transition-colors"
              >
                <Filter className="rotate-45" size={20} />
              </button>
            </div>

            <div className="p-8 max-h-[70vh] overflow-y-auto">
              <div className="space-y-8">
                {/* Step 1: Select Client */}
                <div className="space-y-4">
                  <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">1. Select Business Client</label>
                  {fetchingClients ? (
                    <div className="h-14 bg-slate-50 animate-pulse rounded-2xl border border-slate-100" />
                  ) : (
                    <select
                      value={selectedClient}
                      onChange={(e) => handleClientChange(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-4 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all appearance-none"
                    >
                      <option value="">Choose a client...</option>
                      {clients.map(client => (
                        <option key={client.id} value={client.id}>{client.name} ({client.email})</option>
                      ))}
                    </select>
                  )}
                </div>

                {/* Step 2: Uninvoiced Orders */}
                {selectedClient && (
                  <div className="space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="flex items-center justify-between px-1">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest">2. Select Orders to Invoice</label>
                      <span className="text-[10px] font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full">{selectedOrderIds.length} Selected</span>
                    </div>

                    {fetchingOrders ? (
                      <div className="space-y-2">
                        {[1, 2, 3].map(i => <div key={i} className="h-12 bg-slate-50 animate-pulse rounded-xl border border-slate-100" />)}
                      </div>
                    ) : uninvoicedOrders.length === 0 ? (
                      <div className="p-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                        <p className="text-sm font-bold text-slate-400 italic">No uninvoiced orders found for this client.</p>
                      </div>
                    ) : (
                      <div className="space-y-2 max-h-[240px] overflow-y-auto pr-2 custom-scrollbar">
                        {uninvoicedOrders.map(order => (
                          <div
                            key={order.id}
                            onClick={() => handleToggleOrder(order.id)}
                            className={cn(
                              "flex items-center justify-between p-4 rounded-2xl border transition-all cursor-pointer group",
                              selectedOrderIds.includes(order.id)
                                ? "bg-indigo-50 border-indigo-100 shadow-sm"
                                : "bg-white border-slate-100 hover:border-slate-300"
                            )}
                          >
                            <div className="flex items-center gap-4">
                              <div className={cn(
                                "w-5 h-5 rounded-md flex items-center justify-center transition-all",
                                selectedOrderIds.includes(order.id) ? "bg-indigo-600 text-white" : "bg-white border-2 border-slate-200"
                              )}>
                                {selectedOrderIds.includes(order.id) && <FileText size={12} />}
                              </div>
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-xs font-bold text-slate-900">#{order.tracking_id}</p>
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded text-[8px] font-bold uppercase tracking-wider border",
                                    order.status?.toUpperCase() === 'CANCELLED' || order.status?.toUpperCase() === 'CANCEL'
                                      ? "bg-rose-50 text-rose-600 border-rose-100"
                                      : "bg-emerald-50 text-emerald-600 border-emerald-100"
                                  )}>
                                    {order.status || 'DELIVERED'}
                                  </span>
                                </div>
                                <p className="text-[10px] text-slate-400 font-medium">{formatDate(order.created_at)} • {order.customer_name}</p>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-xs font-bold text-slate-900">{formatCurrency(order.cod_amount, order.currency)}</p>
                              <p className="text-[10px] text-slate-400 font-medium italic mt-0.5">Fee: {formatCurrency(order.delivery_fee, order.currency)}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Invoice Summary & Calculation Breakdown */}
                {selectedOrderIds.length > 0 && (
                  <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/60 space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                    <h4 className="text-xs font-bold text-slate-400 uppercase tracking-widest">Invoice Calculation Summary</h4>
                    <div className="space-y-2.5">
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>Selected Orders ({selectedOrderIds.length}) Service Fee Sum</span>
                        <span>{formatCurrency(totalServiceFee, uninvoicedOrders[0]?.currency || 'SAR')}</span>
                      </div>
                      <div className="flex justify-between text-xs font-medium text-slate-600">
                        <span>Extra Service Charges</span>
                        <span>{formatCurrency(Number(extraCharges) || 0, uninvoicedOrders[0]?.currency || 'SAR')}</span>
                      </div>
                      <div className="pt-2.5 border-t border-slate-200 flex justify-between text-sm font-bold text-slate-900">
                        <span>Total Invoice Amount</span>
                        <span className="text-indigo-600 font-extrabold">
                          {formatCurrency(totalServiceFee + (Number(extraCharges) || 0), uninvoicedOrders[0]?.currency || 'SAR')}
                        </span>
                      </div>
                    </div>
                    <div className="p-3 bg-white rounded-xl border border-slate-100 text-[10px] text-slate-500 leading-relaxed">
                      <span className="font-bold text-slate-700 block mb-1">How is this calculated?</span>
                      Total Invoice Amount = (Sum of Service Fees of all selected orders) + Extra Service Charges.<br />
                      In this case: <span className="font-semibold">{formatCurrency(totalServiceFee, uninvoicedOrders[0]?.currency || 'SAR')}</span> (from {selectedOrderIds.length} orders) + <span className="font-semibold">{formatCurrency(Number(extraCharges) || 0, uninvoicedOrders[0]?.currency || 'SAR')}</span> (extra charges) = <span className="font-bold text-indigo-600">{formatCurrency(totalServiceFee + (Number(extraCharges) || 0), uninvoicedOrders[0]?.currency || 'SAR')}</span>.
                    </div>
                  </div>
                )}

                {/* Step 3: Billing Details */}
                {selectedOrderIds.length > 0 && (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-4 border-t border-slate-100 animate-in fade-in slide-in-from-top-4 duration-300">
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Billing Period</label>
                      <input
                        type="text"
                        value={billingPeriod}
                        onChange={(e) => setBillingPeriod(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Due Date</label>
                      <input
                        type="date"
                        value={dueDate}
                        onChange={(e) => setDueDate(e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-2xl px-6 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                      />
                    </div>
                    <div className="space-y-2 md:col-span-2">
                      <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest ml-1">Extra Service Charges (Optional)</label>
                      <div className="relative">
                        <span className="absolute left-6 top-1/2 -translate-y-1/2 text-slate-400 font-bold">SAR</span>
                        <input
                          type="number"
                          value={extraCharges}
                          onChange={(e) => setExtraCharges(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-2xl pl-16 pr-6 py-3.5 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all"
                        />
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="p-8 bg-slate-50/50 border-t border-slate-100 flex items-center justify-end gap-3">
              <button
                onClick={() => { setIsModalOpen(false); resetModal(); }}
                className="px-8 py-3.5 text-xs font-bold text-slate-500 hover:text-slate-900 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleCreateManual}
                disabled={creatingManual || selectedOrderIds.length === 0}
                className="bg-slate-900 text-white px-10 py-3.5 rounded-2xl text-xs font-bold hover:bg-indigo-600 transition-all shadow-xl shadow-slate-200 active:scale-95 disabled:opacity-30 disabled:grayscale"
              >
                {creatingManual ? 'Creating Batch...' : 'Generate Invoice Now'}
              </button>
            </div>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
