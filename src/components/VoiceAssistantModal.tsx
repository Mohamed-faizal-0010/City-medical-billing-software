import React, { useState, useEffect, useMemo } from 'react';
import {
  Mic,
  MicOff,
  Volume2,
  X,
  Sparkles,
  Search,
  ShoppingCart,
  Boxes,
  Receipt,
  FileText,
  Users,
  Building2,
  Dna,
  ArrowRight,
  AlertCircle,
  HelpCircle,
  CheckCircle2,
  Radio
} from 'lucide-react';
import { useSpeechRecognition, speakNotification, cleanPharmaVoiceInput } from '../hooks/useSpeechRecognition';
import { StorageService } from '../services/storage';
import { Medicine } from '../types';

interface VoiceAssistantModalProps {
  isOpen: boolean;
  onClose: () => void;
  onNavigateTab: (tabId: string, itemData?: any) => void;
  onAddToCart?: (medicine: Medicine) => void;
}

export const VoiceAssistantModal: React.FC<VoiceAssistantModalProps> = ({
  isOpen,
  onClose,
  onNavigateTab,
  onAddToCart
}) => {
  const [selectedLang, setSelectedLang] = useState<'en-IN' | 'en-US' | 'ta-IN'>('en-IN');
  const [lastSpoken, setLastSpoken] = useState('');
  const [actionFeedback, setActionFeedback] = useState<string | null>(null);

  const medicines = useMemo(() => (isOpen ? StorageService.getMedicines() : []), [isOpen]);

  const {
    isListening,
    isSupported,
    transcript,
    interimTranscript,
    error,
    startListening,
    stopListening,
    resetTranscript
  } = useSpeechRecognition({
    lang: selectedLang,
    continuous: true,
    interimResults: true,
    onResult: (finalText) => {
      handleVoiceCommand(finalText);
    }
  });

  // Auto start listening when modal opens
  useEffect(() => {
    if (isOpen) {
      setLastSpoken('');
      setActionFeedback(null);
      resetTranscript();
      const timer = setTimeout(() => {
        startListening(selectedLang);
      }, 300);
      return () => {
        clearTimeout(timer);
        stopListening();
      };
    } else {
      stopListening();
    }
  }, [isOpen, selectedLang]);

  // Voice Command Dispatcher
  const handleVoiceCommand = (spokenText: string) => {
    if (!spokenText || !spokenText.trim()) return;
    const raw = spokenText.trim();
    setLastSpoken(raw);

    const lower = raw.toLowerCase();

    // 1. Navigation Commands
    if (lower.includes('point of sale') || lower.includes('open pos') || lower.includes('go to pos') || lower.includes('billing')) {
      setActionFeedback('Navigating to Point of Sale (POS) Terminal...');
      speakNotification('Opening Point of Sale', selectedLang);
      setTimeout(() => {
        onNavigateTab('pos');
        onClose();
      }, 700);
      return;
    }

    if (lower.includes('purchase') || lower.includes('inward bill') || lower.includes('goods receive')) {
      setActionFeedback('Navigating to Purchases & Inward Goods...');
      speakNotification('Opening Purchases', selectedLang);
      setTimeout(() => {
        onNavigateTab('purchases');
        onClose();
      }, 700);
      return;
    }

    if (lower.includes('inventory') || lower.includes('stock management') || lower.includes('batches')) {
      setActionFeedback('Navigating to Inventory & Stock Management...');
      speakNotification('Opening Inventory', selectedLang);
      setTimeout(() => {
        onNavigateTab('inventory');
        onClose();
      }, 700);
      return;
    }

    if (lower.includes('generic') || lower.includes('substitution') || lower.includes('salt')) {
      setActionFeedback('Opening Generic Drug Substitution & Cost Optimizer...');
      speakNotification('Opening Generic Substitutions', selectedLang);
      setTimeout(() => {
        onNavigateTab('generics');
        onClose();
      }, 700);
      return;
    }

    if (lower.includes('patient') || lower.includes('customer') || lower.includes('refill')) {
      setActionFeedback('Navigating to Patients & Refill Reminders...');
      speakNotification('Opening Patients', selectedLang);
      setTimeout(() => {
        onNavigateTab('patients');
        onClose();
      }, 700);
      return;
    }

    if (lower.includes('supplier') || lower.includes('distributor') || lower.includes('vendor')) {
      setActionFeedback('Navigating to Supplier & Vendor Management...');
      speakNotification('Opening Suppliers', selectedLang);
      setTimeout(() => {
        onNavigateTab('suppliers');
        onClose();
      }, 700);
      return;
    }

    if (lower.includes('report') || lower.includes('gst') || lower.includes('p and l') || lower.includes('profit')) {
      setActionFeedback('Opening Financial & Audit Reports...');
      speakNotification('Opening Reports', selectedLang);
      setTimeout(() => {
        onNavigateTab('reports');
        onClose();
      }, 700);
      return;
    }

    // 2. Direct Medicine Search Check
    // If user says "find Dolo" or "search Augmentin" or just "Dolo 650"
    const searchTarget = lower
      .replace(/^find\s+|^search\s+|^show\s+|^add\s+|^check\s+/i, '')
      .trim();

    if (searchTarget.length > 1) {
      const match = medicines.find(
        (m) =>
          m.name.toLowerCase().includes(searchTarget) ||
          m.genericName.toLowerCase().includes(searchTarget)
      );

      if (match) {
        const totalUnits = match.batches.reduce((sum, b) => sum + (b.stock || 0), 0);
        setActionFeedback(
          `Found "${match.name}" (${match.genericName}) - ${totalUnits} units in stock.`
        );
        speakNotification(`${match.name}, ${totalUnits} units available`, selectedLang);
      } else {
        setActionFeedback(`Searching for "${searchTarget}" in database...`);
      }
    }
  };

  // Matched medicines for current query / spoken input
  const currentQuery = interimTranscript || transcript || lastSpoken;
  const cleanedQuery = currentQuery.replace(/^find\s+|^search\s+|^show\s+|^add\s+|^check\s+/i, '').trim().toLowerCase();

  const matchingMedicines = useMemo(() => {
    if (!cleanedQuery || cleanedQuery.length < 2) return [];
    return medicines
      .filter(
        (m) =>
          m.name.toLowerCase().includes(cleanedQuery) ||
          m.genericName.toLowerCase().includes(cleanedQuery) ||
          m.manufacturer.toLowerCase().includes(cleanedQuery)
      )
      .slice(0, 5);
  }, [cleanedQuery, medicines]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Top Header */}
        <div className="p-4 sm:p-5 bg-gradient-to-r from-teal-800 via-teal-900 to-slate-900 text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-400/30 flex items-center justify-center text-teal-300">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base tracking-tight">City Rx Voice Assistant</h3>
                <span className="text-[10px] uppercase font-mono px-2 py-0.5 bg-emerald-500/30 border border-emerald-400/40 text-emerald-200 rounded-full font-bold">
                  AI Speech
                </span>
              </div>
              <p className="text-xs text-teal-200/80">
                Voice search medicines, check stock, or navigate modules hands-free
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-teal-200/70 hover:text-white rounded-xl hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Language Selector Bar */}
        <div className="px-5 py-2.5 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
          <div className="flex items-center gap-2 text-slate-500">
            <Radio className="w-3.5 h-3.5 text-teal-600" />
            <span className="font-semibold">Speech Accent:</span>
          </div>
          <div className="flex items-center gap-1.5">
            {[
              { id: 'en-IN', label: 'English (India)' },
              { id: 'en-US', label: 'English (US)' },
              { id: 'ta-IN', label: 'தமிழ் / Tamil' }
            ].map((lang) => (
              <button
                key={lang.id}
                type="button"
                onClick={() => {
                  setSelectedLang(lang.id as any);
                  stopListening();
                  setTimeout(() => startListening(lang.id), 200);
                }}
                className={`px-2.5 py-1 rounded-lg font-bold text-[11px] transition-all ${
                  selectedLang === lang.id
                    ? 'bg-teal-700 text-white shadow-2xs'
                    : 'bg-white text-slate-600 hover:bg-slate-200/80 border border-slate-200'
                }`}
              >
                {lang.label}
              </button>
            ))}
          </div>
        </div>

        {/* Central Audio / Waveform Visualizer */}
        <div className="p-6 text-center bg-gradient-to-b from-teal-50/40 to-white">
          <div className="relative inline-block my-2">
            {/* Pulsing visual rings */}
            {isListening && (
              <>
                <span className="absolute -inset-4 rounded-full bg-teal-400/20 animate-ping" />
                <span className="absolute -inset-8 rounded-full bg-teal-300/10 animate-pulse" />
              </>
            )}

            <button
              onClick={() => {
                if (isListening) {
                  stopListening();
                } else {
                  startListening(selectedLang);
                }
              }}
              className={`w-20 h-20 rounded-full flex items-center justify-center transition-all cursor-pointer relative shadow-xl ${
                isListening
                  ? 'bg-rose-500 text-white shadow-rose-500/30 scale-105'
                  : 'bg-teal-600 hover:bg-teal-700 text-white shadow-teal-600/30'
              }`}
              title={isListening ? 'Click to pause listening' : 'Click to start speaking'}
            >
              {isListening ? (
                <Mic className="w-9 h-9 animate-bounce" />
              ) : (
                <MicOff className="w-8 h-8 opacity-90" />
              )}
            </button>
          </div>

          <div className="mt-3">
            <span
              className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold ${
                isListening
                  ? 'bg-rose-100 text-rose-800 animate-pulse'
                  : 'bg-slate-100 text-slate-600'
              }`}
            >
              <span
                className={`w-2 h-2 rounded-full ${
                  isListening ? 'bg-rose-500 animate-ping' : 'bg-slate-400'
                }`}
              />
              {isListening ? 'Listening... Speak now' : 'Microphone paused (Tap to resume)'}
            </span>
          </div>

          {/* Real-time speech transcript bubble */}
          <div className="mt-4 p-3.5 bg-slate-900 text-white rounded-2xl min-h-[58px] flex items-center justify-center text-center shadow-inner">
            {interimTranscript || transcript || lastSpoken ? (
              <p className="text-sm font-semibold text-teal-300">
                "{interimTranscript || transcript || lastSpoken}"
              </p>
            ) : (
              <p className="text-xs text-slate-400 italic">
                Try saying: "Find Dolo 650", "Augmentin", "Go to POS", or "Open Inventory"
              </p>
            )}
          </div>

          {/* Action Execution Feedback */}
          {actionFeedback && (
            <div className="mt-3 p-2.5 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center justify-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
              <span>{actionFeedback}</span>
            </div>
          )}

          {error && (
            <div className="mt-3 p-2.5 bg-rose-50 border border-rose-200 text-rose-800 rounded-xl text-xs font-medium flex items-center justify-center gap-2">
              <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}
        </div>

        {/* Live Matching Medicines Search Preview (if user spoke a drug name) */}
        {matchingMedicines.length > 0 && (
          <div className="px-5 py-3 bg-slate-50 border-t border-slate-200 max-h-48 overflow-y-auto">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-2 flex items-center justify-between">
              <span>Matching Medicines ({matchingMedicines.length})</span>
              <span className="text-teal-700 font-bold">1-Click Add to Billing</span>
            </div>
            <div className="space-y-2">
              {matchingMedicines.map((med) => {
                const totalStock = med.batches.reduce((s, b) => s + b.stock, 0);
                const activeBatch = med.batches.find((b) => b.stock > 0) || med.batches[0];

                return (
                  <div
                    key={med.id}
                    className="p-2.5 bg-white border border-slate-200 rounded-xl flex items-center justify-between gap-3 shadow-2xs hover:border-teal-400 transition-colors"
                  >
                    <div>
                      <div className="font-bold text-xs text-slate-900">{med.name}</div>
                      <div className="text-[11px] text-slate-500">
                        {med.genericName} • Rack {med.rackLocation || activeBatch?.location || 'A-01'}
                      </div>
                      <div className="text-[10px] text-teal-700 font-bold mt-0.5">
                        Stock: {totalStock} units | MRP: ₹{activeBatch?.mrp || 0}
                      </div>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          if (onAddToCart) onAddToCart(med);
                          onNavigateTab('pos');
                          onClose();
                        }}
                        className="px-2.5 py-1.5 bg-teal-600 hover:bg-teal-700 text-white rounded-lg text-xs font-bold flex items-center gap-1 shadow-2xs transition-all"
                      >
                        <ShoppingCart className="w-3.5 h-3.5" />
                        <span>Add to Bill</span>
                      </button>
                      <button
                        onClick={() => {
                          onNavigateTab('inventory');
                          onClose();
                        }}
                        className="px-2 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-xs font-medium"
                      >
                        View
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Suggested Voice Commands Grid */}
        <div className="p-4 bg-white border-t border-slate-200">
          <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-2 flex items-center gap-1">
            <HelpCircle className="w-3 h-3" />
            <span>Voice Command Quick Reference</span>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
            <button
              type="button"
              onClick={() => handleVoiceCommand('point of sale')}
              className="p-2 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-left transition-colors text-slate-700"
            >
              <div className="font-bold text-teal-800">"Point of Sale"</div>
              <div className="text-[10px] text-slate-500">Opens POS counter</div>
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommand('purchases')}
              className="p-2 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-left transition-colors text-slate-700"
            >
              <div className="font-bold text-teal-800">"Purchases"</div>
              <div className="text-[10px] text-slate-500">Inward bill register</div>
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommand('inventory')}
              className="p-2 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-left transition-colors text-slate-700"
            >
              <div className="font-bold text-teal-800">"Inventory"</div>
              <div className="text-[10px] text-slate-500">Check stock levels</div>
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommand('generic')}
              className="p-2 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-left transition-colors text-slate-700"
            >
              <div className="font-bold text-teal-800">"Generic Optimizer"</div>
              <div className="text-[10px] text-slate-500">Find cheaper salts</div>
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommand('patients')}
              className="p-2 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-left transition-colors text-slate-700"
            >
              <div className="font-bold text-teal-800">"Patients & Refills"</div>
              <div className="text-[10px] text-slate-500">Refill queue</div>
            </button>
            <button
              type="button"
              onClick={() => handleVoiceCommand('reports')}
              className="p-2 bg-slate-50 hover:bg-teal-50 hover:border-teal-300 border border-slate-200 rounded-xl text-left transition-colors text-slate-700"
            >
              <div className="font-bold text-teal-800">"Financial Reports"</div>
              <div className="text-[10px] text-slate-500">P&L & GST Inward</div>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
