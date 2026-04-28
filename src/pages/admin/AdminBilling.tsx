import React, { useState } from 'react';
import { MainLayout } from '../../components/MainLayout';
import { useLogistics } from '../../contexts/LogisticsContext';
import { StatusBadge } from '../../components/Cards';
import { formatCurrency, formatDate } from '../../lib/utils';
import { FileText, Download, Filter, MoreVertical, CreditCard, Clock } from 'lucide-react';
import { cn } from '../../lib/utils';

export const AdminBilling: React.FC = () => {
  const { invoices, generateInvoices, markInvoicePaid, currentUser } = useLogistics();
  const [isGenerating, setIsGenerating] = useState(false);

  const isAdmin = currentUser?.role === 'ADMIN';

  // If client, filter invoices
  const displayInvoices = isAdmin 
    ? invoices 
    : invoices.filter(inv => inv.clientId === currentUser?.id);

  const totalOutstanding = displayInvoices.reduce((sum, inv) => sum + inv.outstandingBalance, 0);

  const handleGenerate = async () => {
    setIsGenerating(true);
    await generateInvoices();
    setIsGenerating(false);
  };

  const handleDownload = (invoice: any) => {
    const csvContent = "data:text/csv;charset=utf-8," 
      + "Invoice ID,Client,Amount,Status,Due Date\n"
      + `${invoice.id},${invoice.clientName},${invoice.amount},${invoice.status},${invoice.dueDate}`;
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `invoice-${invoice.id}.csv`);
    document.body.appendChild(link);
    link.click();
  };

  return (
    <MainLayout title={isAdmin ? "Invoicing & Master Billing" : "My Invoices"}>
      <div className="space-y-6">
        {/* Stats Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 bg-white rounded-2xl border border-slate-200 shadow-sm relative overflow-hidden group">
            <div className="absolute right-0 top-0 w-24 h-24 bg-rose-50 rounded-full -mr-12 -mt-12 transition-transform group-hover:scale-110" />
            <p className="text-xs font-bold text-slate-400 uppercase mb-1 relative z-10">Outstanding Balance</p>
            <h3 className="text-3xl font-bold text-rose-600 relative z-10">{formatCurrency(totalOutstanding)}</h3>
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
                <h3 className="text-3xl font-bold text-slate-900 relative z-10">{formatCurrency(12450)}</h3>
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
              <button className="p-2.5 border border-slate-200 rounded-xl text-slate-400 hover:bg-slate-50 transition-colors"><Filter size={18} /></button>
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
                      <p className="text-xs font-bold text-slate-900">{formatCurrency(inv.amount)}</p>
                      <p className="text-[10px] text-rose-500 font-bold uppercase mt-0.5">{inv.outstandingBalance > 0 ? `${formatCurrency(inv.outstandingBalance)} Unpaid` : 'Fully Settled'}</p>
                    </td>
                    <td className="px-8 py-5"><StatusBadge status={inv.status} /></td>
                    <td className="px-8 py-5 text-xs font-bold text-slate-500">{formatDate(inv.dueDate)}</td>
                    <td className="px-8 py-5 text-right">
                      <div className="flex items-center justify-end gap-3 translate-x-2 opacity-0 group-hover:opacity-100 group-hover:translate-x-0 transition-all">
                        {isAdmin && inv.status !== 'PAID' && (
                          <button 
                            onClick={async () => {
                              if(confirm('Confirm payment for this batch?')) {
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
                          title="Download CSV"
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
    </MainLayout>
  );
};
