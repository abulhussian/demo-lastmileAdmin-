import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { formatCurrency } from '../../lib/utils';
import { api } from '../../lib/api';
import {
  Truck,
  Phone,
  Star,
  Clock,
  UserPlus,
  Search,
  Banknote,
  X,
  CheckCircle,
  AlertCircle,
  History,
  Calendar,
  ArrowDownCircle,
  Eye,
  EyeOff,
  Download,
  Compass
} from 'lucide-react';
import { cn } from '../../lib/utils';

const countryCodes = [
  '+1242', '+1246', '+1264', '+1268', '+1284', '+1340', '+1345', '+1441', '+1473', '+1649', '+1664', '+1758', '+1767', '+1784', '+1809', '+1829', '+1849', '+1868', '+1869', '+1876',
  '+998', '+996', '+995', '+994', '+993', '+992', '+977', '+976', '+975', '+974', '+973', '+972', '+971', '+970', '+968', '+967', '+966', '+965', '+964', '+963', '+962', '+961', '+960', '+886', '+880', '+856', '+855', '+853', '+852', '+850', '+689', '+687', '+685', '+679', '+678', '+677', '+676', '+675', '+674', '+673', '+672', '+670', '+599', '+598', '+597', '+595', '+593', '+592', '+591', '+590', '+509', '+508', '+507', '+506', '+505', '+504', '+503', '+502', '+501', '+500', '+423', '+421', '+420', '+389', '+387', '+386', '+385', '+382', '+381', '+380', '+378', '+377', '+376', '+375', '+374', '+373', '+372', '+371', '+370', '+359', '+358', '+357', '+356', '+355', '+354', '+353', '+352', '+351', '+350', '+299', '+298', '+297', '+291', '+290', '+269', '+268', '+267', '+266', '+265', '+264', '+263', '+262', '+261', '+260', '+258', '+257', '+256', '+255', '+254', '+253', '+252', '+251', '+250', '+249', '+248', '+247', '+246', '+245', '+244', '+243', '+242', '+241', '+240', '+239', '+238', '+237', '+236', '+235', '+234', '+233', '+232', '+231', '+230', '+229', '+228', '+227', '+226', '+225', '+224', '+223', '+222', '+221', '+220', '+218', '+216', '+213', '+212', '+211',
  '+98', '+95', '+94', '+93', '+92', '+90', '+86', '+84', '+82', '+81', '+66', '+65', '+64', '+63', '+62', '+61', '+60', '+58', '+57', '+56', '+55', '+54', '+53', '+52', '+51', '+49', '+48', '+47', '+46', '+45', '+44', '+43', '+41', '+40', '+39', '+36', '+34', '+33', '+32', '+31', '+30', '+27', '+20',
  '+7', '+1'
];

const splitPhoneNumber = (phoneStr) => {
  if (!phoneStr) return { countryCode: '+966', number: '' };
  for (const code of countryCodes) {
    if (phoneStr.startsWith(code)) {
      return { countryCode: code, number: phoneStr.substring(code.length) };
    }
  }
  if (phoneStr.startsWith('+')) {
    const match = phoneStr.match(/^\+(\d{1,4})/);
    if (match) {
      const code = '+' + match[1];
      return { countryCode: code, number: phoneStr.substring(code.length) };
    }
    return { countryCode: '+966', number: phoneStr };
  }
  return { countryCode: '+966', number: phoneStr };
};

const formatOnlineTime = (minutes) => {
  if (!minutes || minutes <= 0) return '0h';
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  if (h === 0) return `${m}m`;
  if (m === 0) return `${h}h`;
  return `${h}h ${m}m`;
};

export const AdminDrivers = () => {
  const { drivers, settleDriverCash, toggleUserStatus, addUser, showToast, fetchDrivers } = useLogistics();
  const [searchTerm, setSearchTerm] = useState('');
  const [driverZonesMap, setDriverZonesMap] = useState({});

  React.useEffect(() => {
    fetchDrivers();
  }, [fetchDrivers]);

  React.useEffect(() => {
    if (drivers && drivers.length > 0) {
      const loadDriverZones = async () => {
        const mapping = {};
        await Promise.all(
          drivers.map(async (driver) => {
            try {
              const res = await api.get(`/zones/driver/${driver.id}`);
              if (res && res.data && res.data.length > 0) {
                mapping[driver.id] = res.data[0];
              }
            } catch (e) {
              console.error(e);
            }
          })
        );
        setDriverZonesMap(mapping);
      };
      loadDriverZones();
    }
  }, [drivers]);

  const [cashFilter, setCashFilter] = useState('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [historyDriver, setHistoryDriver] = useState(null);
  const [driverHistory, setDriverHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({});
  const [phoneParts, setPhoneParts] = useState({ countryCode: '+966', number: '' });

  React.useEffect(() => {
    if (isModalOpen) {
      setPhoneParts({ countryCode: '+966', number: '' });
    }
  }, [isModalOpen]);

  const clearFieldError = (fieldName) => {
    if (fieldErrors[fieldName]) {
      setFieldErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    }
  };


  const filteredDrivers = drivers.filter(driver => {
    const name = driver.name || '';
    const vehicleNumber = driver.vehicleNumber || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    
    let matchesCash = true;
    if (cashFilter === 'ZERO') {
      matchesCash = (driver.cashInHand || 0) === 0;
    } else if (cashFilter === 'PENDING') {
      matchesCash = (driver.cashInHand || 0) > 0;
    }
    
    return matchesSearch && matchesCash;
  });

  const handleExport = () => {
    const headers = [
      'Driver ID',
      'Name',
      'Email',
      'Phone',
      'Vehicle Number',
      'Vehicle Type',
      'Status',
      'Total Deliveries',
      'Rating',
      'Cash In Hand',
      'Currency'
    ];

    const escapeCsv = (val) => {
      if (val === undefined || val === null) return '""';
      const str = String(val).replace(/"/g, '""');
      return `"${str}"`;
    };

    const csvRows = [
      headers.join(','),
      ...filteredDrivers.map(driver => [
        escapeCsv(driver.id),
        escapeCsv(driver.name),
        escapeCsv(driver.email),
        escapeCsv(driver.phone),
        escapeCsv(driver.vehicleNumber),
        escapeCsv(driver.vehicleType),
        escapeCsv(driver.active ? 'Active' : 'Inactive'),
        driver.totalDeliveries || 0,
        driver.rating || 0,
        driver.cashInHand || 0,
        escapeCsv(driver.currency || 'SAR')
      ].join(','))
    ];

    const csvString = csvRows.join('\n');
    const blob = new Blob([csvString], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `drivers-export-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleAddDriver = async (e) => {
    e.preventDefault();
    setFieldErrors({});
    
    const formData = new FormData(e.currentTarget);
    const errors = {};

    const name = (formData.get('name') || '').toString().trim();
    const email = (formData.get('email') || '').toString().trim();
    const countryCode = (formData.get('countryCode') || '').toString().trim();
    const phoneNum = (formData.get('phone') || '').toString().trim();
    const vehicleNumber = (formData.get('vehicleNumber') || '').toString().trim();
    const vehicleType = formData.get('vehicleType');
    const password = (formData.get('password') || '').toString().trim();

    if (!name) errors.name = 'Full name is required';
    if (!email) errors.email = 'Email address is required';
    if (!countryCode || countryCode === '+') {
      errors.phone = 'Valid country code (e.g. +966) is required';
    } else if (!phoneNum) {
      errors.phone = 'Phone number is required';
    }
    if (!vehicleNumber) errors.vehicleNumber = 'Vehicle plate is required';
    if (!vehicleType) errors.vehicleType = 'Vehicle type is required';
    if (!password) errors.password = 'Password is required';

    const phone = `${countryCode}${phoneNum}`;

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      showToast('Please fix the validation errors', 'error');
      return;
    }

    setSubmitting(true);
    try {
      await addUser({
        name,
        email,
        password,
        phone,
        vehicleNumber,
        vehicleType,
        role: 'DRIVER',
        active: true,
      });
      showToast('Driver registered successfully');
      setIsModalOpen(false);
    } catch (err) {
      showToast(err.message || 'Failed to register driver', 'error');
    } finally {
      setSubmitting(false);
    }
  };


  const fetchDriverHistory = async (driver) => {
    setHistoryDriver(driver);
    setLoadingHistory(true);
    try {
      // Using the specific API endpoint provided by the user
      const response = await api.get(`/cashflow/settlements/driver/${driver.id}`);
      // Assuming response.data is the array of settlements
      setDriverHistory(response.data || []);
    } catch (err) {
      console.error('Failed to fetch driver history:', err);
      showToast('Failed to load settlement history', 'error');
    } finally {
      setLoadingHistory(false);
    }
  };

  return (
    <MainLayout title="Driver Management">
      <div className="flex flex-col gap-6">
        {/* Header Actions */}
        <div className="flex flex-wrap items-center justify-between gap-4 bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="flex items-center flex-wrap gap-3 flex-1">
            <div className="relative flex-1 max-w-xs">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
              <input
                id="driver-search-input"
                type="text"
                placeholder="Search drivers by name, vehicle ID..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-sm font-medium"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
            <select
              id="driver-cash-filter"
              className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-600 outline-none hover:bg-white cursor-pointer transition-all focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              value={cashFilter}
              onChange={(e) => setCashFilter(e.target.value)}
            >
              <option value="ALL">All Cash Statuses</option>
              <option value="ZERO">0 Cash Drivers</option>
              <option value="PENDING">Pending Cash</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <button
              id="driver-export-btn"
              onClick={handleExport}
              className="bg-white text-slate-700 border border-slate-200 px-4 py-2 rounded-lg text-sm font-bold flex items-center gap-2 hover:bg-slate-50 transition-all shadow-sm active:scale-95"
            >
              <Download size={18} />
              Export
            </button>
            <button
              id="driver-register-btn"
              onClick={() => setIsModalOpen(true)}
              className="bg-indigo-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-indigo-700 transition-all shadow-md active:scale-95"
            >
              <UserPlus size={18} />
              Register Driver
            </button>
          </div>
        </div>

        {/* Driver Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredDrivers.map((driver) => (
            <div key={driver.id} className={cn(
              "bg-white rounded-2xl border transition-all duration-300 group overflow-hidden",
              driver.active 
                ? (driver.isOnline ? "border-indigo-200 hover:shadow-xl shadow-indigo-50/50" : "border-slate-200 hover:shadow-md")
                : "border-slate-100 opacity-60 grayscale-[0.5]"
            )}>
              {/* Header Info */}
              <div className="p-6 pb-4 flex items-start justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-14 h-14 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 font-bold border border-slate-200 group-hover:bg-indigo-600 group-hover:text-white transition-all text-xl">
                    {driver.name.charAt(0)}
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-bold text-slate-900 text-base leading-tight">{driver.name}</h3>
                      <span className={cn(
                        "w-2 h-2 rounded-full",
                        driver.isOnline ? "bg-emerald-500 animate-pulse" : "bg-slate-300"
                      )} title={driver.isOnline ? 'Online' : 'Offline'} />
                    </div>
                    <div className="flex flex-col gap-1 mt-1">
                      <div className="flex items-center gap-1.5 text-slate-400">
                        <Truck size={12} />
                        <span className="text-[10px] font-bold uppercase tracking-widest">{driver.vehicleNumber}</span>
                      </div>
                      {driverZonesMap[driver.id] ? (
                        <div className="flex items-center gap-1 text-[10px] font-bold text-indigo-600">
                          <Compass size={11} className="shrink-0" />
                          <span>Zone: {driverZonesMap[driver.id].name}</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-[10px] font-medium text-slate-400">
                          <Compass size={11} className="shrink-0" />
                          <span>No Zone Assigned</span>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => toggleUserStatus(driver.id, !!driver.active)}
                  className={cn(
                    "px-2 py-1 rounded-lg text-[10px] font-bold transition-all border",
                    driver.isOnline
                      ? "bg-emerald-50 text-emerald-600 border-emerald-100 hover:bg-emerald-100"
                      : "bg-slate-50 text-slate-400 border-slate-200 hover:bg-slate-100"
                  )}
                >
                  {driver.isOnline ? 'ACTIVE' : 'OFFLINE'}
                </button>
              </div>

              {/* Stats Bar */}
              <div className="px-6 py-4 bg-slate-50 flex items-center justify-between border-y border-slate-100">
                <div className="text-center flex-1 border-r border-slate-200">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter mb-1">Deliveries</p>
                  <p className="text-base font-bold text-slate-900">{driver.totalDeliveries}</p>
                </div>
                <div className="text-center flex-1 border-r border-slate-200 px-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter mb-1">Rating</p>
                  <div className="flex items-center justify-center gap-1 text-amber-500">
                    <span className="text-base font-bold">{driver.rating}</span>
                    <Star size={10} fill="currentColor" />
                  </div>
                </div>
                <div className="text-center flex-1 px-2">
                  <p className="text-[10px] uppercase font-bold text-slate-400 tracking-tighter mb-1">In Hand</p>
                  <p className={cn(
                    "text-base font-bold",
                    driver.cashInHand > 0 ? "text-indigo-600" : "text-slate-400"
                  )}>
                    {formatCurrency(driver.cashInHand, driver.currency)}
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
                    <span className="text-[12px] font-medium whitespace-nowrap">
                      {driver.isOnline ? `Online ${formatOnlineTime(driver.onlineMinutes)}` : 'Offline'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-3 pt-2">
                  <button
                    onClick={async () => {
                      if (confirm(`Collect ${formatCurrency(driver.cashInHand, driver.currency)} from ${driver.name}?`)) {
                        try {
                          await settleDriverCash(driver.id, driver.cashInHand);
                          showToast(`Successfully collected ${formatCurrency(driver.cashInHand, driver.currency)} from ${driver.name}`);
                        } catch (err) {
                          showToast(err.message || 'Failed to settle cash', 'error');
                        }
                      }
                    }}
                    disabled={driver.cashInHand <= 0 || !driver.active}
                    className="flex-1 bg-indigo-600 text-white py-2.5 rounded-xl font-bold text-xs flex items-center justify-center gap-2 hover:bg-slate-900 transition-all disabled:opacity-30 disabled:grayscale shadow-sm active:scale-95"
                  >
                    <Banknote size={14} />
                    Settle Now
                  </button>
                  <button 
                    onClick={() => fetchDriverHistory(driver)}
                    className="flex-1 bg-slate-100 text-slate-600 py-2.5 rounded-xl font-bold text-xs hover:bg-slate-200 transition-all flex items-center justify-center gap-2"
                  >
                    <History size={14} />
                    History
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {historyDriver && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-indigo-600 text-white flex items-center justify-center font-bold text-lg">
                  {historyDriver.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">{historyDriver.name}'s Settlement History</h3>
                  <p className="text-xs text-slate-500 font-medium">{historyDriver.vehicleNumber} • {historyDriver.phone}</p>
                </div>
              </div>
              <button onClick={() => setHistoryDriver(null)} className="p-2 text-slate-400 hover:text-slate-600 bg-white rounded-xl border border-slate-100 shadow-sm transition-all">
                <X size={20} />
              </button>
            </div>

            <div className="max-h-[60vh] overflow-y-auto">
              {loadingHistory ? (
                <div className="p-20 text-center flex flex-col items-center">
                  <div className="w-10 h-10 border-4 border-indigo-100 border-t-indigo-600 rounded-full animate-spin mb-4" />
                  <p className="text-sm font-medium text-slate-400">Loading history...</p>
                </div>
              ) : driverHistory.length > 0 ? (
                <div className="divide-y divide-slate-50">
                  {driverHistory.map((log) => (
                    <div key={log.id} className="p-6 flex items-center justify-between hover:bg-slate-50/50 transition-colors">
                      <div className="flex items-center gap-4">
                        <div className="p-3 bg-emerald-50 text-emerald-600 rounded-xl">
                          <ArrowDownCircle size={20} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-slate-900">Admin Collection</p>
                          <div className="flex items-center gap-2 mt-0.5">
                            <Calendar size={12} className="text-slate-400" />
                            <p className="text-[11px] text-slate-400 font-medium">{new Date(log.created_at || log.date).toLocaleString()}</p>
                          </div>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold text-emerald-600">+{formatCurrency(log.amount, log.currency)}</p>
                        <span className="text-[10px] font-bold text-emerald-500/60 uppercase tracking-widest">{log.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-20 text-center flex flex-col items-center">
                  <div className="w-16 h-16 bg-slate-50 rounded-full flex items-center justify-center text-slate-300 mb-4">
                    <History size={32} />
                  </div>
                  <p className="text-sm font-medium text-slate-400">No settlement history found for this driver.</p>
                </div>
              )}
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end">
              <button onClick={() => setHistoryDriver(null)} className="px-8 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-black transition-all shadow-md">
                Close History
              </button>
            </div>
          </div>
        </div>
      )}

      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl w-full max-w-md shadow-2xl p-8 transform animate-in slide-in-from-bottom-4 duration-300">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-xl font-bold text-slate-900">Register New Driver</h2>
              <button onClick={() => setIsModalOpen(false)} className="p-2 hover:bg-slate-50 rounded-lg text-slate-400"><X size={20} /></button>
            </div>
            <form onSubmit={handleAddDriver} noValidate className="space-y-5">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Driver Full Name</label>
                <input 
                  name="name" 
                  onChange={() => clearFieldError('name')}
                  className={cn(
                    "w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium",
                    fieldErrors.name ? "border-rose-300" : "border-slate-200"
                  )} 
                />
                {fieldErrors.name && <p className="text-rose-500 text-[10px] mt-1 font-bold uppercase">{fieldErrors.name}</p>}
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Vehicle Plate</label>
                  <input 
                    name="vehicleNumber" 
                    placeholder="ABC-123" 
                    onChange={() => clearFieldError('vehicleNumber')}
                    className={cn(
                      "w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium",
                      fieldErrors.vehicleNumber ? "border-rose-300" : "border-slate-200"
                    )} 
                  />
                  {fieldErrors.vehicleNumber && <p className="text-rose-500 text-[10px] mt-1 font-bold uppercase">{fieldErrors.vehicleNumber}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Vehicle Type</label>
                  <select 
                    name="vehicleType" 
                    onChange={() => clearFieldError('vehicleType')}
                    className={cn(
                      "w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium",
                      fieldErrors.vehicleType ? "border-rose-300" : "border-slate-200"
                    )}
                  >
                    <option value="Bike">Bike</option>
                    <option value="Van">Van</option>
                    <option value="Truck">Truck</option>
                  </select>
                  {fieldErrors.vehicleType && <p className="text-rose-500 text-[10px] mt-1 font-bold uppercase">{fieldErrors.vehicleType}</p>}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Email</label>
                  <input 
                    name="email" 
                    type="email" 
                    onChange={() => clearFieldError('email')}
                    className={cn(
                      "w-full px-3 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium",
                      fieldErrors.email ? "border-rose-300" : "border-slate-200"
                    )} 
                  />
                  {fieldErrors.email && <p className="text-rose-500 text-[10px] mt-1 font-bold uppercase">{fieldErrors.email}</p>}
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Phone</label>
                  <div className="flex gap-2">
                    <input
                      name="countryCode"
                      type="text"
                      placeholder="+966"
                      value={phoneParts.countryCode}
                      onChange={(e) => {
                        let val = e.target.value.replace(/[^0-9+]/g, '');
                        if (val && !val.startsWith('+')) {
                          val = '+' + val.replace(/\+/g, '');
                        } else if (val) {
                          val = '+' + val.substring(1).replace(/\+/g, '');
                        }
                        setPhoneParts(prev => ({ ...prev, countryCode: val }));
                        clearFieldError('phone');
                      }}
                      className={cn(
                        "w-[80px] shrink-0 px-3 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium",
                        fieldErrors.phone ? "border-rose-300" : "border-slate-200"
                      )}
                    />
                    <input 
                      name="phone" 
                      type="tel"
                      inputMode="numeric"
                      value={phoneParts.number}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9]/g, '');
                        setPhoneParts(prev => ({ ...prev, number: val }));
                        clearFieldError('phone');
                      }}
                      className={cn(
                        "flex-1 min-w-0 px-3 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium",
                        fieldErrors.phone ? "border-rose-300" : "border-slate-200"
                      )} 
                    />
                  </div>
                  {fieldErrors.phone && <p className="text-rose-500 text-[10px] mt-1 font-bold uppercase">{fieldErrors.phone}</p>}
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1.5">Temporary Password</label>
                <div className="relative">
                  <input 
                    name="password" 
                    type={showPassword ? "text" : "password"} 
                    defaultValue="password123" 
                    onChange={() => clearFieldError('password')}
                    className={cn(
                      "w-full px-4 py-2.5 bg-slate-50 border rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium pr-10",
                      fieldErrors.password ? "border-rose-300" : "border-slate-200"
                    )} 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors p-1"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                {fieldErrors.password && <p className="text-rose-500 text-[10px] mt-1 font-bold uppercase">{fieldErrors.password}</p>}
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
      {/* Global Toast is handled by MainLayout */}
    </MainLayout>
  );
};
