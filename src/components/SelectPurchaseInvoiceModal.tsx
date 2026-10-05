import React, { useState, useMemo } from 'react';
import { X, Search, Edit3, Calendar, Building2, Receipt, FileText, CheckCircle2, Clock, Trash2 } from 'lucide-react';
import { PurchaseInvoice } from '../types';

interface SelectPurchaseInvoiceModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoices: PurchaseInvoice[];
  onSelectInvoice: (invoice: PurchaseInvoice) => void;
  onDeleteInvoice?: (invoice: PurchaseInvoice) => void;
}

export const SelectPurchaseInvoiceModal: React.FC<SelectPurchaseInvoiceModalProps> = ({
  isOpen,
  onClose,
  invoices,
  onSelectInvoice,
  onDeleteInvoice,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Unpaid' | 'Paid'>('all');

  const filteredInvoices = useMemo(() => {
    let list = [...invoices].sort(
      (a, b) => new Date(b.createdAt || b.invoiceDate).getTime() - new Date(a.createdAt || a.invoiceDate).getTime()
    );

    if (statusFilter !== 'all') {
      list = list.filter((inv) => inv.paymentStatus === statusFilter);
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (inv) =>
          inv.invoiceNo.toLowerCase().includes(q) ||
          inv.distributorName.toLowerCase().includes(q) ||
          (inv.distributorGstin && inv.distributorGstin.toLowerCase().includes(q)) ||
          inv.invoiceDate.includes(q) ||
          inv.items.some((item) => item.medicineName.toLowerCase().includes(q) || item.batchNumber.toLowerCase().includes(q))
      );
    }

    return list;
  }, [invoices, searchQuery, statusFilter]);

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-3xl shadow-2xl border border-slate-200 w-full max-w-3xl overflow-hidden my-6 flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-700 to-teal-800 p-5 text-white flex items-center justify-between shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              <Receipt className="w-5 h-5 text-teal-100" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-wide">Select Purchase Entry to Edit</h3>
                <span className="px-2 py-0.5 rounded-full bg-white/20 text-white text-[10px] font-bold uppercase tracking-wider">
                  {invoices.length} Invoices
                </span>
              </div>
              <p className="text-xs text-teal-100/90 font-medium mt-0.5">
                Choose an inward invoice to load all products and distributor details into the edit form
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition-colors"
            title="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Search & Filter Toolbar */}
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row gap-3 items-center justify-between shrink-0">
          <div className="relative w-full sm:w-80">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by invoice no, distributor, medicine..."
              className="w-full pl-9 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 placeholder:text-slate-400 focus:outline-hidden focus:ring-2 focus:ring-teal-500"
              autoFocus
            />
          </div>

          <div className="flex items-center gap-1.5 self-start sm:self-auto">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider mr-1">Status:</span>
            {(['all', 'Unpaid', 'Paid'] as const).map((status) => (
              <button
                key={status}
                type="button"
                onClick={() => setStatusFilter(status)}
                className={`px-3 py-1 rounded-lg text-xs font-bold transition-colors ${
                  statusFilter === status
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-100'
                }`}
              >
                {status === 'all' ? 'All' : status}
              </button>
            ))}
          </div>
        </div>

        {/* Invoices List */}
        <div className="overflow-y-auto p-4 space-y-2.5 flex-1 divide-y divide-slate-100">
          {filteredInvoices.length === 0 ? (
            <div className="py-12 text-center text-slate-400">
              <Receipt className="w-12 h-12 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-sm text-slate-700">No purchase invoices found</p>
              <p className="text-xs text-slate-400 mt-1">
                {searchQuery ? `No records matching "${searchQuery}"` : 'No purchase entries recorded in system yet.'}
              </p>
            </div>
          ) : (
            filteredInvoices.map((inv) => (
              <div
                key={inv.id}
                className="pt-2.5 first:pt-0 pb-2.5 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 hover:bg-slate-50/80 p-3 rounded-2xl transition-colors border border-transparent hover:border-slate-200"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono font-black text-slate-900 text-sm">{inv.invoiceNo}</span>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider flex items-center gap-1 ${
                        inv.paymentStatus === 'Paid'
                          ? 'bg-emerald-100 text-emerald-800'
                          : 'bg-rose-100 text-rose-800'
                      }`}
                    >
                      {inv.paymentStatus === 'Paid' ? (
                        <CheckCircle2 className="w-3 h-3" />
                      ) : (
                        <Clock className="w-3 h-3" />
                      )}
                      <span>{inv.paymentStatus}</span>
                    </span>
                    {inv.attachment && (
                      <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-semibold flex items-center gap-1">
                        <FileText className="w-3 h-3" />
                        <span>File Attached</span>
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-600 flex-wrap">
                    <span className="flex items-center gap-1 font-bold text-teal-900">
                      <Building2 className="w-3.5 h-3.5 text-teal-600" />
                      {inv.distributorName}
                    </span>
                    <span className="flex items-center gap-1 text-slate-500 font-mono">
                      <Calendar className="w-3.5 h-3.5 text-slate-400" />
                      {inv.invoiceDate}
                    </span>
                    <span className="text-slate-500">
                      <strong>{(inv.items || []).length}</strong> items
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                  <div className="text-right">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block">Grand Total</span>
                    <span className="font-mono font-black text-slate-900 text-base">
                      ₹{inv.grandTotal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5 shrink-0">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectInvoice(inv);
                        onClose();
                      }}
                      className="px-3.5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-xs transition-all"
                      title="Load this purchase entry for editing"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>Edit Entry</span>
                    </button>
                    {onDeleteInvoice && (
                      <button
                        type="button"
                        onClick={() => {
                          onDeleteInvoice(inv);
                        }}
                        className="p-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-bold rounded-xl text-xs flex items-center transition-colors"
                        title="Delete this purchase entry"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Modal Footer */}
        <div className="p-3 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs text-slate-500 shrink-0">
          <span>
            Showing {filteredInvoices.length} of {invoices.length} invoices
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 font-bold rounded-lg text-xs"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
