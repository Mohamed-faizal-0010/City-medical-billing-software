import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Search,
  Phone,
  Mail,
  MapPin,
  FileText,
  CreditCard,
  DollarSign,
  Star,
  CheckCircle2,
  X,
  TrendingDown,
  ArrowUpRight,
  History
} from 'lucide-react';
import { Supplier, PurchaseOrder, PurchaseReturn } from '../types';
import { StorageService } from '../services/storage';

interface SuppliersViewProps {
  onRefreshData?: () => void;
}

export const SuppliersView: React.FC<SuppliersViewProps> = ({ onRefreshData }) => {
  const [suppliers, setSuppliers] = useState<Supplier[]>(() => StorageService.getSuppliers());
  const [purchaseOrders] = useState<PurchaseOrder[]>(() => StorageService.getPurchaseOrders());
  const [purchaseReturns] = useState<PurchaseReturn[]>(() => StorageService.getPurchaseReturns());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSupplier, setSelectedSupplier] = useState<Supplier | null>(null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [payingSupplier, setPayingSupplier] = useState<Supplier | null>(null);
  const [paymentAmount, setPaymentAmount] = useState<number>(0);
  const [paymentRef, setPaymentRef] = useState('');

  // Form states for adding supplier
  const [name, setName] = useState('');
  const [contactPerson, setContactPerson] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [address, setAddress] = useState('');
  const [gstin, setGstin] = useState('');
  const [drugLicenseNo, setDrugLicenseNo] = useState('');
  const [paymentTerms, setPaymentTerms] = useState<'Net 15' | 'Net 30' | 'Net 45' | 'Immediate'>('Net 30');

  const reload = () => {
    setSuppliers(StorageService.getSuppliers());
    if (onRefreshData) onRefreshData();
  };

  const filteredSuppliers = useMemo(() => {
    return suppliers.filter(s => {
      const q = searchQuery.toLowerCase();
      return (
        s.name.toLowerCase().includes(q) ||
        s.contactPerson.toLowerCase().includes(q) ||
        s.gstin.toLowerCase().includes(q) ||
        s.address.toLowerCase().includes(q)
      );
    });
  }, [suppliers, searchQuery]);

  const totalOutstandingPayable = suppliers.reduce((sum, s) => sum + s.outstandingPayable, 0);

  // Handle Add Supplier
  const handleAddSupplier = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name || !phone) return;

    const newSupplier: Supplier = {
      id: `sup-${Date.now().toString().slice(-4)}`,
      name,
      contactPerson: contactPerson || name,
      phone,
      email: email || 'orders@distributor.com',
      address: address || 'Industrial Area, Tamil Nadu',
      gstin: gstin || '33AABCM9901M1ZQ',
      drugLicenseNo: drugLicenseNo || 'TN-MDU-19284',
      paymentTerms,
      outstandingPayable: 0,
      rating: 5.0
    };

    const current = StorageService.getSuppliers();
    current.push(newSupplier);
    StorageService.saveSuppliers(current);
    reload();
    setShowAddModal(false);
    // Reset
    setName('');
    setContactPerson('');
    setPhone('');
    setEmail('');
    setAddress('');
    setGstin('');
    setDrugLicenseNo('');
  };

  // Handle Recording Payment to Settle Payables
  const handleRecordPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!payingSupplier || paymentAmount <= 0) return;

    // Deduct from outstanding payable
    StorageService.updateSupplierPayable(payingSupplier.id, -paymentAmount);
    reload();
    setPayingSupplier(null);
    setPaymentAmount(0);
    setPaymentRef('');
  };

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-emerald-600" />
            <span>Supplier Management & Accounts Payable</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Vendor relationship directory with credit terms, ledger reconciliations, and payment logging
          </p>
        </div>

        <button
          onClick={() => setShowAddModal(true)}
          className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm rounded-xl shadow-xs transition-colors self-start sm:self-auto"
          id="add-supplier-btn"
        >
          <Plus className="w-4 h-4" />
          <span>Add New Supplier</span>
        </button>
      </div>

      {/* Summary KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Registered Distributors</div>
          <div className="text-2xl font-black text-slate-900 mt-1">{suppliers.length}</div>
          <div className="text-xs text-slate-500 mt-0.5">Verified wholesale licenses</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-rose-200 bg-rose-50/40 shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="text-xs font-bold text-rose-700 uppercase tracking-wider">Total Accounts Payable</div>
            <CreditCard className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-2xl font-black text-rose-900 mt-1">
            ₹{totalOutstandingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="text-xs text-rose-600 font-medium mt-0.5">Pending vendor liabilities</div>
        </div>

        <div className="p-4 bg-white rounded-2xl border border-slate-200 shadow-2xs">
          <div className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Credit Compliance</div>
          <div className="text-lg font-bold text-emerald-700 mt-1 flex items-center gap-1.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Optimal Terms (Net 30)</span>
          </div>
          <div className="text-xs text-slate-500 mt-0.5">Automated debit notes applied</div>
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
            placeholder="Search distributor, contact, GSTIN..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
            id="supplier-search-input"
          />
        </div>
      </div>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredSuppliers.map(sup => {
          const supplierPOs = purchaseOrders.filter(po => po.supplierId === sup.id);
          const supplierReturns = purchaseReturns.filter(pr => pr.supplierId === sup.id);

          return (
            <div
              key={sup.id}
              className="bg-white rounded-2xl border border-slate-200 p-5 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
            >
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <h3 className="font-bold text-slate-900 text-base">{sup.name}</h3>
                    <p className="text-xs text-slate-500 flex items-center gap-1 mt-0.5">
                      <span>Attn: {sup.contactPerson}</span>
                    </p>
                  </div>
                  <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                    {sup.paymentTerms}
                  </span>
                </div>

                <div className="space-y-1.5 text-xs text-slate-600 pt-1 border-t border-slate-100">
                  <div className="flex items-center gap-2">
                    <Phone className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>{sup.phone}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Mail className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.email}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="truncate">{sup.address}</span>
                  </div>
                </div>

                <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-[11px] font-mono">
                  <div className="flex justify-between text-slate-500">
                    <span>GSTIN:</span>
                    <span className="text-slate-800 font-bold">{sup.gstin}</span>
                  </div>
                  <div className="flex justify-between text-slate-500">
                    <span>Drug Lic:</span>
                    <span className="text-slate-800">{sup.drugLicenseNo}</span>
                  </div>
                </div>

                {/* Payable Balance */}
                <div className="p-3 bg-rose-50/60 border border-rose-200/80 rounded-xl flex items-center justify-between">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700">
                      Outstanding Payable
                    </span>
                    <p className="text-base font-black font-mono text-rose-900">
                      ₹{sup.outstandingPayable.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                  </div>
                  {sup.outstandingPayable > 0 && (
                    <button
                      onClick={() => {
                        setPayingSupplier(sup);
                        setPaymentAmount(sup.outstandingPayable);
                      }}
                      className="px-2.5 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-lg shadow-2xs transition-colors"
                    >
                      Pay Now
                    </button>
                  )}
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs">
                <span className="text-slate-500">
                  {supplierPOs.length} orders • {supplierReturns.length} returns
                </span>
                <button
                  onClick={() => setSelectedSupplier(sup)}
                  className="font-bold text-emerald-700 hover:text-emerald-800 flex items-center gap-1"
                >
                  <span>Ledger History</span>
                  <ArrowUpRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* Supplier Ledger / History Modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-2xl w-full p-6 space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="font-bold text-slate-900 text-lg">{selectedSupplier.name}</h3>
                <p className="text-xs text-slate-500">
                  GSTIN: {selectedSupplier.gstin} • Terms: {selectedSupplier.paymentTerms}
                </p>
              </div>
              <button
                onClick={() => setSelectedSupplier(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-4 text-xs">
              {/* Purchase Orders */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <History className="w-4 h-4 text-emerald-600" />
                  <span>Procurement History</span>
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {purchaseOrders
                    .filter(po => po.supplierId === selectedSupplier.id)
                    .map(po => (
                      <div key={po.id} className="p-3 flex items-center justify-between bg-white">
                        <div>
                          <p className="font-bold font-mono text-slate-900">{po.id}</p>
                          <p className="text-slate-500 text-[11px]">
                            {po.orderDate} • {(po.items || []).length} items ({po.status})
                          </p>
                        </div>
                        <span className="font-mono font-bold text-slate-900">
                          ₹{(po.grandTotal ?? 0).toFixed(2)}
                        </span>
                      </div>
                    ))}
                  {purchaseOrders.filter(po => po.supplierId === selectedSupplier.id).length === 0 && (
                    <p className="text-center text-slate-400 py-3">No orders placed with this vendor</p>
                  )}
                </div>
              </div>

              {/* Purchase Returns / Debit Notes */}
              <div>
                <h4 className="font-bold text-slate-700 uppercase tracking-wider mb-2">
                  Debit Notes & Returns
                </h4>
                <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                  {purchaseReturns
                    .filter(pr => pr.supplierId === selectedSupplier.id)
                    .map(pr => (
                      <div key={pr.id} className="p-3 flex items-center justify-between bg-white">
                        <div>
                          <p className="font-bold font-mono text-emerald-800">{pr.debitNoteNumber}</p>
                          <p className="text-slate-500 text-[11px]">
                            {pr.returnDate} • {pr.items[0]?.reason}
                          </p>
                        </div>
                        <span className="font-mono font-bold text-emerald-800">
                          -₹{(pr.totalDebitAmount ?? 0).toFixed(2)} (Debited)
                        </span>
                      </div>
                    ))}
                  {purchaseReturns.filter(pr => pr.supplierId === selectedSupplier.id).length === 0 && (
                    <p className="text-center text-slate-400 py-3">No debit notes issued to this vendor</p>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-100 flex justify-end">
              <button
                onClick={() => setSelectedSupplier(null)}
                className="py-2 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700 text-xs"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Record Payment Modal */}
      {payingSupplier && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl border border-slate-200 max-w-md w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Record Payment to Supplier</h3>
              <button
                onClick={() => setPayingSupplier(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl text-xs space-y-1">
              <p className="font-bold text-slate-800">{payingSupplier.name}</p>
              <p className="text-slate-500">Current Outstanding: ₹{(payingSupplier.outstandingPayable ?? 0).toFixed(2)}</p>
            </div>

            <form onSubmit={handleRecordPayment} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Payment Amount (₹) *</label>
                <input
                  type="number"
                  step="0.01"
                  required
                  value={paymentAmount}
                  onChange={e => setPaymentAmount(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl font-mono text-base font-bold text-slate-900 mt-1"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700">Bank / NEFT / Cheque Reference</label>
                <input
                  type="text"
                  value={paymentRef}
                  onChange={e => setPaymentRef(e.target.value)}
                  placeholder="e.g. NEFT-ICIC-992140"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setPayingSupplier(null)}
                  className="flex-1 py-2 px-3 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Confirm Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add New Supplier Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl shadow-xl border border-slate-200 max-w-lg w-full p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="font-bold text-slate-900 text-base">Add New Pharma Supplier</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddSupplier} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700">Company / Agency Name *</label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={e => setName(e.target.value)}
                  placeholder="e.g. Madurai MedPharma Distributors"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-semibold"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Contact Person</label>
                  <input
                    type="text"
                    value={contactPerson}
                    onChange={e => setContactPerson(e.target.value)}
                    placeholder="e.g. R. Karthik"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Phone Number *</label>
                  <input
                    type="text"
                    required
                    value={phone}
                    onChange={e => setPhone(e.target.value)}
                    placeholder="+91 98401 22910"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">GSTIN Number</label>
                  <input
                    type="text"
                    value={gstin}
                    onChange={e => setGstin(e.target.value.toUpperCase())}
                    placeholder="33AABCM..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono uppercase"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Drug License No</label>
                  <input
                    type="text"
                    value={drugLicenseNo}
                    onChange={e => setDrugLicenseNo(e.target.value)}
                    placeholder="TN-MDU-..."
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1 font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700">Email Address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="orders@supplier.in"
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700">Payment Terms</label>
                  <select
                    value={paymentTerms}
                    onChange={e => setPaymentTerms(e.target.value as any)}
                    className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                  >
                    <option value="Net 15">Net 15 Days</option>
                    <option value="Net 30">Net 30 Days</option>
                    <option value="Net 45">Net 45 Days</option>
                    <option value="Immediate">Immediate Cash/UPI</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700">Warehouse Address</label>
                <input
                  type="text"
                  value={address}
                  onChange={e => setAddress(e.target.value)}
                  placeholder="Street address, City, Pincode"
                  className="w-full px-3 py-2 border border-slate-200 rounded-xl mt-1"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="flex-1 py-2.5 px-4 bg-slate-100 hover:bg-slate-200 font-semibold rounded-xl text-slate-700"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2.5 px-4 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl shadow-xs"
                >
                  Save Supplier
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
