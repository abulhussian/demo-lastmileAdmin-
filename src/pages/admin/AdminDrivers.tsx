import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { StatusBadge } from '../../components/Cards';
import { formatCurrency } from '../../lib/utils';
import { 
  Truck, 
  Phone, 
  MapPin, 
  Star, 
  Clock, 
  CheckCircle2, 
  UserPlus, 
  Search,
  MoreVertical,
  Banknote,
  X
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminDrivers: React.FC = () => {
  const { drivers, settleDriverCash, toggleUserStatus, addUser } = useLogistics();
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const filteredDrivers = drivers.filter(driver => 
    driver.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    driver.vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddDriver = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    const formData = new FormData(e.currentTarget);
    await addUser({
      name: formData.get('name') as string,
      email: formData.get('email') as string,
      phone: formData.get('phone') as string,
      vehicleNumber: formData.get('vehicle') as string,
      role: 'DRIVER' as any,
      active: true,
    } as any);
    setSubmitting(false);
    setIsModalOpen(false);
  };

  return (
    <MainLayout title="Driver Management">
      <div className="flex flex-col gap-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="Search drivers by name, vehicle ID..." 
              className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <button 
            onClick={() => setIsModalOpen(true)}
            className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
          >
            <UserPlus size={18} />
            Register Driver
          </button>
        </div>

        {/* Driver Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className={cn(
              "bg-white rounded-2xl border transition-all duration-300 group overflow-hidden",
              driver.active ? "border-slate-200 hover:shadow-xl hover:border-indigo-200" : "border-slate-100 opacity-60 grayscale-[0.5]"
            )}>
              {/* Header Info */}
              <div className="p-6 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all text-xl">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-base leading-tight">{driver.name}</h3>
                    <div className="flex items-center gap-1.5 text-slate-400 mt-1">
                      <Truck size={12} />
                      <span className="text-[10px] font-bold uppercase tracking-widest">{driver.vehicleNumber}</span>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => toggleUserStatus(driver.id)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold transition-all border",
                    driver.active 
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100" 
                      : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {driver.active ? 'ACTIVE' : 'INACTIVE'}
                </button>
              </div>

              {/* Stats Bar */}
              <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-y border-slate-100">
                <div className="text-center flex-1 border-r border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter mb-1">Deliveries</p>
                  <p className="text-base font-bold text-slate-900">142</p>
                </div>
                <div className="text-center flex-1 border-r border-slate-200 px-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter mb-1">Rating</p>
                  <div className="flex items-center justify-center gap-1 text-amber-500">
                    <span className="text-base font-bold">4.8</span>
                    <Star size={10} fill="currentColor" />
                  </div>
                </div>
                <div className="text-center flex-1 px-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter mb-1">In Hand</p>
                  <p className={cn(
                    "text-base font-bold",
                    driver.cashInHand > 0 ? "text-indigo-600" : "text-slate-400"
                  )}>
                    {formatCurrency(driver.cashInHand)}
                  </p>
                </div>
              </div>

              {/* Action Area */}
              <div className="p-6 space-y-4">
                <div className="flex items-center justify-between text-slate-500">
                  <div className="flex items-center gap-2">
                    <Phone size={14} className="text-slate-300" />
                    <span className="text-[12px] font-medium">{driver.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock size={14} className="text-slate-300" />
                    <span className="text-[12px] font-medium whitespace-nowrap">Online 4h</span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button 
                    onClick={async () => {
                      if (confirm(`Collect ${formatCurrency(driver.cashInHand)} from ${driver.name}?`)) {
                        await settleDriverCash(driver.id);
                      }
                    }}
                    disabled={driver.cashInHand <= 0 || !driver.active}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-900 transition-all disabled:opacity-30 disabled:grayscale shadow-sm active:scale-95"
                  >
                    <Banknote size={14} />
                    Settle Now
                  </button>
                  <button className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all">
                    History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-8">
               <h2 className="text-xl font-bold text-slate-900">Register New Driver</h2>
               <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><X size={20}/></button>
            </div>
            <form onSubmit={handleAddDriver} className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Driver Full Name</label>
                <input name="name" required className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
              </div>
               <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Vehicle Number / ID</label>
                <input name="vehicle" required placeholder="e.g. TRK-9901" className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Email</label>
                  <input name="email" type="email" required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Phone</label>
                  <input name="phone" required className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium" />
                </div>
              </div>
             
              <div className="flex justify-end gap-3 mt-10">
                <button type="button" onClick={() => setIsModalOpen(false)} className="px-5 py-2.5 text-slate-500 hover:bg-slate-50 rounded-xl font-bold text-xs">Cancel</button>
                <button type="submit" disabled={submitting} className="px-8 py-2.5 bg-indigo-600 text-white rounded-xl font-bold text-xs hover:bg-indigo-700 shadow-lg shadow-indigo-100 transition-all active:scale-95 disabled:opacity-50">
                   {submitting ? 'Registering...' : 'Complete Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </MainLayout>
  );
};
