import React, { useState, useMemo } from 'react';
import {
  Dna,
  Search,
  ArrowRight,
  TrendingDown,
  CheckCircle2,
  AlertCircle,
  Pill,
  Sparkles,
  Layers,
  Percent,
  ShoppingCart
} from 'lucide-react';
import { Medicine, GenericAlternative } from '../types';
import { StorageService } from '../services/storage';

interface GenericSubstitutionViewProps {
  onSelectForPOS?: (medicine: Medicine) => void;
}

export const GenericSubstitutionView: React.FC<GenericSubstitutionViewProps> = ({ onSelectForPOS }) => {
  const [medicines] = useState<Medicine[]>(() => StorageService.getMedicines());
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOriginal, setSelectedOriginal] = useState<Medicine | null>(() => {
    // Default to a popular high-cost branded medicine like Augmentin 625 Duo or Pan 40
    return medicines.find(m => m.name.includes('Augmentin')) || medicines[0] || null;
  });

  // Calculate alternatives for selected medicine
  const alternatives: GenericAlternative[] = useMemo(() => {
    if (!selectedOriginal) return [];
    return StorageService.findGenericAlternatives(selectedOriginal);
  }, [selectedOriginal, medicines]);

  // Filtered search list
  const filteredMedicines = useMemo(() => {
    if (!searchQuery) return medicines;
    const q = searchQuery.toLowerCase();
    return medicines.filter(
      m =>
        m.name.toLowerCase().includes(q) ||
        m.genericName.toLowerCase().includes(q) ||
        m.manufacturer.toLowerCase().includes(q)
    );
  }, [medicines, searchQuery]);

  const originalPrice = selectedOriginal?.batches[0]?.sellingPrice || 0;
  const originalStock = selectedOriginal?.batches.reduce((sum, b) => sum + b.stock, 0) || 0;

  return (
    <div className="p-4 lg:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Dna className="w-7 h-7 text-emerald-600" />
            <span>Generic Drug Substitution & Cost Optimizer</span>
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Bioequivalent salt-matched alternative generator with patient out-of-pocket savings calculations
          </p>
        </div>

        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-emerald-100 text-emerald-800 border border-emerald-200 flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>AI Bioequivalence Engine Active</span>
          </span>
        </div>
      </div>

      {/* Main Grid: Left Selector, Right Substitutions Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Drug Selector (4 cols) */}
        <div className="lg:col-span-4 bg-white rounded-2xl border border-slate-200 shadow-2xs p-4 flex flex-col h-[680px]">
          <div className="mb-3">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Select Prescribed / Branded Drug
            </label>
            <div className="relative mt-1.5">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                placeholder="Search Pentose 40, Rabalkem, Pan, or generic salt..."
                className="w-full pl-9 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
                id="generic-search-input"
              />
            </div>
            {/* Quick generic category pills */}
            <div className="flex items-center gap-1 overflow-x-auto pt-2 pb-0.5 no-scrollbar">
              {[
                { label: 'All', query: '' },
                { label: 'Pentose 40', query: 'Pentose' },
                { label: 'Rabalkem DSR', query: 'Rabalkem' },
                { label: 'Pan 40', query: 'Pan 40' },
                { label: 'Amoxy-Clav', query: 'Clav' },
                { label: 'Para 650', query: '650' },
                { label: 'Aceclo', query: 'Zerodol' }
              ].map(chip => (
                <button
                  key={chip.label}
                  type="button"
                  onClick={() => setSearchQuery(chip.query)}
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-md shrink-0 transition-colors ${
                    searchQuery === chip.query
                      ? 'bg-emerald-600 text-white'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {chip.label}
                </button>
              ))}
            </div>
          </div>

          <div className="flex-1 overflow-y-auto space-y-1.5 pr-1">
            {filteredMedicines.map(med => {
              const isSelected = selectedOriginal?.id === med.id;
              const price = med.batches[0]?.sellingPrice || 0;
              const stock = med.batches.reduce((sum, b) => sum + b.stock, 0);

              return (
                <button
                  key={med.id}
                  onClick={() => setSelectedOriginal(med)}
                  className={`w-full text-left p-3 rounded-xl border transition-all ${
                    isSelected
                      ? 'border-emerald-500 bg-emerald-50/60 shadow-2xs'
                      : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50/70'
                  }`}
                  id={`select-drug-${med.id}`}
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="font-bold text-slate-900 text-xs">{med.name}</p>
                      <p className="text-[11px] text-slate-500 line-clamp-1">{med.genericName}</p>
                    </div>
                    <span className="text-xs font-mono font-bold text-slate-800">
                      ₹{(price ?? 0).toFixed(2)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-[10px] text-slate-400 mt-1.5 pt-1 border-t border-slate-100">
                    <span className="truncate max-w-[180px]">{med.manufacturer} • {med.strength}</span>
                    <span className={stock > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                      {stock > 0 ? `${stock} in stock` : 'Out of stock'}
                    </span>
                  </div>
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Column: Comparative Analysis & Alternative Cards (8 cols) */}
        <div className="lg:col-span-8 space-y-5">
          {selectedOriginal ? (
            <>
              {/* Reference Prescribed Medicine Header Card */}
              <div className="p-5 bg-white rounded-2xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
                  <div>
                    <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Prescribed Drug Reference
                    </span>
                    <div className="flex items-center gap-2 mt-0.5">
                      <h2 className="text-xl font-black text-slate-900">{selectedOriginal.name}</h2>
                      <span className="text-xs font-mono px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                        {selectedOriginal.strength}
                      </span>
                    </div>
                    <p className="text-xs text-slate-600 mt-1">
                      Active Molecule: <span className="font-bold text-slate-800">{selectedOriginal.genericName}</span>
                    </p>
                  </div>

                  <div className="text-left sm:text-right">
                    <p className="text-[10px] text-slate-400 uppercase font-semibold">Original Retail Price</p>
                    <p className="text-2xl font-black font-mono text-slate-900">₹{(originalPrice ?? 0).toFixed(2)}</p>
                    <p className="text-[11px] text-slate-500">
                      Stock: <span className="font-semibold text-slate-700">{originalStock} units</span>
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="font-bold text-slate-700">Dosage Guidelines:</span>
                    <p className="text-slate-600 mt-0.5 text-[11px]">
                      {selectedOriginal.dosageGuidelines || 'As prescribed by physician post-meals.'}
                    </p>
                  </div>
                  <div className="p-2.5 bg-slate-50 rounded-xl border border-slate-200/80">
                    <span className="font-bold text-slate-700">Known Precautions:</span>
                    <p className="text-slate-600 mt-0.5 text-[11px]">
                      {selectedOriginal.sideEffects || 'Mild stomach upset may occur. Check allergy history.'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Bioequivalent Matches List */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h3 className="font-bold text-slate-900 text-sm">
                      Bioequivalent Generic Matches ({alternatives.length})
                    </h3>
                    <span className="text-xs text-slate-500">
                      Identical chemical salt & therapeutic action
                    </span>
                  </div>
                </div>

                {alternatives.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3.5">
                    {alternatives.map(alt => {
                      const matchedMed = medicines.find(m => m.id === alt.medicineId);
                      const savingsAmount = originalPrice - alt.sellingPrice;

                      return (
                        <div
                          key={alt.medicineId}
                          className="bg-white rounded-2xl border border-slate-200 hover:border-emerald-400 p-4 shadow-2xs hover:shadow-xs transition-all flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-start justify-between gap-2">
                              <div>
                                <span className="text-[9px] font-black uppercase tracking-wider text-emerald-800 bg-emerald-100 px-1.5 py-0.5 rounded">
                                  Generic Alternative
                                </span>
                                <h4 className="font-bold text-slate-900 text-base mt-1">{alt.brandName}</h4>
                                <p className="text-xs text-slate-500">{alt.manufacturer}</p>
                              </div>

                              <div className="text-right">
                                <div className="text-lg font-black font-mono text-emerald-700">
                                  ₹{(alt.sellingPrice ?? 0).toFixed(2)}
                                </div>
                                {alt.savingsPercentage > 0 && (
                                  <div className="inline-flex items-center gap-0.5 text-[10px] font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-full">
                                    <TrendingDown className="w-3 h-3" />
                                    <span>Save {alt.savingsPercentage}%</span>
                                  </div>
                                )}
                              </div>
                            </div>

                            <div className="mt-3 p-2.5 bg-slate-50 rounded-xl border border-slate-100 space-y-1 text-xs">
                              <div className="flex justify-between text-slate-600">
                                <span>Strength / Form:</span>
                                <span className="font-medium text-slate-800">{alt.strength} • {alt.form}</span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Patient Net Savings:</span>
                                <span className="font-mono font-bold text-emerald-800">
                                  {savingsAmount != null && savingsAmount > 0 ? `₹${savingsAmount.toFixed(2)} per unit` : 'Par pricing'}
                                </span>
                              </div>
                              <div className="flex justify-between text-slate-600">
                                <span>Stock in Pharmacy:</span>
                                <span className={alt.stockAvailable > 0 ? 'text-emerald-700 font-semibold' : 'text-rose-600 font-semibold'}>
                                  {alt.stockAvailable} units available
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                            {onSelectForPOS && matchedMed && alt.stockAvailable > 0 && (
                              <button
                                onClick={() => onSelectForPOS(matchedMed)}
                                className="w-full flex items-center justify-center gap-2 py-2 px-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-xs transition-colors"
                              >
                                <ShoppingCart className="w-3.5 h-3.5" />
                                <span>Dispense this Generic</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  <div className="p-8 bg-slate-50 rounded-2xl border border-dashed border-slate-300 text-center space-y-2">
                    <AlertCircle className="w-8 h-8 text-slate-400 mx-auto" />
                    <p className="font-semibold text-slate-700 text-sm">No Other Generic Equivalents in Stock</p>
                    <p className="text-xs text-slate-500 max-w-md mx-auto">
                      Currently there are no other active medicines in your inventory sharing the exact molecule{' '}
                      <span className="font-mono font-bold text-slate-800">"{selectedOriginal.genericName}"</span>. You can create a Purchase Order to procure low-cost generic equivalents.
                    </p>
                  </div>
                )}
              </div>
            </>
          ) : (
            <div className="p-12 text-center text-slate-400">
              <Pill className="w-10 h-10 mx-auto mb-2 text-slate-300" />
              <p className="font-semibold">Select a drug on the left to see generic substitutions</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
