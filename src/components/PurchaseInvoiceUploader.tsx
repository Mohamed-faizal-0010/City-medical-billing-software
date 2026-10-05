import React, { useState, useRef } from 'react';
import {
  Upload,
  FileSpreadsheet,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  CheckCircle2,
  AlertCircle,
  Eye,
  Sparkles,
  ArrowRight,
  FileUp,
  X,
  Camera,
  Building2,
  Check,
  Tag
} from 'lucide-react';
import { PurchaseInvoice, PurchaseInvoiceItem, Supplier } from '../types';
import { parsePurchaseSpreadsheet, processInvoiceDocument } from '../utils/purchaseInvoiceParser';
import { generateSamplePurchaseExcelTemplate } from '../utils/exportUtils';

interface PurchaseInvoiceUploaderProps {
  attachment: PurchaseInvoice['attachment'] | null;
  onAttachmentChange: (att: PurchaseInvoice['attachment'] | null) => void;
  onSpreadsheetParsed: (
    items: PurchaseInvoiceItem[],
    meta?: { invoiceNo?: string; invoiceDate?: string; distributorName?: string },
    mode?: 'replace' | 'append'
  ) => void;
  existingItemsCount: number;
  onShowPurchaseEntry?: () => void;
  isEditMode?: boolean;
  editingInvoiceNo?: string;
  distributor?: Supplier | null;
  onUpdateDistributorImage?: (image: string) => void;
}

export const PurchaseInvoiceUploader: React.FC<PurchaseInvoiceUploaderProps> = ({
  attachment,
  onAttachmentChange,
  onSpreadsheetParsed,
  existingItemsCount,
  onShowPurchaseEntry,
  isEditMode,
  editingInvoiceNo,
  distributor,
  onUpdateDistributorImage
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const agencyImgInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [uploadMessage, setUploadMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [showAgencyImagePicker, setShowAgencyImagePicker] = useState(false);

  // Pending spreadsheet confirmation modal if current bill already has items
  const [pendingSpreadsheet, setPendingSpreadsheet] = useState<{
    items: PurchaseInvoiceItem[];
    meta?: { invoiceNo?: string; invoiceDate?: string; distributorName?: string };
    filename: string;
    attachment: PurchaseInvoice['attachment'];
  } | null>(null);

  // Smart detected items from scanned document (image/pdf)
  const [pendingDocExtract, setPendingDocExtract] = useState<{
    items: PurchaseInvoiceItem[];
    meta?: { invoiceNo?: string; invoiceDate?: string; distributorName?: string };
    filename: string;
  } | null>(null);

  // Full image/doc preview modal
  const [showPreviewModal, setShowPreviewModal] = useState(false);

  // Handler for custom distributor/agency image upload
  const handleAgencyImageFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      setUploadMessage({
        type: 'error',
        text: 'Please select a valid image file (PNG, JPG, or WebP) for the distributor logo.'
      });
      return;
    }
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl && onUpdateDistributorImage) {
        onUpdateDistributorImage(dataUrl);
        setUploadMessage({
          type: 'success',
          text: `Distributor/Agency image for "${distributor?.name || 'Supplier'}" updated successfully!`
        });
      }
    };
    reader.readAsDataURL(file);
    if (agencyImgInputRef.current) {
      agencyImgInputRef.current.value = '';
    }
  };

  const agencyPresets = [
    { label: 'Pharma Hub', url: 'https://images.unsplash.com/photo-1586528116311-ad8dd3c8310d?w=200&auto=format&fit=crop&q=80' },
    { label: 'BioLogistics', url: 'https://images.unsplash.com/photo-1587293852726-70cdb56c2866?w=200&auto=format&fit=crop&q=80' },
    { label: 'Wholesale Depot', url: 'https://images.unsplash.com/photo-1576602976047-174e57a47881?w=200&auto=format&fit=crop&q=80' },
    { label: 'Cold Storage', url: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=200&auto=format&fit=crop&q=80' }
  ];

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
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      await processSelectedFile(files[0]);
    }
  };

  const handleFileInputChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      await processSelectedFile(files[0]);
    }
    // reset input so same file can be selected again if needed
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const processSelectedFile = async (file: File) => {
    setIsProcessing(true);
    setUploadMessage(null);

    const isExcel = /\.(xlsx|xls|csv)$/i.test(file.name);
    const isPdf = file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf');
    const isImage = file.type.startsWith('image/') || /\.(png|jpe?g|webp|bmp)$/i.test(file.name);

    if (!isExcel && !isPdf && !isImage) {
      setIsProcessing(false);
      setUploadMessage({
        type: 'error',
        text: 'Unsupported file type. Please upload Image (PNG/JPG), PDF, or Excel (XLS/XLSX/CSV).'
      });
      return;
    }

    try {
      if (isExcel) {
        const result = await parsePurchaseSpreadsheet(file);
        setIsProcessing(false);

        if (!result.success) {
          setUploadMessage({
            type: 'error',
            text: result.error || 'Failed to parse Excel file.'
          });
          return;
        }

        const newAttachment: PurchaseInvoice['attachment'] = {
          name: file.name,
          type: file.name.endsWith('.csv') ? 'csv' : 'xls',
          dataUrl: result.dataUrl,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };

        if (existingItemsCount > 0) {
          // Ask user whether to replace or append
          setPendingSpreadsheet({
            items: result.items,
            meta: result.meta,
            filename: file.name,
            attachment: newAttachment
          });
        } else {
          // Direct apply
          onAttachmentChange(newAttachment);
          onSpreadsheetParsed(result.items, result.meta, 'replace');
          setUploadMessage({
            type: 'success',
            text: `Imported ${result.items.length} medicines from ${file.name} successfully!`
          });
        }
      } else {
        // Image or PDF
        const result = await processInvoiceDocument(file);
        setIsProcessing(false);

        if (!result.success) {
          setUploadMessage({
            type: 'error',
            text: result.error || 'Failed to process document.'
          });
          return;
        }

        const newAttachment: PurchaseInvoice['attachment'] = {
          name: file.name,
          type: result.fileType as any,
          dataUrl: result.dataUrl,
          size: file.size,
          uploadedAt: new Date().toISOString()
        };

        onAttachmentChange(newAttachment);
        
        if (result.suggestedItems && result.suggestedItems.length > 0) {
          setPendingDocExtract({
            items: result.suggestedItems,
            meta: result.meta,
            filename: file.name
          });
          setUploadMessage({
            type: 'success',
            text: `Attached ${file.name} (${(file.size / 1024).toFixed(1)} KB). Scanned items detected ready for auto-fill!`
          });
        } else {
          setUploadMessage({
            type: 'success',
            text: `Attached ${file.name} (${(file.size / 1024).toFixed(1)} KB) to this purchase entry.`
          });
        }
      }
    } catch (err: any) {
      setIsProcessing(false);
      setUploadMessage({
        type: 'error',
        text: `Error uploading file: ${err.message || 'Unknown error'}`
      });
    }
  };

  const confirmSpreadsheetImport = (mode: 'replace' | 'append') => {
    if (!pendingSpreadsheet) return;
    onAttachmentChange(pendingSpreadsheet.attachment);
    onSpreadsheetParsed(pendingSpreadsheet.items, pendingSpreadsheet.meta, mode);
    setUploadMessage({
      type: 'success',
      text: `${mode === 'replace' ? 'Replaced bill with' : 'Appended'} ${pendingSpreadsheet.items.length} medicines from ${pendingSpreadsheet.filename}!`
    });
    setPendingSpreadsheet(null);
  };

  const handleDownloadAttachment = () => {
    if (!attachment?.dataUrl) return;
    const a = document.createElement('a');
    a.href = attachment.dataUrl;
    a.download = attachment.name;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div className="bg-white rounded-3xl border border-slate-200 p-5 lg:p-6 shadow-xs space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-teal-50 text-teal-700 flex items-center justify-center font-bold">
            <FileUp className="w-4 h-4" />
          </div>
          <div>
            <h2 className="font-extrabold text-slate-900 text-sm uppercase tracking-wide">
              Invoice Document Upload & Auto-Import
            </h2>
            <p className="text-xs text-slate-500">
              Upload distributor bill in <b>Image (PNG/JPG)</b>, <b>PDF</b>, or <b>Excel (XLSX/CSV)</b> to attach or auto-fill items.
            </p>
          </div>
        </div>

        {/* Download Sample Excel Template Button */}
        <button
          type="button"
          onClick={generateSamplePurchaseExcelTemplate}
          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors self-start sm:self-auto"
          title="Download pre-formatted Excel template for easy purchase inward import"
        >
          <Download className="w-3.5 h-3.5 text-emerald-600" />
          <span>Sample Excel Template</span>
        </button>
      </div>

      {/* Hidden File Input for Invoice Documents */}
      <input
        ref={fileInputRef}
        type="file"
        accept=".png,.jpg,.jpeg,.webp,.pdf,.xlsx,.xls,.csv"
        onChange={handleFileInputChange}
        className="hidden"
      />

      {/* Hidden File Input for Agency / Distributor Image Upload */}
      <input
        ref={agencyImgInputRef}
        type="file"
        accept="image/*"
        onChange={handleAgencyImageFile}
        className="hidden"
      />

      {/* DISTRIBUTOR / AGENCY BRANDING & IMAGE CARD */}
      {distributor && (
        <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {/* Agency Photo Avatar with Upload Trigger */}
            <div className="relative group shrink-0">
              <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-teal-500 bg-white shadow-xs">
                {distributor.image ? (
                  <img
                    src={distributor.image}
                    alt={distributor.name}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                    referrerPolicy="no-referrer"
                  />
                ) : (
                  <div className="w-full h-full bg-teal-100 text-teal-800 font-black text-lg flex items-center justify-center">
                    {distributor.name.slice(0, 2).toUpperCase()}
                  </div>
                )}
              </div>
              <button
                type="button"
                onClick={() => agencyImgInputRef.current?.click()}
                className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-teal-600 hover:bg-teal-700 text-white flex items-center justify-center shadow-md transition-transform hover:scale-110"
                title="Upload Distributor/Agency Logo Image"
              >
                <Camera className="w-3.5 h-3.5" />
              </button>
            </div>

            <div className="space-y-0.5">
              <div className="flex items-center gap-2 flex-wrap">
                <h3 className="font-extrabold text-slate-900 text-sm">{distributor.name}</h3>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-100 text-teal-800 text-[10px] font-bold">
                  <Tag className="w-2.5 h-2.5" />
                  <span>{distributor.agencyCode || `AGY-${distributor.id.toUpperCase()}`}</span>
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 font-semibold">
                  {distributor.paymentTerms}
                </span>
              </div>

              <div className="flex items-center gap-3 text-xs text-slate-500 flex-wrap">
                <span className="font-mono">GSTIN: <strong className="text-slate-700">{distributor.gstin || 'Unregistered'}</strong></span>
                {distributor.drugLicenseNo && (
                  <span className="font-mono">D.L.: <strong className="text-slate-700">{distributor.drugLicenseNo}</strong></span>
                )}
                <span>Tel: <strong className="text-slate-700">{distributor.phone}</strong></span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full md:w-auto justify-end flex-wrap">
            <button
              type="button"
              onClick={() => agencyImgInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-teal-50 text-teal-700 border border-teal-200 font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-2xs"
            >
              <Camera className="w-3.5 h-3.5" />
              <span>{distributor.image ? 'Change Agency Image' : 'Upload Agency Image'}</span>
            </button>
            <button
              type="button"
              onClick={() => setShowAgencyImagePicker(!showAgencyImagePicker)}
              className="px-2.5 py-1.5 bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold rounded-xl text-xs transition-colors"
              title="Pick from sample agency logo presets"
            >
              Presets
            </button>
          </div>
        </div>
      )}

      {/* Preset Agency Logo Quick Selector Modal / Popover */}
      {showAgencyImagePicker && onUpdateDistributorImage && (
        <div className="p-3 bg-teal-50/70 border border-teal-200 rounded-2xl space-y-2 animate-fadeIn">
          <div className="flex items-center justify-between text-xs font-bold text-teal-900">
            <span>Choose Sample Agency Logo / Photo Preset:</span>
            <button
              type="button"
              onClick={() => setShowAgencyImagePicker(false)}
              className="p-1 hover:bg-teal-200/50 rounded-lg text-teal-800"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {agencyPresets.map((preset, idx) => (
              <div
                key={idx}
                onClick={() => {
                  onUpdateDistributorImage(preset.url);
                  setShowAgencyImagePicker(false);
                  setUploadMessage({
                    type: 'success',
                    text: `Selected "${preset.label}" agency image preset!`
                  });
                }}
                className="p-2 bg-white rounded-xl border border-teal-200 hover:border-teal-500 cursor-pointer flex items-center gap-2 transition-all hover:shadow-xs group"
              >
                <img
                  src={preset.url}
                  alt={preset.label}
                  className="w-8 h-8 rounded-lg object-cover"
                  referrerPolicy="no-referrer"
                />
                <span className="text-xs font-bold text-slate-800 group-hover:text-teal-700 truncate">
                  {preset.label}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Dropzone / Current Attached File */}
      {!attachment ? (
        <div
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
            isDragging
              ? 'border-teal-500 bg-teal-50/50 ring-4 ring-teal-100'
              : 'border-slate-300 hover:border-teal-500 hover:bg-slate-50/70'
          }`}
        >
          <div className="flex flex-col items-center justify-center space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 rounded-2xl bg-teal-100 text-teal-700 flex items-center justify-center shadow-xs">
                <Upload className="w-5 h-5" />
              </div>
              <div className="flex items-center -space-x-1">
                <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center justify-center text-[10px] font-bold" title="Excel / CSV">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-rose-50 text-rose-700 border border-rose-200 flex items-center justify-center text-[10px] font-bold" title="PDF Document">
                  <FileText className="w-4 h-4" />
                </div>
                <div className="w-7 h-7 rounded-lg bg-sky-50 text-sky-700 border border-sky-200 flex items-center justify-center text-[10px] font-bold" title="Image / Scan">
                  <ImageIcon className="w-4 h-4" />
                </div>
              </div>
            </div>

            <div>
              <p className="text-sm font-bold text-slate-800">
                {isProcessing ? 'Reading and processing file...' : 'Drop invoice file here, or click to browse'}
              </p>
              <p className="text-xs text-slate-500 mt-0.5">
                Supports <b>XLSX / XLS / CSV</b> (auto-extracts line items), <b>PDF</b>, and <b>JPG / PNG</b> invoice scans
              </p>
            </div>

            <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
              <span className="px-2.5 py-1 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-semibold flex items-center gap-1">
                <FileSpreadsheet className="w-3.5 h-3.5" />
                <span>Excel: Auto-populate items</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-rose-50 border border-rose-200 text-rose-800 text-[11px] font-semibold flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                <span>PDF: Inward Bill Attachment</span>
              </span>
              <span className="px-2.5 py-1 rounded-lg bg-sky-50 border border-sky-200 text-sky-800 text-[11px] font-semibold flex items-center gap-1">
                <ImageIcon className="w-3.5 h-3.5" />
                <span>Image: Scanned Photo Attachment</span>
              </span>
            </div>
          </div>
        </div>
      ) : (
        /* Attached Document Card */
        <div className="p-4 bg-teal-50/60 border border-teal-200 rounded-2xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            {attachment.type === 'image' && attachment.dataUrl ? (
              <div
                onClick={() => setShowPreviewModal(true)}
                className="relative group w-14 h-14 rounded-xl overflow-hidden border border-teal-300 bg-white cursor-pointer shrink-0"
              >
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity text-white">
                  <Eye className="w-4 h-4" />
                </div>
              </div>
            ) : (
              <div className="w-12 h-12 rounded-xl bg-white border border-teal-200 text-teal-700 flex items-center justify-center shrink-0 shadow-xs">
                {attachment.type === 'pdf' ? (
                  <FileText className="w-6 h-6 text-rose-600" />
                ) : attachment.type === 'xls' || attachment.type === 'csv' ? (
                  <FileSpreadsheet className="w-6 h-6 text-emerald-600" />
                ) : (
                  <ImageIcon className="w-6 h-6 text-teal-600" />
                )}
              </div>
            )}

            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-slate-900 text-sm truncate max-w-[220px] sm:max-w-md">
                  {attachment.name}
                </span>
                <span className="px-2 py-0.5 rounded-md bg-teal-100 text-teal-800 font-mono text-[10px] font-bold uppercase">
                  {attachment.type}
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                {attachment.size ? `${(attachment.size / 1024).toFixed(1)} KB • ` : ''}
                Attached to purchase record
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto justify-end flex-wrap">
            {onShowPurchaseEntry && (existingItemsCount > 0 || attachment) && (
              <button
                type="button"
                onClick={onShowPurchaseEntry}
                className="px-3 py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
                title="Show full purchase entry voucher & review items"
              >
                <FileText className="w-3.5 h-3.5" />
                <span>Show Purchase Entry</span>
              </button>
            )}
            {attachment.dataUrl && (
              <button
                type="button"
                onClick={() => setShowPreviewModal(true)}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              >
                <Eye className="w-3.5 h-3.5 text-teal-600" />
                <span>Preview</span>
              </button>
            )}
            {attachment.dataUrl && (
              <button
                type="button"
                onClick={handleDownloadAttachment}
                className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                title="Download attached document"
              >
                <Download className="w-3.5 h-3.5 text-slate-600" />
                <span>Download</span>
              </button>
            )}
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="px-3 py-1.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 font-semibold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
              title="Replace or update attached document"
            >
              <Upload className="w-3.5 h-3.5 text-indigo-600" />
              <span>Replace / Update</span>
            </button>
            <button
              type="button"
              onClick={() => {
                onAttachmentChange(null);
                setUploadMessage(null);
                setPendingDocExtract(null);
              }}
              className="p-1.5 hover:bg-rose-100 text-rose-600 rounded-xl transition-colors"
              title="Remove attachment"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {/* Scanned Document Items Auto-Fill Card with Full Item Details & Entries Counter */}
      {pendingDocExtract && (
        <div className="p-4 sm:p-5 bg-sky-50 border-2 border-sky-200 rounded-3xl space-y-4 shadow-sm animate-fadeIn">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-sky-200/70 pb-3">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-sky-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <Sparkles className="w-5 h-5" />
              </div>
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-extrabold text-sky-950 text-sm">
                    Scanned Inward Bill Extracted Items
                  </span>
                  <span className="px-2.5 py-0.5 rounded-full bg-sky-200 text-sky-900 font-extrabold text-xs flex items-center gap-1">
                    <CheckCircle2 className="w-3.5 h-3.5 text-sky-700" />
                    <span>Number of Entries Completed: {pendingDocExtract.items.length}</span>
                  </span>
                </div>
                <p className="text-xs text-sky-800 mt-0.5">
                  Extracted from <b className="font-mono">{pendingDocExtract.filename}</b>. Verify product name, batch, expiry, quantity, MRP and rate below:
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 self-end sm:self-auto">
              <button
                type="button"
                onClick={() => {
                  onSpreadsheetParsed(pendingDocExtract.items, pendingDocExtract.meta, 'replace');
                  setUploadMessage({
                    type: 'success',
                    text: `Populated all ${pendingDocExtract.items.length} entries from scanned bill into purchase invoice!`
                  });
                  setPendingDocExtract(null);
                }}
                className="px-4 py-2 bg-sky-600 hover:bg-sky-700 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors shadow-xs"
              >
                <span>Auto-Fill All Entries</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
              <button
                type="button"
                onClick={() => setPendingDocExtract(null)}
                className="p-1.5 text-sky-600 hover:text-sky-800 rounded-lg hover:bg-sky-200/50"
                title="Dismiss preview"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Extracted Items Table: Product Name, Batch, Expiry, Quantity, MRP, Rate */}
          <div className="overflow-x-auto rounded-2xl border border-sky-200 bg-white shadow-2xs max-h-64 overflow-y-auto">
            <table className="w-full text-left text-xs text-slate-700">
              <thead className="bg-sky-100/70 text-[11px] font-extrabold text-sky-950 uppercase sticky top-0 z-10">
                <tr>
                  <th className="px-3 py-2.5">#</th>
                  <th className="px-3 py-2.5">Product Name</th>
                  <th className="px-3 py-2.5">Batch</th>
                  <th className="px-3 py-2.5">Expiry</th>
                  <th className="px-3 py-2.5 text-right">Quantity</th>
                  <th className="px-3 py-2.5 text-right">MRP (₹)</th>
                  <th className="px-3 py-2.5 text-right">Rate (₹)</th>
                  <th className="px-3 py-2.5 text-right">Net (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {pendingDocExtract.items.map((item, idx) => (
                  <tr key={idx} className="hover:bg-sky-50/50">
                    <td className="px-3 py-2 font-mono text-slate-400">{idx + 1}</td>
                    <td className="px-3 py-2 font-bold text-slate-900">
                      <div>{item.medicineName}</div>
                      {item.pack && <span className="text-[10px] text-slate-400">{item.pack}</span>}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-700 font-bold">{item.batchNumber}</td>
                    <td className="px-3 py-2 font-mono text-slate-600">{item.expiryDate}</td>
                    <td className="px-3 py-2 text-right">
                      <span className="font-bold text-slate-900">{item.billedQuantity}</span>
                      {item.freeQuantity > 0 && (
                        <span className="text-emerald-600 font-bold text-[10px] ml-1">+{item.freeQuantity}F</span>
                      )}
                    </td>
                    <td className="px-3 py-2 text-right font-mono text-slate-700">₹{item.mrp.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono font-bold text-slate-900">₹{item.purchaseRate.toFixed(2)}</td>
                    <td className="px-3 py-2 text-right font-mono font-extrabold text-teal-700">₹{item.netAmount.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Message feedback */}
      {uploadMessage && (
        <div
          className={`p-3 rounded-xl text-xs font-medium flex items-center justify-between ${
            uploadMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
              : 'bg-rose-50 text-rose-800 border border-rose-200'
          }`}
        >
          <div className="flex items-center gap-2">
            {uploadMessage.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            )}
            <span>{uploadMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setUploadMessage(null)}
            className="p-1 hover:bg-black/5 rounded-lg"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Spreadsheet Items Conflict Modal with Details Table */}
      {pendingSpreadsheet && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl p-6 max-w-2xl w-full shadow-2xl border border-slate-200 space-y-4 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center gap-3 text-emerald-800">
                <div className="w-10 h-10 rounded-2xl bg-emerald-100 flex items-center justify-center">
                  <FileSpreadsheet className="w-5 h-5 text-emerald-700" />
                </div>
                <div>
                  <h3 className="font-bold text-slate-900 text-base">Import Spreadsheet Inward Items</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-500 font-mono">{pendingSpreadsheet.filename}</span>
                    <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800 font-extrabold text-[10px]">
                      Number of Entries Completed: {pendingSpreadsheet.items.length}
                    </span>
                  </div>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setPendingSpreadsheet(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-600">
              Extracted <b>{pendingSpreadsheet.items.length} medicines</b> from this spreadsheet. Your current invoice already has <b>{existingItemsCount} item(s)</b>. Choose how to apply:
            </p>

            {/* Preview table of items */}
            <div className="overflow-x-auto rounded-2xl border border-slate-200 bg-slate-50/50 max-h-52 overflow-y-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-[10px] font-extrabold text-slate-600 uppercase sticky top-0">
                  <tr>
                    <th className="px-2.5 py-2">#</th>
                    <th className="px-2.5 py-2">Product Name</th>
                    <th className="px-2.5 py-2">Batch</th>
                    <th className="px-2.5 py-2">Expiry</th>
                    <th className="px-2.5 py-2 text-right">Qty</th>
                    <th className="px-2.5 py-2 text-right">MRP (₹)</th>
                    <th className="px-2.5 py-2 text-right">Rate (₹)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200/60 font-medium">
                  {pendingSpreadsheet.items.map((item, idx) => (
                    <tr key={idx} className="bg-white hover:bg-slate-50">
                      <td className="px-2.5 py-1.5 font-mono text-slate-400">{idx + 1}</td>
                      <td className="px-2.5 py-1.5 font-bold text-slate-900">{item.medicineName}</td>
                      <td className="px-2.5 py-1.5 font-mono">{item.batchNumber}</td>
                      <td className="px-2.5 py-1.5 font-mono text-slate-600">{item.expiryDate}</td>
                      <td className="px-2.5 py-1.5 text-right font-bold">{item.billedQuantity + (item.freeQuantity || 0)}</td>
                      <td className="px-2.5 py-1.5 text-right font-mono">₹{item.mrp.toFixed(2)}</td>
                      <td className="px-2.5 py-1.5 text-right font-mono font-bold text-slate-900">₹{item.purchaseRate.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => confirmSpreadsheetImport('replace')}
                className="w-full py-2.5 px-4 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors shadow-xs"
              >
                <span>Replace Existing Items ({pendingSpreadsheet.items.length} new entries)</span>
              </button>
              <button
                type="button"
                onClick={() => confirmSpreadsheetImport('append')}
                className="w-full py-2.5 px-4 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs flex items-center justify-center gap-2 transition-colors"
              >
                <span>Append to Existing Items (Combine both)</span>
              </button>
              <button
                type="button"
                onClick={() => setPendingSpreadsheet(null)}
                className="w-full py-2 px-4 text-slate-400 hover:text-slate-600 text-xs font-semibold"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Document Preview Modal */}
      {showPreviewModal && attachment?.dataUrl && (
        <div className="fixed inset-0 z-60 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-3 lg:p-6">
          <div className="bg-white rounded-2xl shadow-2xl border border-slate-200 max-w-4xl w-full max-h-[90vh] flex flex-col overflow-hidden">
            <div className="flex items-center justify-between p-4 border-b border-slate-200 bg-slate-50">
              <div className="flex items-center gap-2">
                {attachment.type === 'pdf' ? (
                  <FileText className="w-5 h-5 text-rose-600" />
                ) : attachment.type === 'image' ? (
                  <ImageIcon className="w-5 h-5 text-sky-600" />
                ) : (
                  <FileSpreadsheet className="w-5 h-5 text-emerald-600" />
                )}
                <span className="font-bold text-slate-900 text-sm truncate max-w-md">
                  {attachment.name}
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
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-200"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            <div className="p-4 flex-1 overflow-auto bg-slate-100 flex items-center justify-center">
              {attachment.type === 'image' ? (
                <img
                  src={attachment.dataUrl}
                  alt={attachment.name}
                  className="max-w-full max-h-[75vh] object-contain rounded-lg shadow-md border border-slate-200"
                />
              ) : attachment.type === 'pdf' ? (
                <iframe
                  src={attachment.dataUrl}
                  title={attachment.name}
                  className="w-full h-[75vh] rounded-lg border border-slate-200"
                />
              ) : (
                <div className="text-center p-8 bg-white rounded-2xl border border-slate-200 shadow-sm max-w-md">
                  <FileSpreadsheet className="w-16 h-16 text-emerald-600 mx-auto mb-3" />
                  <h3 className="font-bold text-slate-900 mb-1">Spreadsheet Attachment</h3>
                  <p className="text-xs text-slate-500 mb-4">{attachment.name}</p>
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
