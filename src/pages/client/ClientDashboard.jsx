import React from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { KPICard, StatusBadge } from '../../components/Cards';
import { Package, Truck, Clock, DollarSign, ArrowRight } from 'lucide-react';
import { formatCurrency, formatDate } from '../../lib/utils';
import { Link } from 'react-router-dom';

const cn = (...inputs) => inputs.filter(Boolean).join(' ');

export const ClientDashboard = () => {
  const { orders, invoices, currentUser } = useLogistics();
  
  const clientOrders = orders.filter(o => o.clientId === currentUser?.id);
  const clientInvoices = invoices.filter(i => i.clientId === currentUser?.id);
  
  const activeOrdersCount = clientOrders.filter(o => !['DELIVERED', 'CANCELLED'].includes(o.status)).length;
  const totalSpent = clientOrders.reduce((sum, o) => sum + o.deliveryFee, 0);
  const outstanding = clientInvoices.reduce((sum, i) => sum + i.outstandingBalance, 0);

  return (
    <MainLayout title={`Welcome, ${currentUser?.companyDetails?.companyName || currentUser?.name}`}>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <KPICard 
          title="Active Deliveries" 
          value={activeOrdersCount} 
          icon={Truck} 
          className="border-indigo-100 bg-indigo-50/20"
        />
        <KPICard 
          title="Total Deliveries (MTD)" 
          value={clientOrders.length} 
          icon={Package} 
        />
        <KPICard 
          title="Total Logistics Spend" 
          value={totalSpent} 
          icon={DollarSign} 
          isCurrency
        />
        <KPICard 
          title="Outstanding Balance" 
          value={outstanding} 
          icon={Clock} 
          isCurrency
          className={cn(outstanding > 0 ? "border-rose-100 bg-rose-50/20 text-rose-700" : "")}
        />
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-8">
        <div className="xl:col-span-2 space-y-6">
          {/* Active Orders List */}
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-5 border-b border-slate-200 flex items-center justify-between">
              <h3 className="font-bold text-slate-900">Recent Shipments</h3>
              <Link to="/client/orders" className="text-sm font-bold text-indigo-600 flex items-center gap-1 hover:underline">
                View All <ArrowRight size={14} />
              </Link>
            </div>
            <div className="divide-y divide-slate-100">
              {clientOrders.slice(0, 5).map(order => (
                <div key={order.id} className="p-4 flex items-center justify-between hover:bg-slate-50 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="p-2 bg-slate-100 rounded-lg text-slate-400">
                      <Package size={20} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-slate-900">{order.trackingId}</p>
                      <p className="text-xs text-slate-500">{order.customerName} • {order.deliveryAddress.city}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <StatusBadge status={order.status} />
                    <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Updated {formatDate(order.updatedAt)}</p>
                  </div>
                </div>
              ))}
              {clientOrders.length === 0 && (
                <div className="p-12 text-center text-slate-400">
                  <p>No orders placed yet.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="space-y-6">
          {/* Quick Actions */}
          <div className="bg-indigo-600 p-6 rounded-xl text-white shadow-lg shadow-indigo-200/50">
            <h3 className="font-bold text-lg mb-4">New Shipment</h3>
            <p className="text-indigo-100 text-sm mb-6 leading-relaxed">
              Ready to ship? Create a single delivery or upload a batch file to start logistics.
            </p>
            <div className="space-y-3">
              <Link 
                to="/create-order" 
                className="block w-full text-center py-2.5 bg-white text-indigo-600 font-bold rounded-lg hover:bg-indigo-50 transition-colors"
              >
                Create Single Order
              </Link>
              <Link 
                to="/create-order" 
                state={{ activeTab: 'BULK' }}
                className="block w-full text-center py-2.5 bg-indigo-500/20 border border-indigo-400/30 text-white font-bold rounded-lg hover:bg-indigo-500/40 transition-colors"
              >
                Bulk Upload (CSV)
              </Link>
            </div>
          </div>
          
          {/* Payment Status */}
          <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm">
            <h3 className="font-bold text-slate-900 mb-4">Billing Status</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Unpaid Invoices</span>
                <span className="font-bold text-slate-900">1</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-slate-500">Next Due Date</span>
                <span className="font-bold text-rose-600">May 15, 2026</span>
              </div>
              <Link 
                to="/client/billing" 
                className="block w-full text-center py-2 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 hover:bg-slate-50"
              >
                View Statements
              </Link>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
