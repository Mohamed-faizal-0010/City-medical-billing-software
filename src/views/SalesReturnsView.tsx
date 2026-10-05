import React, { useState, useMemo } from 'react';
import {
  RotateCcw,
  Search,
  CheckCircle2,
  AlertTriangle,
  Receipt,
  RotateCcw as ReturnIcon,
  X,
  Printer,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import { SalesReturn, SaleTransaction, Medicine } from '../types';
import { StorageService } from '../services/storage';
import { formatQuantityWithUnit } from '../utils/packUtils';

interface SalesReturnsViewProps {
  onRefreshData?: () => void;
}

export const SalesReturnsView: React.FC<SalesReturnsViewProps> = ({ onRefreshData }) => {
  const [salesReturns, setSalesReturns] = useState<SalesReturn[]>(() =>
    StorageService.getSalesReturns()
  );
  const [transactions] = useState<SaleTransaction[]>(() => StorageService.getTransactions());
  const [medicines] = useState<Medicine[]>(() => StorageService.getMedicines());
  const [searchQuery, setSearchQuery] = useState('');
  const [showProcessModal, setShowProcessModal] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState('');
  const [selectedReturnDetails, setSelectedReturnDetails] = useState<SalesReturn | null>(null);

  // Return Processing Form State
  const [selectedTransaction, setSelectedTransaction] = useState<SaleTransaction | null>(null);
  const [selectedItemIndex, setSelectedItemIndex] = useState(0);
  const [returnQuantity, setReturnQuantity] = useState(1);
  const [returnReason, setReturnReason] = useState('Physician discontinued therapy');
  const [returnToStock, setReturnToStock] = useState(true);
  const [refundMethod, setRefundMethod] = useState<'Cash' | 'UPI_Reversal' | 'Store_Credit'>('Cash');

  const pharmacyProfile = StorageService.getPharmacyProfile();

  const reload = () => {
    setSalesReturns(StorageService.getSalesReturns());
    if (onRefreshData) onRefreshData();
  };

  const filteredReturns = useMemo(() => {
    return salesReturns.filter(sr => {
      const q = searchQuery.toLowerCase();
      const customer = (sr.customerName || sr.patientName || '').toLowerCase();
      return (
        sr.id.toLowerCase().includes(q) ||
        sr.invoiceId.toLowerCase().includes(q) ||
        customer.includes(q) ||
        sr.items.some(i => i.medicineName.toLowerCase().includes(q))
      );
    });
  }, [salesReturns, searchQuery]);

  const totalRefundsProcessed = salesReturns.reduce((sum, r) => sum + (r.refundAmount ?? r.totalRefundAmount ?? 0), 0);

  // When invoice is chosen in return modal
  const handleSelectInvoice = (invId: string) => {
    setSelectedInvoiceId(invId);
    const tx = transactions.find(t => t.id === invId);
    setSelectedTransaction(tx || null);
    setSelectedItemIndex(0);
    setReturnQuantity(1);
  };

  // Submit Sales Return
  const handleSubmitSalesReturn = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTransaction) return;

    const itemToReturn = selectedTransaction.items[selectedItemIndex];
    if (!itemToReturn) return;

    const isLoose = itemToReturn.unitType === 'loose';
    const unitPrice = itemToReturn.unitPrice * (1 - (itemToReturn.discountPercent || 0) / 100);
    const refundAmount = unitPrice * returnQuantity;
    const packSize = itemToReturn.packSize || 10;
    const stockQuantityDelta = isLoose
      ? Math.round((returnQuantity / packSize) * 1000) / 1000
      : returnQuantity;

    const newReturn: SalesReturn = {
      id: `RET-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`,
      invoiceId: selectedTransaction.id,
      date: new Date().toISOString(),
      customerName: selectedTransaction.patientName,
      items: [
        {
          medicineId: itemToReturn.medicineId,
          medicineName: itemToReturn.medicineName,
          batchNumber: itemToReturn.batchNumber,
          quantity: stockQuantityDelta,
          looseQuantity: isLoose ? returnQuantity : undefined,
          unitType: isLoose ? 'loose' : 'pack',
          packSize,
          unitName: itemToReturn.unitName,
          packName: itemToReturn.packName,
          unitPrice,
          refundAmount,
          reason: returnReason,
          returnToStock
        }
      ],
      refundAmount,
      refundMethod,
      processedBy: selectedTransaction.cashierName || 'Senior Pharmacist'
    };

    StorageService.addSalesReturn(newReturn);
    reload();
    setShowProcessModal(false);
    setSelectedReturnDetails(newReturn);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <RotateCcw className="w-7 h-7 text-emerald-600" />
            <span>Retail Sales Returns & Restocking</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Customer invoice return processing with automated inventory reinstatement and refund settlement
          </p>
        </div>

        <button
          onClick={() => {
            setShowProcessModal(true);
            if (transactions[0]) {
              handleSelectInvoice(transactions[0].id);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          id="new-sales-return-btn"
        >
          <RotateCcw className="w-4 h-4" />
          <span>Process Sales Return</span>
        </button>
      </div>

      {/* KPI Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Sales Returns</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{salesReturns.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Processed return events</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Refunded to Patients</div>
          <div className="text-2xl font-black text-rose-700 mt-1">
            ₹{totalRefundsProcessed.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Settled via Cash / UPI reversal</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Inventory Restock</div>
          <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Automatic Batch Adjustment</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Physical stock auto-reconciled</div>
        </div>
      </div>

      {/* Search Input */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex items-center justify-between">
        <div className="relative w-full max-w-sm">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search return ID, invoice #, customer..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Returns History Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Return ID</th>
                <th className="py-3 px-4">Original Invoice</th>
                <th className="py-3 px-4">Customer Name</th>
                <th className="py-3 px-4">Returned Item & Batch</th>
                <th className="py-3 px-4 text-center">Restocked</th>
                <th className="py-3 px-4 text-right">Refund Amount</th>
                <th className="py-3 px-4 text-center">Method</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.map(ret => (
                <tr key={ret.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{ret.id}</td>

                  <td className="py-3.5 px-4 font-mono text-xs text-slate-700">
                    <div className="flex items-center gap-1">
                      <Receipt className="w-3.5 h-3.5 text-slate-400" />
                      <span>{ret.invoiceId}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">{ret.customerName}</td>

                  <td className="py-3.5 px-4">
                    {ret.items.map((i, idx) => (
                      <div key={idx}>
                        <div className="flex items-center gap-1.5">
                          <span className="font-semibold text-slate-800">{i.medicineName}</span>
                          {i.unitType === 'loose' && (
                            <span className="text-[10px] font-bold px-1.5 py-0.2 bg-amber-100 text-amber-800 rounded">
                              LOOSE
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-slate-500 font-mono">
                          Batch: {i.batchNumber} • Qty: {formatQuantityWithUnit(i)}
                        </div>
                      </div>
                    ))}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    {ret.items.some(i => i.returnToStock) ? (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                        Restocked
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-slate-100 text-slate-600 border border-slate-200">
                        Discarded
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-rose-700">
                    ₹{(ret.refundAmount ?? ret.totalRefundAmount ?? 0).toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="text-xs font-mono font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                      {ret.refundMethod}
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedReturnDetails(ret)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      View Receipt
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReturns.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <RotateCcw className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No sales returns recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* Process Sales Return Modal */}
      {showProcessModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <RotateCcw className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Process Sales Return</h3>
              </div>
              <button
                onClick={() => setShowProcessModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitSalesReturn} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Select Past Customer Invoice *</label>
                <select
                  value={selectedInvoiceId}
                  onChange={e => handleSelectInvoice(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono font-semibold"
                >
                  {transactions.map(tx => (
                    <option key={tx.id} value={tx.id}>
                      {tx.id} - {tx.patientName} (₹{(tx.grandTotal ?? 0).toFixed(2)} on {tx.date.split('T')[0]})
                    </option>
                  ))}
                </select>
              </div>

              {selectedTransaction && (
                (() => {
                  const currentItem = selectedTransaction.items[selectedItemIndex];
                  const isLoose = currentItem?.unitType === 'loose';
                  const maxQty = isLoose ? (currentItem?.looseQuantity || 1) : (currentItem?.quantity || 1);
                  const unitLabel = isLoose ? (currentItem?.unitName || 'Units') : (currentItem?.packName || 'Packs');
                  const packSize = currentItem?.packSize || 10;
                  const stockRestored = isLoose 
                    ? Math.round((returnQuantity / packSize) * 1000) / 1000 
                    : returnQuantity;
                  const estimatedRefund = ((currentItem?.unitPrice || 0) * (1 - (currentItem?.discountPercent || 0) / 100)) * returnQuantity;

                  return (
                    <>
                      <div>
                        <label className="font-bold text-slate-700">Select Medicine Being Returned *</label>
                        <select
                          value={selectedItemIndex}
                          onChange={e => {
                            const idx = Number(e.target.value);
                            setSelectedItemIndex(idx);
                            setReturnQuantity(1);
                          }}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-semibold"
                        >
                          {selectedTransaction.items.map((item, idx) => (
                            <option key={idx} value={idx}>
                              {item.medicineName} ({item.batchNumber}) - Bought {formatQuantityWithUnit(item)} @ ₹{(item.unitPrice ?? 0).toFixed(2)}
                            </option>
                          ))}
                        </select>
                      </div>

                      {isLoose && (
                        <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 flex items-center justify-between">
                          <span>Sold as Loose Unit ({currentItem?.unitName || 'Units'} from 1 {currentItem?.packName || 'Pack'} of {packSize})</span>
                          <span className="font-bold">Rate: ₹{(currentItem?.unitPrice || 0).toFixed(2)} / {currentItem?.unitName || 'unit'}</span>
                        </div>
                      )}

                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="font-bold text-slate-700">
                            Return Quantity ({unitLabel}) (Max: {maxQty})
                          </label>
                          <input
                            type="number"
                            min="1"
                            max={maxQty}
                            value={returnQuantity}
                            onChange={e => setReturnQuantity(Math.min(maxQty, Math.max(1, Number(e.target.value))))}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono font-bold"
                          />
                          <p className="text-[11px] text-slate-500 mt-0.5">
                            Estimated Refund: <span className="font-bold text-rose-600">₹{estimatedRefund.toFixed(2)}</span>
                          </p>
                        </div>

                        <div>
                          <label className="font-bold text-slate-700">Refund Settlement Method</label>
                          <select
                            value={refundMethod}
                            onChange={e => setRefundMethod(e.target.value as any)}
                            className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-semibold"
                          >
                            <option value="Cash">Cash Refund</option>
                            <option value="UPI_Reversal">UPI Reversal</option>
                            <option value="Store_Credit">Store Credit Note</option>
                          </select>
                        </div>
                      </div>

                      <div>
                        <label className="font-bold text-slate-700">Reason for Return</label>
                        <select
                          value={returnReason}
                          onChange={e => setReturnReason(e.target.value)}
                          className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                        >
                          <option value="Physician discontinued therapy">Physician discontinued therapy</option>
                          <option value="Wrong medication / dosage dispensed">Wrong medication / dosage dispensed</option>
                          <option value="Patient allergy / adverse reaction">Patient allergy / adverse reaction</option>
                          <option value="Patient recovered before consuming full course">Patient recovered early</option>
                        </select>
                      </div>

                      <div className="p-3 bg-slate-50 border border-slate-200 rounded-xl space-y-2">
                        <label className="flex items-center gap-2 cursor-pointer font-semibold text-slate-800">
                          <input
                            type="checkbox"
                            checked={returnToStock}
                            onChange={e => setReturnToStock(e.target.checked)}
                            className="w-4 h-4 text-emerald-600 rounded"
                          />
                          <span>Return units to active inventory (Seal intact & uncompromised)</span>
                        </label>
                        <p className="text-[11px] text-slate-500">
                          If checked, batch stock for #{currentItem?.batchNumber} will be automatically increased by {isLoose ? `${returnQuantity} ${unitLabel} (${stockRestored} ${currentItem?.packName || 'pack'})` : `${returnQuantity} ${unitLabel}`} in real-time.
                        </p>
                      </div>
                    </>
                  );
                })()
              )}

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowProcessModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm & Settle Refund
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Return Receipt Details Modal */}
      {selectedReturnDetails && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Sales Return Credit Voucher</h3>
              <button
                onClick={() => setSelectedReturnDetails(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono space-y-2">
              <div className="text-center border-b border-dashed border-slate-300 pb-2">
                <p className="font-bold text-sm text-slate-900 uppercase">{pharmacyProfile.name}</p>
                <p className="text-[10px] text-slate-500">{pharmacyProfile.addressLine1}, {pharmacyProfile.taluk}</p>
                <p className="text-[10px] text-emerald-800 font-bold">SALES RETURN VOUCHER #{selectedReturnDetails.id}</p>
              </div>

              <div className="flex justify-between text-slate-600 pt-1">
                <span>Original Inv: {selectedReturnDetails.invoiceId}</span>
                <span>Date: {selectedReturnDetails.date.split('T')[0]}</span>
              </div>
              <div>Patient / Customer: <span className="font-bold text-slate-900">{selectedReturnDetails.customerName || selectedReturnDetails.patientName || 'Customer'}</span></div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1">
                {selectedReturnDetails.items.map((item, idx) => (
                  <div key={idx} className="flex justify-between">
                    <span>
                      {item.medicineName} ({formatQuantityWithUnit(item)} @ Batch #{item.batchNumber})
                      <br />
                      <span className="text-[10px] text-slate-400">Reason: {item.reason}</span>
                    </span>
                    <span className="font-bold text-rose-700">₹{(item.refundAmount ?? 0).toFixed(2)}</span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between pt-1 font-bold text-sm text-slate-900">
                <span>TOTAL REFUND PAID ({selectedReturnDetails.refundMethod}):</span>
                <span className="text-rose-700">₹{(selectedReturnDetails.refundAmount ?? selectedReturnDetails.totalRefundAmount ?? 0).toFixed(2)}</span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700 flex items-center justify-center gap-2 text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Voucher</span>
              </button>
              <button
                onClick={() => setSelectedReturnDetails(null)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs shadow-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
