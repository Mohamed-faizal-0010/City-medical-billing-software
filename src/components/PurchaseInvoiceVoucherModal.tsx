import React, { useState } from 'react';
import {
  Printer,
  X,
  FileText,
  CheckCircle2,
  Building2,
  Calendar,
  CreditCard,
  PackageCheck,
  Download,
  FileSpreadsheet,
  Paperclip,
  Eye,
  Edit3,
  ExternalLink,
  Image as ImageIcon,
  FileUp,
  Maximize2,
  Minimize2,
  Trash2
} from 'lucide-react';
import { PurchaseInvoice } from '../types';
import { StorageService } from '../services/storage';
import { exportPurchaseInvoiceToPDF, exportPurchaseInvoiceToExcel } from '../utils/exportUtils';

interface PurchaseInvoiceVoucherModalProps {
  invoice: PurchaseInvoice | null;
  onClose: () => void;
  onMarkPaid?: (invoiceId: string) => void;
  onEditInvoice?: (invoice: PurchaseInvoice) => void;
  onDeleteInvoice?: (invoice: PurchaseInvoice) => void;
  onUploadUpdate?: (invoice: PurchaseInvoice) => void;
}

export const PurchaseInvoiceVoucherModal: React.FC<PurchaseInvoiceVoucherModalProps> = ({
  invoice,
  onClose,
  onMarkPaid,
  onEditInvoice,
  onDeleteInvoice,
  onUploadUpdate
}) => {
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [isFullScreen, setIsFullScreen] = useState(false);

  if (!invoice) return null;

  const pharmacyProfile = StorageService.getPharmacyProfile();

  const handleDownloadAttachment = () => {
    if (!invoice.attachment?.dataUrl) return;
    const link = document.createElement('a');
    link.href = invoice.attachment.dataUrl;
    link.download = invoice.attachment.name || `Invoice_${invoice.invoiceNo}_document`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div
      className={`fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center ${
        isFullScreen ? 'p-0 overflow-hidden' : 'p-3 lg:p-6 overflow-y-auto'
      }`}
    >
      <div
        className={`bg-white border border-slate-200 transition-all duration-200 space-y-6 ${
          isFullScreen
            ? 'w-full h-full max-w-none rounded-none shadow-none p-6 lg:p-10 overflow-y-auto max-h-none'
            : 'rounded-3xl shadow-2xl max-w-4xl w-full p-6 lg:p-8 max-h-[92vh] overflow-y-auto'
        }`}
      >
        {/* Header & Actions */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 text-emerald-800 flex items-center justify-center shrink-0">
              <PackageCheck className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-xl font-bold text-slate-900">Purchase Inward Bill / Goods Receipt</h2>
                {invoice.attachment && (
                  <span className="px-2 py-0.5 rounded-md bg-teal-50 text-teal-700 border border-teal-200 text-[10px] font-bold flex items-center gap-1">
                    <Paperclip className="w-3 h-3" />
                    <span>Doc Attached</span>
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 font-mono">Invoice Ref: #{invoice.invoiceNo} • ID: {invoice.id}</p>
            </div>
          </div>
          <div className="flex items-center flex-wrap gap-2 w-full sm:w-auto justify-end">
            {onUploadUpdate && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUploadUpdate(invoice);
                }}
                className="px-3 py-2 bg-teal-50 hover:bg-teal-100 text-teal-800 border border-teal-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                title="Upload new document or update entry items"
              >
                <FileUp className="w-3.5 h-3.5 text-teal-600" />
                <span>Upload Update</span>
              </button>
            )}
            {onEditInvoice && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onEditInvoice(invoice);
                }}
                className="px-3 py-2 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                title="Edit / Update this purchase entry"
              >
                <Edit3 className="w-3.5 h-3.5" />
                <span>Edit Entry</span>
              </button>
            )}
            {onDeleteInvoice && (
              <button
                type="button"
                onClick={() => {
                  if (
                    window.confirm(
                      `Are you sure you want to permanently delete purchase inward bill #${invoice.invoiceNo} from ${invoice.distributorName} (₹${(invoice.grandTotal || 0).toFixed(2)})?\n\nThis will remove the invoice, roll back batch stock, and adjust distributor payable balance.`
                    )
                  ) {
                    onClose();
                    onDeleteInvoice(invoice);
                  }
                }}
                className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                title="Permanently delete this inward bill and revert inventory & ledger"
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                <span>Delete Entry</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => exportPurchaseInvoiceToPDF(invoice, pharmacyProfile)}
              className="px-3 py-2 bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title="Download PDF Voucher"
            >
              <Download className="w-3.5 h-3.5" />
              <span>PDF</span>
            </button>
            <button
              type="button"
              onClick={() => exportPurchaseInvoiceToExcel(invoice, pharmacyProfile)}
              className="px-3 py-2 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title="Download Excel Sheet"
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Excel</span>
            </button>
            <button
              type="button"
              onClick={() => window.print()}
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Printer className="w-3.5 h-3.5" />
              <span>Print</span>
            </button>
            <button
              type="button"
              onClick={() => setIsFullScreen(prev => !prev)}
              id="voucher-fullscreen-toggle-btn"
              className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title={isFullScreen ? 'Exit Full Screen' : 'View Full Screen'}
            >
              {isFullScreen ? (
                <>
                  <Minimize2 className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Exit Full Screen</span>
                </>
              ) : (
                <>
                  <Maximize2 className="w-3.5 h-3.5 text-slate-700" />
                  <span className="hidden sm:inline">Full Screen</span>
                </>
              )}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Sheet */}
        <div className="border border-slate-200 rounded-2xl p-5 lg:p-6 bg-slate-50/50 space-y-6 print:border-none print:p-0">
          {/* Pharmacy & Distributor Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-b border-slate-200 pb-5">
            <div>
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block mb-1">
                Billed To (Pharmacy)
              </span>
              <h3 className="font-extrabold text-slate-900 text-base">{pharmacyProfile.name}</h3>
              <p className="text-xs text-slate-600 mt-0.5">{pharmacyProfile.addressLine1}, {pharmacyProfile.taluk}</p>
              <p className="text-xs text-slate-600">{pharmacyProfile.district}, {pharmacyProfile.state} - {pharmacyProfile.pincode}</p>
              <p className="text-xs text-slate-500 mt-1 font-mono">GSTIN: {pharmacyProfile.gstin}</p>
              <p className="text-xs text-slate-500 font-mono">D.L. No: {pharmacyProfile.drugLicenseNo}</p>
            </div>

            <div className="bg-white p-3.5 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center gap-3">
                {invoice.distributorImage ? (
                  <img
                    src={invoice.distributorImage}
                    alt={invoice.distributorName}
                    className="w-12 h-12 rounded-xl object-cover border border-slate-200 shrink-0 shadow-2xs"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 font-black">
                    <Building2 className="w-6 h-6 text-teal-600" />
                  </div>
                )}
                <div>
                  <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider block">
                    Distributor / Agency Details
                  </span>
                  <h4 className="font-bold text-slate-900 text-sm">{invoice.distributorName}</h4>
                </div>
              </div>
              {invoice.distributorGstin && (
                <p className="text-xs text-slate-600 font-mono">GSTIN: {invoice.distributorGstin}</p>
              )}
              {invoice.distributorPhone && (
                <p className="text-xs text-slate-600">Contact: {invoice.distributorPhone}</p>
              )}
              <div className="pt-2 mt-2 border-t border-slate-100 grid grid-cols-2 gap-2 text-xs">
                <div>
                  <span className="text-slate-400 block text-[10px]">Invoice Date:</span>
                  <span className="font-semibold text-slate-800">{invoice.invoiceDate}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[10px]">Payment Due Date:</span>
                  <span className="font-semibold text-slate-800">{invoice.paymentDueDate}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Attached Document Banner (if attached) */}
          {invoice.attachment && (
            <div className="p-3 bg-white rounded-xl border border-teal-200 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-teal-50 border border-teal-200 text-teal-700 flex items-center justify-center shrink-0">
                  {invoice.attachment.type === 'image' ? (
                    <ImageIcon className="w-5 h-5" />
                  ) : invoice.attachment.type === 'pdf' ? (
                    <FileText className="w-5 h-5" />
                  ) : (
                    <FileSpreadsheet className="w-5 h-5" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-slate-900 truncate max-w-[240px] sm:max-w-[320px]">
                      {invoice.attachment.name}
                    </span>
                    <span className="text-[10px] uppercase font-bold px-1.5 py-0.5 rounded bg-slate-100 text-slate-600">
                      {invoice.attachment.type}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {invoice.attachment.size ? `${(invoice.attachment.size / 1024).toFixed(1)} KB • ` : ''}
                    Uploaded supplier invoice document
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
                {invoice.attachment.dataUrl && (
                  <button
                    type="button"
                    onClick={() => setShowDocumentModal(true)}
                    className="px-2.5 py-1.5 bg-teal-50 hover:bg-teal-100 text-teal-800 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>View Doc</span>
                  </button>
                )}
                {invoice.attachment.dataUrl && (
                  <button
                    type="button"
                    onClick={handleDownloadAttachment}
                    className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Download File</span>
                  </button>
                )}
                {onUploadUpdate && (
                  <button
                    type="button"
                    onClick={() => {
                      onClose();
                      onUploadUpdate(invoice);
                    }}
                    className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-semibold rounded-lg text-xs flex items-center gap-1 transition-colors"
                  >
                    <FileUp className="w-3.5 h-3.5" />
                    <span>Update Doc</span>
                  </button>
                )}
              </div>
            </div>
          )}

          {/* If No Document Attached Banner */}
          {!invoice.attachment && onUploadUpdate && (
            <div className="p-3.5 bg-slate-100/80 rounded-xl border border-dashed border-slate-300 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <Paperclip className="w-4 h-4 text-slate-400" />
                <span className="text-xs text-slate-600 font-medium">
                  No invoice document attached to this inward bill.
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onUploadUpdate(invoice);
                }}
                className="px-3 py-1.5 bg-white hover:bg-slate-50 text-indigo-700 border border-indigo-200 font-bold rounded-lg text-xs flex items-center gap-1.5 transition-colors"
              >
                <FileUp className="w-3.5 h-3.5" />
                <span>Upload Invoice (Image / PDF / XLS)</span>
              </button>
            </div>
          )}

          {/* Line Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b-2 border-slate-200 text-[11px] font-bold text-slate-600 bg-slate-100/70">
                  <th className="py-2.5 px-3">#</th>
                  <th className="py-2.5 px-3">Product Name</th>
                  <th className="py-2.5 px-2">HSN</th>
                  <th className="py-2.5 px-2">Batch</th>
                  <th className="py-2.5 px-2">Expiry</th>
                  <th className="py-2.5 px-2">Pack</th>
                  <th className="py-2.5 px-2 text-center">Box x Unit</th>
                  <th className="py-2.5 px-2 text-center">Billed</th>
                  <th className="py-2.5 px-2 text-center text-emerald-700">Free</th>
                  <th className="py-2.5 px-2 text-right">MRP</th>
                  <th className="py-2.5 px-2 text-right">Rate</th>
                  <th className="py-2.5 px-2 text-right">Disc%</th>
                  <th className="py-2.5 px-2 text-center">GST</th>
                  <th className="py-2.5 px-3 text-right">Net Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 bg-white">
                {invoice.items.map((item, idx) => (
                  <tr key={item.id || idx} className="hover:bg-slate-50/80">
                    <td className="py-2 px-3 text-slate-400 font-mono">{idx + 1}</td>
                    <td className="py-2 px-3 font-semibold text-slate-900">
                      {item.medicineName}
                      {item.genericName && (
                        <span className="block text-[10px] text-slate-400 font-normal">{item.genericName}</span>
                      )}
                    </td>
                    <td className="py-2 px-2 font-mono text-slate-600">{item.hsnCode}</td>
                    <td className="py-2 px-2 font-mono font-medium text-slate-800">{item.batchNumber}</td>
                    <td className="py-2 px-2 font-mono text-slate-600">{item.expiryDate}</td>
                    <td className="py-2 px-2 text-slate-600">{item.pack}</td>
                    <td className="py-2 px-2 text-center text-slate-600 font-mono">
                      {item.boxes} × {item.unitsPerBox}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-bold text-slate-900">
                      {item.billedQuantity}
                    </td>
                    <td className="py-2 px-2 text-center font-mono font-bold text-emerald-700">
                      {item.freeQuantity > 0 ? `+${item.freeQuantity}` : '-'}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-700">
                      ₹{(item.mrp ?? 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono font-medium text-slate-900">
                      ₹{(item.purchaseRate ?? 0).toFixed(2)}
                    </td>
                    <td className="py-2 px-2 text-right font-mono text-slate-600">
                      {item.discountPercentage > 0 ? `${item.discountPercentage}%` : '-'}
                    </td>
                    <td className="py-2 px-2 text-center font-mono text-slate-600">
                      {item.gstRate}%
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-bold text-slate-900">
                      ₹{(item.netAmount ?? 0).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Tax Breakdown & Grand Total */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-3 border-t border-slate-200">
            <div className="space-y-2 text-xs">
              <span className="font-bold text-slate-700 uppercase tracking-wider text-[11px] block">
                GST Tax Summary
              </span>
              <div className="bg-white p-3 rounded-xl border border-slate-200 space-y-1.5">
                <div className="flex justify-between text-slate-600">
                  <span>Taxable Base Value:</span>
                  <span className="font-mono font-semibold">₹{(invoice.taxableAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Central GST (CGST - 50%):</span>
                  <span className="font-mono">₹{(invoice.cgstAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>State GST (SGST - 50%):</span>
                  <span className="font-mono">₹{(invoice.sgstAmount ?? 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between font-bold text-slate-800 pt-1 border-t border-slate-100">
                  <span>Total Input Tax Credit (ITC):</span>
                  <span className="font-mono text-teal-700">₹{(invoice.totalTax ?? 0).toFixed(2)}</span>
                </div>
              </div>

              {invoice.notes && (
                <div className="p-2.5 bg-slate-100/70 rounded-xl text-slate-600 text-[11px]">
                  <span className="font-bold text-slate-700">Remarks: </span>
                  {invoice.notes}
                </div>
              )}
            </div>

            <div className="bg-white p-4 rounded-xl border border-slate-200 space-y-2 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Gross Purchase Value:</span>
                <span className="font-mono font-semibold">₹{(invoice.subtotal ?? 0).toFixed(2)}</span>
              </div>
              {invoice.totalScheme > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Scheme Discount:</span>
                  <span className="font-mono font-semibold">- ₹{(invoice.totalScheme ?? 0).toFixed(2)}</span>
                </div>
              )}
              {invoice.totalDiscount > 0 && (
                <div className="flex justify-between text-rose-600">
                  <span>Trade Discount:</span>
                  <span className="font-mono font-semibold">- ₹{(invoice.totalDiscount ?? 0).toFixed(2)}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>GST Tax (CGST + SGST):</span>
                <span className="font-mono font-semibold text-slate-800">
                  + ₹{(invoice.totalTax ?? 0).toFixed(2)}
                </span>
              </div>
              {invoice.roundOff !== 0 && (
                <div className="flex justify-between text-slate-500 text-[11px]">
                  <span>Round Off:</span>
                  <span className="font-mono">{invoice.roundOff > 0 ? `+ ₹${invoice.roundOff.toFixed(2)}` : `- ₹${Math.abs(invoice.roundOff).toFixed(2)}`}</span>
                </div>
              )}
              <div className="flex justify-between items-center pt-2 border-t-2 border-slate-200 text-sm font-black text-slate-900">
                <span>TOTAL INVOICE AMOUNT:</span>
                <span className="text-xl font-mono text-emerald-700">₹{(invoice.grandTotal ?? 0).toFixed(2)}</span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Paid Amount:</span>
                <span className="font-mono font-bold text-emerald-700">
                  ₹{(invoice.paidAmount ?? (invoice.paymentStatus === 'Paid' ? invoice.grandTotal : 0)).toFixed(2)}
                </span>
              </div>

              <div className="flex justify-between items-center text-xs">
                <span className="text-slate-600 font-medium">Balance Due:</span>
                <span className="font-mono font-bold text-rose-700">
                  ₹{(invoice.balanceAmount ?? (invoice.paymentStatus === 'Paid' ? 0 : invoice.grandTotal)).toFixed(2)}
                </span>
              </div>

              <div className="pt-2 flex items-center justify-between border-t border-slate-100">
                <span className="text-[11px] text-slate-500 font-semibold">
                  Payment Mode: <strong className="text-slate-700">{(invoice.paymentMethod || 'Credit').replace('_', ' ')}</strong>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold ${
                    invoice.paymentStatus === 'Paid' || (invoice.balanceAmount === 0 && (invoice.paidAmount || 0) > 0)
                      ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                      : invoice.paymentStatus === 'Partially Paid' || ((invoice.paidAmount || 0) > 0 && (invoice.balanceAmount || 0) > 0)
                      ? 'bg-amber-100 text-amber-800 border border-amber-200'
                      : 'bg-rose-100 text-rose-800 border border-rose-200'
                  }`}
                >
                  {invoice.paymentStatus === 'Paid' || (invoice.balanceAmount === 0 && (invoice.paidAmount || 0) > 0)
                    ? 'Paid'
                    : invoice.paymentStatus === 'Partially Paid'
                    ? 'Partially Paid'
                    : 'Unpaid / Credit'}
                </span>
              </div>

              {invoice.payments && invoice.payments.length > 0 && (
                <div className="pt-2 border-t border-slate-100 space-y-1 text-[11px]">
                  <span className="font-bold text-slate-700 block">Payment History:</span>
                  {invoice.payments.map((p, pIdx) => (
                    <div key={p.id || pIdx} className="flex justify-between text-slate-500 font-mono">
                      <span>{new Date(p.date).toLocaleDateString('en-IN')} ({p.paymentMethod.replace('_', ' ')})</span>
                      <span className="font-bold text-slate-800">₹{p.amount.toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
          <p className="text-xs text-slate-400">
            Stock automatically added to pharmacy inventory batches with real-time MRP and cost calculation.
          </p>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            {invoice.paymentStatus !== 'Paid' && onMarkPaid && (
              <button
                type="button"
                onClick={() => onMarkPaid(invoice.id)}
                className="flex-1 sm:flex-none px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1.5 transition-colors shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Mark Payment Settled</span>
              </button>
            )}
            <button
              type="button"
              onClick={onClose}
              className="flex-1 sm:flex-none px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
            >
              Close
            </button>
          </div>
        </div>
      </div>

      {/* Full Document Viewer Modal */}
      {showDocumentModal && invoice.attachment?.dataUrl && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 lg:p-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-teal-600" />
                <span className="font-bold text-slate-900 text-sm truncate max-w-md">
                  {invoice.attachment.name}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleDownloadAttachment}
                  className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-semibold rounded-lg text-xs flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
                <button
                  type="button"
                  onClick={() => setShowDocumentModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>
            <div className="p-4 flex-1 overflow-auto bg-slate-100 flex items-center justify-center">
              {invoice.attachment.type === 'image' ? (
                <img
                  src={invoice.attachment.dataUrl}
                  alt={invoice.attachment.name}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md border border-slate-200"
                />
              ) : invoice.attachment.type === 'pdf' ? (
                <iframe
                  src={invoice.attachment.dataUrl}
                  title={invoice.attachment.name}
                  className="w-full h-[75vh] rounded-lg border border-slate-200"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
                  <FileSpreadsheet className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">Spreadsheet Attachment</h3>
                  <p className="text-xs text-slate-500 mb-4">{invoice.attachment.name}</p>
                  <button
                    type="button"
                    onClick={handleDownloadAttachment}
                    className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs inline-flex items-center gap-2"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download Excel File</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

