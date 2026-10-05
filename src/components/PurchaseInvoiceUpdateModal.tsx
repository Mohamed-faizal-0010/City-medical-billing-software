import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Download,
  CheckCircle2,
  AlertCircle,
  X,
  RefreshCw,
  Edit3,
  Paperclip,
  ArrowRight,
  Eye,
  FileUp,
  Boxes
} from 'lucide-react';
import { PurchaseInvoice, PurchaseInvoiceItem } from '../types';
import { StorageService } from '../services/storage';
import { parsePurchaseSpreadsheet, processInvoiceDocument, ParsedInvoiceResult } from '../utils/purchaseInvoiceParser';
import { exportPurchaseInvoiceToPDF, exportPurchaseInvoiceToExcel } from '../utils/exportUtils';

interface PurchaseInvoiceUpdateModalProps {
  invoice: PurchaseInvoice | null;
  onClose: () => void;
  onUpdated: (updatedInvoice: PurchaseInvoice, message: string) => void;
  onOpenInFullEditor: (invoice: PurchaseInvoice, newAttachment?: PurchaseInvoice['attachment'], newItems?: PurchaseInvoiceItem[]) => void;
}

export const PurchaseInvoiceUpdateModal: React.FC<PurchaseInvoiceUpdateModalProps> = ({
  invoice,
  onClose,
  onUpdated,
  onOpenInFullEditor
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [parsedResult, setParsedResult] = useState<ParsedInvoiceResult | null>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [recalculateInventory, setRecalculateInventory] = useState(true);

  if (!invoice) return null;

  const pharmacyProfile = StorageService.getPharmacyProfile();

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
      await handleFileSelected(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await handleFileSelected(e.target.files[0]);
    }
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleFileSelected = async (file: File) => {
    setIsProcessing(true);
    setErrorMessage(null);
    setSelectedFile(file);

    const isExcel = /\.(xlsx|xls|csv)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);

    if (!isExcel && !isPdf && !isImage) {
      setIsProcessing(false);
      setErrorMessage('Unsupported file format. Please upload an Image (PNG/JPG), PDF, or Excel (XLSX/CSV) file.');
      return;
    }

    try {
      if (isExcel) {
        const result = await parsePurchaseSpreadsheet(file);
        setIsProcessing(false);
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to read spreadsheet file.');
          return;
        }
        setParsedResult(result);
      } else {
        const result = await processInvoiceDocument(file);
        setIsProcessing(false);
        if (!result.success) {
          setErrorMessage(result.error || 'Failed to process document.');
          return;
        }
        setParsedResult(result);
      }
    } catch (err: any) {
      setIsProcessing(false);
      setErrorMessage(err.message || 'Error processing invoice file.');
    }
  };

  // Action 1: Update Document Attachment Only
  const handleUpdateAttachmentOnly = () => {
    if (!parsedResult || !selectedFile) return;

    const newAttachment: PurchaseInvoice['attachment'] = {
      name: selectedFile.name,
      type: parsedResult.fileType as any,
      dataUrl: parsedResult.dataUrl,
      size: selectedFile.size,
      uploadedAt: new Date().toISOString()
    };

    const updated = StorageService.updatePurchaseInvoiceAttachment(invoice.id, newAttachment);
    if (updated) {
      onUpdated(updated, `Attached new document "${selectedFile.name}" to Purchase Entry #${invoice.invoiceNo}!`);
      onClose();
    }
  };

  // Action 2: Update Both Attachment and Line Items (Auto-recalculate)
  const handleUpdateItemsAndAttachment = () => {
    if (!parsedResult || !selectedFile) return;

    const itemsToApply =
      (parsedResult.items && parsedResult.items.length > 0)
        ? parsedResult.items
        : (parsedResult.suggestedItems && parsedResult.suggestedItems.length > 0)
        ? parsedResult.suggestedItems
        : (invoice.items || []);

    const newAttachment: PurchaseInvoice['attachment'] = {
      name: selectedFile.name,
      type: parsedResult.fileType as any,
      dataUrl: parsedResult.dataUrl,
      size: selectedFile.size,
      uploadedAt: new Date().toISOString()
    };

    // Calculate totals for new items
    const subtotal = itemsToApply.reduce((sum, i) => sum + (i.taxableAmount || 0), 0);
    const totalTax = itemsToApply.reduce((sum, i) => sum + (i.totalTax || 0), 0);
    const grandTotal = Math.round((subtotal + totalTax) * 100) / 100;

    const updatedInvoice: PurchaseInvoice = {
      ...invoice,
      invoiceNo: parsedResult.meta?.invoiceNo || invoice.invoiceNo,
      invoiceDate: parsedResult.meta?.invoiceDate || invoice.invoiceDate,
      items: itemsToApply,
      subtotal,
      taxableAmount: subtotal,
      cgstAmount: totalTax / 2,
      sgstAmount: totalTax / 2,
      totalTax,
      grandTotal,
      attachment: newAttachment,
      notes: `${invoice.notes || ''} [Updated via ${selectedFile.name} on ${new Date().toLocaleDateString()}]`.trim()
    };

    StorageService.updatePurchaseInvoice(updatedInvoice, recalculateInventory);
    onUpdated(
      updatedInvoice,
      `Successfully updated Purchase Entry #${updatedInvoice.invoiceNo} with ${itemsToApply.length} items from ${selectedFile.name}!`
    );
    onClose();
  };

  // Action 3: Open in Full Editor
  const handleOpenFullEditor = () => {
    if (parsedResult && selectedFile) {
      const newAttachment: PurchaseInvoice['attachment'] = {
        name: selectedFile.name,
        type: parsedResult.fileType as any,
        dataUrl: parsedResult.dataUrl,
        size: selectedFile.size,
        uploadedAt: new Date().toISOString()
      };
      const itemsToApply = (parsedResult.items && parsedResult.items.length > 0)
        ? parsedResult.items 
        : (parsedResult.suggestedItems || []);
      onOpenInFullEditor(invoice, newAttachment, itemsToApply);
    } else {
      onOpenInFullEditor(invoice);
    }
    onClose();
  };

  const handleDownloadCurrentAttachment = () => {
    if (!invoice.attachment?.dataUrl) return;
    const link = document.createElement('a');
    link.href = invoice.attachment.dataUrl;
    link.download = invoice.attachment.name;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-3 lg:p-6 overflow-y-auto">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-2xl w-full p-6 lg:p-8 space-y-6 max-h-[92vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center shrink-0">
              <FileUp className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-slate-900">Upload & Update Purchase Invoice</h2>
                <span className="px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200 text-[10px] font-bold">
                  Update Mode
                </span>
              </div>
              <p className="text-xs text-slate-500 font-mono">
                Invoice #{invoice.invoiceNo} • {invoice.distributorName}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Current Invoice Summary Card */}
        <div className="p-4 bg-slate-50 rounded-2xl border border-slate-200 space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-slate-500">Current Inward Record:</span>
            <span className="font-mono font-bold text-slate-900">₹{(invoice.grandTotal || 0).toFixed(2)}</span>
          </div>
          <div className="grid grid-cols-3 gap-2 text-[11px] pt-1 border-t border-slate-200/60 text-slate-600">
            <div>
              <span className="text-slate-400 block text-[10px]">Invoice Date:</span>
              <span className="font-medium">{invoice.invoiceDate}</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Items Count:</span>
              <span className="font-medium">{(invoice.items || []).length} Medicines</span>
            </div>
            <div>
              <span className="text-slate-400 block text-[10px]">Current Document:</span>
              <span className="font-medium truncate block max-w-[120px]">
                {invoice.attachment ? invoice.attachment.name : 'No file attached'}
              </span>
            </div>
          </div>

          {/* Quick Downloads for current record */}
          <div className="pt-2 flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-slate-400">Download Current:</span>
            <button
              type="button"
              onClick={() => exportPurchaseInvoiceToPDF(invoice, pharmacyProfile)}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-rose-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>PDF Voucher</span>
            </button>
            <button
              type="button"
              onClick={() => exportPurchaseInvoiceToExcel(invoice, pharmacyProfile)}
              className="px-2 py-1 bg-white hover:bg-slate-100 text-emerald-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Excel Sheet</span>
            </button>
            {invoice.attachment?.dataUrl && (
              <button
                type="button"
                onClick={handleDownloadCurrentAttachment}
                className="px-2 py-1 bg-white hover:bg-slate-100 text-teal-700 border border-slate-200 rounded-lg text-[10px] font-bold flex items-center gap-1"
              >
                <Paperclip className="w-3 h-3" />
                <span>Existing Document ({invoice.attachment.type.toUpperCase()})</span>
              </button>
            )}
          </div>
        </div>

        {/* Upload Dropzone */}
        <div className="space-y-3">
          <label className="text-xs font-bold text-slate-700 block">
            Select New Invoice File (Image, PDF, or Excel):
          </label>

          <input
            ref={fileInputRef}
            type="file"
            accept=".png,.jpg,.jpeg,.webp,.pdf,.xlsx,.xls,.csv"
            onChange={handleFileInputChange}
            className="hidden"
          />

          <div
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
            className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-indigo-500 bg-indigo-50/50 ring-4 ring-indigo-100'
                : 'border-slate-300 hover:border-indigo-500 hover:bg-slate-50/70'
            }`}
          >
            <div className="flex flex-col items-center justify-center space-y-2">
              <div className="w-10 h-10 rounded-2xl bg-indigo-100 text-indigo-700 flex items-center justify-center">
                <Upload className="w-5 h-5" />
              </div>
              <p className="text-xs font-bold text-slate-800">
                {isProcessing
                  ? 'Reading file contents...'
                  : selectedFile
                  ? `Selected: ${selectedFile.name}`
                  : 'Drop revised invoice file here or click to browse'}
              </p>
              <p className="text-[11px] text-slate-400">
                Upload updated bill in <b>Image (PNG/JPG)</b>, <b>PDF</b>, or <b>Excel (XLSX/CSV)</b>
              </p>
            </div>
          </div>
        </div>

        {/* Error message */}
        {errorMessage && (
          <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-800 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Newly Selected File Card */}
        {parsedResult && selectedFile && (
          <div className="p-4 bg-indigo-50/70 border border-indigo-200 rounded-2xl space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-white border border-indigo-200 text-indigo-700 flex items-center justify-center font-bold">
                  {parsedResult.fileType === 'pdf' ? (
                    <FileText className="w-5 h-5 text-rose-600" />
                  ) : parsedResult.fileType === 'xls' || parsedResult.fileType === 'csv' ? (
                    <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <ImageIcon className="w-5 h-5 text-sky-600" />
                  )}
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-900 text-xs truncate max-w-xs">{selectedFile.name}</span>
                    <span className="px-1.5 py-0.5 rounded bg-indigo-200 text-indigo-800 text-[10px] font-bold uppercase">
                      {parsedResult.fileType}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    {(selectedFile.size / 1024).toFixed(1)} KB • Ready to update invoice
                  </p>
                </div>
              </div>

              {parsedResult.dataUrl && (
                <button
                  type="button"
                  onClick={() => {
                    const win = window.open();
                    if (win) win.document.write(`<iframe src="${parsedResult.dataUrl}" frameborder="0" style="border:0; top:0px; left:0px; bottom:0px; right:0px; width:100%; height:100%;" allowfullscreen></iframe>`);
                  }}
                  className="px-2.5 py-1 bg-white hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-semibold flex items-center gap-1"
                >
                  <Eye className="w-3.5 h-3.5" />
                  <span>View Doc</span>
                </button>
              )}
            </div>

            {/* Parsing Details Banner */}
            {parsedResult && parsedResult.items && parsedResult.items.length > 0 ? (
              <div className="p-2.5 bg-emerald-100/60 border border-emerald-200 rounded-xl text-emerald-900 text-xs flex items-center justify-between">
                <span>
                  ✓ Found <b>{parsedResult.items.length} line items</b> in spreadsheet.
                </span>
                <span className="font-semibold text-[11px]">Ready to synchronize stock</span>
              </div>
            ) : parsedResult && parsedResult.suggestedItems && parsedResult.suggestedItems.length > 0 ? (
              <div className="p-2.5 bg-sky-100/60 border border-sky-200 rounded-xl text-sky-900 text-xs flex items-center justify-between">
                <span>
                  ✓ Document scan verified • <b>{parsedResult.suggestedItems.length} items</b> detected
                </span>
                <span className="font-semibold text-[11px]">Can auto-update line items</span>
              </div>
            ) : null}

            {/* Inventory re-calculation checkbox */}
            <label className="flex items-center gap-2 cursor-pointer text-xs font-medium text-slate-700 pt-1">
              <input
                type="checkbox"
                checked={recalculateInventory}
                onChange={e => setRecalculateInventory(e.target.checked)}
                className="w-4 h-4 text-indigo-600 rounded-sm"
              />
              <span>Automatically update inventory stock & batches with new items</span>
            </label>
          </div>
        )}

        {/* Action Buttons */}
        <div className="space-y-2 pt-2 border-t border-slate-100">
          {parsedResult && selectedFile ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleUpdateAttachmentOnly}
                className="w-full py-2.5 px-4 bg-white hover:bg-slate-100 text-slate-800 border border-slate-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <Paperclip className="w-4 h-4 text-slate-500" />
                <span>Update Attachment Only</span>
              </button>

              <button
                type="button"
                onClick={handleUpdateItemsAndAttachment}
                className="w-full py-2.5 px-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <RefreshCw className="w-4 h-4" />
                <span>Update Items & Document</span>
              </button>
            </div>
          ) : null}

          <div className="flex items-center justify-between gap-2 pt-2">
            <button
              type="button"
              onClick={handleOpenFullEditor}
              className="py-2 px-3 text-indigo-700 hover:bg-indigo-50 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
            >
              <Edit3 className="w-3.5 h-3.5" />
              <span>Open in Full Purchase Entry Editor</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="py-2 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition-colors"
            >
              Cancel
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
