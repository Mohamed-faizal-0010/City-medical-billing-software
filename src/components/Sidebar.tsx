import React, { useState, useEffect, useMemo } from 'react';
import {
  ShoppingCart,
  Boxes,
  Dna,
  RotateCcw,
  Truck,
  FileMinus,
  Building2,
  Users,
  CalendarCheck,
  BarChart3,
  ShieldCheck,
  X,
  Stethoscope,
  Link2,
  Smartphone,
  ChevronLeft,
  ChevronRight,
  PanelLeftClose,
  PanelLeftOpen,
  Receipt,
  FileSpreadsheet,
  AlertOctagon,
  Download,
  ShoppingBag,
  TrendingUp,
  Clock
} from 'lucide-react';

interface SidebarProps {
  activeTab: string;
  onSelectTab: (tabId: string) => void;
  mobileNavOpen: boolean;
  onCloseMobileNav: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  mobileNavOpen,
  onCloseMobileNav,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('city_medical_sidebar_collapsed') === 'true';
    } catch {
      return false;
    }
  });

  const [sidebarMode, setSidebarMode] = useState<'all' | 'retail' | 'wholesale'>(() => {
    try {
      return (localStorage.getItem('city_medical_sidebar_mode') as any) || 'all';
    } catch {
      return 'all';
    }
  });

  const handleSetSidebarMode = (mode: 'all' | 'retail' | 'wholesale') => {
    setSidebarMode(mode);
    try {
      localStorage.setItem('city_medical_sidebar_mode', mode);
    } catch {}
  };

  const toggleCollapse = () => {
    setIsCollapsed(prev => {
      const next = !prev;
      try {
        localStorage.setItem('city_medical_sidebar_collapsed', String(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  const retailGroup = {
    group: 'Retail Operations',
    color: 'teal',
    items: [
      { id: 'retail-dashboard', label: 'Retail Dashboard', icon: BarChart3, badge: 'Counter' },
      { id: 'pos', label: 'POS Billing [F1]', icon: ShoppingCart, badge: 'Retail' },
      { id: 'online-orders', label: 'Online Order Portal', icon: ShoppingBag, badge: 'Live' },
      { id: 'patients', label: 'Patients & Khata Dues', icon: Users, badge: 'Udhaar' },
      { id: 'clinic', label: 'Clinic & Rx', icon: Stethoscope, badge: 'OPD' },
      { id: 'generics', label: 'Generics Substitute', icon: Dna, badge: 'AI' },
      { id: 'sales-returns', label: 'Sales Returns', icon: RotateCcw },
      { id: 'report-sales', label: 'Retail Sales Report', icon: Receipt, badge: 'Daily' },
      { id: 'retail-payment-pending', label: 'Retail Payment Pending', icon: Clock, badge: 'Due ₹' },
      { id: 'retail-payment-report', label: 'Purchase Payment Report', icon: FileSpreadsheet, badge: 'Settled' },
      { id: 'retail-suppliers', label: 'Retail Supplier List', icon: Building2, badge: 'Ledgers' },
    ]
  };

  const wholesaleGroup = {
    group: 'Wholesale & B2B Distribution',
    color: 'indigo',
    items: [
      { id: 'wholesale-dashboard', label: 'Wholesale Dashboard', icon: TrendingUp, badge: 'B2B' },
      { id: 'wholesale-pos', label: 'Wholesale B2B Billing', icon: Truck, badge: 'PTR' },
      { id: 'wholesale-hub', label: 'Wholesale Hub', icon: Building2, badge: 'Form 20B' },
      { id: 'wholesale-pending', label: 'Payment Pending', icon: Receipt, badge: 'Due ₹' },
      { id: 'wholesale-returns', label: 'Wholesale Returns', icon: RotateCcw, badge: 'Credit' },
      { id: 'wholesale-purchases', label: 'Wholesale Purchases', icon: Truck, badge: 'Inward' },
      { id: 'wholesale-purchase-returns', label: 'Debit Notes', icon: FileMinus },
      { id: 'wholesale-purchase-report', label: 'Wholesale Report', icon: FileSpreadsheet },
    ]
  };

  const inventoryGroup = {
    group: 'Inventory & Procurement',
    color: 'slate',
    items: [
      { id: 'inventory', label: 'Inventory / Stock', icon: Boxes, badge: 'FEFO' },
      { id: 'stock-report', label: 'Current Stock Report (22 Forms)', icon: Boxes, badge: 'PDF/XLS' },
      { id: 'expiry-dashboard', label: 'Batch Expiry (90d)', icon: Clock, badge: 'Urgent' },
      { id: 'purchases', label: 'Purchase Entry', icon: Truck, badge: 'Inward' },
      { id: 'retail-payment-pending', label: 'Purchase Payment Pending', icon: Clock, badge: 'Due ₹' },
      { id: 'retail-payment-report', label: 'Purchase Payment Report', icon: FileSpreadsheet, badge: 'Audit' },
      { id: 'retail-suppliers', label: 'Retail Supplier List', icon: Building2 },
      { id: 'purchase-returns', label: 'Purchase Returns', icon: FileMinus },
      { id: 'suppliers', label: 'Suppliers Master', icon: Building2 },
      { id: 'report-schedule', label: 'Schedule Drug Report', icon: AlertOctagon, badge: 'H1/H/X' },
    ]
  };

  const systemGroup = {
    group: 'Reports & Management',
    color: 'slate',
    items: [
      { id: 'reports', label: 'All Reports & P&L', icon: BarChart3, badge: 'Hub' },
      { id: 'retail-payment-report', label: 'Purchase Payment Report', icon: FileSpreadsheet, badge: 'Audit' },
      { id: 'report-purchases', label: 'Purchase Report & Dues', icon: FileSpreadsheet, badge: 'Pay ₹' },
      { id: 'software-controller', label: 'Software Controller', icon: ShieldCheck, badge: 'Multi-Store' },
      { id: 'playstore-app', label: 'App / Publish / Sale', icon: Download, badge: 'PC/APK' },
      { id: 'short-links', label: 'Short Links', icon: Link2 },
      { id: 'security', label: 'Security & Users', icon: ShieldCheck },
    ]
  };

  const navigationItems = useMemo(() => {
    if (sidebarMode === 'retail') {
      return [
        retailGroup,
        {
          group: 'Procurement & Payables',
          color: 'teal',
          items: [
            { id: 'purchases', label: 'Purchase Entry', icon: Truck, badge: 'Inward' },
            { id: 'retail-payment-pending', label: 'Retail Payment Pending', icon: Clock, badge: 'Due ₹' },
            { id: 'retail-payment-report', label: 'Purchase Payment Report', icon: FileSpreadsheet, badge: 'Settled' },
            { id: 'retail-suppliers', label: 'Retail Supplier List', icon: Building2, badge: 'Ledgers' },
            { id: 'purchase-returns', label: 'Purchase Returns', icon: FileMinus },
          ]
        },
        {
          group: 'Stock & Audit',
          color: 'slate',
          items: [
            { id: 'inventory', label: 'Inventory / Stock', icon: Boxes, badge: 'FEFO' },
            { id: 'stock-report', label: 'Current Stock Report', icon: Boxes, badge: 'PDF/XLS' },
            { id: 'expiry-dashboard', label: 'Batch Expiry (90d)', icon: Clock, badge: 'Urgent' },
            { id: 'report-schedule', label: 'Schedule Drug Report', icon: AlertOctagon, badge: 'H1' },
          ]
        },
        {
          group: 'Reports & System',
          color: 'slate',
          items: [
            { id: 'reports', label: 'Reports & P&L', icon: BarChart3, badge: 'Hub' },
            { id: 'software-controller', label: 'Software Controller', icon: ShieldCheck },
            { id: 'security', label: 'Security', icon: ShieldCheck }
          ]
        }
      ];
    }

    if (sidebarMode === 'wholesale') {
      return [
        wholesaleGroup,
        {
          group: 'Inventory & Inward',
          color: 'slate',
          items: [
            { id: 'inventory', label: 'Inventory / Stock', icon: Boxes, badge: 'FEFO' },
            { id: 'expiry-dashboard', label: 'Batch Expiry (90d)', icon: Clock, badge: 'Urgent' },
            { id: 'suppliers', label: 'Suppliers & Pharma Labs', icon: Building2 },
            { id: 'stock-report', label: 'Stock Report (22 Forms)', icon: Boxes }
          ]
        },
        {
          group: 'Wholesale Compliance',
          color: 'slate',
          items: [
            { id: 'reports', label: 'B2B GST Reports', icon: BarChart3, badge: 'GST' },
            { id: 'software-controller', label: 'Multi-Store Controller', icon: ShieldCheck },
            { id: 'security', label: 'Security', icon: ShieldCheck }
          ]
        }
      ];
    }

    // Default 'all'
    return [
      retailGroup,
      wholesaleGroup,
      inventoryGroup,
      systemGroup
    ];
  }, [sidebarMode]);

  return (
    <>
      {/* Mobile Drawer Overlay */}
      {mobileNavOpen && (
        <div
          onClick={onCloseMobileNav}
          className="fixed inset-0 bg-slate-900/40 backdrop-blur-xs z-40 lg:hidden"
        />
      )}

      {/* Main Sidebar (Desktop sticky-scrolling + Mobile slide-in) */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-50 bg-white border-r border-slate-200 flex flex-col transition-all duration-200 lg:translate-x-0 lg:sticky lg:top-[57px] lg:h-[calc(100vh-57px)] lg:z-20 shrink-0 select-none shadow-xs ${
          isCollapsed ? 'lg:w-16 w-60' : 'lg:w-52 w-60'
        } ${mobileNavOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        {/* Header with collapse toggle (desktop) and close button (mobile) */}
        <div className="flex items-center justify-between px-3 py-2 border-b border-slate-100 h-10">
          <div className="flex items-center gap-1.5 overflow-hidden">
            {!isCollapsed ? (
              <div className="flex items-center gap-1.5">
                <span className="font-extrabold text-slate-800 text-xs uppercase tracking-wider truncate">
                  Navigation
                </span>
                <span className="text-[9px] bg-emerald-50 text-emerald-700 font-bold px-1.5 py-0.2 rounded border border-emerald-200">
                  Melur
                </span>
              </div>
            ) : (
              <span className="text-[10px] font-black text-emerald-700 tracking-tighter mx-auto">
                CMS
              </span>
            )}
          </div>

          {/* Desktop collapse toggle */}
          <button
            type="button"
            onClick={toggleCollapse}
            className="hidden lg:flex p-1 text-slate-400 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-colors cursor-pointer"
            title={isCollapsed ? 'Expand sidebar' : 'Collapse to mini sidebar'}
          >
            {isCollapsed ? (
              <ChevronRight className="w-3.5 h-3.5" />
            ) : (
              <ChevronLeft className="w-3.5 h-3.5" />
            )}
          </button>

          {/* Mobile close button */}
          <button
            onClick={onCloseMobileNav}
            className="p-1 text-slate-500 hover:text-slate-900 rounded-lg hover:bg-slate-100 lg:hidden"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Top Retail vs Wholesale Mode Segment Switcher */}
        {!isCollapsed ? (
          <div className="p-2 border-b border-slate-100 bg-slate-50/80">
            <div className="flex bg-slate-200/90 p-0.5 rounded-xl text-[10px] font-bold">
              <button
                type="button"
                onClick={() => handleSetSidebarMode('all')}
                className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
                  sidebarMode === 'all'
                    ? 'bg-white text-slate-900 shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                All
              </button>
              <button
                type="button"
                onClick={() => handleSetSidebarMode('retail')}
                className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
                  sidebarMode === 'retail'
                    ? 'bg-teal-700 text-white shadow-xs'
                    : 'text-teal-800 hover:text-teal-950'
                }`}
                title="Filter navigation to Retail Pharmacy operations"
              >
                Retail
              </button>
              <button
                type="button"
                onClick={() => handleSetSidebarMode('wholesale')}
                className={`flex-1 py-1 rounded-lg transition-all text-center cursor-pointer ${
                  sidebarMode === 'wholesale'
                    ? 'bg-indigo-700 text-white shadow-xs'
                    : 'text-indigo-800 hover:text-indigo-950'
                }`}
                title="Filter navigation to Wholesale B2B operations"
              >
                Wholesale
              </button>
            </div>
          </div>
        ) : (
          <div className="py-1 px-1 border-b border-slate-100 flex justify-center">
            <button
              type="button"
              onClick={() => {
                const next = sidebarMode === 'all' ? 'retail' : (sidebarMode === 'retail' ? 'wholesale' : 'all');
                handleSetSidebarMode(next);
              }}
              className="text-[9px] font-bold px-1 py-0.5 rounded bg-slate-100 hover:bg-slate-200 text-slate-700"
              title={`Mode: ${sidebarMode.toUpperCase()} (Click to toggle)`}
            >
              {sidebarMode === 'all' ? 'ALL' : (sidebarMode === 'retail' ? 'RET' : 'WHL')}
            </button>
          </div>
        )}

        {/* Dedicated Navigation scrolling container */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-3 overscroll-contain scrollbar-thin scrollbar-thumb-slate-200 hover:scrollbar-thumb-slate-300">
          {navigationItems.map(group => (
            <div key={group.group} className="space-y-0.5">
              {!isCollapsed && (
                <div className={`px-2 text-[9px] font-extrabold uppercase tracking-wider ${
                  group.color === 'teal' ? 'text-teal-700' : group.color === 'indigo' ? 'text-indigo-700' : 'text-slate-400'
                }`}>
                  {group.group}
                </div>
              )}
              {isCollapsed && (
                <div className="h-px bg-slate-100 mx-1 my-1" />
              )}
              <div className="space-y-0.5">
                {group.items.map(item => {
                  const Icon = item.icon;
                  const isActive = activeTab === item.id;
                  const activeColorClass =
                    group.color === 'indigo'
                      ? 'bg-indigo-600 text-white shadow-2xs font-semibold'
                      : group.color === 'teal'
                      ? 'bg-teal-600 text-white shadow-2xs font-semibold'
                      : 'bg-slate-800 text-white shadow-2xs font-semibold';

                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        onSelectTab(item.id);
                        onCloseMobileNav();
                      }}
                      title={isCollapsed ? `${item.label} (${group.group})` : undefined}
                      className={`w-full flex items-center ${
                        isCollapsed ? 'justify-center px-1.5 py-2' : 'justify-between px-2.5 py-1.5'
                      } rounded-lg text-xs font-medium transition-all ${
                        isActive
                          ? activeColorClass
                          : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                      }`}
                      id={`nav-${item.id}`}
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <Icon
                          className={`w-4 h-4 shrink-0 ${
                            isActive ? 'text-white' : 'text-slate-500'
                          }`}
                        />
                        {!isCollapsed && (
                          <span className="truncate text-xs">{item.label}</span>
                        )}
                      </div>
                      {!isCollapsed && item.badge && (
                        <span
                          className={`text-[9px] font-bold px-1 py-0.2 rounded shrink-0 ${
                            isActive
                              ? 'bg-white/20 text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          {item.badge}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
        </div>

        {/* Compact Sidebar Footer */}
        <div className="p-2 border-t border-slate-100 bg-slate-50/70">
          {!isCollapsed ? (
            <div className="px-2 py-1.5 bg-white rounded-lg border border-slate-200 shadow-2xs flex items-center justify-between text-[10px]">
              <span className="text-slate-600 font-medium">Sync</span>
              <span className="flex items-center gap-1 text-emerald-700 font-bold">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live
              </span>
            </div>
          ) : (
            <div className="flex justify-center py-1" title="Live Cloud Sync: Active">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            </div>
          )}
        </div>
      </aside>

      {/* Mobile Bottom Dock for instant thumbs access on phones */}
      <div className="fixed bottom-0 left-0 right-0 z-30 bg-white/95 backdrop-blur-md border-t border-slate-200 px-2 py-1.5 flex items-center justify-around lg:hidden">
        <button
          onClick={() => onSelectTab('pos')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg ${
            activeTab === 'pos' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <ShoppingCart className="w-4 h-4" />
          <span className="text-[9px]">POS</span>
        </button>
        <button
          onClick={() => onSelectTab('inventory')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg ${
            activeTab === 'inventory' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Boxes className="w-4 h-4" />
          <span className="text-[9px]">Stock</span>
        </button>
        <button
          onClick={() => onSelectTab('clinic')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg ${
            activeTab === 'clinic' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Stethoscope className="w-4 h-4" />
          <span className="text-[9px]">Clinic</span>
        </button>
        <button
          onClick={() => onSelectTab('patients')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg ${
            activeTab === 'patients' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <Users className="w-4 h-4" />
          <span className="text-[9px]">Patients</span>
        </button>
        <button
          onClick={() => onSelectTab('reports')}
          className={`flex flex-col items-center gap-0.5 p-1 rounded-lg ${
            activeTab === 'reports' ? 'text-emerald-600 font-bold' : 'text-slate-500'
          }`}
        >
          <BarChart3 className="w-4 h-4" />
          <span className="text-[9px]">P&L</span>
        </button>
      </div>
    </>
  );
};
