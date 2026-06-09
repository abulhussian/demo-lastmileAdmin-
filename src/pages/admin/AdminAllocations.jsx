import React, { useState, useEffect } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { api } from '../../lib/api';
import { 
  Shuffle, 
  MapPin, 
  Clock, 
  Search, 
  Star, 
  Truck, 
  Compass, 
  ShieldAlert, 
  CheckCircle2, 
  UserCheck2,
  RefreshCw,
  Sliders,
  HelpCircle
} from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminAllocations = () => {
  const { drivers, fetchDrivers, showToast } = useLogistics();
  const [selectedStrategy, setSelectedStrategy] = useState(() => {
    return localStorage.getItem('last_mile_strategy') || 'zone';
  });
  const [loadingStrategy, setLoadingStrategy] = useState(false);
  const [saving, setSaving] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [driverZonesMap, setDriverZonesMap] = useState({});

  const [clubbingEnabled, setClubbingEnabled] = useState(() => {
    return localStorage.getItem('fifo_clubbing_enabled') === 'true';
  });
  const [maxWaitTime, setMaxWaitTime] = useState(() => {
    return localStorage.getItem('fifo_max_wait_time') || '5';
  });
  const [maxDistance, setMaxDistance] = useState(() => {
    return localStorage.getItem('fifo_max_distance') || '2';
  });

  // Fetch drivers exactly once on mount
  useEffect(() => {
    fetchDrivers();
  }, []);

  useEffect(() => {
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

  const handleSaveStrategy = async (strategyValue, extras = {}) => {
    try {
      setSaving(true);
      const payload = {
        strategy: strategyValue,
        clubbingEnabled: extras.clubbingEnabled !== undefined ? extras.clubbingEnabled : clubbingEnabled,
        maxWaitTime: extras.maxWaitTime !== undefined ? extras.maxWaitTime : maxWaitTime,
        maxDistance: extras.maxDistance !== undefined ? extras.maxDistance : maxDistance
      };
      const response = await api.post('/drivers/assignment-strategy', payload);
      if (response && response.data && response.data.strategy) {
        const updated = response.data.strategy.toLowerCase();
        setSelectedStrategy(updated);
        localStorage.setItem('last_mile_strategy', updated);
      } else {
        setSelectedStrategy(strategyValue);
        localStorage.setItem('last_mile_strategy', strategyValue);
      }
      showToast('Assignment strategy updated successfully', 'success');
    } catch (err) {
      console.error('Failed to save assignment strategy:', err);
      showToast(err.message || 'Failed to update assignment strategy', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleToggleClubbing = async (enabled) => {
    setClubbingEnabled(enabled);
    localStorage.setItem('fifo_clubbing_enabled', String(enabled));
    if (selectedStrategy === 'fifo') {
      await handleSaveStrategy('fifo', { clubbingEnabled: enabled });
    }
  };

  const handleWaitTimeChange = async (time) => {
    setMaxWaitTime(time);
    localStorage.setItem('fifo_max_wait_time', time);
    if (selectedStrategy === 'fifo') {
      await handleSaveStrategy('fifo', { maxWaitTime: time });
    }
  };

  const handleDistanceChange = async (distance) => {
    setMaxDistance(distance);
    localStorage.setItem('fifo_max_distance', distance);
    if (selectedStrategy === 'fifo') {
      await handleSaveStrategy('fifo', { maxDistance: distance });
    }
  };

  const strategies = [
    {
      id: 'fifo',
      title: 'First-In, First-Out (FIFO)',
      icon: Clock,
      description: 'Assigns pending orders to the next available driver based on the order creation timestamp.',
      badge: 'Time Optimized',
      badgeColor: 'bg-indigo-50 text-indigo-700 border-indigo-100',
      points: [
        'Preserves strict queue discipline',
        'Minimizes order waiting times in backend',
        'Simplest allocation logic with low latency'
      ]
    },
    {
      id: 'nearest',
      title: 'Nearest Driver Routing',
      icon: MapPin,
      description: 'Calculates the distance between the order pickup point and online drivers using Geohash matching.',
      badge: 'Distance Optimized',
      badgeColor: 'bg-emerald-50 text-emerald-700 border-emerald-100',
      points: [
        'Uses 9-character precision geohashes',
        'Minimizes driver travel distance to pickup',
        'Substantially reduces fuel costs'
      ]
    },
    {
      id: 'zone',
      title: 'Zone-Wise Alignment',
      icon: Compass,
      description: 'Prioritizes drivers whose registered city/zip code matches the pickup zone location directly.',
      badge: 'Territory Optimized',
      badgeColor: 'bg-amber-50 text-amber-700 border-amber-100',
      points: [
        'Groups resources by home territories',
        'Familiar route optimization for drivers',
        'Highly stable routing for high-volume cities'
      ]
    }
  ];

  // Filter drivers based on search term
  const filteredDrivers = drivers.filter(driver => {
    const name = driver.name || '';
    const vehicleNumber = driver.vehicleNumber || '';
    const matchesSearch = name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          vehicleNumber.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesSearch;
  });

  const onlineDriversCount = drivers.filter(d => d.isOnline).length;

  return (
    <MainLayout title="Order Allocations">
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-8">
        
        {/* Left Side: Auto-Assignment Settings */}
        <div className="xl:col-span-7 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 overflow-hidden">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Auto-Assignment Settings</h2>
                <p className="text-xs text-slate-500 mt-1">Configure how incoming orders are automatically matched with active drivers</p>
              </div>
              <div className="p-2.5 bg-indigo-50 rounded-xl text-indigo-600">
                <Sliders size={20} />
              </div>
            </div>

            {loadingStrategy ? (
              <div className="py-20 text-center flex flex-col items-center">
                <RefreshCw className="w-8 h-8 text-indigo-600 animate-spin mb-4" />
                <p className="text-sm font-medium text-slate-400">Loading current assignment rules...</p>
              </div>
            ) : (
              <div className="space-y-4">
                {strategies.map((strategy) => {
                  const Icon = strategy.icon;
                  const isSelected = selectedStrategy === strategy.id;
                  return (
                    <div
                      key={strategy.id}
                      onClick={() => handleSaveStrategy(strategy.id)}
                      className={cn(
                        "relative border rounded-2xl p-5 cursor-pointer transition-all duration-300 group flex flex-col md:flex-row md:items-start gap-4",
                        isSelected 
                          ? "border-indigo-600 bg-indigo-50/10 shadow-sm ring-1 ring-indigo-600/30" 
                          : "border-slate-200 hover:border-slate-300 hover:bg-slate-50/50"
                      )}
                    >
                      <div className={cn(
                        "p-3 rounded-xl transition-colors shrink-0 self-start",
                        isSelected ? "bg-indigo-600 text-white" : "bg-slate-100 text-slate-500 group-hover:bg-slate-200 group-hover:text-slate-700"
                      )}>
                        <Icon size={20} />
                      </div>
                      
                      <div className="flex-1 space-y-2">
                        <div className="flex items-center flex-wrap gap-2 justify-between">
                          <h3 className="font-bold text-slate-900 text-sm group-hover:text-indigo-600 transition-colors">
                            {strategy.title}
                          </h3>
                          <span className={cn("text-[10px] px-2 py-0.5 rounded-full font-bold border", strategy.badgeColor)}>
                            {strategy.badge}
                          </span>
                        </div>
                        
                        <p className="text-xs text-slate-500 leading-relaxed">
                          {strategy.description}
                        </p>

                        <ul className="grid grid-cols-1 md:grid-cols-2 gap-x-4 gap-y-1.5 pt-2 border-t border-slate-100">
                          {strategy.points.map((pt, idx) => (
                            <li key={idx} className="flex items-center gap-2 text-[11px] text-slate-600 font-medium">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-400 group-hover:bg-indigo-500 shrink-0" />
                              <span>{pt}</span>
                            </li>
                          ))}
                        </ul>

                        {strategy.id === 'fifo' && isSelected && (
                          <div 
                            onClick={(e) => e.stopPropagation()} 
                            className="mt-4 pt-4 border-t border-slate-100 w-full space-y-4 cursor-default"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <h4 className="text-xs font-bold text-slate-800">Enable Order Clubbing</h4>
                                <p className="text-[10px] text-slate-500">Group multiple orders together based on proximity and timing</p>
                              </div>
                              <label className="relative inline-flex items-center cursor-pointer select-none">
                                <input 
                                  type="checkbox" 
                                  className="sr-only peer" 
                                  checked={clubbingEnabled} 
                                  onChange={(e) => handleToggleClubbing(e.target.checked)} 
                                />
                                <div className="w-9 h-5 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-indigo-600"></div>
                              </label>
                            </div>

                            {clubbingEnabled && (
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-slate-50 p-3.5 rounded-xl border border-slate-200/60 transition-all">
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Max Clubbing Distance</label>
                                  <select 
                                    value={maxDistance} 
                                    onChange={(e) => handleDistanceChange(e.target.value)}
                                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-slate-700"
                                  >
                                    <option value="1">Within 1 km</option>
                                    <option value="2">Within 2 km</option>
                                    <option value="3">Within 3 km</option>
                                    <option value="5">Within 5 km</option>
                                    <option value="10">Within 10 km</option>
                                  </select>
                                </div>
                                <div className="space-y-1.5">
                                  <label className="text-[10px] font-bold text-slate-600 uppercase tracking-wider">Max Wait Time</label>
                                  <select 
                                    value={maxWaitTime} 
                                    onChange={(e) => handleWaitTimeChange(e.target.value)}
                                    className="w-full text-xs bg-white border border-slate-200 rounded-lg p-2 outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-600 font-semibold text-slate-700"
                                  >
                                    <option value="2">2 minutes</option>
                                    <option value="5">5 minutes</option>
                                    <option value="10">10 minutes</option>
                                    <option value="15">15 minutes</option>
                                  </select>
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Selected Indicator */}
                      <div className="absolute top-4 right-4">
                        {isSelected ? (
                          <div className="text-indigo-600 bg-white rounded-full p-0.5 border border-indigo-100 shadow-sm">
                            <CheckCircle2 size={20} fill="currentColor" className="text-white fill-indigo-600" />
                          </div>
                        ) : (
                          <div className="w-5 h-5 rounded-full border border-slate-300 group-hover:border-slate-400 bg-white" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            <div className="mt-6 p-4 bg-slate-50 rounded-xl border border-slate-200/60 flex items-start gap-3">
              <HelpCircle className="text-slate-400 shrink-0 mt-0.5" size={16} />
              <p className="text-[11px] text-slate-500 leading-relaxed font-medium">
                Changes take effect instantly. Any new orders published to the queue will run the newly chosen strategy rules for assignment. Active assignments are monitored continuously.
              </p>
            </div>
          </div>
        </div>

        {/* Right Side: Driver Monitor */}
        <div className="xl:col-span-5 flex flex-col gap-6">
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 flex flex-col h-[calc(100vh-140px)] min-h-[500px]">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-bold text-slate-900">Drivers Online</h2>
                <p className="text-xs text-slate-500 mt-1">Real-time status of delivery partners</p>
              </div>
              <div className="flex items-center gap-1.5 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full text-emerald-700 text-xs font-bold">
                <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                <span>{onlineDriversCount} Online</span>
              </div>
            </div>

            {/* Search */}
            <div className="relative mb-4">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
              <input
                type="text"
                placeholder="Search drivers by name or plate..."
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-xs font-semibold"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            {/* Drivers List */}
            <div className="flex-1 overflow-y-auto pr-1 space-y-3 scrollbar-thin">
              {filteredDrivers.length > 0 ? (
                filteredDrivers.map((driver) => (
                  <div 
                    key={driver.id} 
                    className={cn(
                      "p-4 rounded-xl border flex items-center justify-between transition-all",
                      driver.isOnline 
                        ? "border-emerald-100 bg-emerald-50/10" 
                        : "border-slate-100 bg-white"
                    )}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-xl bg-slate-100 border border-slate-200 text-slate-600 font-bold flex items-center justify-center text-sm uppercase">
                          {driver.name.charAt(0)}
                        </div>
                        <span className={cn(
                          "absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white",
                          driver.isOnline ? "bg-emerald-500" : "bg-slate-300"
                        )} />
                      </div>
                      <div className="min-w-0">
                        <h4 className="text-xs font-bold text-slate-900 truncate">{driver.name}</h4>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-[9px] font-extrabold uppercase text-slate-400 tracking-wider">
                            {driver.vehicleNumber || 'No plate'}
                          </span>
                          <span className="text-[10px] text-slate-300">•</span>
                          <div className="flex items-center text-amber-500 gap-0.5">
                            <span className="text-[10px] font-bold">{driver.rating || '5.0'}</span>
                            <Star size={8} fill="currentColor" />
                          </div>
                        </div>
                        {selectedStrategy === 'zone' && (
                          <div className="mt-1 flex items-center gap-1 text-[9px] font-bold text-indigo-600">
                            <Compass size={10} className="shrink-0" />
                            <span>{driverZonesMap[driver.id]?.name || 'No Zone'}</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col items-end gap-1.5">
                      <span className={cn(
                        "text-[9px] font-bold px-2 py-0.5 rounded-full uppercase border",
                        driver.isOnline 
                          ? "bg-emerald-50 text-emerald-700 border-emerald-100" 
                          : "bg-slate-50 text-slate-400 border-slate-200"
                      )}>
                        {driver.isOnline ? 'Available' : 'Offline'}
                      </span>
                      <div className="flex items-center gap-1 text-[10px] text-slate-400 font-medium">
                        <Truck size={10} />
                        <span className="capitalize">{driver.vehicleType || 'Van'}</span>
                      </div>
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-20 text-center flex flex-col items-center">
                  <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center text-slate-300 mb-3">
                    <UserCheck2 size={24} />
                  </div>
                  <p className="text-xs font-semibold text-slate-400">No matching drivers found</p>
                </div>
              )}
            </div>
          </div>
        </div>

      </div>
    </MainLayout>
  );
};
