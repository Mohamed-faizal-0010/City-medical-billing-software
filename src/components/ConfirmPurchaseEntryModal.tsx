import React, { useState } from 'react';
import {
  X,
  CheckCircle2,
  AlertCircle,
  FileCheck,
  Building2,
  Calendar,
  Receipt,
  Boxes,
  ShieldCheck,
  Save,
  PackageCheck,
  ArrowRight,
  Sparkles,
  Info
} from 'lucide-react';
import { PurchaseInvoiceItem } from '../types';

export interface ConfirmPurchaseEntryModalProps {
  isOpen: boolean;
  onClose: () => void;
  invoiceData: {
    distributorName: string;
    distributorGstin?: string;
    distributorPhone?: string;
    invoiceNo: string;
    invoiceDate: string;
    paymentDueDate?: string;
    notes?: string;
    items: PurchaseInvoiceItem[];
    subtotal: number;
    totalScheme: number;
    totalDiscount: number;
    taxableAmount: number;
    cgstAmount: number;
    sgstAmount: number;
    totalTax: number;
    roundOff: number;
    grandTotal: number;
    draftId?: string | null;
  };
  onSaveAsDraft: () => void;
  onConfirmAndComplete: () => void;
  isUpdatingExisting?: boolean;
}

export const ConfirmPurchaseEntryModal: React.FC<ConfirmPurchaseEntryModalProps> = ({
  isOpen,
  onClose,
  invoiceData,
  onSaveAsDraft,
  onConfirmAndComplete,
  isUpdatingExisting = false
}) => {
  const [hasVerifiedPhysicalStock, setHasVerifiedPhysicalStock] = useState(true);
  const [itemSearchFilter, setItemSearchFilter] = useState('');

  if (!isOpen) return null;

  const totalBilledUnits = invoiceData.items.reduce((sum, item) => sum + (item.billedQuantity || 0), 0);
  const totalFreeUnits = invoiceData.items.reduce((sum, item) => sum + (item.freeQuantity || 0), 0);
  const totalInwardUnits = totalBilledUnits + totalFreeUnits;

  const filteredItems = itemSearchFilter.trim()
    ? invoiceData.items.filter(
        item =>
          item.medicineName.toLowerCase().includes(itemSearchFilter.toLowerCase()) ||
          item.batchNumber.toLowerCase().includes(itemSearchFilter.toLowerCase()) ||
          (item.hsnCode && item.hsnCode.includes(itemSearchFilter))
      )
    : invoiceData.items;

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-5 animate-fadeIn">
      <div className="bg-white rounded-3xl max-w-4xl w-full border border-slate-200 shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="bg-gradient-to-r from-teal-900 via-teal-800 to-slate-900 text-white p-5 sm:p-6 flex items-start justify-between relative overflow-hidden">
          <div className="relative z-10">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold bg-teal-500/20 text-teal-300 border border-teal-400/30 mb-2">
              <FileCheck className="w-3.5 h-3.5" />
              <span>Two-Step Verification & Inward Stock Commitment</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-black tracking-tight text-white flex items-center gap-2">
              <span>Confirm & Complete Purchase Entry</span>
            </h2>
            <p className="text-xs text-teal-100/80 mt-1 max-w-2xl">
              Verify distributor invoice details, medicine batches, expiry dates, and inward quantities. Once confirmed, this invoice will be officially saved and inventory stock will be updated.
            </p>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="p-2 text-teal-200 hover:text-white hover:bg-white/10 rounded-full transition-colors cursor-pointer relative z-10"
            title="Close dialog"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-5 sm:p-6 overflow-y-auto space-y-6 flex-1 text-slate-800 text-xs">
          {/* Draft Notification Banner */}
          {invoiceData.draftId && (
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-amber-900">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-amber-200/60 text-amber-800 rounded-xl">
                  <Save className="w-4 h-4" />
                </div>
                <div>
                  <span className="font-bold text-xs">Draft Inward Entry: {invoiceData.draftId}</span>
                  <p className="text-[11px] text-amber-800/80">
                    Currently saved in drafts. Confirming will finalize and clear this draft from storage.
                  </p>
                </div>
              </div>
              <span className="text-[10px] font-black uppercase px-2 py-0.5 bg-amber-200 text-amber-900 rounded-md">
                Saved in Draft
              </span>
            </div>
          )}

          {/* Key Invoice Summary Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-2xl border border-slate-200">
            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Distributor / Supplier</span>
              <span className="font-bold text-slate-900 text-sm block truncate mt-0.5">
                {invoiceData.distributorName}
              </span>
              {invoiceData.distributorGstin && (
                <span className="text-[10px] text-slate-500 font-mono block">
                  GST: {invoiceData.distributorGstin}
                </span>
              )}
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Distributor Invoice #</span>
              <span className="font-mono font-black text-slate-900 text-sm block mt-0.5">
                {invoiceData.invoiceNo}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Bill Date: {invoiceData.invoiceDate}
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Inward Quantity</span>
              <div className="mt-0.5 flex items-baseline gap-1.5">
                <span className="font-black text-sm text-teal-800">{totalInwardUnits} Units</span>
                {totalFreeUnits > 0 && (
                  <span className="text-[10px] text-emerald-700 font-bold">({totalFreeUnits} Free)</span>
                )}
              </div>
              <span className="text-[10px] text-slate-500 block">
                Across {invoiceData.items.length} medicine line(s)
              </span>
            </div>

            <div>
              <span className="text-slate-400 text-[10px] uppercase font-bold block">Grand Total Payable</span>
              <span className="font-mono font-black text-emerald-800 text-base block mt-0.5">
                ₹{invoiceData.grandTotal.toFixed(2)}
              </span>
              <span className="text-[10px] text-slate-500 block">
                Tax: ₹{invoiceData.totalTax.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Itemized Batch & Expiry Verification Table */}
          <div className="border border-slate-200 rounded-2xl overflow-hidden">
            <div className="bg-slate-100/80 px-4 py-2.5 border-b border-slate-200 flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-800 text-xs flex items-center gap-1.5">
                  <Boxes className="w-3.5 h-3.5 text-teal-700" />
                  <span>Medicine Batches & Inward Stock Summary ({invoiceData.items.length} Serial Products)</span>
                </span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-teal-100 text-teal-900 border border-teal-300">
                  {invoiceData.items.length >= 50 ? '50+ Serials Verified' : 'Min 50 Product Serials Supported'}
                </span>
              </div>
              <div className="flex items-center gap-2">
                {invoiceData.items.length > 5 && (
                  <input
                    type="text"
                    value={itemSearchFilter}
                    onChange={e => setItemSearchFilter(e.target.value)}
                    placeholder="Search product / batch / S.No..."
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded-lg text-xs placeholder:text-slate-400 focus:outline-hidden focus:ring-1 focus:ring-teal-500 w-44"
                  />
                )}
                <span className="text-[11px] text-slate-500 font-medium">
                  FEFO Stock Update Enabled
                </span>
              </div>
            </div>

            <div className="overflow-x-auto max-h-64">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-50 text-slate-500 font-bold border-b border-slate-200 text-[11px]">
                    <th className="py-2 px-3">S.No (1-50+)</th>
                    <th className="py-2 px-3">Medicine Name</th>
                    <th className="py-2 px-3">Batch</th>
                    <th className="py-2 px-3">Expiry</th>
                    <th className="py-2 px-3 text-right">Billed Qty</th>
                    <th className="py-2 px-3 text-right">Free</th>
                    <th className="py-2 px-3 text-right">Rate (₹)</th>
                    <th className="py-2 px-3 text-right">MRP (₹)</th>
                    <th className="py-2 px-3 text-right">GST %</th>
                    <th className="py-2 px-3 text-right">Net Amount</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredItems.map((item, idx) => (
                    <tr key={item.id || idx} className="hover:bg-slate-50/60">
                      <td className="py-2 px-3 text-slate-600 font-mono font-bold text-[11px]">#{idx + 1}</td>
                      <td className="py-2 px-3 font-semibold text-slate-800">
                        {item.medicineName}
                        {item.pack && <span className="text-[10px] text-slate-400 block font-normal">{item.pack}</span>}
                      </td>
                      <td className="py-2 px-3 font-mono font-bold text-slate-900">{item.batchNumber}</td>
                      <td className="py-2 px-3 font-mono text-slate-700">{item.expiryDate}</td>
                      <td className="py-2 px-3 text-right font-bold text-slate-800">{item.billedQuantity}</td>
                      <td className="py-2 px-3 text-right font-bold text-emerald-700">
                        {item.freeQuantity > 0 ? `+${item.freeQuantity}` : '—'}
                      </td>
                      <td className="py-2 px-3 text-right font-mono">₹{item.purchaseRate.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono text-slate-600">₹{item.mrp.toFixed(2)}</td>
                      <td className="py-2 px-3 text-right font-mono">{item.gstRate}%</td>
                      <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                        ₹{item.netAmount.toFixed(2)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Financial Totals Breakdown Strip */}
          <div className="bg-slate-50 rounded-2xl p-4 border border-slate-200 flex flex-wrap items-center justify-between gap-4">
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-600">
              <div>
                <span className="text-slate-400 text-[10px] block">Subtotal:</span>
                <span className="font-mono font-bold text-slate-900">₹{invoiceData.subtotal.toFixed(2)}</span>
              </div>
              {(invoiceData.totalScheme > 0 || invoiceData.totalDiscount > 0) && (
                <div>
                  <span className="text-slate-400 text-[10px] block">Scheme & Discount:</span>
                  <span className="font-mono font-bold text-emerald-700">
                    - ₹{(invoiceData.totalScheme + invoiceData.totalDiscount).toFixed(2)}
                  </span>
                </div>
              )}
              <div>
                <span className="text-slate-400 text-[10px] block">Taxable Amount:</span>
                <span className="font-mono font-bold text-slate-900">₹{invoiceData.taxableAmount.toFixed(2)}</span>
              </div>
              <div>
                <span className="text-slate-400 text-[10px] block">GST Tax:</span>
                <span className="font-mono font-bold text-teal-800">+ ₹{invoiceData.totalTax.toFixed(2)}</span>
              </div>
            </div>

            <div className="text-right">
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider block">
                Total Invoice Amount
              </span>
              <span className="text-2xl font-black font-mono text-emerald-800">
                ₹{invoiceData.grandTotal.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Inward Verification Checkbox */}
          <div className="p-3.5 bg-teal-50/60 border border-teal-200/80 rounded-2xl flex items-start gap-3">
            <input
              type="checkbox"
              id="confirm-physical-stock-check"
              checked={hasVerifiedPhysicalStock}
              onChange={e => setHasVerifiedPhysicalStock(e.target.checked)}
              className="mt-0.5 h-4 w-4 rounded border-slate-300 text-teal-600 focus:ring-teal-500 cursor-pointer"
            />
            <label htmlFor="confirm-physical-stock-check" className="cursor-pointer">
              <span className="font-bold text-slate-900 block text-xs">
                I have inspected medicines, verified batch numbers, expiry dates, and inward quantities.
              </span>
              <span className="text-[11px] text-slate-600 block mt-0.5">
                Clicking <strong>Confirm, Complete & Save</strong> will commit this invoice to the purchase ledger, update inventory stock, clear saved draft, and close the purchase entry tab.
              </span>
            </label>
          </div>
        </div>

        {/* Modal Action Footer */}
        <div className="bg-slate-100 p-4 sm:p-5 border-t border-slate-200 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center gap-2 w-full sm:w-auto">
            {/* Hold Entry / Save in Draft Option */}
            <button
              type="button"
              onClick={() => {
                onSaveAsDraft();
                onClose();
              }}
              className="w-full sm:w-auto px-4 py-2.5 bg-amber-50 hover:bg-amber-100 text-amber-900 border border-amber-300 font-bold text-xs rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer shadow-xs"
              title="Hold this inward purchase entry in Drafts. You can resume and complete it whenever you're ready."
            >
              <Save className="w-4 h-4 text-amber-700" />
              <span>Hold Entry / Keep in Draft</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-full sm:w-auto px-4 py-2.5 bg-white hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl border border-slate-200 transition-colors cursor-pointer"
            >
              Back to Edit
            </button>
          </div>

          {/* Complete & Save Option */}
          <button
            type="button"
            disabled={!hasVerifiedPhysicalStock}
            onClick={() => {
              onConfirmAndComplete();
              onClose();
            }}
            className={`w-full sm:w-auto px-6 py-2.5 text-white font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-md transition-all cursor-pointer ${
              hasVerifiedPhysicalStock
                ? 'bg-teal-600 hover:bg-teal-700 shadow-teal-600/20'
                : 'bg-slate-400 cursor-not-allowed opacity-60'
            }`}
          >
            <CheckCircle2 className="w-4 h-4" />
            <span>
              {isUpdatingExisting ? '✓ Confirm, Update & Save' : '✓ Confirm, Complete & Save'}
            </span>
          </button>
        </div>
      </div>
    </div>
  );
};
