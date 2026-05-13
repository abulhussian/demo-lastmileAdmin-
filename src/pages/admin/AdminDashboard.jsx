import React from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { KPICard } from '../../components/Cards';
import { 
  Package, 
  Truck, 
  Banknote, 
  Clock, 
  TrendingUp, 
  CheckCircle2, 
  AlertCircle 
} from 'lucide-react';
import { 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area
} from 'recharts';
import { cn } from '../../lib/utils';

const chartData = [
  { name: 'Mon', orders: 45, revenue: 1200 },
  { name: 'Tue', orders: 52, revenue: 1500 },
  { name: 'Wed', orders: 48, revenue: 1350 },
  { name: 'Thu', orders: 61, revenue: 1800 },
  { name: 'Fri', orders: 55, revenue: 1650 },
  { name: 'Sat', orders: 32, revenue: 900 },
  { name: 'Sun', orders: 28, revenue: 750 },
];

export const AdminDashboard = () => {
  const navigate = useNavigate();
  const { orders, drivers, revenueStats, fetchRevenueStats } = useLogistics();
  const [period, setPeriod] = React.useState('weekly');

  const stats = revenueStats?.revenue_stats;
  const totalOrders = stats?.total_orders || orders.length;
  const activeDrivers = drivers.filter(d => d.active).length;
  const totalRevenue = stats?.total_revenue || orders.reduce((sum, o) => sum + (Number(o.orderValue) || 0), 0);
  const driverCash = stats?.total_outstanding || drivers.reduce((sum, d) => sum + Math.max(0, Number(d.cashInHand) || 0), 0);

  const pendingOrders = orders.filter(o => o.status === 'PENDING').length;
  const deliveredToday = orders.filter(o => o.status === 'DELIVERED').length;

  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    // No need to fetch again if we already have both
  };

  const currentChartData = revenueStats?.charts?.[period] || chartData;

  return (
    <MainLayout title="Admin Overview">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5 mb-8">
        <KPICard 
          title="Total Orders" 
          value={totalOrders} 
          icon={Package} 
          trend={{ value: 12, isUp: true }} 
        />
        <KPICard 
          title="Active Drivers" 
          value={activeDrivers} 
          icon={Truck} 
        />
        <KPICard 
          title="Total Revenue" 
          value={totalRevenue} 
          icon={TrendingUp} 
          isCurrency 
          trend={{ value: 8, isUp: true }}
        />
        <KPICard 
          title="Settlements Pending" 
          value={driverCash} 
          icon={Banknote} 
          isCurrency
          className="border-blue-100 bg-blue-50/20"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Main Chart */}
        <div className="lg:col-span-8 bg-white p-6 rounded-[16px] border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="font-bold text-slate-900">Revenue Performance</h3>
            <div className="flex gap-2 bg-slate-100 p-1 rounded-full">
              <button 
                onClick={() => handlePeriodChange('weekly')}
                className={cn(
                  "text-[10px] font-bold uppercase px-4 py-1.5 rounded-full transition-all",
                  period === 'weekly' ? "bg-slate-950 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Weekly
              </button>
              <button 
                onClick={() => handlePeriodChange('monthly')}
                className={cn(
                  "text-[10px] font-bold uppercase px-4 py-1.5 rounded-full transition-all",
                  period === 'monthly' ? "bg-slate-950 text-white shadow-md" : "text-slate-500 hover:text-slate-900"
                )}
              >
                Monthly
              </button>
            </div>
          </div>
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={currentChartData}>
                <defs>
                  <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3B82F6" stopOpacity={0.2}/>
                    <stop offset="95%" stopColor="#3B82F6" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#F1F5F9" />
                <XAxis dataKey={revenueStats?.charts ? "label" : "name"} fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                <YAxis fontSize={11} stroke="#94A3B8" axisLine={false} tickLine={false} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: '1px solid #E2E8F0', padding: '12px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="revenue" 
                  stroke="#3B82F6" 
                  strokeWidth={3}
                  fillOpacity={1} 
                  fill="url(#colorValue)" 
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Secondary Stats */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-[16px] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-900 text-sm">Status Audit</h3>
              <Clock size={16} className="text-slate-400" />
            </div>
            <div className="space-y-6">
              {[
                { label: 'Pending Dispatch', value: pendingOrders, color: 'text-amber-500', icon: Clock },
                { label: 'Success (Today)', value: deliveredToday, color: 'text-emerald-500', icon: CheckCircle2 },
                { label: 'Active Alerts', value: 3, color: 'text-rose-500', icon: AlertCircle },
              ].map((item, idx) => (
                <div key={idx} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={cn("p-1.5 rounded-lg bg-slate-50", item.color)}>
                      <item.icon size={16} />
                    </div>
                    <span className="text-[13px] font-medium text-slate-600">{item.label}</span>
                  </div>
                  <span className="text-sm font-extrabold text-slate-900">{item.value}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="bg-[#0F172A] p-6 rounded-[16px] text-white">
            <h3 className="font-bold text-base mb-2">Fleet Snapshot</h3>
            <p className="text-slate-400 text-[12px] mb-6 leading-relaxed">System is running at 98.4% efficiency with 2 active redirects.</p>
            <div className="flex items-center justify-between border-t border-slate-800 pt-4">
              <div className="flex -space-x-2">
                {[1,2,3].map(i => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-slate-950 bg-slate-800 flex items-center justify-center font-bold text-[10px]">
                    D{i}
                  </div>
                ))}
              </div>
              <button 
                onClick={() => navigate('/admin/orders')}
                className="text-[11px] font-bold bg-blue-500 px-3 py-1.5 rounded-lg"
              >
                View Logs
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};
