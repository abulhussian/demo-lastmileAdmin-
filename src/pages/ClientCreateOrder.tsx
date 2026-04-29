import React, { useState } from 'react';
import { MainLayout } from '../components/MainLayout';
import { useLogistics } from '../contexts/LogisticsContext';
import { Package, Upload, ArrowLeft, CheckCircle2, FileSpreadsheet, X } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export const ClientCreateOrder: React.FC = () => {
  const { createOrder } = useLogistics();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState<'SINGLE' | 'BULK'>('SINGLE');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [bulkFile, setBulkFile] = useState<File | null>(null);

  const [formData, setFormData] = useState({
    customerName: '',
    customerPhone: '',
    orderValue: '',
    codAmount: '',
    pickupStreet: '',
    pickupCity: '',
    pickupZip: '',
    deliveryStreet: '',
    deliveryCity: '',
    deliveryZip: '',
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    await createOrder({
      customerName: formData.customerName,
      customerPhone: formData.customerPhone,
      orderValue: Number(formData.orderValue),
      codAmount: Number(formData.codAmount),
      pickupAddress: { street: formData.pickupStreet, city: formData.pickupCity, state: 'NY', zip: formData.pickupZip },
      deliveryAddress: { street: formData.deliveryStreet, city: formData.deliveryCity, state: 'NY', zip: formData.deliveryZip },
    });
    
    setIsSubmitting(false);
    navigate('/client/orders');
  };

  const handleBulkUpload = async () => {
    setIsSubmitting(true);
    // Simulate multi-creation from bulk
    for(let i=0; i<3; i++) {
      await createOrder({
        customerName: `Bulk Item ${i+1}`,
        customerPhone: `+1-555-000${i}`,
        orderValue: 400,
        codAmount: 0,
        pickupAddress: { street: 'Main Warehouse', city: 'NYC', state: 'NY', zip: '10001' },
        deliveryAddress: { street: `Retail Outlet ${i+1}`, city: 'NYC', state: 'NY', zip: '10002' },
      });
    }
    setIsSubmitting(false);
    navigate('/client/orders');
  };

  return (
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
                        className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500" 
                        placeholder="+1 (xxx) xxx-xxxx"
                        value={formData.customerPhone}
                        onChange={e => setFormData({...formData, customerPhone: e.target.value})}
                      />
                    </div>
                  </div>
                </div>

                {/* Section: Addresses */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Pickup Location</h3>
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
                  </div>
                  <div className="space-y-4">
                    <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4 text-indigo-600">Delivery Location</h3>
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
                  </div>
                </div>

                {/* Section: Payments */}
                <div>
                  <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-4">Value & Settlement</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6 p-6 bg-indigo-50 rounded-xl border border-indigo-100">
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">Total Order Value ($)</label>
                      <input 
                        type="number"
                        placeholder="0.00"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none" 
                        value={formData.orderValue}
                        onChange={e => setFormData({...formData, orderValue: e.target.value})}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-sm font-semibold text-slate-700">COD Amount to Collect ($)</label>
                      <input 
                        type="number"
                        placeholder="Leave 0 if prepaid"
                        className="w-full px-4 py-2 bg-white border border-slate-200 rounded-lg outline-none text-indigo-600 font-bold" 
                        value={formData.codAmount}
                        onChange={e => setFormData({...formData, codAmount: e.target.value})}
                      />
                    </div>
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
                  Download our <span className="text-indigo-600 font-bold underline cursor-pointer">template CSV</span>, fill in your daily deliveries, and drop it here to import.
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
  );
};

export default ClientCreateOrder;
