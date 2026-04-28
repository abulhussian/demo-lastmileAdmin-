import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { User, Shield, Phone, Mail, MapPin, Building, CreditCard } from 'lucide-react';
import { cn } from '../../lib/utils';

const ClientProfile: React.FC = () => {
  const { currentUser } = useLogistics();
  const [activeTab, setActiveTab] = useState<'PERSONAL' | 'BUSINESS'>('PERSONAL');

  if (!currentUser) return null;

  return (
    <MainLayout>
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-slate-900">Account Settings</h1>
          <p className="text-slate-500">Manage your profile, business details, and preferences.</p>
        </div>

        <div className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
          <div className="flex border-b border-slate-200 bg-slate-50/50">
            <button
              onClick={() => setActiveTab('PERSONAL')}
              className={cn(
                "px-8 py-4 text-sm font-medium transition-all relative border-r border-slate-200",
                activeTab === 'PERSONAL' 
                  ? "bg-white text-indigo-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600" 
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              Personal Profile
            </button>
            <button
              onClick={() => setActiveTab('BUSINESS')}
              className={cn(
                "px-8 py-4 text-sm font-medium transition-all relative",
                activeTab === 'BUSINESS' 
                  ? "bg-white text-indigo-600 after:content-[''] after:absolute after:bottom-0 after:left-0 after:w-full after:h-0.5 after:bg-indigo-600" 
                  : "text-slate-500 hover:bg-slate-100"
              )}
            >
              Business Information
            </button>
          </div>

          <div className="p-8">
            {activeTab === 'PERSONAL' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-left-4 duration-300">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 rounded-full bg-indigo-50 flex items-center justify-center text-indigo-600 text-3xl font-bold border-2 border-indigo-100 shadow-inner">
                    {currentUser.avatar ? (
                      <img src={currentUser.avatar} alt={currentUser.name} className="w-full h-full rounded-full object-cover" />
                    ) : (
                      currentUser.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div>
                    <h3 className="text-xl font-bold text-slate-900">{currentUser.name}</h3>
                    <p className="text-slate-500 flex items-center gap-1.5 mt-1">
                      <Shield className="w-4 h-4" />
                      Role: {currentUser.role}
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-slate-100">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                        <Mail className="w-4 h-4 text-slate-400" /> Email Address
                      </span>
                      <input
                        readOnly
                        value={currentUser.email}
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-600 focus:outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-slate-400" /> Phone Number
                      </span>
                      <input
                        placeholder="+1 (555) 000-0000"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </label>
                  </div>
                  <div className="space-y-4">
                     <label className="block">
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                        Account Status
                      </span>
                      <div className="w-full bg-emerald-50 border border-emerald-100 rounded-xl px-4 py-3 flex items-center gap-2 text-emerald-700 font-medium">
                        <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                        Verified Active
                      </div>
                    </label>
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Company Registry</h4>
                      <div className="space-y-6">
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                            <Building className="w-4 h-4 text-slate-400" /> Company Name
                          </span>
                          <input
                            defaultValue={currentUser.companyDetails?.companyName}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          />
                        </label>
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-slate-400" /> Business Address
                          </span>
                          <textarea
                            rows={3}
                            placeholder="Street, City, State, ZIP"
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-700 focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all resize-none"
                          />
                        </label>
                      </div>
                    </div>
                  </div>

                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Billing Preferences</h4>
                      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-6 space-y-6">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="w-10 h-10 rounded-xl bg-white border border-slate-200 flex items-center justify-center">
                              <CreditCard className="w-5 h-5 text-indigo-600" />
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900">Fee Structure</p>
                              <p className="text-xs text-slate-500">{currentUser.companyDetails?.feeType === 'FIXED' ? 'Fixed Rate' : 'Percentage Based'}</p>
                            </div>
                          </div>
                          <span className="text-lg font-bold text-indigo-600">
                            {currentUser.companyDetails?.feeType === 'FIXED' ? `$${currentUser.companyDetails?.feeValue}` : `${currentUser.companyDetails?.feeValue}%`}
                          </span>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-xs text-slate-400 leading-relaxed">
                            Your billing structure is managed by the LogiFlow admin. Contact support to request a rate change.
                          </p>
                          <button className="w-full py-2 text-sm font-semibold text-white bg-indigo-600 rounded-xl hover:bg-indigo-700 transition-colors shadow-sm">
                            Update Invoicing Email
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end gap-3">
              <button className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all">
                Cancel
              </button>
              <button className="px-8 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-slate-800 transition-all shadow-md shadow-slate-200">
                Save Changes
              </button>
            </div>
          </div>
        </div>
      </div>
    </MainLayout>
  );
};

export default ClientProfile;
