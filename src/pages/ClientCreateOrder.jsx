import React, { useState } from 'react';
import { MainLayout } from '../components/MainLayout';
import { useLogistics } from '../contexts/LogisticsContext';
import { Upload, ArrowLeft, CheckCircle2, FileSpreadsheet, X, MapPin } from 'lucide-react';
import { MapPicker } from '../components/MapPicker';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn, formatCurrency } from '../lib/utils';

export const ClientCreateOrder = () => {
  const { createOrder, bulkCreateOrders, currentUser, showToast } = useLogistics();
  const navigate = useNavigate();
  const location = useLocation();
  const [activeTab, setActiveTab] = useState(location.state?.activeTab || 'SINGLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkFile, setBulkFile] = useState(null);
  const [mapModal, setMapModal] = useState(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    orderValue: '',
    codAmount: '',
    pickupStreet: '',
    pickupCity: '',
    pickupZip: '',
    pickupLat: undefined,
    pickupLng: undefined,
    pickupAddressFull: '',
    deliveryStreet: '',
    deliveryCity: '',
    deliveryZip: '',
    deliveryLat: undefined,
    deliveryLng: undefined,
    deliveryAddressFull: '',
    feeType: '',
    feeValue: '',
    currency: 'SAR',
  });

  // Auto-populate client fees and currency
  React.useEffect(() => {
    if (currentUser?.role === 'CLIENT' && currentUser.companyDetails) {
      setFormData(prev => ({
        ...prev,
        feeType: currentUser.companyDetails.feeType || 'FIXED',
        feeValue: currentUser.companyDetails.feeValue || 0,
        currency: currentUser.currency || 'SAR'
      }));
    }
  }, [currentUser]);

  const calculateDeliveryFee = () => {
    const codAmount = Number(formData.codAmount || 0);
    const feeValue = Number(formData.feeValue || 0);
    if (formData.feeType === 'PERCENTAGE') {
      return (codAmount * feeValue) / 100;
    }
    return feeValue;
  };


  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.pickupStreet || !formData.pickupCity) {
      showToast('Please provide a complete Pickup Location', 'error');
      return;
    }

    if (!formData.deliveryStreet || !formData.deliveryCity) {
      showToast('Please provide a complete Delivery Location', 'error');
      return;
    }

    setIsSubmitting(true);
    
    const deliveryFee = calculateDeliveryFee();

    try {
      await createOrder({
        customerName: formData.customerName,
        customerPhone: formData.customerPhone,
        orderValue: Number(formData.orderValue),
        codAmount: Number(formData.codAmount),
        pickupAddress: { 
          street: formData.pickupStreet, 
          city: formData.pickupCity, 
          state: 'NY', 
          zip: formData.pickupZip,
          lat: formData.pickupLat,
          lng: formData.pickupLng
        },
        deliveryAddress: { 
          street: formData.deliveryStreet, 
          city: formData.deliveryCity, 
          state: 'NY', 
          zip: formData.deliveryZip,
          lat: formData.deliveryLat,
          lng: formData.deliveryLng
        },
        clientId: currentUser?.id,
        deliveryFee: deliveryFee,
        feeType: formData.feeType,
        feeValue: Number(formData.feeValue || 0),
        currency: formData.currency || 'SAR'
      });
      showToast('Logistics request submitted successfully');
      navigate('/client/orders');
    } catch (err) {
      showToast(err.message || 'Failed to submit logistics request', 'error');
    } finally {
      setIsSubmitting(false);
    }
  };


  const handleMapConfirm = (data) => {
    if (mapModal === 'PICKUP') {
      setFormData({
        ...formData,
        pickupStreet: data.street,
        pickupCity: data.city,
        pickupZip: data.zip,
        pickupLat: data.lat,
        pickupLng: data.lng,
        pickupAddressFull: data.address
      });
    } else if (mapModal === 'DELIVERY') {
      setFormData({
        ...formData,
        deliveryStreet: data.street,
        deliveryCity: data.city,
        deliveryZip: data.zip,
        deliveryLat: data.lat,
        deliveryLng: data.lng,
        deliveryAddressFull: data.address
      });
    }
    setMapModal(null);
  };

  const handleBulkUpload = async () => {
    if (!bulkFile) return;
    setIsSubmitting(true);
    try {
      await bulkCreateOrders(bulkFile);
      navigate('/client/orders');
    } catch (err) {
      alert(err.message || 'Failed to upload bulk orders');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
    <MainLayout title="Logistics Request">
      <div className="max-w-4xl mx-auto">
        <Link to="/client" className="flex items-center gap-2 text-slate-500 hover:text-indigo-600 transition-colors mb-6 text-sm font-medium">
          <ArrowLeft size={16} />
          Back to Dashboard
        </Link>

        {/* Tab Switcher */}
        <div className="bg-white p-1 rounded-xl border border-slate-200 flex mb-8">
          <button 
            onClick={() => setActiveTab('SINGLE')}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
              activeTab === 'SINGLE' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Single Delivery
          </button>
          <button 
            onClick={() => setActiveTab('BULK')}
            className={cn(
              "flex-1 py-2.5 rounded-lg text-sm font-bold transition-all",
              activeTab === 'BULK' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"
            )}
          >
            Batch Bulk Upload
          </button>
        </div>

        <AnimatePresence mode="wait">
          {activeTab === 'SINGLE' ? (
            <motion.form 
              key="single"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              onSubmit={handleSubmit}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
            >
              <div className="p-8 space-y-8">
                {/* Section: Customer Info */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Customer Details</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Full Name</label>
                      <input 
                        required
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                        placeholder="John Doe"
                        value={formData.customerName}
                        onChange={e => setFormData({...formData, customerName: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Phone Number</label>
                      <input 
                        required
                        type="tel"
                        pattern="[0-9]{10}"
                        maxLength={10}
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                        placeholder="10 digit number"
                        value={formData.customerPhone}
                        onChange={e => {
                          const val = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                          setFormData({...formData, customerPhone: val});
                        }}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest">Pickup Location</h3>
                      <button 
                        type="button"
                        onClick={() => setMapModal('PICKUP')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded transition-colors"
                      >
                        <MapPin size={12} />
                        Select from Map
                      </button>
                    </div>
                    <input 
                      required
                      placeholder="Street Address" 
                      className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                      value={formData.pickupStreet}
                      onChange={e => setFormData({...formData, pickupStreet: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        required
                        placeholder="City" 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" 
                        value={formData.pickupCity}
                        onChange={e => setFormData({...formData, pickupCity: e.target.value})}
                      />
                      <input 
                        required
                        placeholder="Zip" 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" 
                        value={formData.pickupZip}
                        onChange={e => setFormData({...formData, pickupZip: e.target.value})}
                      />
                    </div>
                    <input 
                      placeholder="Full Address" 
                      readOnly
                      className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none text-xs text-slate-500 italic" 
                      value={formData.pickupAddressFull}
                    />
                  </div>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest text-indigo-600">Delivery Location</h3>
                      <button 
                        type="button"
                        onClick={() => setMapModal('DELIVERY')}
                        className="text-xs font-bold text-indigo-600 hover:text-indigo-700 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded transition-colors"
                      >
                        <MapPin size={12} />
                        Select from Map
                      </button>
                    </div>
                    <input 
                      required
                      placeholder="Destination Street" 
                      className="w-full px-4 py-2 bg-slate-50 border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 shadow-sm shadow-indigo-100" 
                      value={formData.deliveryStreet}
                      onChange={e => setFormData({...formData, deliveryStreet: e.target.value})}
                    />
                    <div className="grid grid-cols-2 gap-3">
                      <input 
                        required
                        placeholder="City" 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" 
                        value={formData.deliveryCity}
                        onChange={e => setFormData({...formData, deliveryCity: e.target.value})}
                      />
                      <input 
                        required
                        placeholder="Zip" 
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none" 
                        value={formData.deliveryZip}
                        onChange={e => setFormData({...formData, deliveryZip: e.target.value})}
                      />
                    </div>
                    <input 
                      placeholder="Full Address" 
                      readOnly
                      className="w-full px-4 py-2 bg-slate-50/50 border border-slate-200 rounded-lg outline-none text-xs text-slate-500 italic" 
                      value={formData.deliveryAddressFull}
                    />
                  </div>
                </div>

                {/* Section: Payments & Fees */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Value & Settlement</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Total Order Value ({formData.currency || 'SAR'})</label>
                      <input 
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="0.00"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none" 
                        value={formData.orderValue}
                        onChange={e => setFormData({...formData, orderValue: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">COD Amount to Collect ({formData.currency || 'SAR'})</label>
                      <input 
                        type="number"
                        required
                        min="0.01"
                        step="0.01"
                        placeholder="Amount to collect"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-indigo-600 font-bold" 
                        value={formData.codAmount}
                        onChange={e => setFormData({...formData, codAmount: e.target.value})}
                      />
                    </div>

                    <div className="md:col-span-2 pt-4 border-t border-indigo-100 flex items-center justify-between">
                      <div>
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Calculated Delivery Fee</p>
                        <p className="text-xl font-black text-indigo-600">{formatCurrency(calculateDeliveryFee(), formData.currency || currentUser?.currency)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Model</p>
                        <p className="text-xs font-bold text-slate-600">{formData.feeType === 'PERCENTAGE' ? `${formData.feeValue}% of COD` : 'Fixed Rate'}</p>
                      </div>
                    </div>

                    {/* Admin Fee Options */}
                    {currentUser?.role === 'ADMIN' && (
                      <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-6 pt-4 border-t border-indigo-100/50 mt-2 animate-in fade-in slide-in-from-top-2">
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-indigo-600">Fee Type</label>
                          <select 
                            className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={formData.feeType}
                            onChange={e => setFormData({...formData, feeType: e.target.value})}
                          >
                            <option value="FIXED">Fixed per Delivery</option>
                            <option value="PERCENTAGE">Percentage of Value</option>
                          </select>
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-indigo-600">Fee Value {formData.feeType === 'PERCENTAGE' ? '(%)' : `(${formData.currency || 'SAR'})`}</label>
                          <input 
                            type="number"
                            min="0"
                            className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                            placeholder="30"
                            value={formData.feeValue}
                            onChange={e => {
                              const val = e.target.value;
                              if (val !== '' && Number(val) < 0) {
                                setFormData({...formData, feeValue: '0'});
                              } else {
                                setFormData({...formData, feeValue: val});
                              }
                            }}
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-sm font-bold text-indigo-600">Currency</label>
                          <select 
                            className="w-full px-4 py-2 bg-white border border-indigo-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20"
                            value={formData.currency}
                            onChange={e => setFormData({...formData, currency: e.target.value})}
                          >
                            <option value="SAR">SAR (Saudi Riyal)</option>
                            <option value="USD">USD (US Dollar)</option>
                            <option value="AED">AED (UAE Dirham)</option>
                            <option value="EUR">EUR (Euro)</option>
                            <option value="EGP">EGP (Egyptian Pound)</option>
                            <option value="KWD">KWD (Kuwaiti Dinar)</option>
                            <option value="BHD">BHD (Bahraini Dinar)</option>
                            <option value="QAR">QAR (Qatari Riyal)</option>
                            <option value="OMR">OMR (Omani Rial)</option>
                          </select>
                        </div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              <div className="p-6 bg-slate-50 border-t border-slate-100 flex justify-end gap-3">
                <button type="button" onClick={() => navigate('/client/orders')} className="px-6 py-2 text-sm font-bold text-slate-500 hover:text-slate-700 transition-colors">
                  Cancel
                </button>
                <button 
                  disabled={isSubmitting}
                  className="px-10 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                      Processing...
                    </>
                  ) : (
                    <>Submit Logistics Request</>
                  )}
                </button>
              </div>
            </motion.form>
          ) : (
            <motion.div 
              key="bulk"
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -10 }}
              className="bg-white rounded-2xl border-2 border-dashed border-slate-200 p-12 text-center"
            >
              <div className="max-w-md mx-auto">
                <div className="w-20 h-20 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-6">
                  <FileSpreadsheet size={36} />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">Bulk Order Upload</h3>
                <p className="text-slate-500 mb-8 leading-relaxed">
                  Download our <a href="/sample_orders.csv" download className="text-indigo-600 font-bold underline cursor-pointer">template CSV</a>, fill in your daily deliveries, and drop it here to import.
                </p>

                {!bulkFile ? (
                   <label className="block w-full py-16 border-2 border-dashed border-indigo-200 rounded-2xl bg-indigo-50/30 hover:bg-indigo-50 transition-colors cursor-pointer group">
                    <input type="file" className="hidden" accept=".csv" onChange={(e) => setBulkFile(e.target.files?.[0] || null)} />
                    <Upload className="mx-auto mb-4 text-indigo-400 group-hover:scale-110 transition-transform" size={40} />
                    <span className="text-sm font-bold text-indigo-600">Select CSV to Upload</span>
                  </label>
                ) : (
                  <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between text-left">
                    <div className="flex items-center gap-3">
                      <CheckCircle2 className="text-emerald-500" />
                      <div>
                        <p className="text-sm font-bold text-slate-900">{bulkFile.name}</p>
                        <p className="text-xs text-slate-500">{(bulkFile.size / 1024).toFixed(1)} KB • Ready to submit</p>
                      </div>
                    </div>
                    <button onClick={() => setBulkFile(null)} className="p-1 hover:bg-emerald-100 rounded text-emerald-600"><X size={16} /></button>
                  </div>
                )}

                <div className="mt-8">
                  <button 
                    onClick={handleBulkUpload}
                    disabled={!bulkFile || isSubmitting}
                    className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {isSubmitting ? 'Importing Deliveries...' : 'Confirm & Submit Batch'}
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </MainLayout>
    {mapModal && (
      <MapPicker 
        title={mapModal === 'PICKUP' ? 'Select Pickup Location' : 'Select Delivery Location'}
        onClose={() => setMapModal(null)}
        onConfirm={handleMapConfirm}
      />
    )}
</>
  );
};

export default ClientCreateOrder;
