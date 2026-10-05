import React, { useState, useEffect } from 'react';
import {
  X,
  CreditCard,
  Building2,
  CheckCircle2,
  Calendar,
  FileText,
  DollarSign,
  History,
  ShieldCheck,
  Banknote,
  Smartphone,
  Building
} from 'lucide-react';
import { PurchaseInvoice, SupplierPaymentEntry } from '../types';
import { StorageService } from '../services/storage';

interface SupplierPaymentModalProps {
  isOpen: boolean;
  invoice: PurchaseInvoice | null;
  onClose: () => void;
  onPaymentSuccess?: (updated: PurchaseInvoice) => void;
  defaultPaymentType?: 'FULL' | 'PART';
}

export const SupplierPaymentModal: React.FC<SupplierPaymentModalProps> = ({
  isOpen,
  invoice,
  onClose,
  onPaymentSuccess,
  defaultPaymentType = 'FULL'
}) => {
  const [paymentType, setPaymentType] = useState<'FULL' | 'PART'>(defaultPaymentType);
  const [amount, setAmount] = useState<string>('');
  const [paymentMethod, setPaymentMethod] = useState<'Bank_Transfer' | 'Cash' | 'UPI' | 'Cheque'>('UPI');
  const [referenceNo, setReferenceNo] = useState<string>('');
  const [bankName, setBankName] = useState<string>('');
  const [chequeNo, setChequeNo] = useState<string>('');
  const [notes, setNotes] = useState<string>('');
  const [paymentDate, setPaymentDate] = useState<string>(() => new Date().toISOString().split('T')[0]);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (invoice) {
      const grandTotal = invoice.grandTotal || 0;
      const currentPaid = invoice.paidAmount != null ? invoice.paidAmount : (invoice.paymentStatus === 'Paid' ? grandTotal : 0);
      const remainingBalance = invoice.balanceAmount != null ? invoice.balanceAmount : Math.max(0, grandTotal - currentPaid);
      
      setPaymentType(defaultPaymentType);
      if (defaultPaymentType === 'FULL') {
        setAmount(remainingBalance > 0 ? remainingBalance.toFixed(2) : '0');
      } else {
        setAmount(remainingBalance > 0 ? (remainingBalance / 2).toFixed(2) : '0');
      }
      setReferenceNo('');
      setBankName('');
      setChequeNo('');
      setNotes('');
      setError(null);
      setPaymentDate(new Date().toISOString().split('T')[0]);
    }
  }, [invoice, defaultPaymentType]);

  if (!isOpen || !invoice) return null;

  const grandTotal = invoice.grandTotal || 0;
  const currentPaid = invoice.paidAmount != null ? invoice.paidAmount : (invoice.paymentStatus === 'Paid' ? grandTotal : 0);
  const remainingBalance = invoice.balanceAmount != null ? invoice.balanceAmount : Math.max(0, grandTotal - currentPaid);
  const enteredAmount = Number(amount) || 0;
  const balanceAfterThisPayment = Math.max(0, remainingBalance - enteredAmount);

  const handleSelectFullPayment = () => {
    setPaymentType('FULL');
    setAmount(remainingBalance.toFixed(2));
    if (error) setError(null);
  };

  const handleSelectPartPayment = () => {
    setPaymentType('PART');
    if (enteredAmount >= remainingBalance) {
      setAmount((remainingBalance / 2).toFixed(2));
    }
    if (error) setError(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const payAmt = Number(amount);
    if (isNaN(payAmt) || payAmt <= 0) {
      setError('Please enter a valid payment amount greater than ₹0.00');
      return;
    }
    if (payAmt > remainingBalance) {
      setError(`Payment amount cannot exceed the pending balance of ₹${remainingBalance.toFixed(2)}.`);
      return;
    }

    setIsProcessing(true);
    try {
      const updated = StorageService.recordSupplierPayment(invoice.id, {
        amount: payAmt,
        paymentMethod,
        referenceNo: referenceNo.trim() || undefined,
        notes: notes.trim() || undefined,
        recordedBy: 'Accounts Pharmacist'
      });

      if (updated && onPaymentSuccess) {
        onPaymentSuccess(updated);
      }
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Failed to record supplier payment.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-5 bg-gradient-to-r from-teal-800 via-slate-900 to-teal-950 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-teal-300" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-black tracking-tight text-white flex items-center gap-2">
                <span>Record Supplier Payment</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-300 border border-teal-400/30">
                  {invoice.invoiceNo}
                </span>
              </h2>
              <p className="text-xs text-teal-200/80">
                Accounts Payable Settlement • {invoice.distributorName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-white rounded-xl hover:bg-white/10 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
          {/* Bill Summary Banner */}
          <div className="grid grid-cols-3 gap-2 p-3 bg-slate-50 rounded-2xl border border-slate-200 text-center font-mono">
            <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-slate-400 uppercase font-bold block">Total Bill</span>
              <span className="text-sm font-black text-slate-900">₹{grandTotal.toFixed(2)}</span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-slate-100 shadow-2xs">
              <span className="text-[10px] text-emerald-600 uppercase font-bold block">Paid So Far</span>
              <span className="text-sm font-black text-emerald-700">₹{currentPaid.toFixed(2)}</span>
            </div>
            <div className="p-2 bg-white rounded-xl border border-rose-100 shadow-2xs">
              <span className="text-[10px] text-rose-600 uppercase font-bold block">Balance Due</span>
              <span className="text-sm font-black text-rose-700">₹{remainingBalance.toFixed(2)}</span>
            </div>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* Payment Type Selection: Full Payment vs Part Payment */}
          <div className="space-y-1.5">
            <label className="block text-xs font-bold text-slate-700">
              Payment Settlement Type
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 rounded-2xl border border-slate-200">
              <button
                type="button"
                onClick={handleSelectFullPayment}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentType === 'FULL'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                id="btn-modal-full-payment"
              >
                <CheckCircle2 className="w-4 h-4 text-emerald-300" />
                <span>Full Payment (100%)</span>
              </button>

              <button
                type="button"
                onClick={handleSelectPartPayment}
                className={`py-2 px-3 rounded-xl text-xs font-extrabold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                  paymentType === 'PART'
                    ? 'bg-amber-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900 hover:bg-white/60'
                }`}
                id="btn-modal-part-payment"
              >
                <DollarSign className="w-4 h-4 text-amber-200" />
                <span>Part Payment (Installment)</span>
              </button>
            </div>
          </div>

          {/* Payment Form Fields */}
          <div className="space-y-3.5">
            <div>
              <div className="flex justify-between items-center mb-1">
                <label className="block text-xs font-bold text-slate-700">
                  {paymentType === 'FULL' ? 'Full Settlement Amount (₹)' : 'Part Payment Amount (₹)'}{' '}
                  <span className="text-rose-500">*</span>
                </label>

                {paymentType === 'PART' && (
                  <div className="flex items-center gap-1.5 text-xs">
                    <button
                      type="button"
                      onClick={() => setAmount((remainingBalance * 0.25).toFixed(2))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-[10px] font-bold rounded text-slate-600 cursor-pointer"
                    >
                      25%
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmount((remainingBalance * 0.5).toFixed(2))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-[10px] font-bold rounded text-slate-600 cursor-pointer"
                    >
                      50%
                    </button>
                    <button
                      type="button"
                      onClick={() => setAmount((remainingBalance * 0.75).toFixed(2))}
                      className="px-2 py-0.5 bg-slate-100 hover:bg-teal-50 hover:text-teal-800 text-[10px] font-bold rounded text-slate-600 cursor-pointer"
                    >
                      75%
                    </button>
                  </div>
                )}
              </div>

              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 font-bold text-slate-400 font-mono text-base">
                  ₹
                </span>
                <input
                  type="number"
                  step="any"
                  min="0.01"
                  max={remainingBalance}
                  value={amount}
                  onChange={e => {
                    setAmount(e.target.value);
                    if (error) setError(null);
                  }}
                  placeholder="Enter payment amount"
                  className="w-full pl-8 pr-4 py-2.5 bg-white border border-slate-300 rounded-xl text-base font-mono font-black text-slate-900 focus:ring-2 focus:ring-teal-500 focus:outline-hidden shadow-2xs"
                  required
                />
              </div>

              {/* Dynamic Live Balance Preview */}
              <div className="mt-1.5 flex items-center justify-between text-[11px] font-mono px-1">
                <span className="text-slate-500">
                  {paymentType === 'FULL' ? '100% Full bill settlement' : 'Partial payment installment'}
                </span>
                <span className={`font-bold ${balanceAfterThisPayment <= 0.001 ? 'text-emerald-700' : 'text-amber-800'}`}>
                  Balance after payment: ₹{balanceAfterThisPayment.toFixed(2)}
                </span>
              </div>
            </div>

            {/* Payment Options Selection Cards */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1.5">
                Payment Option / Mode <span className="text-rose-500">*</span>
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                <button
                  type="button"
                  onClick={() => setPaymentMethod('UPI')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'UPI'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  id="pay-opt-upi"
                >
                  <Smartphone className={`w-5 h-5 ${paymentMethod === 'UPI' ? 'text-teal-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">UPI / QR</span>
                  <span className="text-[9px] text-slate-400">GPay, PhonePe</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Bank_Transfer')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'Bank_Transfer'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  id="pay-opt-bank"
                >
                  <Building className={`w-5 h-5 ${paymentMethod === 'Bank_Transfer' ? 'text-teal-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Bank Transfer</span>
                  <span className="text-[9px] text-slate-400">NEFT / RTGS</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cash')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'Cash'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  id="pay-opt-cash"
                >
                  <Banknote className={`w-5 h-5 ${paymentMethod === 'Cash' ? 'text-teal-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Cash</span>
                  <span className="text-[9px] text-slate-400">Counter Cash</span>
                </button>

                <button
                  type="button"
                  onClick={() => setPaymentMethod('Cheque')}
                  className={`p-2.5 rounded-xl border text-center transition-all cursor-pointer flex flex-col items-center gap-1 ${
                    paymentMethod === 'Cheque'
                      ? 'bg-teal-50 border-teal-500 text-teal-900 ring-2 ring-teal-500/20 shadow-xs'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                  id="pay-opt-cheque"
                >
                  <FileText className={`w-5 h-5 ${paymentMethod === 'Cheque' ? 'text-teal-600' : 'text-slate-500'}`} />
                  <span className="text-xs font-bold">Cheque</span>
                  <span className="text-[9px] text-slate-400">Bank Cheque</span>
                </button>
              </div>
            </div>

            {/* Payment Date & Mode-Specific Reference Fields */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Payment Date
                </label>
                <input
                  type="date"
                  value={paymentDate}
                  onChange={e => setPaymentDate(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono font-semibold text-slate-800 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  {paymentMethod === 'UPI'
                    ? 'UPI Transaction ID / UTR'
                    : paymentMethod === 'Cheque'
                    ? 'Cheque Number'
                    : paymentMethod === 'Bank_Transfer'
                    ? 'NEFT / RTGS Reference UTR'
                    : 'Cash Voucher / Receipt #'}
                </label>
                <input
                  type="text"
                  value={paymentMethod === 'Cheque' ? chequeNo : referenceNo}
                  onChange={e => {
                    if (paymentMethod === 'Cheque') {
                      setChequeNo(e.target.value);
                      setReferenceNo(e.target.value);
                    } else {
                      setReferenceNo(e.target.value);
                    }
                  }}
                  placeholder={
                    paymentMethod === 'UPI'
                      ? 'e.g. UPI Ref #402910482910'
                      : paymentMethod === 'Cheque'
                      ? 'e.g. Cheque #509214'
                      : paymentMethod === 'Bank_Transfer'
                      ? 'e.g. UTR-HDFC9028471928'
                      : 'e.g. Cash Voucher #CV-1049'
                  }
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs font-mono text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            </div>

            {paymentMethod === 'Cheque' && (
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">
                  Bank Name & Branch
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={e => setBankName(e.target.value)}
                  placeholder="e.g. State Bank of India, Main Branch"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">
                Payment Remarks / Notes (Optional)
              </label>
              <input
                type="text"
                value={notes}
                onChange={e => setNotes(e.target.value)}
                placeholder={
                  paymentType === 'FULL'
                    ? 'Full settlement of distributor inward invoice'
                    : 'Part payment installment against distributor invoice'
                }
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-xl text-xs text-slate-800 placeholder:text-slate-400 focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
              />
            </div>
          </div>

          {/* Payment History (if any exists) */}
          {invoice.payments && invoice.payments.length > 0 && (
            <div className="pt-2">
              <h3 className="text-xs font-bold text-slate-700 flex items-center gap-1.5 mb-2">
                <History className="w-3.5 h-3.5 text-teal-600" />
                <span>Previous Payments Recorded ({invoice.payments.length})</span>
              </h3>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs bg-slate-50/50">
                {invoice.payments.map((p, idx) => (
                  <div key={p.id || idx} className="p-2.5 flex items-center justify-between">
                    <div>
                      <span className="font-bold text-slate-800">
                        ₹{p.amount.toFixed(2)}
                      </span>
                      <span className="text-slate-500 text-[11px] ml-2">
                        via {p.paymentMethod.replace('_', ' ')}
                      </span>
                      {p.referenceNo && (
                        <span className="text-slate-400 font-mono text-[10px] block">
                          Ref: {p.referenceNo}
                        </span>
                      )}
                    </div>
                    <span className="text-slate-400 text-[11px] font-mono">
                      {new Date(p.date).toLocaleDateString('en-IN')}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isProcessing || remainingBalance <= 0}
              className="px-5 py-2.5 bg-teal-600 hover:bg-teal-700 disabled:opacity-50 text-white font-extrabold rounded-xl text-xs transition-all shadow-md shadow-teal-600/20 flex items-center gap-1.5 cursor-pointer"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Confirm & Record Payment</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
