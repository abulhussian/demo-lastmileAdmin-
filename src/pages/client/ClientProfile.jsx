import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { Shield, Phone, Mail, MapPin, Building, CreditCard, Star, CheckCircle, AlertCircle, X } from 'lucide-react';
import { cn, formatCurrency } from '../../lib/utils';

const ClientProfile = () => {
  const { currentUser, updateUser, showToast } = useLogistics();
  const [activeTab, setActiveTab] = useState('PERSONAL');
  const [isSaving, setIsSaving] = useState(false);

  // Form states
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [billingEmail, setBillingEmail] = useState('');
  const [street, setStreet] = useState('');
  const [city, setCity] = useState('');
  const [state, setState] = useState('');
  const [zip, setZip] = useState('');

  // Sync form state when currentUser changes
  React.useEffect(() => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setCompanyName(currentUser.companyDetails?.companyName || '');
      setBillingEmail(currentUser.companyDetails?.billingEmail || '');
      setStreet(currentUser.companyDetails?.address?.street || '');
      setCity(currentUser.companyDetails?.address?.city || '');
      setState(currentUser.companyDetails?.address?.state || '');
      setZip(currentUser.companyDetails?.address?.zip || '');
    }
  }, [currentUser]);

  const hasChanges = currentUser && (
    name !== (currentUser.name || '') ||
    phone !== (currentUser.phone || '') ||
    companyName !== (currentUser.companyDetails?.companyName || '') ||
    billingEmail !== (currentUser.companyDetails?.billingEmail || '') ||
    street !== (currentUser.companyDetails?.address?.street || '') ||
    city !== (currentUser.companyDetails?.address?.city || '') ||
    state !== (currentUser.companyDetails?.address?.state || '') ||
    zip !== (currentUser.companyDetails?.address?.zip || '')
  );
  
  const resetForm = () => {
    if (currentUser) {
      setName(currentUser.name || '');
      setPhone(currentUser.phone || '');
      setCompanyName(currentUser.companyDetails?.companyName || '');
      setBillingEmail(currentUser.companyDetails?.billingEmail || '');
      setStreet(currentUser.companyDetails?.address?.street || '');
      setCity(currentUser.companyDetails?.address?.city || '');
      setState(currentUser.companyDetails?.address?.state || '');
      setZip(currentUser.companyDetails?.address?.zip || '');
    }
  };


  if (!currentUser) return null;

  const handleSaveProfile = async () => {
    if (!hasChanges) {
      showToast('No changes detected', 'info');
      return;
    }
    setIsSaving(true);
    try {
      const payload = {
        ...currentUser,
        name,
        phone,
      };

      if (currentUser.role === 'CLIENT') {
        payload.companyDetails = {
          ...currentUser.companyDetails,
          companyName,
          billingEmail,
          address: {
            street,
            city,
            state,
            zip
          },
          phone: phone // Syncing main phone to company phone
        };
      }


      await updateUser(currentUser.id, payload);
      showToast('User updated successfully');

    } catch (error) {
      console.error('Failed to update profile:', error);
      showToast(error.message || 'Error updating profile', 'error');
    } finally {
      setIsSaving(false);
    }
  };

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
            {currentUser.role === 'CLIENT' && (
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
            )}
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
                  <div className="flex-1">
                    <label className="block mb-2">
                      <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Full Name</span>
                      <input
                        value={name}
                        onChange={e => setName(e.target.value)}
                        className="w-full mt-1 bg-white border border-slate-200 rounded-xl px-4 py-2.5 text-slate-900 font-bold focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                      />
                    </label>
                    <div className="flex items-center gap-4 mt-2">
                      <p className="text-slate-500 flex items-center gap-1.5 text-sm">
                        <Shield className="w-4 h-4 text-slate-400" />
                        Role: <span className="font-bold text-slate-700 capitalize">{currentUser.role?.toLowerCase()}</span>
                      </p>
                      {currentUser.rating && (
                        <p className="text-amber-500 flex items-center gap-1 text-sm font-bold bg-amber-50 px-2 py-0.5 rounded-md border border-amber-100">
                          <Star className="w-3.5 h-3.5" fill="currentColor" />
                          {currentUser.rating} Rating
                        </p>
                      )}
                    </div>
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
                        className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-3 text-slate-400 font-medium cursor-not-allowed"
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                        <Phone className="w-4 h-4 text-slate-400" /> Phone Number
                      </span>
                      <input
                        type="tel"
                        inputMode="numeric"
                        value={phone}
                        onChange={e => setPhone(e.target.value.replace(/[^0-9]/g, ''))}
                        placeholder="+91 00000 00000"
                        className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
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
            ) : currentUser.role === 'CLIENT' ? (
              <div className="space-y-8 animate-in fade-in slide-in-from-right-4 duration-300">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                  <div className="space-y-6">
                    <div>
                      <h4 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-6">Company Registry</h4>
                      <div className="space-y-5">
                        <label className="block">
                          <span className="text-sm font-semibold text-slate-700 flex items-center gap-2 mb-2">
                            <Building className="w-4 h-4 text-slate-400" /> Company Name
                          </span>
                          <input
                            value={companyName}
                            onChange={e => setCompanyName(e.target.value)}
                            className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-slate-900 font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                          />
                        </label>
                        
                        <div className="space-y-4 pt-2">
                          <span className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                            <MapPin className="w-4 h-4 text-slate-400" /> Business Address
                          </span>
                          <div className="grid grid-cols-2 gap-3">
                            <div className="col-span-2">
                              <input
                                placeholder="Street Address"
                                value={street}
                                onChange={e => setStreet(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>
                            <input
                              placeholder="City"
                              value={city}
                              onChange={e => setCity(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            />
                            <input
                              placeholder="State"
                              value={state}
                              onChange={e => setState(e.target.value)}
                              className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                            />
                            <div className="col-span-2">
                              <input
                                placeholder="Zip Code"
                                value={zip}
                                onChange={e => setZip(e.target.value)}
                                className="w-full bg-white border border-slate-200 rounded-xl px-4 py-3 text-sm font-medium focus:ring-2 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all"
                              />
                            </div>
                          </div>
                        </div>
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
                            {currentUser.companyDetails?.feeType === 'FIXED' ? formatCurrency(currentUser.companyDetails?.feeValue, currentUser.currency) : `${currentUser.companyDetails?.feeValue}%`}
                          </span>
                        </div>

                        <div className="space-y-4">
                          <p className="text-xs text-slate-400 leading-relaxed border-b border-slate-200 pb-4">
                            Your billing structure is managed by the LastMile admin. Contact support to request a rate change.
                          </p>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-1.5 pl-1">
                              Invoicing Email
                            </label>
                            <div className="relative">
                              <input
                                type="email"
                                value={billingEmail}
                                onChange={(e) => setBillingEmail(e.target.value)}
                                placeholder="billing@company.com"
                                className="w-full px-4 py-2.5 bg-white border border-slate-200 rounded-xl focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 outline-none transition-all text-sm font-medium"
                              />
                              <Mail className="absolute right-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ) : null}

            <div className="mt-12 pt-8 border-t border-slate-100 flex justify-end gap-3">
              <button 
                type="button"
                onClick={resetForm} 
                disabled={!hasChanges}
                className="px-6 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50 rounded-xl transition-all disabled:opacity-30 disabled:cursor-not-allowed"
              >
                Discard Changes
              </button>

              <button
                onClick={handleSaveProfile}
                disabled={isSaving || !hasChanges}
                className="px-8 py-2.5 text-sm font-semibold text-white bg-slate-900 rounded-xl hover:bg-black transition-all shadow-lg shadow-slate-200 disabled:opacity-50 disabled:cursor-not-allowed min-w-[140px]"
              >
                {isSaving ? (
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    Saving...
                  </div>
                ) : 'Save Changes'}
              </button>
            </div>
          </div>
        </div>
      </div>

    </MainLayout>
  );
};

export default ClientProfile;
