import React, { useState, useMemo } from 'react';
import {
  Search,
  Link2,
  ExternalLink,
  QrCode,
  Copy,
  Check,
  Share2,
  Plus,
  Sparkles,
  Globe,
  Eye,
  Trash2,
  Smartphone,
  Building2,
  ShoppingBag,
  Stethoscope,
  Pill,
  ArrowUpRight,
  BarChart2,
  FileText,
  CheckCircle2,
  X,
  RefreshCw,
  Send,
  SlidersHorizontal,
  ChevronRight
} from 'lucide-react';
import { ShortLink, Medicine } from '../types';
import { StorageService } from '../services/storage';
import { EXTERNAL_SEARCH_ENGINES, SearchEnginePortal } from '../data/initialShortLinks';
import { QRCode } from '../components/QRCode';
import { copyToClipboardSafely } from '../utils/billShareUtils';

interface ShortLinkSearchViewProps {
  onNavigateToPOS?: () => void;
  onNavigateToInvoice?: (invoiceId: string) => void;
}

export const ShortLinkSearchView: React.FC<ShortLinkSearchViewProps> = () => {
  // Data state
  const [shortLinks, setShortLinks] = useState<ShortLink[]>(() => StorageService.getShortLinks());
  const medicines = useMemo(() => StorageService.getMedicines(), []);

  // Search and filter state
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'all' | 'links' | 'medicines' | 'portals' | 'pages'>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');

  // UI state
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [qrModalLink, setQrModalLink] = useState<ShortLink | null>(null);
  const [previewLink, setPreviewLink] = useState<ShortLink | null>(null);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);

  // New short link form state
  const [newTitle, setNewTitle] = useState('');
  const [newSlug, setNewSlug] = useState('');
  const [newDomain, setNewDomain] = useState('cityrx.link');
  const [newOriginalUrl, setNewOriginalUrl] = useState('');
  const [newCategory, setNewCategory] = useState<'medicine' | 'invoice' | 'website' | 'prescription' | 'custom'>('website');
  const [newDescription, setNewDescription] = useState('');
  const [selectedMedicineId, setSelectedMedicineId] = useState('');

  // Handle Copy Link
  const handleCopyLink = async (shortUrl: string, id: string) => {
    await copyToClipboardSafely(shortUrl);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  // Handle Share WhatsApp
  const handleShareWhatsApp = async (link: ShortLink) => {
    const rawMsg = `*City Medical, Melur*\n${link.title}\n🔗 ${link.shortUrl}\n\nFor inquiries or orders, contact City Medical Melur: +91 98421 87654`;
    await copyToClipboardSafely(rawMsg);
    const text = encodeURIComponent(rawMsg);
    const url = `https://api.whatsapp.com/send?text=${text}`;
    try {
      const a = document.createElement('a');
      a.href = url;
      a.target = '_blank';
      a.rel = 'noopener noreferrer';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
    } catch {
      window.open(url, '_blank');
    }
  };

  // Handle Delete Link
  const handleDeleteLink = (id: string) => {
    if (window.confirm('Are you sure you want to delete this short link?')) {
      StorageService.deleteShortLink(id);
      setShortLinks(StorageService.getShortLinks());
    }
  };

  // Handle Create Short Link
  const handleCreateShortLink = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSlug.trim() && !newTitle.trim()) return;

    let targetUrl = newOriginalUrl.trim();
    let meta: ShortLink['metadata'] = { description: newDescription };

    if (newCategory === 'medicine' && selectedMedicineId) {
      const med = medicines.find(m => m.id === selectedMedicineId);
      if (med) {
        targetUrl = `/medicine/${med.id}`;
        meta = {
          medicineId: med.id,
          medicineName: med.name,
          genericName: med.genericName,
          manufacturer: med.manufacturer,
          amount: med.batches[0]?.sellingPrice || 0,
          description: `${med.form} - ${med.strength}. ${newDescription}`
        };
      }
    }

    const created = StorageService.addShortLink({
      code: newSlug.trim() || `link-${Date.now().toString(36)}`,
      domain: newDomain,
      originalUrl: targetUrl || '/',
      title: newTitle.trim() || `Short Link ${newSlug}`,
      category: newCategory,
      metadata: meta
    });

    setShortLinks(StorageService.getShortLinks());
    setIsCreateModalOpen(false);
    // Reset form
    setNewTitle('');
    setNewSlug('');
    setNewOriginalUrl('');
    setNewDescription('');
    setSelectedMedicineId('');
  };

  // Quick shorten medicine directly
  const handleQuickShortenMedicine = (med: Medicine) => {
    const existing = shortLinks.find(l => l.metadata?.medicineId === med.id);
    if (existing) {
      handleCopyLink(existing.shortUrl, existing.id);
      return;
    }
    const created = StorageService.createShortLinkForMedicine(med);
    setShortLinks(StorageService.getShortLinks());
    handleCopyLink(created.shortUrl, created.id);
  };

  // Filtered Short Links
  const filteredShortLinks = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    return shortLinks.filter(link => {
      if (categoryFilter !== 'all' && link.category !== categoryFilter) return false;
      if (!q) return true;
      return (
        link.title.toLowerCase().includes(q) ||
        link.code.toLowerCase().includes(q) ||
        link.shortUrl.toLowerCase().includes(q) ||
        link.originalUrl.toLowerCase().includes(q) ||
        link.metadata?.medicineName?.toLowerCase().includes(q) ||
        link.metadata?.genericName?.toLowerCase().includes(q) ||
        link.metadata?.description?.toLowerCase().includes(q) ||
        link.metadata?.tags?.some(t => t.toLowerCase().includes(q))
      );
    });
  }, [shortLinks, searchQuery, categoryFilter]);

  // Filtered Medicines matching search query
  const matchingMedicines = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return medicines.slice(0, 8); // show top 8 default popular
    return medicines
      .filter(
        m =>
          m.name.toLowerCase().includes(q) ||
          m.genericName.toLowerCase().includes(q) ||
          m.manufacturer.toLowerCase().includes(q) ||
          m.category.toLowerCase().includes(q)
      )
      .slice(0, 15);
  }, [medicines, searchQuery]);

  // Total statistics
  const stats = useMemo(() => {
    const totalClicks = shortLinks.reduce((acc, l) => acc + (l.clicks || 0), 0);
    const totalActive = shortLinks.filter(l => l.isActive).length;
    const medicineLinks = shortLinks.filter(l => l.category === 'medicine').length;
    return {
      totalLinks: shortLinks.length,
      totalClicks,
      totalActive,
      medicineLinks
    };
  }, [shortLinks]);

  // Open external search engine
  const handleOpenSearchEngine = (engine: SearchEnginePortal, customTerm?: string) => {
    const term = customTerm || searchQuery.trim() || 'Pantoprazole';
    const targetUrl = engine.searchUrlTemplate.replace('{{QUERY}}', encodeURIComponent(term));
    window.open(targetUrl, '_blank', 'noopener,noreferrer');
  };

  return (
    <div className="space-y-6 pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-emerald-950 to-slate-900 text-white rounded-3xl p-6 lg:p-8 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 w-80 h-80 bg-emerald-500/10 rounded-full blur-3xl pointer-events-none" />
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/30 text-emerald-300 text-xs font-semibold mb-3">
              <Sparkles className="w-3.5 h-3.5" />
              <span>City Medical Web Search & Short Link Hub</span>
            </div>
            <h1 className="text-2xl lg:text-3xl font-extrabold tracking-tight">
              Short Link & Website Search Engine
            </h1>
            <p className="text-slate-300 text-sm mt-2 leading-relaxed">
              Universal medicine, digital bill, and web search index. Generate branded shareable short URLs (<span className="text-emerald-400 font-mono">cityrx.link/...</span>), QR codes, and search premier medical reference portals in real-time.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-5 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl shadow-lg transition-all flex items-center gap-2 text-sm"
              id="btn-create-short-link"
            >
              <Plus className="w-4 h-4" />
              <span>New Short Link</span>
            </button>
          </div>
        </div>

        {/* Global Search Bar */}
        <div className="mt-8 relative max-w-3xl">
          <div className="relative flex items-center">
            <Search className="w-5 h-5 absolute left-4 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              placeholder="Search Pentose 40, Rabalkem DSR, Pan 40, short links, or medical portals..."
              className="w-full pl-12 pr-28 py-3.5 bg-white/10 hover:bg-white/15 focus:bg-white text-white focus:text-slate-900 placeholder:text-slate-400 rounded-2xl border border-white/20 focus:border-emerald-400 focus:outline-none focus:ring-4 focus:ring-emerald-500/20 text-sm transition-all shadow-inner"
              id="global-web-search-input"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-20 text-slate-400 hover:text-slate-200 p-1"
              >
                <X className="w-4 h-4" />
              </button>
            )}
            <div className="absolute right-3 px-2 py-1 rounded-lg bg-white/10 text-slate-300 text-xs font-mono border border-white/10 pointer-events-none">
              ⌘K
            </div>
          </div>

          {/* Quick Search Chips */}
          <div className="flex items-center gap-2 mt-3 overflow-x-auto pb-1 text-xs text-slate-300">
            <span className="text-slate-400 font-medium shrink-0">Popular:</span>
            {[
              'Pentose 40',
              'Rabalkem DSR',
              'Pan 40',
              'Augmentin 625',
              'Dolo 650',
              'Prescription Upload',
              'Clinic OPD'
            ].map(chip => (
              <button
                key={chip}
                onClick={() => setSearchQuery(chip)}
                className="px-2.5 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/90 border border-white/10 shrink-0 transition-colors"
              >
                {chip}
              </button>
            ))}
          </div>
        </div>

        {/* Metrics Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-6 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400">Total Short Links</span>
            <p className="text-xl font-extrabold text-white mt-0.5">{stats.totalLinks}</p>
          </div>
          <div>
            <span className="text-slate-400">Total Patient Visits</span>
            <p className="text-xl font-extrabold text-emerald-400 mt-0.5">{stats.totalClicks}</p>
          </div>
          <div>
            <span className="text-slate-400">Medicine Product Links</span>
            <p className="text-xl font-extrabold text-white mt-0.5">{stats.medicineLinks}</p>
          </div>
          <div>
            <span className="text-slate-400">Domain Gateway</span>
            <p className="text-sm font-bold text-emerald-300 font-mono mt-1">https://cityrx.link</p>
          </div>
        </div>
      </div>

      {/* Tabs navigation */}
      <div className="flex flex-wrap items-center justify-between gap-4 border-b border-slate-200 pb-3">
        <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl">
          {[
            { id: 'all', label: 'All Results' },
            { id: 'links', label: `Short Links (${filteredShortLinks.length})` },
            { id: 'medicines', label: `Medicine Search (${matchingMedicines.length})` },
            { id: 'portals', label: 'External Drug Portals' },
            { id: 'pages', label: 'Store Website Pages' }
          ].map(t => (
            <button
              key={t.id}
              onClick={() => setActiveTab(t.id as any)}
              className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all ${
                activeTab === t.id
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'links' && (
          <div className="flex items-center gap-2">
            <SlidersHorizontal className="w-3.5 h-3.5 text-slate-400" />
            <select
              value={categoryFilter}
              onChange={e => setCategoryFilter(e.target.value)}
              className="text-xs bg-white border border-slate-200 rounded-lg px-2.5 py-1.5 text-slate-700 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">All Categories</option>
              <option value="medicine">Medicines & Drugs</option>
              <option value="invoice">Digital Invoices</option>
              <option value="prescription">Prescription Refills</option>
              <option value="website">Website Services</option>
              <option value="custom">Custom Links</option>
            </select>
          </div>
        )}
      </div>

      {/* SECTION 1: EXTERNAL DRUG SEARCH ENGINES (when all or portals active) */}
      {(activeTab === 'all' || activeTab === 'portals') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Globe className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                External Medical Portals & Salt Search Engines
              </h2>
            </div>
            {searchQuery && (
              <span className="text-xs text-slate-500">
                Searching for: <strong className="text-emerald-700 font-mono">"{searchQuery}"</strong>
              </span>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {EXTERNAL_SEARCH_ENGINES.map(portal => (
              <div
                key={portal.id}
                className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-emerald-300 hover:shadow-xs transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-md bg-slate-100 text-slate-700">
                        {portal.category}
                      </span>
                      <h3 className="font-bold text-slate-900 text-sm mt-1.5">{portal.name}</h3>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-800">
                      {portal.badge}
                    </span>
                  </div>
                  <p className="text-xs text-slate-500 mt-1.5 leading-relaxed">
                    {portal.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <button
                    onClick={() => handleOpenSearchEngine(portal)}
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 hover:text-emerald-800"
                  >
                    <span>Search "{searchQuery.trim() || 'Pantoprazole'}"</span>
                    <ArrowUpRight className="w-3.5 h-3.5" />
                  </button>

                  <a
                    href={portal.homepageUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-[11px] text-slate-400 hover:text-slate-600 flex items-center gap-1"
                  >
                    <span>Portal Home</span>
                    <ExternalLink className="w-3 h-3" />
                  </a>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 2: MEDICINE CATALOG WITH 1-CLICK SHORT LINK (when all or medicines active) */}
      {(activeTab === 'all' || activeTab === 'medicines') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Pill className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Medicines & Generics (Live Product Index & Short Link Generator)
              </h2>
            </div>
            <span className="text-xs text-slate-500">
              Showing {matchingMedicines.length} formulations
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {matchingMedicines.map(med => {
              const stock = med.batches.reduce((sum, b) => sum + b.stock, 0);
              const price = med.batches[0]?.sellingPrice || 0;
              const existingLink = shortLinks.find(l => l.metadata?.medicineId === med.id);

              return (
                <div
                  key={med.id}
                  className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs hover:border-slate-300 transition-all flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <div className="flex items-center gap-1.5">
                          <h3 className="font-extrabold text-slate-900 text-sm">{med.name}</h3>
                          {med.name.toLowerCase().includes('pentose') || med.name.toLowerCase().includes('rabalkem') ? (
                            <span className="text-[9px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.2 rounded">
                              Generic Brand
                            </span>
                          ) : null}
                        </div>
                        <p className="text-xs text-slate-600 font-medium line-clamp-1 mt-0.5">
                          {med.genericName}
                        </p>
                      </div>
                      <span className="text-xs font-bold text-slate-900 font-mono">
                        ₹{(price ?? 0).toFixed(2)}
                      </span>
                    </div>

                    <div className="mt-2.5 flex flex-wrap items-center gap-1.5 text-[10px]">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-medium">
                        {med.manufacturer}
                      </span>
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md">
                        {med.form} • {med.strength}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded-md font-bold ${
                          stock > 10
                            ? 'bg-emerald-50 text-emerald-700'
                            : stock > 0
                            ? 'bg-amber-50 text-amber-700'
                            : 'bg-rose-50 text-rose-700'
                        }`}
                      >
                        {stock > 0 ? `${stock} in stock` : 'Out of Stock'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                    {existingLink ? (
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleCopyLink(existingLink.shortUrl, existingLink.id)}
                          className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 flex items-center gap-1"
                        >
                          {copiedId === existingLink.id ? (
                            <>
                              <Check className="w-3 h-3 text-emerald-600" />
                              <span>Copied!</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3 h-3" />
                              <span className="font-mono">{existingLink.code}</span>
                            </>
                          )}
                        </button>
                        <button
                          onClick={() => setPreviewLink(existingLink)}
                          className="p-1 text-slate-400 hover:text-slate-700 rounded-md"
                          title="Preview Mobile Page"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => handleQuickShortenMedicine(med)}
                        className="px-2.5 py-1 text-[11px] font-bold rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200 flex items-center gap-1"
                      >
                        <Link2 className="w-3 h-3" />
                        <span>Create Short Link</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        onClick={() => {
                          const url = `https://www.1mg.com/search/all?name=${encodeURIComponent(med.name)}`;
                          window.open(url, '_blank');
                        }}
                        className="px-2 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-900 rounded bg-slate-50 hover:bg-slate-100"
                        title="Search on 1mg"
                      >
                        1mg
                      </button>
                      <button
                        onClick={() => {
                          const url = `https://www.netmeds.com/catalogsearch/result?q=${encodeURIComponent(med.name)}`;
                          window.open(url, '_blank');
                        }}
                        className="px-2 py-1 text-[10px] font-medium text-slate-500 hover:text-slate-900 rounded bg-slate-50 hover:bg-slate-100"
                        title="Search on Netmeds"
                      >
                        Netmeds
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 3: SHORT LINKS DIRECTORY (when all or links active) */}
      {(activeTab === 'all' || activeTab === 'links') && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-4 h-4 text-emerald-600" />
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
                Active City Medical Short Links ({filteredShortLinks.length})
              </h2>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-slate-500 font-bold uppercase tracking-wider">
                  <tr>
                    <th className="py-3 px-4">Title & Description</th>
                    <th className="py-3 px-4">Short Link</th>
                    <th className="py-3 px-4">Category</th>
                    <th className="py-3 px-4 text-center">Visits</th>
                    <th className="py-3 px-4">Created</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredShortLinks.map(link => {
                    const isCopied = copiedId === link.id;

                    return (
                      <tr key={link.id} className="hover:bg-slate-50/70 transition-colors">
                        <td className="py-3.5 px-4 max-w-xs">
                          <p className="font-bold text-slate-900 text-xs">{link.title}</p>
                          {link.metadata?.description && (
                            <p className="text-[11px] text-slate-500 line-clamp-1 mt-0.5">
                              {link.metadata.description}
                            </p>
                          )}
                          {link.metadata?.amount && (
                            <span className="text-[10px] text-emerald-700 font-bold mt-1 inline-block">
                              ₹{(link.metadata.amount ?? 0).toFixed(2)}
                            </span>
                          )}
                        </td>

                        <td className="py-3.5 px-4 font-mono">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-800 bg-emerald-50 px-2 py-1 rounded-md border border-emerald-200">
                              {link.shortUrl}
                            </span>
                          </div>
                        </td>

                        <td className="py-3.5 px-4">
                          <span
                            className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase ${
                              link.category === 'medicine'
                                ? 'bg-blue-100 text-blue-800'
                                : link.category === 'invoice'
                                ? 'bg-emerald-100 text-emerald-800'
                                : link.category === 'prescription'
                                ? 'bg-purple-100 text-purple-800'
                                : 'bg-slate-100 text-slate-800'
                            }`}
                          >
                            {link.category}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-center">
                          <span className="font-bold text-slate-900 font-mono bg-slate-100 px-2 py-0.5 rounded">
                            {link.clicks || 0}
                          </span>
                        </td>

                        <td className="py-3.5 px-4 text-slate-500 text-[11px]">
                          {new Date(link.createdAt).toLocaleDateString('en-IN', {
                            day: 'numeric',
                            month: 'short',
                            year: 'numeric'
                          })}
                        </td>

                        <td className="py-3.5 px-4 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleCopyLink(link.shortUrl, link.id)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                              title="Copy URL"
                            >
                              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
                            </button>

                            <button
                              onClick={() => setQrModalLink(link)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                              title="Show QR Code"
                            >
                              <QrCode className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleShareWhatsApp(link)}
                              className="p-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 text-emerald-700"
                              title="Share on WhatsApp"
                            >
                              <Share2 className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => setPreviewLink(link)}
                              className="p-1.5 rounded-lg border border-slate-200 hover:bg-slate-100 text-slate-700"
                              title="Test / Mobile Preview"
                            >
                              <Eye className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleDeleteLink(link.id)}
                              className="p-1.5 rounded-lg text-rose-500 hover:bg-rose-50"
                              title="Delete Link"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* SECTION 4: STORE WEBSITE PAGES (when all or pages active) */}
      {(activeTab === 'all' || activeTab === 'pages') && (
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <Building2 className="w-4 h-4 text-emerald-600" />
            <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wide">
              City Medical Website Pages & Patient Portals
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center font-bold mb-3">
                <FileText className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Upload Prescription Portal</h3>
              <p className="text-xs text-slate-500 mt-1">
                Patients in Melur can photograph their doctor's prescription and send it directly for pharmacist verification & doorstep delivery.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono text-xs text-purple-700 font-bold">cityrx.link/upload-rx</span>
                <button
                  onClick={() => handleCopyLink('https://cityrx.link/upload-rx', 'page-rx')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  {copiedId === 'page-rx' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold mb-3">
                <Stethoscope className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Clinic OPD Appointment Booking</h3>
              <p className="text-xs text-slate-500 mt-1">
                Patients can view available doctors (General Medicine & Pediatrics), OPD consultation schedules, and queue token numbers.
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono text-xs text-emerald-700 font-bold">cityrx.link/clinic-opd</span>
                <button
                  onClick={() => handleCopyLink('https://cityrx.link/clinic-opd', 'page-clinic')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  {copiedId === 'page-clinic' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold mb-3">
                <Send className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 text-sm">Direct Pharmacist WhatsApp Order</h3>
              <p className="text-xs text-slate-500 mt-1">
                Direct WhatsApp link initiating a live chat with the City Medical registered pharmacist (+91 98421 87654).
              </p>
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-mono text-xs text-blue-700 font-bold">cityrx.link/whatsapp-order</span>
                <button
                  onClick={() => handleCopyLink('https://cityrx.link/whatsapp-order', 'page-wa')}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-semibold"
                >
                  {copiedId === 'page-wa' ? 'Copied' : 'Copy'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 1: CREATE NEW SHORT LINK */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full border border-slate-200 shadow-2xl p-6 relative">
            <button
              onClick={() => setIsCreateModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2 mb-4">
              <div className="w-8 h-8 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center">
                <Link2 className="w-4 h-4" />
              </div>
              <h3 className="font-extrabold text-slate-900 text-lg">Create Branded Short Link</h3>
            </div>

            <form onSubmit={handleCreateShortLink} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                  Category
                </label>
                <div className="grid grid-cols-3 gap-2">
                  {[
                    { id: 'website', label: 'Website' },
                    { id: 'medicine', label: 'Medicine' },
                    { id: 'prescription', label: 'Rx Refill' },
                    { id: 'invoice', label: 'Invoice' },
                    { id: 'custom', label: 'Custom' }
                  ].map(c => (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => setNewCategory(c.id as any)}
                      className={`py-1.5 px-3 rounded-xl text-xs font-bold border transition-all ${
                        newCategory === c.id
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-800'
                          : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {c.label}
                    </button>
                  ))}
                </div>
              </div>

              {newCategory === 'medicine' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">
                    Select Medicine to Shorten
                  </label>
                  <select
                    value={selectedMedicineId}
                    onChange={e => {
                      const id = e.target.value;
                      setSelectedMedicineId(id);
                      const m = medicines.find(med => med.id === id);
                      if (m) {
                        setNewTitle(`${m.name} (${m.genericName})`);
                        setNewSlug(m.name.toLowerCase().replace(/[^a-z0-9]+/g, '-'));
                      }
                    }}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="">-- Choose a medicine --</option>
                    {medicines.map(m => (
                      <option key={m.id} value={m.id}>
                        {m.name} ({m.genericName}) - {m.manufacturer}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Link Title</label>
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Pentose 40 Tablet - Patient Price & Availability"
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Domain</label>
                  <select
                    value={newDomain}
                    onChange={e => setNewDomain(e.target.value)}
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl"
                  >
                    <option value="cityrx.link">cityrx.link</option>
                    <option value="cmed.in">cmed.in</option>
                    <option value="rx.melur.in">rx.melur.in</option>
                    <option value="citymedical.store">citymedical.store</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Custom Slug</label>
                  <input
                    type="text"
                    value={newSlug}
                    onChange={e => setNewSlug(e.target.value.toLowerCase().replace(/[^a-z0-9_-]/g, '-'))}
                    placeholder="e.g. pentose-40"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              </div>

              {newCategory !== 'medicine' && (
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">Target / Destination URL</label>
                  <input
                    type="text"
                    value={newOriginalUrl}
                    onChange={e => setNewOriginalUrl(e.target.value)}
                    placeholder="https://... or /invoice/INV-2026-001"
                    className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
                    required
                  />
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">Description (Optional)</label>
                <textarea
                  value={newDescription}
                  onChange={e => setNewDescription(e.target.value)}
                  placeholder="Notes or patient instructions..."
                  rows={2}
                  className="w-full text-xs p-2.5 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-200 flex items-center justify-between text-xs">
                <span className="text-slate-600">Generated URL Preview:</span>
                <span className="font-mono font-bold text-emerald-800">
                  https://{newDomain}/{newSlug || 'your-slug'}
                </span>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-500 rounded-xl shadow-md"
                >
                  Create & Shorten
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: QR CODE VIEW */}
      {qrModalLink && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-sm w-full border border-slate-200 shadow-2xl p-6 text-center relative">
            <button
              onClick={() => setQrModalLink(null)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 p-1"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center justify-center gap-2 mb-2">
              <span className="font-extrabold text-slate-900 text-sm">City Medical</span>
              <span className="text-[10px] bg-emerald-100 text-emerald-800 font-bold px-1.5 py-0.5 rounded">Melur</span>
            </div>

            <h3 className="font-bold text-slate-900 text-base mb-1">{qrModalLink.title}</h3>
            <p className="text-xs font-mono text-emerald-700 font-bold mb-4">{qrModalLink.shortUrl}</p>

            <div className="flex items-center justify-center p-4 bg-slate-50 rounded-2xl border border-slate-200 mb-4 inline-block">
              <QRCode value={qrModalLink.shortUrl} size={180} />
            </div>

            <p className="text-[11px] text-slate-500 mb-4">
              Scan with any mobile smartphone camera or Google Lens to instantly access this link.
            </p>

            <div className="flex items-center gap-2">
              <button
                onClick={() => handleCopyLink(qrModalLink.shortUrl, qrModalLink.id)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 text-slate-800 flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>{copiedId === qrModalLink.id ? 'Copied' : 'Copy Link'}</span>
              </button>
              <button
                onClick={() => handleShareWhatsApp(qrModalLink)}
                className="flex-1 py-2 rounded-xl text-xs font-bold bg-emerald-600 hover:bg-emerald-500 text-white flex items-center justify-center gap-1.5 shadow-md"
              >
                <Share2 className="w-3.5 h-3.5" />
                <span>WhatsApp</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: INTERACTIVE MOBILE SMARTPHONE PREVIEW */}
      {previewLink && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs z-50 flex items-center justify-center p-4">
          <div className="bg-slate-900 rounded-[40px] p-4 max-w-sm w-full shadow-2xl border-4 border-slate-700 relative text-white">
            <button
              onClick={() => setPreviewLink(null)}
              className="absolute -top-3 -right-3 w-8 h-8 bg-white text-slate-900 rounded-full flex items-center justify-center shadow-lg hover:bg-slate-100"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Mobile speaker notch */}
            <div className="w-28 h-4 bg-slate-800 rounded-full mx-auto mb-3 flex items-center justify-center">
              <div className="w-3 h-3 rounded-full bg-slate-700" />
            </div>

            {/* Browser Address Bar */}
            <div className="bg-slate-800 rounded-xl p-2 px-3 flex items-center justify-between text-[11px] mb-3 border border-slate-700">
              <div className="flex items-center gap-1.5 text-emerald-400 font-mono font-bold truncate">
                <span>🔒</span>
                <span className="truncate">{previewLink.shortUrl}</span>
              </div>
              <button
                onClick={() => StorageService.incrementShortLinkClicks(previewLink.id)}
                className="text-slate-400 hover:text-white"
                title="Refresh page"
              >
                <RefreshCw className="w-3 h-3" />
              </button>
            </div>

            {/* Simulated Web View Content */}
            <div className="bg-white rounded-2xl p-4 text-slate-900 max-h-[500px] overflow-y-auto space-y-4">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 bg-emerald-600 text-white rounded-lg flex items-center justify-center font-black text-xs">
                    CR
                  </div>
                  <div>
                    <h4 className="font-extrabold text-xs text-slate-900 leading-tight">City Medical</h4>
                    <p className="text-[10px] text-slate-500">Chokkalingapuram, Melur</p>
                  </div>
                </div>
                <span className="text-[9px] font-bold px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800">
                  Verified Store
                </span>
              </div>

              {/* Dynamic Content based on Category */}
              {previewLink.category === 'medicine' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-emerald-50 rounded-xl border border-emerald-100">
                    <span className="text-[10px] uppercase font-bold text-emerald-700">Medicine In-Stock</span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-1">
                      {previewLink.metadata?.medicineName || previewLink.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-0.5">
                      {previewLink.metadata?.genericName}
                    </p>
                    <p className="text-[11px] text-slate-500 mt-1">
                      Manufactured by {previewLink.metadata?.manufacturer || 'Alkem / Hetero'}
                    </p>

                    <div className="mt-3 flex items-baseline justify-between pt-2 border-t border-emerald-200/60">
                      <div>
                        <span className="text-[10px] text-slate-500">City Medical Price:</span>
                        <p className="text-lg font-extrabold text-emerald-800 font-mono">
                          ₹{(previewLink.metadata?.amount ?? 58).toFixed(2)}
                        </p>
                      </div>
                      <span className="text-xs bg-emerald-600 text-white font-bold px-2 py-1 rounded-lg">
                        Ready for Pickup
                      </span>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 leading-relaxed">
                    {previewLink.metadata?.description || 'Authentic batch verified medicine with active FEFO tracking.'}
                  </p>

                  <button
                    onClick={() => handleShareWhatsApp(previewLink)}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 flex items-center justify-center gap-1.5 shadow-md"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Order via WhatsApp (+91 98421 87654)</span>
                  </button>
                </div>
              ) : previewLink.category === 'invoice' ? (
                <div className="space-y-3">
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <span className="text-[10px] uppercase font-bold text-slate-500">Digital Tax Invoice</span>
                    <h3 className="text-sm font-extrabold text-slate-900 mt-0.5">
                      {previewLink.metadata?.invoiceId || 'INV-2026-001'}
                    </h3>
                    <p className="text-xs text-slate-700 mt-1 font-medium">
                      Patient: {previewLink.metadata?.patientName || 'Priya Sundaram'}
                    </p>
                    <div className="mt-2.5 pt-2 border-t border-slate-200 flex items-center justify-between">
                      <span className="text-xs text-slate-500">Amount Paid:</span>
                      <span className="text-base font-extrabold text-slate-900 font-mono">
                        ₹{(previewLink.metadata?.amount ?? 348.5).toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-xl bg-emerald-50 text-emerald-900 text-xs flex items-center gap-2 border border-emerald-200">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span>Payment Received via Live UPI QR</span>
                  </div>

                  <button
                    onClick={() => alert('Simulated invoice PDF download')}
                    className="w-full py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5"
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>Download Official PDF Receipt</span>
                  </button>
                </div>
              ) : (
                <div className="space-y-3">
                  <h3 className="text-sm font-extrabold text-slate-900">{previewLink.title}</h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {previewLink.metadata?.description || 'City Medical online digital services portal.'}
                  </p>
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs">
                    <span className="text-slate-500 block mb-1">Target Destination:</span>
                    <span className="font-mono text-emerald-700 break-all">{previewLink.originalUrl}</span>
                  </div>
                  <button
                    onClick={() => handleShareWhatsApp(previewLink)}
                    className="w-full py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-500 flex items-center justify-center gap-1.5"
                  >
                    <Share2 className="w-3.5 h-3.5" />
                    <span>Share with Patient</span>
                  </button>
                </div>
              )}

              {/* Footer */}
              <div className="pt-3 border-t border-slate-100 text-center text-[10px] text-slate-400">
                City Medical, Chokkalingapuram, Melur Taluk, Madurai District.
                <br />
                Licensed Pharmacist: DL-20B-18928
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
