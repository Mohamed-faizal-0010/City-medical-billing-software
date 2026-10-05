import React, { useState, useEffect, useMemo, useCallback } from 'react';
import {
  AlertTriangle,
  Bell,
  X,
  ChevronRight,
  TrendingDown,
  ShoppingCart,
  Boxes,
  Volume2,
  VolumeX,
  ExternalLink,
  RefreshCw,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { LowStockAlertItem } from '../types';
import { StorageService } from '../services/storage';

interface LowStockNotificationBannerProps {
  viewMode?: 'banner' | 'pill' | 'toast_only';
  onNavigateToPurchases?: (medicineId?: string, suggestedQty?: number) => void;
  onFilterLowStockInInventory?: () => void;
  className?: string;
}

export const LowStockNotificationBanner: React.FC<LowStockNotificationBannerProps> = ({
  viewMode = 'banner',
  onNavigateToPurchases,
  onFilterLowStockInInventory,
  className = ''
}) => {
  const [alerts, setAlerts] = useState<LowStockAlertItem[]>(() => StorageService.getLowStockAlerts());
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [activeToast, setActiveToast] = useState<LowStockAlertItem | null>(null);
  const [isDismissed, setIsDismissed] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(true);

  // Play subtle warning beep when alert is triggered
  const playAlertSound = useCallback(() => {
    if (!soundEnabled || typeof window === 'undefined') return;
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(440, audioCtx.currentTime); // A4
      osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.15);
      gain.gain.setValueAtTime(0.12, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.25);
      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + 0.25);
    } catch {
      // AudioContext policy
    }
  }, [soundEnabled]);

  const refreshAlerts = useCallback(() => {
    const fresh = StorageService.getLowStockAlerts();
    setAlerts(fresh);
  }, []);

  // Listen to custom low-stock alert events dispatched by deductStockForSale or adjustments
  useEffect(() => {
    const handleLowStockEvent = (e: any) => {
      refreshAlerts();
      const detail = e.detail;
      if (detail && detail.alerts && detail.alerts.length > 0) {
        const topAlert = detail.alerts[0];
        setActiveToast(topAlert);
        setIsDismissed(false);
        playAlertSound();

        // Auto dismiss toast after 7 seconds
        const timer = setTimeout(() => {
          setActiveToast(null);
        }, 7000);
        return () => clearTimeout(timer);
      }
    };

    const handleStorageChange = () => {
      refreshAlerts();
    };

    window.addEventListener('pharmacy:low-stock-alert', handleLowStockEvent);
    window.addEventListener('storage', handleStorageChange);

    return () => {
      window.removeEventListener('pharmacy:low-stock-alert', handleLowStockEvent);
      window.removeEventListener('storage', handleStorageChange);
    };
  }, [refreshAlerts, playAlertSound]);

  const criticalZeroCount = useMemo(() => alerts.filter(a => a.status === 'critical_zero').length, [alerts]);
  const lowCount = alerts.length;

  if (alerts.length === 0) {
    return null;
  }

  return (
    <>
      {/* Toast Notification (Floating bottom-right or top-right on live stock breach) */}
      {activeToast && (
        <div
          role="alert"
          aria-live="assertive"
          className="fixed bottom-5 right-5 z-50 max-w-md w-full bg-slate-900 text-white rounded-2xl shadow-2xl border border-rose-500/40 p-4 animate-in slide-in-from-bottom-5 duration-200"
        >
          <div className="flex items-start gap-3">
            <div className="p-2.5 rounded-xl bg-rose-500/20 text-rose-400 shrink-0 border border-rose-500/30">
              <AlertTriangle className="w-5 h-5 animate-pulse" />
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between gap-2">
                <span className="text-[10px] font-extrabold uppercase tracking-wider text-rose-400 bg-rose-950/80 px-2 py-0.5 rounded-full border border-rose-800">
                  {activeToast.currentStock === 0 ? 'Out of Stock' : 'Low Stock Alert'}
                </span>
                <button
                  type="button"
                  onClick={() => setActiveToast(null)}
                  className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <h4 className="font-bold text-sm text-white mt-1 truncate">
                {activeToast.medicineName} {activeToast.strength && <span className="text-slate-400 text-xs">({activeToast.strength})</span>}
              </h4>
              <p className="text-xs text-slate-300 mt-0.5">
                Current stock has dropped to <strong className="text-amber-400 font-mono font-bold">{activeToast.currentStock}</strong> units (Threshold: {activeToast.minStockAlert} units).
              </p>

              <div className="mt-3 flex items-center gap-2">
                {onNavigateToPurchases && (
                  <button
                    type="button"
                    onClick={() => {
                      setActiveToast(null);
                      onNavigateToPurchases(activeToast.medicineId, activeToast.suggestedReorderQuantity);
                    }}
                    className="px-3 py-1.5 bg-rose-600 hover:bg-rose-500 text-white text-xs font-bold rounded-lg flex items-center gap-1.5 transition-colors shadow-xs"
                  >
                    <ShoppingCart className="w-3.5 h-3.5" />
                    <span>Reorder {activeToast.suggestedReorderQuantity} Units</span>
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setActiveToast(null);
                    setIsDrawerOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-medium rounded-lg transition-colors"
                >
                  View All ({alerts.length})
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Pill Mode: typically placed in header or toolbar of POSView */}
      {viewMode === 'pill' && (
        <div className={`flex items-center gap-2 ${className}`}>
          <button
            type="button"
            onClick={() => setIsDrawerOpen(true)}
            id="low-stock-alert-pill"
            className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 text-xs font-bold transition-all shadow-2xs group cursor-pointer"
            title={`${lowCount} medicines at or below minimum stock alert threshold`}
          >
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-rose-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-600"></span>
            </span>
            <AlertTriangle className="w-3.5 h-3.5 text-rose-600 group-hover:scale-110 transition-transform" />
            <span>
              {lowCount} Low Stock {criticalZeroCount > 0 && <span className="text-[10px] text-rose-500 font-normal">({criticalZeroCount} zero)</span>}
            </span>
          </button>
        </div>
      )}

      {/* Banner Mode: typically placed at top of Inventory or POS */}
      {viewMode === 'banner' && !isDismissed && (
        <div
          role="region"
          aria-label="Low Stock Alerts"
          className={`bg-gradient-to-r from-amber-50 via-rose-50 to-amber-50/80 border border-rose-200/90 rounded-2xl p-3.5 sm:p-4 text-slate-800 shadow-2xs transition-all ${className}`}
        >
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3">
              <div className="w-9 h-9 rounded-xl bg-rose-100 text-rose-700 flex items-center justify-center shrink-0 border border-rose-200">
                <AlertTriangle className="w-5 h-5 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-xs sm:text-sm font-black text-rose-900 uppercase tracking-wide">
                    Automated Stock Alert: {lowCount} {lowCount === 1 ? 'Medicine' : 'Medicines'} Below Threshold
                  </h4>
                  {criticalZeroCount > 0 && (
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-600 text-white shadow-2xs">
                      {criticalZeroCount} Out of Stock
                    </span>
                  )}
                </div>
                <p className="text-xs text-slate-600 mt-0.5">
                  Stock levels dropped below the configured <span className="font-mono font-bold text-slate-800">minStockAlert</span> threshold. Reorder from suppliers to prevent stock-outs.
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap gap-2 shrink-0">
              {onFilterLowStockInInventory && (
                <button
                  type="button"
                  onClick={onFilterLowStockInInventory}
                  className="px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 text-xs font-bold transition-all shadow-2xs flex items-center gap-1.5 cursor-pointer"
                >
                  <Boxes className="w-3.5 h-3.5 text-teal-600" />
                  <span>Filter in Inventory</span>
                </button>
              )}

              <button
                type="button"
                onClick={() => setIsDrawerOpen(true)}
                id="view-low-stock-details-btn"
                className="px-3.5 py-1.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
              >
                <span>View Low Stock List ({lowCount})</span>
                <ChevronRight className="w-3.5 h-3.5" />
              </button>

              <button
                type="button"
                onClick={() => setSoundEnabled(!soundEnabled)}
                className={`p-1.5 rounded-xl border text-xs transition-colors ${
                  soundEnabled
                    ? 'bg-rose-100 text-rose-700 border-rose-200'
                    : 'bg-white text-slate-400 border-slate-200'
                }`}
                title={soundEnabled ? 'Alert audio sound enabled' : 'Alert audio sound muted'}
              >
                {soundEnabled ? <Volume2 className="w-3.5 h-3.5" /> : <VolumeX className="w-3.5 h-3.5" />}
              </button>

              <button
                type="button"
                onClick={() => setIsDismissed(true)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 hover:bg-rose-100/50 transition-colors cursor-pointer"
                title="Dismiss Banner"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Slide-over Drawer / Modal with Comprehensive Low Stock Details & Actions */}
      {isDrawerOpen && (
        <div
          role="dialog"
          aria-modal="true"
          className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-xs flex justify-end animate-in fade-in duration-150"
        >
          <div className="w-full max-w-xl bg-white h-full shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-200">
            {/* Drawer Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-2xl bg-rose-600 text-white flex items-center justify-center shadow-xs">
                  <AlertTriangle className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                    <span>Low Stock Alert Center</span>
                    <span className="px-2 py-0.5 text-xs font-bold rounded-full bg-rose-100 text-rose-800">
                      {alerts.length} Items
                    </span>
                  </h3>
                  <p className="text-xs text-slate-500">
                    Medicines at or below their Minimum Stock Alert threshold
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsDrawerOpen(false)}
                className="p-2 rounded-xl text-slate-400 hover:text-slate-700 hover:bg-slate-200 transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Quick Stat Summary Strip */}
            <div className="grid grid-cols-3 gap-2 px-5 py-3 bg-slate-100/60 border-b border-slate-200 text-xs">
              <div>
                <span className="text-slate-500 text-[10px] block">Total Low SKUs</span>
                <span className="font-bold text-slate-800 text-sm">{alerts.length}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Zero Stock</span>
                <span className="font-bold text-rose-600 text-sm">{criticalZeroCount}</span>
              </div>
              <div>
                <span className="text-slate-500 text-[10px] block">Total Reorder Units</span>
                <span className="font-bold text-teal-700 text-sm">
                  {alerts.reduce((sum, a) => sum + a.suggestedReorderQuantity, 0)}
                </span>
              </div>
            </div>

            {/* Items List */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3 divide-y divide-slate-100">
              {alerts.map(item => {
                const percent = Math.min(100, Math.round((item.currentStock / item.minStockAlert) * 100));
                const isZero = item.currentStock === 0;

                return (
                  <div key={item.medicineId} className="pt-3 first:pt-0">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-slate-900 text-sm">
                            {item.medicineName}
                          </span>
                          {item.strength && (
                            <span className="text-xs text-slate-500 font-medium">
                              {item.strength}
                            </span>
                          )}
                          <span
                            className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                              isZero
                                ? 'bg-rose-100 text-rose-800 border border-rose-300'
                                : 'bg-amber-100 text-amber-800 border border-amber-300'
                            }`}
                          >
                            {isZero ? '0 Stock (Out)' : 'Low Stock'}
                          </span>
                        </div>

                        {item.genericName && (
                          <p className="text-xs text-slate-500 italic mt-0.5">
                            {item.genericName}
                          </p>
                        )}

                        <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                          {item.manufacturer && <span>Mfg: {item.manufacturer}</span>}
                          {item.rackLocation && <span>Rack: {item.rackLocation}</span>}
                        </div>
                      </div>

                      {/* Stock vs Min Alert Badges */}
                      <div className="text-right shrink-0">
                        <div className="text-xs font-mono font-black text-slate-900">
                          <span className={isZero ? 'text-rose-600 font-extrabold' : 'text-amber-700'}>
                            {item.currentStock}
                          </span>
                          <span className="text-slate-400 font-normal"> / {item.minStockAlert} min</span>
                        </div>
                        <span className="text-[10px] font-medium text-slate-400 block mt-0.5">
                          Deficit: -{item.deficit}
                        </span>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2.5">
                      <div
                        className={`h-full rounded-full transition-all ${
                          isZero ? 'bg-rose-500 w-1' : percent <= 30 ? 'bg-rose-500' : 'bg-amber-500'
                        }`}
                        style={{ width: `${Math.max(4, percent)}%` }}
                      />
                    </div>

                    {/* Action Row */}
                    <div className="flex items-center justify-between mt-2.5 text-xs">
                      <span className="text-slate-500 text-[11px]">
                        Suggested Reorder: <strong className="text-slate-800 font-bold">{item.suggestedReorderQuantity} units</strong>
                      </span>

                      <div className="flex items-center gap-2">
                        {onNavigateToPurchases && (
                          <button
                            type="button"
                            onClick={() => {
                              setIsDrawerOpen(false);
                              onNavigateToPurchases(item.medicineId, item.suggestedReorderQuantity);
                            }}
                            className="px-2.5 py-1 bg-teal-600 hover:bg-teal-700 text-white rounded-lg font-bold flex items-center gap-1 transition-colors text-xs"
                          >
                            <ShoppingCart className="w-3 h-3" />
                            <span>Add to Purchase</span>
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Drawer Footer */}
            <div className="p-4 border-t border-slate-200 bg-slate-50 flex items-center justify-between gap-3 shrink-0">
              <button
                type="button"
                onClick={refreshAlerts}
                className="px-3 py-2 rounded-xl bg-white hover:bg-slate-100 border border-slate-200 text-xs font-bold text-slate-700 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Refresh Stock Counts</span>
              </button>

              <div className="flex items-center gap-2">
                {onFilterLowStockInInventory && (
                  <button
                    type="button"
                    onClick={() => {
                      setIsDrawerOpen(false);
                      onFilterLowStockInInventory();
                    }}
                    className="px-3 py-2 rounded-xl bg-teal-50 hover:bg-teal-100 border border-teal-200 text-teal-800 text-xs font-bold transition-colors"
                  >
                    View in Inventory
                  </button>
                )}
                <button
                  type="button"
                  onClick={() => setIsDrawerOpen(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-900 text-white text-xs font-bold transition-colors"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
};
