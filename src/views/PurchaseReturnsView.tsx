import React, { useState, useMemo } from 'react';
import {
  FileMinus,
  Plus,
  Search,
  CheckCircle2,
  Printer,
  Building2,
  AlertOctagon,
  Calendar,
  X,
  Boxes
} from 'lucide-react';
import { PurchaseReturn, Supplier, Medicine } from '../types';
import { StorageService } from '../services/storage';

interface PurchaseReturnsViewProps {
  onRefreshData?: () => void;
}

export const PurchaseReturnsView: React.FC<PurchaseReturnsViewProps> = ({ onRefreshData }) => {
  const [purchaseReturns, setPurchaseReturns] = useState<PurchaseReturn[]>(() =>
    StorageService.getPurchaseReturns()
  );
  const [suppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [medicines] = useState<Medicine[]>(() => StorageService.getMedicines());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedReturn, setSelectedReturn] = useState<PurchaseReturn | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Form states
  const [selectedSupplierId, setSelectedSupplierId] = useState(suppliers[0]?.id || '');
  const [selectedMedicineId, setSelectedMedicineId] = useState(medicines[0]?.id || '');
  const [selectedBatchNumber, setSelectedBatchNumber] = useState('');
  const [returnQuantity, setReturnQuantity] = useState(10);
  const [returnReason, setReturnReason] = useState<PurchaseReturn['items'][0]['reason']>('Expired Stock');

  const pharmacyProfile = StorageService.getPharmacyProfile();

  const reload = () => {
    setPurchaseReturns(StorageService.getPurchaseReturns());
    if (onRefreshData) onRefreshData();
  };

  const selectedMedObj = useMemo(
    () => medicines.find(m => m.id === selectedMedicineId),
    [medicines, selectedMedicineId]
  );

  const availableBatches = selectedMedObj?.batches || [];

  const filteredReturns = useMemo(() => {
    return purchaseReturns.filter(pr => {
      const q = searchQuery.toLowerCase();
      return (
        pr.id.toLowerCase().includes(q) ||
        pr.debitNoteNumber.toLowerCase().includes(q) ||
        pr.supplierName.toLowerCase().includes(q) ||
        pr.items.some(i => i.medicineName.toLowerCase().includes(q))
      );
    });
  }, [purchaseReturns, searchQuery]);

  const totalDebited = purchaseReturns.reduce((sum, pr) => sum + pr.totalDebitAmount, 0);

  // Handle Create Purchase Return & Issue Debit Note
  const handleCreateReturn = (e: React.FormEvent) => {
    e.preventDefault();
    const sup = suppliers.find(s => s.id === selectedSupplierId);
    if (!sup || !selectedMedObj) return;

    const batch = selectedMedObj.batches.find(b => b.batchNumber === selectedBatchNumber) || selectedMedObj.batches[0];
    if (!batch) {
      alert('Please select a valid batch to return.');
      return;
    }

    const unitCost = batch.costPrice;
    const itemTotal = unitCost * returnQuantity;
    const taxRate = selectedMedObj.taxRate;
    const taxAmount = (itemTotal * taxRate) / 100;
    const totalDebit = itemTotal + taxAmount;

    const debitNoteNo = `DN-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`;

    const newPR: PurchaseReturn = {
      id: `PR-${Date.now().toString().slice(-5)}`,
      debitNoteNumber: debitNoteNo,
      supplierId: sup.id,
      supplierName: sup.name,
      returnDate: new Date().toISOString().split('T')[0],
      totalDebitAmount: totalDebit,
      accountsPayableAdjusted: true,
      status: 'Debit_Note_Issued',
      items: [
        {
          medicineId: selectedMedObj.id,
          medicineName: selectedMedObj.name,
          batchNumber: batch.batchNumber,
          quantity: returnQuantity,
          unitCostPrice: unitCost,
          reason: returnReason,
          totalAmount: totalDebit
        }
      ]
    };

    StorageService.addPurchaseReturn(newPR);
    reload();
    setShowCreateModal(false);
    setSelectedReturn(newPR);
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <FileMinus className="w-7 h-7 text-emerald-600" />
            <span>Purchase Returns & Debit Notes</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Supplier return processing with automated debit note generation and accounts payable reconciliation
          </p>
        </div>

        <button
          onClick={() => {
            setShowCreateModal(true);
            if (availableBatches[0]) {
              setSelectedBatchNumber(availableBatches[0].batchNumber);
            }
          }}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          id="create-purchase-return-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Process Return & Issue Debit Note</span>
        </button>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Debit Notes Issued</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{purchaseReturns.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Supplier claims generated</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Accounts Payable Credit</div>
          <div className="text-2xl font-black text-emerald-800 mt-1">
            ₹{totalDebited.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-emerald-600 font-medium mt-0.5">Auto-deducted from liabilities</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Reconciliation Status</div>
          <div className="text-lg font-bold text-slate-800 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>100% Ledger Synced</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Inventory deducted in real-time</div>
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
            placeholder="Search Debit Note #, supplier, drug..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>

      {/* Returns Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600 text-xs uppercase font-bold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">Debit Note #</th>
                <th className="py-3 px-4">Supplier</th>
                <th className="py-3 px-4">Return Date</th>
                <th className="py-3 px-4">Returned Item & Batch</th>
                <th className="py-3 px-4 text-center">Quantity</th>
                <th className="py-3 px-4 text-right">Debit Amount</th>
                <th className="py-3 px-4 text-center">AP Status</th>
                <th className="py-3 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredReturns.map(pr => (
                <tr key={pr.id} className="hover:bg-slate-50/70 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-slate-900">{pr.debitNoteNumber}</td>

                  <td className="py-3.5 px-4 font-semibold text-slate-800">
                    <div className="flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5 text-slate-400" />
                      <span>{pr.supplierName}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 text-xs text-slate-600">{pr.returnDate}</td>

                  <td className="py-3.5 px-4">
                    {pr.items.map((i, idx) => (
                      <div key={idx}>
                        <span className="font-semibold text-slate-800">{i.medicineName}</span>
                        <div className="text-[11px] text-slate-400 font-mono">
                          Batch: {i.batchNumber} • Reason: {i.reason}
                        </div>
                      </div>
                    ))}
                  </td>

                  <td className="py-3.5 px-4 text-center font-mono font-bold text-slate-800">
                    {pr.items.reduce((s, i) => s + i.quantity, 0)}
                  </td>

                  <td className="py-3.5 px-4 text-right font-mono font-bold text-emerald-800">
                    ₹{(pr.totalDebitAmount ?? 0).toFixed(2)}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 border border-emerald-200">
                      <CheckCircle2 className="w-3 h-3" />
                      AP Adjusted
                    </span>
                  </td>

                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => setSelectedReturn(pr)}
                      className="px-2.5 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors"
                    >
                      View Note
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          {filteredReturns.length === 0 && (
            <div className="text-center py-12 text-slate-500">
              <FileMinus className="w-10 h-10 mx-auto text-slate-300 mb-2" />
              <p className="font-semibold text-slate-700">No purchase returns recorded</p>
            </div>
          )}
        </div>
      </div>

      {/* Official Debit Note Modal */}
      {selectedReturn && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">Official Debit Note</h3>
                <p className="text-xs font-mono text-slate-500">#{selectedReturn.debitNoteNumber}</p>
              </div>
              <button
                onClick={() => setSelectedReturn(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Printable Debit Note Container */}
            <div className="p-5 bg-slate-50 rounded-2xl border border-slate-200 text-xs font-mono space-y-3">
              <div className="text-center border-b border-dashed border-slate-300 pb-3">
                <h2 className="text-base font-black text-slate-900 uppercase tracking-wide">
                  {pharmacyProfile.name}
                </h2>
                <p className="text-slate-600">
                  {pharmacyProfile.addressLine1}, {pharmacyProfile.taluk}, {pharmacyProfile.district} - {pharmacyProfile.pincode}
                </p>
                <p className="text-slate-500">
                  GSTIN: {pharmacyProfile.gstin} | DL: {pharmacyProfile.drugLicenseNo}
                </p>
                <p className="text-emerald-800 font-semibold">Phone: {pharmacyProfile.mobile}</p>
                <div className="mt-2 inline-block px-3 py-1 bg-slate-800 text-white font-bold rounded-lg text-[11px] tracking-wider">
                  DEBIT NOTE (PURCHASE RETURN)
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1">
                <div>
                  <p className="font-bold text-slate-700 uppercase">Debited To Supplier:</p>
                  <p className="font-semibold text-slate-900">{selectedReturn.supplierName}</p>
                  <p className="text-slate-500">Return ID: {selectedReturn.id}</p>
                </div>
                <div className="text-right">
                  <p><span className="text-slate-500">Note No:</span> <span className="font-bold text-slate-900">{selectedReturn.debitNoteNumber}</span></p>
                  <p><span className="text-slate-500">Date:</span> {selectedReturn.returnDate}</p>
                  <p><span className="text-slate-500">Ledger:</span> Accounts Payable Adjusted</p>
                </div>
              </div>

              <div className="border-t border-b border-dashed border-slate-300 py-2 space-y-1.5">
                <div className="flex font-bold text-slate-800">
                  <span className="w-5/12">Item Description / Batch</span>
                  <span className="w-3/12">Reason</span>
                  <span className="w-2/12 text-right">Qty</span>
                  <span className="w-2/12 text-right">Debit Amt</span>
                </div>
                {selectedReturn.items.map((item, idx) => (
                  <div key={idx} className="flex text-slate-600">
                    <span className="w-5/12 font-medium text-slate-900 truncate">
                      {item.medicineName} <br />
                      <span className="text-[10px] text-slate-400">Batch: {item.batchNumber}</span>
                    </span>
                    <span className="w-3/12 text-[11px] text-slate-500">{item.reason}</span>
                    <span className="w-2/12 text-right">{item.quantity}</span>
                    <span className="w-2/12 text-right font-bold text-slate-900">
                      ₹{(item.totalAmount ?? 0).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>

              <div className="flex justify-between items-center pt-2 font-bold text-sm text-slate-900">
                <span>TOTAL DEBIT AMOUNT:</span>
                <span className="text-emerald-800 font-mono">₹{(selectedReturn.totalDebitAmount ?? 0).toFixed(2)}</span>
              </div>

              <div className="pt-4 border-t border-slate-200 flex justify-between text-[10px] text-slate-400">
                <div>Authorized Pharmacist Signatory</div>
                <div>Supplier Acknowledged & Adjusted</div>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700 flex items-center justify-center gap-2 text-xs"
              >
                <Printer className="w-4 h-4" />
                <span>Print Debit Note</span>
              </button>
              <button
                onClick={() => setSelectedReturn(null)}
                className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs text-xs"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Process New Return Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <FileMinus className="w-5 h-5 text-emerald-600" />
                <h3 className="font-bold text-slate-900 text-base">Return Batch to Supplier</h3>
              </div>
              <button
                onClick={() => setShowCreateModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateReturn} className="space-y-3.5 text-xs">
              <div>
                <label className="font-bold text-slate-700">Supplier *</label>
                <select
                  value={selectedSupplierId}
                  onChange={e => setSelectedSupplierId(e.target.value)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-semibold"
                >
                  {suppliers.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Payable: ₹{(s.outstandingPayable ?? 0).toFixed(2)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700">Medicine Formulation *</label>
                <select
                  value={selectedMedicineId}
                  onChange={e => {
                    setSelectedMedicineId(e.target.value);
                    const med = medicines.find(m => m.id === e.target.value);
                    if (med && med.batches[0]) {
                      setSelectedBatchNumber(med.batches[0].batchNumber);
                    }
                  }}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                >
                  {medicines.map(m => (
                    <option key={m.id} value={m.id}>
                      {m.name} ({m.genericName})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Batch Number *</label>
                  <select
                    value={selectedBatchNumber}
                    onChange={e => setSelectedBatchNumber(e.target.value)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                  >
                    {availableBatches.map(b => (
                      <option key={b.batchNumber} value={b.batchNumber}>
                        #{b.batchNumber} (Stock: {b.stock} • Exp: {b.expiryDate})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700">Return Quantity *</label>
                  <input
                    type="number"
                    min="1"
                    value={returnQuantity}
                    onChange={e => setReturnQuantity(Math.max(1, Number(e.target.value)))}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono font-bold"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Reason for Return *</label>
                <select
                  value={returnReason}
                  onChange={e => setReturnReason(e.target.value as any)}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                >
                  <option value="Expired Stock">Expired Stock</option>
                  <option value="Damaged Packaging / Broken Ampoule">Damaged Packaging / Broken Ampoule</option>
                  <option value="Manufacturer Recall">Manufacturer Recall</option>
                  <option value="Near-Expiry Clearance">Near-Expiry Clearance</option>
                </select>
              </div>

              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-900 text-xs">
                Submitting will automatically deduct {returnQuantity} units from inventory and credit the debit amount to your Accounts Payable ledger with {suppliers.find(s => s.id === selectedSupplierId)?.name}.
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Generate Debit Note
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
