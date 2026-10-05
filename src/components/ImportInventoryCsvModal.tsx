import React, { useState, useRef, useMemo } from 'react';
import {
  X,
  FileSpreadsheet,
  Upload,
  Download,
  CheckCircle2,
  AlertTriangle,
  AlertCircle,
  FileText,
  Layers,
  ArrowRight,
  RefreshCw,
  Search,
  Package,
  Calendar,
  Check,
  Building2,
  MapPin,
  ChevronDown,
  ChevronUp,
  HelpCircle,
  FileCheck
} from 'lucide-react';
import {
  ParsedInventoryRow,
  BulkImportResult,
  parseInventoryCsvOrExcel,
  downloadInventoryCsvTemplate,
  downloadInventoryExcelTemplate,
  executeBulkInventoryImport
} from '../utils/inventoryCsvParser';

interface ImportInventoryCsvModalProps {
  isOpen: boolean;
  onClose: () => void;
  onImportComplete: (result: BulkImportResult) => void;
}

export const ImportInventoryCsvModal: React.FC<ImportInventoryCsvModalProps> = ({
  isOpen,
  onClose,
  onImportComplete
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste'>('upload');
  const [file, setFile] = useState<File | null>(null);
  const [rawText, setRawText] = useState('');
  const [isParsing, setIsParsing] = useState(false);
  const [parseError, setParseError] = useState<string | null>(null);
  const [parsedRows, setParsedRows] = useState<ParsedInventoryRow[]>([]);
  const [detectedHeaders, setDetectedHeaders] = useState<string[]>([]);
  const [mergeExisting, setMergeExisting] = useState(true);
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'VALID' | 'WARNING' | 'ERROR'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isImporting, setIsImporting] = useState(false);
  const [importResult, setImportResult] = useState<BulkImportResult | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [showFieldHelp, setShowFieldHelp] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Handle Drag & Drop
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const droppedFile = e.dataTransfer.files[0];
      await handleProcessFile(droppedFile);
    }
  };

  // Handle File Processing
  const handleProcessFile = async (selectedFile: File) => {
    setFile(selectedFile);
    setParseError(null);
    setIsParsing(true);
    setImportResult(null);

    try {
      const { rows, headersDetected, error } = await parseInventoryCsvOrExcel(selectedFile);
      if (error) {
        setParseError(error);
        setParsedRows([]);
      } else {
        setParsedRows(rows);
        setDetectedHeaders(headersDetected);
      }
    } catch (err: any) {
      setParseError(err?.message || 'Failed to read file.');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Handle Raw Text Parse
  const handleProcessRawText = async () => {
    if (!rawText.trim()) {
      setParseError('Please paste your CSV or tabular data before parsing.');
      return;
    }

    setParseError(null);
    setIsParsing(true);
    setImportResult(null);

    try {
      const { rows, headersDetected, error } = await parseInventoryCsvOrExcel(rawText);
      if (error) {
        setParseError(error);
        setParsedRows([]);
      } else {
        setParsedRows(rows);
        setDetectedHeaders(headersDetected);
      }
    } catch (err: any) {
      setParseError(err?.message || 'Failed to parse text.');
      setParsedRows([]);
    } finally {
      setIsParsing(false);
    }
  };

  // Toggle row inclusion
  const handleToggleRow = (rowId: string) => {
    setParsedRows(prev =>
      prev.map(r => (r.id === rowId ? { ...r, isExcluded: !r.isExcluded } : r))
    );
  };

  // Select all or deselect all
  const handleSelectAll = (select: boolean) => {
    setParsedRows(prev =>
      prev.map(r => ({
        ...r,
        isExcluded: select ? false : true
      }))
    );
  };

  // Filtered rows for preview table
  const filteredRows = useMemo(() => {
    return parsedRows.filter(row => {
      // Status filter
      if (statusFilter === 'VALID' && row.status !== 'valid') return false;
      if (statusFilter === 'WARNING' && row.status !== 'warning') return false;
      if (statusFilter === 'ERROR' && row.status !== 'error') return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchName = row.name.toLowerCase().includes(q);
        const matchGeneric = row.genericName.toLowerCase().includes(q);
        const matchBatch = row.batchNumber.toLowerCase().includes(q);
        const matchMfr = row.manufacturer.toLowerCase().includes(q);
        if (!matchName && !matchGeneric && !matchBatch && !matchMfr) return false;
      }

      return true;
    });
  }, [parsedRows, statusFilter, searchQuery]);

  // Statistics
  const stats = useMemo(() => {
    const total = parsedRows.length;
    const validCount = parsedRows.filter(r => r.status === 'valid').length;
    const warningCount = parsedRows.filter(r => r.status === 'warning').length;
    const errorCount = parsedRows.filter(r => r.status === 'error').length;

    const selectedRows = parsedRows.filter(r => !r.isExcluded);
    const selectedCount = selectedRows.length;
    const totalStock = selectedRows.reduce((acc, r) => acc + r.stock, 0);
    const totalValuation = selectedRows.reduce((acc, r) => acc + r.stock * r.costPrice, 0);

    return {
      total,
      validCount,
      warningCount,
      errorCount,
      selectedCount,
      totalStock,
      totalValuation
    };
  }, [parsedRows]);

  // Execute Import
  const handleExecuteImport = () => {
    const activeRows = parsedRows.filter(r => !r.isExcluded);
    if (activeRows.length === 0) {
      alert('Please select at least one row to import.');
      return;
    }

    setIsImporting(true);
    setTimeout(() => {
      const result = executeBulkInventoryImport(activeRows, { mergeExisting });
      setIsImporting(false);
      if (result.success) {
        setImportResult(result);
        onImportComplete(result);
      } else {
        setParseError(result.error || 'Import failed.');
      }
    }, 250);
  };

  // Reset to pick new file
  const handleReset = () => {
    setFile(null);
    setRawText('');
    setParsedRows([]);
    setDetectedHeaders([]);
    setParseError(null);
    setImportResult(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-900/70 backdrop-blur-xs overflow-y-auto">
      <div
        className="relative bg-white rounded-2xl shadow-2xl border border-slate-200 w-full max-w-5xl my-auto overflow-hidden flex flex-col max-h-[92vh]"
        onClick={e => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className="px-6 py-4.5 bg-gradient-to-r from-teal-900 via-slate-900 to-indigo-950 text-white flex items-center justify-between border-b border-teal-800/40 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-black tracking-tight text-white">
                  Bulk Import Inventory & Opening Stock
                </h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-teal-500/20 text-teal-300 border border-teal-400/30">
                  CSV / Excel Onboarding
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Bulk upload medicines, batches, expiry dates, and initial opening stock into your pharmacy
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Download sample templates */}
            <div className="hidden sm:flex items-center gap-1.5 bg-white/10 p-1 rounded-xl border border-white/15">
              <button
                type="button"
                onClick={downloadInventoryCsvTemplate}
                className="px-2.5 py-1 text-xs font-bold text-teal-100 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-1 transition-colors"
                title="Download sample CSV template prefilled with Indian pharmacy drugs"
              >
                <Download className="w-3.5 h-3.5 text-teal-300" />
                <span>CSV Template</span>
              </button>
              <span className="text-white/20">|</span>
              <button
                type="button"
                onClick={downloadInventoryExcelTemplate}
                className="px-2.5 py-1 text-xs font-bold text-teal-100 hover:text-white hover:bg-white/10 rounded-lg flex items-center gap-1 transition-colors"
                title="Download formatted Excel (.xlsx) template"
              >
                <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-300" />
                <span>Excel Template</span>
              </button>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="p-2 text-slate-300 hover:text-white hover:bg-white/10 rounded-xl transition-colors"
              title="Close modal"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-5 sm:p-6 space-y-5 bg-slate-50/50">
          {/* Success Banner if import completed */}
          {importResult && (
            <div className="p-6 bg-emerald-50 border-2 border-emerald-300 rounded-2xl space-y-4 animate-in fade-in">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shrink-0 shadow-md">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div className="flex-1">
                  <h3 className="text-lg font-black text-emerald-950">
                    Inventory Bulk Import Completed Successfully!
                  </h3>
                  <p className="text-xs sm:text-sm text-emerald-800 mt-1">
                    Your pharmacy inventory and initial stock levels have been onboarded and synchronized.
                  </p>

                  {/* Stat breakdown */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4">
                    <div className="p-3 bg-white border border-emerald-200 rounded-xl">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">New Drugs Added</p>
                      <p className="text-lg font-black text-emerald-700 mt-0.5">
                        {importResult.createdMedicinesCount} SKUs
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-emerald-200 rounded-xl">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Existing Drugs Updated</p>
                      <p className="text-lg font-black text-indigo-700 mt-0.5">
                        {importResult.updatedMedicinesCount} SKUs
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-emerald-200 rounded-xl">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Total Stock Onboarded</p>
                      <p className="text-lg font-black text-teal-700 mt-0.5">
                        {importResult.totalStockAdded.toLocaleString('en-IN')} units
                      </p>
                    </div>
                    <div className="p-3 bg-white border border-emerald-200 rounded-xl">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Opening Stock Valuation</p>
                      <p className="text-lg font-black text-slate-900 mt-0.5">
                        ₹{importResult.totalValuationAdded.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>Import Another File</span>
                </button>
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 shadow-sm transition-colors"
                >
                  <Check className="w-4 h-4" />
                  <span>Close & View in Inventory</span>
                </button>
              </div>
            </div>
          )}

          {/* STEP 1: Upload or Paste (shown when no rows parsed or reset) */}
          {parsedRows.length === 0 && !importResult && (
            <div className="space-y-5">
              {/* Tab Selector */}
              <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl">
                  <button
                    type="button"
                    onClick={() => setActiveTab('upload')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                      activeTab === 'upload'
                        ? 'bg-white text-teal-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <Upload className="w-3.5 h-3.5" />
                    <span>Upload CSV / Excel</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveTab('paste')}
                    className={`px-3.5 py-1.5 rounded-lg text-xs font-bold flex items-center gap-2 transition-all ${
                      activeTab === 'paste'
                        ? 'bg-white text-teal-900 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Paste Raw Text / Table</span>
                  </button>
                </div>

                {/* Mobile download buttons */}
                <div className="flex sm:hidden items-center gap-2">
                  <button
                    type="button"
                    onClick={downloadInventoryCsvTemplate}
                    className="px-2.5 py-1.5 text-xs font-bold text-teal-800 bg-teal-50 border border-teal-200 rounded-lg flex items-center gap-1"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>CSV Template</span>
                  </button>
                  <button
                    type="button"
                    onClick={downloadInventoryExcelTemplate}
                    className="px-2.5 py-1.5 text-xs font-bold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg flex items-center gap-1"
                  >
                    <FileSpreadsheet className="w-3.5 h-3.5" />
                    <span>Excel Template</span>
                  </button>
                </div>
              </div>

              {/* Upload Tab */}
              {activeTab === 'upload' && (
                <div
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onDrop={handleDrop}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-8 sm:p-12 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-teal-500 bg-teal-50/50 scale-[1.005]'
                      : 'border-slate-300 hover:border-teal-500 bg-white hover:bg-slate-50/80 shadow-2xs'
                  }`}
                >
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".csv, .xlsx, .xls, .tsv, text/csv, application/vnd.openxmlformats-officedocument.spreadsheetml.sheet, application/vnd.ms-excel"
                    className="hidden"
                    onChange={e => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleProcessFile(e.target.files[0]);
                      }
                    }}
                  />

                  <div className="w-16 h-16 rounded-2xl bg-teal-50 text-teal-700 mx-auto flex items-center justify-center border border-teal-200 shadow-2xs mb-4">
                    {isParsing ? (
                      <RefreshCw className="w-8 h-8 animate-spin text-teal-600" />
                    ) : (
                      <Upload className="w-8 h-8" />
                    )}
                  </div>

                  <h3 className="text-base font-extrabold text-slate-800">
                    {isParsing ? 'Parsing spreadsheet rows...' : 'Choose or drag & drop your inventory file'}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1.5 max-w-md mx-auto">
                    Supports <span className="font-semibold text-slate-700">.csv, .xlsx, .xls</span> files. Columns can be in any order — the system automatically matches headers like Medicine Name, Batch, Expiry, Stock, Cost Price, MRP, etc.
                  </p>

                  <div className="mt-5 flex items-center justify-center gap-3">
                    <span className="px-4 py-2 bg-teal-600 hover:bg-teal-700 text-white text-xs font-bold rounded-xl shadow-xs transition-colors inline-flex items-center gap-1.5">
                      <Upload className="w-3.5 h-3.5" />
                      <span>Browse Files</span>
                    </span>
                  </div>
                </div>
              )}

              {/* Paste Tab */}
              {activeTab === 'paste' && (
                <div className="space-y-3 bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                      <FileText className="w-4 h-4 text-teal-600" />
                      <span>Paste CSV or Tab-Delimited Data (from Excel / Google Sheets)</span>
                    </label>
                    <span className="text-[11px] text-slate-400">First row must contain column headers</span>
                  </div>

                  <textarea
                    value={rawText}
                    onChange={e => setRawText(e.target.value)}
                    rows={8}
                    placeholder={`Medicine Name,Generic Name,Batch Number,Expiry Date,Initial Stock,Cost Price,Selling Price,MRP,Dosage Form,Manufacturer\nDolo 650,Paracetamol,DL-881A,12/2027,100,21.50,30.50,32.00,Tablet,Micro Labs\nAugmentin 625 Duo,Amoxicillin + Clav,AUG-490,08/2027,40,148.00,195.00,204.00,Tablet,GSK\nPan 40,Pantoprazole,PN-102K,05/2028,60,98.00,142.00,155.00,Tablet,Alkem Labs`}
                    className="w-full font-mono text-xs p-3.5 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent text-slate-800 leading-relaxed"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <button
                      type="button"
                      onClick={() => setRawText('')}
                      className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
                    >
                      Clear Text
                    </button>
                    <button
                      type="button"
                      disabled={isParsing || !rawText.trim()}
                      onClick={handleProcessRawText}
                      className="px-5 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-300 text-white font-bold text-xs rounded-xl shadow-xs flex items-center gap-1.5 transition-colors"
                    >
                      {isParsing ? (
                        <>
                          <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                          <span>Parsing Rows...</span>
                        </>
                      ) : (
                        <>
                          <span>Parse & Preview</span>
                          <ArrowRight className="w-3.5 h-3.5" />
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}

              {/* Supported Columns Guide Drawer */}
              <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
                <button
                  type="button"
                  onClick={() => setShowFieldHelp(prev => !prev)}
                  className="w-full px-5 py-3.5 flex items-center justify-between text-left text-xs font-bold text-slate-800 hover:bg-slate-50 transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <HelpCircle className="w-4 h-4 text-teal-600" />
                    <span>View Supported CSV / Excel Header Columns & Accepted Formats</span>
                  </span>
                  {showFieldHelp ? <ChevronUp className="w-4 h-4 text-slate-400" /> : <ChevronDown className="w-4 h-4 text-slate-400" />}
                </button>

                {showFieldHelp && (
                  <div className="px-5 pb-5 pt-2 border-t border-slate-100 text-xs text-slate-600 space-y-3 bg-slate-50/50">
                    <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="font-extrabold text-teal-900 block">Medicine Name *</span>
                        <span className="text-[11px] text-slate-500">Required. Brand name (e.g. Crocin 650, Pan 40, Augmentin).</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="font-extrabold text-slate-900 block">Generic Name / Molecule</span>
                        <span className="text-[11px] text-slate-500">Active salt (e.g. Paracetamol, Pantoprazole Sodium).</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="font-extrabold text-teal-900 block">Batch Number *</span>
                        <span className="text-[11px] text-slate-500">Lot/Batch identifier (e.g. BAT-101, DL-49). Auto-created if empty.</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="font-extrabold text-teal-900 block">Expiry Date *</span>
                        <span className="text-[11px] text-slate-500">Accepts MM/YYYY, MM/YY, YYYY-MM, or DD/MM/YYYY.</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="font-extrabold text-teal-900 block">Initial Stock *</span>
                        <span className="text-[11px] text-slate-500">Opening quantity in packs or units (e.g. 50, 100).</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="font-extrabold text-slate-900 block">Cost Price (₹) & MRP (₹)</span>
                        <span className="text-[11px] text-slate-500">Purchase rate & Maximum Retail Price.</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="font-extrabold text-slate-900 block">Dosage Form & Strength</span>
                        <span className="text-[11px] text-slate-500">Tablet, Syrup, Injection, Ointment, Capsule, Drops, etc.</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="font-extrabold text-slate-900 block">Manufacturer & Category</span>
                        <span className="text-[11px] text-slate-500">Company (Cipla, Sun Pharma) and class (Antibiotic, Analgesic).</span>
                      </div>
                      <div className="p-3 bg-white rounded-xl border border-slate-200">
                        <span className="font-extrabold text-slate-900 block">Rack Location & Barcode</span>
                        <span className="text-[11px] text-slate-500">Shelf position (Rack A-1) and EAN barcode for POS scanners.</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Parsing Error Box */}
          {parseError && (
            <div className="p-4 bg-rose-50 border border-rose-300 rounded-xl flex items-start gap-3 text-rose-800 text-xs animate-in fade-in">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div className="flex-1">
                <p className="font-bold text-rose-900">Unable to complete file processing</p>
                <p className="mt-0.5">{parseError}</p>
              </div>
            </div>
          )}

          {/* STEP 2: Preview & Validation Table */}
          {parsedRows.length > 0 && !importResult && (
            <div className="space-y-4">
              {/* KPI Strip */}
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2.5">
                <div className="p-3 bg-white border border-slate-200 rounded-xl">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Total Rows</p>
                  <p className="text-lg font-black text-slate-800 mt-0.5">{stats.total}</p>
                </div>
                <div className="p-3 bg-emerald-50/60 border border-emerald-200 rounded-xl">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-emerald-700">Valid Rows</p>
                  <p className="text-lg font-black text-emerald-800 mt-0.5">{stats.validCount}</p>
                </div>
                <div className="p-3 bg-amber-50/60 border border-amber-200 rounded-xl">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-amber-700">With Warnings</p>
                  <p className="text-lg font-black text-amber-800 mt-0.5">{stats.warningCount}</p>
                </div>
                <div className="p-3 bg-rose-50/60 border border-rose-200 rounded-xl">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-rose-700">Errors</p>
                  <p className="text-lg font-black text-rose-800 mt-0.5">{stats.errorCount}</p>
                </div>
                <div className="p-3 bg-teal-50/60 border border-teal-200 rounded-xl">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-teal-700">Stock Units</p>
                  <p className="text-lg font-black text-teal-800 mt-0.5">
                    {stats.totalStock.toLocaleString('en-IN')}
                  </p>
                </div>
                <div className="p-3 bg-indigo-50/60 border border-indigo-200 rounded-xl">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-indigo-700">Opening Value</p>
                  <p className="text-lg font-black text-indigo-900 mt-0.5">
                    ₹{stats.totalValuation.toLocaleString('en-IN', { maximumFractionDigits: 0 })}
                  </p>
                </div>
              </div>

              {/* Table Controls Bar */}
              <div className="bg-white p-3.5 border border-slate-200 rounded-xl flex flex-col md:flex-row md:items-center justify-between gap-3 shadow-2xs">
                <div className="flex items-center gap-2 flex-wrap">
                  {/* Status filter tabs */}
                  <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-lg">
                    <button
                      type="button"
                      onClick={() => setStatusFilter('ALL')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                        statusFilter === 'ALL'
                          ? 'bg-white text-slate-900 shadow-2xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      All ({stats.total})
                    </button>
                    <button
                      type="button"
                      onClick={() => setStatusFilter('VALID')}
                      className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                        statusFilter === 'VALID'
                          ? 'bg-emerald-600 text-white shadow-2xs'
                          : 'text-emerald-700 hover:text-emerald-900'
                      }`}
                    >
                      Valid ({stats.validCount})
                    </button>
                    {stats.warningCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('WARNING')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                          statusFilter === 'WARNING'
                            ? 'bg-amber-600 text-white shadow-2xs'
                            : 'text-amber-700 hover:text-amber-900'
                        }`}
                      >
                        Warnings ({stats.warningCount})
                      </button>
                    )}
                    {stats.errorCount > 0 && (
                      <button
                        type="button"
                        onClick={() => setStatusFilter('ERROR')}
                        className={`px-2.5 py-1 text-xs font-bold rounded-md transition-all ${
                          statusFilter === 'ERROR'
                            ? 'bg-rose-600 text-white shadow-2xs'
                            : 'text-rose-700 hover:text-rose-900'
                        }`}
                      >
                        Errors ({stats.errorCount})
                      </button>
                    )}
                  </div>

                  {/* Quick Select All / Deselect All */}
                  <div className="flex items-center gap-1.5 pl-2 border-l border-slate-200">
                    <button
                      type="button"
                      onClick={() => handleSelectAll(true)}
                      className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      Select All
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectAll(false)}
                      className="px-2 py-1 text-[11px] font-bold text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-md transition-colors"
                    >
                      Deselect All
                    </button>
                  </div>
                </div>

                <div className="flex items-center gap-2.5">
                  {/* Search filter in preview */}
                  <div className="relative flex-1 sm:w-60">
                    <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-1/2 -translate-y-1/2" />
                    <input
                      type="text"
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      placeholder="Filter parsed rows..."
                      className="w-full text-xs pl-8 pr-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg focus:bg-white focus:outline-none focus:ring-1 focus:ring-teal-500 text-slate-800"
                    />
                  </div>

                  {/* Conflict handling toggle */}
                  <label className="flex items-center gap-1.5 text-xs text-slate-700 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={mergeExisting}
                      onChange={e => setMergeExisting(e.target.checked)}
                      className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 focus:ring-teal-500"
                    />
                    <span className="font-semibold" title="If medicine name already exists, add or update batch instead of creating a duplicate medicine master card">
                      Merge with Existing
                    </span>
                  </label>
                </div>
              </div>

              {/* Interactive Preview Table */}
              <div className="bg-white border border-slate-200 rounded-xl overflow-hidden shadow-2xs">
                <div className="overflow-x-auto max-h-96">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead className="sticky top-0 z-10 bg-slate-100 text-slate-700 font-extrabold uppercase text-[10px] tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-2.5 px-3 w-10 text-center">
                          <input
                            type="checkbox"
                            checked={stats.selectedCount === stats.total && stats.total > 0}
                            onChange={e => handleSelectAll(e.target.checked)}
                            className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300"
                          />
                        </th>
                        <th className="py-2.5 px-2 w-14 text-center">Status</th>
                        <th className="py-2.5 px-3">Medicine & Molecule</th>
                        <th className="py-2.5 px-2">Form & Strength</th>
                        <th className="py-2.5 px-2">Batch No</th>
                        <th className="py-2.5 px-2">Expiry</th>
                        <th className="py-2.5 px-2 text-right">Initial Stock</th>
                        <th className="py-2.5 px-2 text-right">Cost (₹)</th>
                        <th className="py-2.5 px-2 text-right">Selling (₹)</th>
                        <th className="py-2.5 px-2 text-right">MRP (₹)</th>
                        <th className="py-2.5 px-3">Rack & Mfr</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-700">
                      {filteredRows.length === 0 ? (
                        <tr>
                          <td colSpan={11} className="py-10 text-center text-slate-400">
                            No rows match your current filter or search criteria.
                          </td>
                        </tr>
                      ) : (
                        filteredRows.map(row => {
                          const isExcluded = row.isExcluded;
                          return (
                            <tr
                              key={row.id}
                              className={`transition-colors ${
                                isExcluded
                                  ? 'bg-slate-50/70 opacity-60 text-slate-400'
                                  : row.status === 'error'
                                  ? 'bg-rose-50/30 hover:bg-rose-50/60'
                                  : row.status === 'warning'
                                  ? 'bg-amber-50/30 hover:bg-amber-50/60'
                                  : 'hover:bg-slate-50/80'
                              }`}
                            >
                              <td className="py-2.5 px-3 text-center">
                                <input
                                  type="checkbox"
                                  checked={!isExcluded}
                                  onChange={() => handleToggleRow(row.id)}
                                  className="w-3.5 h-3.5 text-teal-600 rounded border-slate-300 cursor-pointer"
                                />
                              </td>
                              <td className="py-2.5 px-2 text-center">
                                {row.status === 'valid' && (
                                  <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-emerald-100 text-emerald-700" title="Valid - Ready to import">
                                    <Check className="w-3.5 h-3.5 font-bold" />
                                  </span>
                                )}
                                {row.status === 'warning' && (
                                  <span
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-amber-100 text-amber-700 cursor-help"
                                    title={row.validationIssues.join(' • ')}
                                  >
                                    <AlertTriangle className="w-3.5 h-3.5" />
                                  </span>
                                )}
                                {row.status === 'error' && (
                                  <span
                                    className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-rose-100 text-rose-700 cursor-help"
                                    title={row.validationIssues.join(' • ')}
                                  >
                                    <AlertCircle className="w-3.5 h-3.5" />
                                  </span>
                                )}
                              </td>
                              <td className="py-2.5 px-3">
                                <p className="font-extrabold text-slate-900 leading-snug">{row.name}</p>
                                <p className="text-[11px] text-slate-500 line-clamp-1">{row.genericName}</p>
                                {row.validationIssues.length > 0 && (
                                  <p className="text-[10px] text-amber-700 font-semibold mt-0.5">
                                    ⚠️ {row.validationIssues.join('; ')}
                                  </p>
                                )}
                              </td>
                              <td className="py-2.5 px-2">
                                <span className="font-semibold text-slate-800">{row.form}</span>
                                <span className="text-[11px] text-slate-500 block">{row.strength}</span>
                              </td>
                              <td className="py-2.5 px-2 font-mono font-bold text-slate-800">
                                {row.batchNumber}
                              </td>
                              <td className="py-2.5 px-2 font-medium text-slate-700">
                                {row.expiryDate}
                              </td>
                              <td className="py-2.5 px-2 text-right font-black text-teal-700">
                                {row.stock}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-600">
                                ₹{row.costPrice.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono font-bold text-slate-900">
                                ₹{row.sellingPrice.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-2 text-right font-mono text-slate-500">
                                ₹{row.mrp.toFixed(2)}
                              </td>
                              <td className="py-2.5 px-3">
                                <span className="text-slate-800 font-semibold block">{row.rackLocation}</span>
                                <span className="text-[11px] text-slate-500 block truncate max-w-[120px]">
                                  {row.manufacturer}
                                </span>
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>

                {/* Table Footer Bar */}
                <div className="px-4 py-2.5 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex items-center justify-between">
                  <span>
                    Showing {filteredRows.length} of {stats.total} rows • Selected for import: <strong className="text-teal-900 font-bold">{stats.selectedCount}</strong> rows ({stats.totalStock.toLocaleString('en-IN')} units)
                  </span>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="text-xs text-rose-600 hover:text-rose-800 font-bold transition-colors"
                  >
                    Discard & Pick Another File
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-4 bg-white border-t border-slate-200 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            {parsedRows.length > 0 && !importResult && (
              <button
                type="button"
                onClick={handleReset}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
              >
                Back to File Upload
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-white hover:bg-slate-100 text-slate-700 border border-slate-300 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>

            {parsedRows.length > 0 && !importResult && (
              <button
                type="button"
                disabled={isImporting || stats.selectedCount === 0}
                onClick={handleExecuteImport}
                className="px-6 py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-extrabold rounded-xl text-xs shadow-md flex items-center gap-2 transition-all cursor-pointer"
              >
                {isImporting ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span>Importing {stats.selectedCount} Medicines...</span>
                  </>
                ) : (
                  <>
                    <Check className="w-4 h-4" />
                    <span>Confirm & Bulk Import ({stats.selectedCount} Drugs)</span>
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
