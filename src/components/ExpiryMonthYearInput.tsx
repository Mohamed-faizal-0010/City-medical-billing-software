import React, { useState, useEffect, useRef } from 'react';
import { Calendar, ChevronDown, Check, AlertTriangle } from 'lucide-react';

interface ExpiryMonthYearInputProps {
  value: string; // MM/YYYY, MM/YY, or YYYY-MM
  onChange: (formattedValue: string) => void;
  id?: string;
  className?: string;
  required?: boolean;
  onKeyDown?: (e: React.KeyboardEvent<HTMLInputElement>) => void;
}

export const ExpiryMonthYearInput: React.FC<ExpiryMonthYearInputProps> = ({
  value,
  onChange,
  id = 'purchase-expiry-input',
  className = '',
  required = true,
  onKeyDown
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Parse current value into Month (1-12) and Year (YYYY)
  const parseMonthYear = (val: string): { month: number; year: number } => {
    const now = new Date();
    const defaultYear = now.getFullYear() + 2;
    const defaultMonth = 12;

    if (!val) return { month: defaultMonth, year: defaultYear };

    // Format MM/YYYY
    if (/^\d{1,2}\/\d{4}$/.test(val)) {
      const [m, y] = val.split('/').map(Number);
      return { month: m >= 1 && m <= 12 ? m : defaultMonth, year: y };
    }
    // Format MM/YY
    if (/^\d{1,2}\/\d{2}$/.test(val)) {
      const [m, y] = val.split('/').map(Number);
      return { month: m >= 1 && m <= 12 ? m : defaultMonth, year: 2000 + y };
    }
    // Format YYYY-MM
    if (/^\d{4}-\d{1,2}$/.test(val)) {
      const [y, m] = val.split('-').map(Number);
      return { month: m >= 1 && m <= 12 ? m : defaultMonth, year: y };
    }
    // Format YYYY-MM-DD
    if (/^\d{4}-\d{1,2}-\d{1,2}$/.test(val)) {
      const [y, m] = val.split('-').map(Number);
      return { month: m >= 1 && m <= 12 ? m : defaultMonth, year: y };
    }

    return { month: defaultMonth, year: defaultYear };
  };

  const { month: parsedMonth, year: parsedYear } = parseMonthYear(value);
  const [selectedMonth, setSelectedMonth] = useState<number>(parsedMonth);
  const [selectedYear, setSelectedYear] = useState<number>(parsedYear);
  const [rawInput, setRawInput] = useState<string>(value || '');

  // Keep local state in sync when value changes from outside
  useEffect(() => {
    const { month, year } = parseMonthYear(value);
    setSelectedMonth(month);
    setSelectedYear(year);
    setRawInput(value || '');
  }, [value]);

  // Handle clicking outside to close picker popup
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const months = [
    { num: 1, name: 'Jan', code: '01' },
    { num: 2, name: 'Feb', code: '02' },
    { num: 3, name: 'Mar', code: '03' },
    { num: 4, name: 'Apr', code: '04' },
    { num: 5, name: 'May', code: '05' },
    { num: 6, name: 'Jun', code: '06' },
    { num: 7, name: 'Jul', code: '07' },
    { num: 8, name: 'Aug', code: '08' },
    { num: 9, name: 'Sep', code: '09' },
    { num: 10, name: 'Oct', code: '10' },
    { num: 11, name: 'Nov', code: '11' },
    { num: 12, name: 'Dec', code: '12' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 12 }, (_, i) => currentYear + i);

  // Commit month and year selection as MM/YYYY
  const commitMonthYear = (m: number, y: number) => {
    setSelectedMonth(m);
    setSelectedYear(y);
    const mm = String(m).padStart(2, '0');
    const formatted = `${mm}/${y}`;
    setRawInput(formatted);
    onChange(formatted);
  };

  // Direct keyboard input handler with auto-slash for MM/YY or MM/YYYY
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let text = e.target.value.replace(/[^0-9/]/g, '');

    // If user types 2 digits without slash, auto-insert slash e.g. "0828" -> "08/28"
    if (text.length === 4 && !text.includes('/')) {
      const m = text.slice(0, 2);
      const y = text.slice(2);
      text = `${m}/${y}`;
    }

    setRawInput(text);

    // If valid MM/YY or MM/YYYY, trigger onChange
    if (/^\d{2}\/\d{2}$/.test(text)) {
      const [m, y] = text.split('/').map(Number);
      if (m >= 1 && m <= 12) {
        const fullYear = 2000 + y;
        setSelectedMonth(m);
        setSelectedYear(fullYear);
        onChange(`${String(m).padStart(2, '0')}/${fullYear}`);
      }
    } else if (/^\d{2}\/\d{4}$/.test(text)) {
      const [m, y] = text.split('/').map(Number);
      if (m >= 1 && m <= 12 && y >= 2020 && y <= 2045) {
        setSelectedMonth(m);
        setSelectedYear(y);
        onChange(`${String(m).padStart(2, '0')}/${y}`);
      }
    } else {
      onChange(text);
    }
  };

  // Expiry check logic (e.g. is it expired, or < 90 days?)
  const checkExpiryStatus = () => {
    if (!selectedMonth || !selectedYear) return null;
    const now = new Date();
    // Expiry date is last day of the selected month
    const expiryDate = new Date(selectedYear, selectedMonth, 0);
    const diffMs = expiryDate.getTime() - now.getTime();
    const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays < 0) {
      return { status: 'expired', label: 'Expired', color: 'text-rose-600 bg-rose-50 border-rose-200' };
    }
    if (diffDays <= 90) {
      return { status: 'short', label: `< 90 Days (${diffDays}d)`, color: 'text-amber-700 bg-amber-50 border-amber-300' };
    }
    return { status: 'valid', label: 'Valid', color: 'text-emerald-700 bg-emerald-50 border-emerald-200' };
  };

  const expiryStatus = checkExpiryStatus();

  return (
    <div className={`relative ${className}`} ref={containerRef}>
      <div className="flex items-center gap-1">
        {/* Main Input for Expiry Month & Year */}
        <div className="relative flex-1">
          <input
            type="text"
            id={id}
            value={rawInput}
            onChange={handleInputChange}
            onKeyDown={onKeyDown}
            placeholder="MM/YY or MM/YYYY"
            required={required}
            className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:bg-white focus:ring-2 focus:ring-teal-500 focus:outline-hidden"
            title="Enter Expiry Month and Year (e.g. 08/28 or 12/2028)"
          />
        </div>

        {/* Quick Month / Year Picker Dropdown Button */}
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-xl text-slate-700 hover:text-teal-800 transition-colors cursor-pointer shrink-0"
          title="Pick Expiry Month & Year"
        >
          <Calendar className="w-4 h-4 text-teal-600" />
        </button>
      </div>

      {/* Expiry status pill indicator */}
      {expiryStatus && (
        <div className="mt-1 flex items-center justify-between text-[10px]">
          <span className={`px-1.5 py-0.5 rounded-md font-bold border ${expiryStatus.color} flex items-center gap-1`}>
            {expiryStatus.status === 'expired' && <AlertTriangle className="w-3 h-3 text-rose-600" />}
            {expiryStatus.status === 'short' && <AlertTriangle className="w-3 h-3 text-amber-600" />}
            <span>{expiryStatus.label}</span>
          </span>
          <span className="text-slate-400 font-mono">
            {months.find(m => m.num === selectedMonth)?.name} {selectedYear}
          </span>
        </div>
      )}

      {/* Month & Year Selection Popup Modal / Dropdown */}
      {isOpen && (
        <div className="absolute left-0 top-full mt-1 z-50 bg-white border border-slate-300 shadow-2xl rounded-2xl p-3 w-64 text-xs animate-fadeIn">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 mb-2">
            <span className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="w-3.5 h-3.5 text-teal-600" />
              <span>Expiry Month & Year</span>
            </span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 text-xs font-bold"
            >
              ✕
            </button>
          </div>

          {/* Year Selector row */}
          <div className="mb-2.5">
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Select Expiry Year
            </label>
            <div className="grid grid-cols-4 gap-1 max-h-24 overflow-y-auto pr-1">
              {years.map(yr => (
                <button
                  key={yr}
                  type="button"
                  onClick={() => commitMonthYear(selectedMonth, yr)}
                  className={`py-1 text-[11px] font-mono rounded-lg font-bold transition-colors cursor-pointer ${
                    selectedYear === yr
                      ? 'bg-teal-700 text-white shadow-2xs'
                      : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                  }`}
                >
                  {yr}
                </button>
              ))}
            </div>
          </div>

          {/* Month Selector Grid (12 Months) */}
          <div>
            <label className="block text-[10px] uppercase font-bold text-slate-500 mb-1">
              Select Expiry Month
            </label>
            <div className="grid grid-cols-3 gap-1">
              {months.map(m => (
                <button
                  key={m.num}
                  type="button"
                  onClick={() => {
                    commitMonthYear(m.num, selectedYear);
                    setIsOpen(false);
                  }}
                  className={`py-1.5 px-2 text-[11px] rounded-lg font-semibold flex items-center justify-between transition-colors cursor-pointer ${
                    selectedMonth === m.num
                      ? 'bg-teal-600 text-white font-bold'
                      : 'bg-slate-50 hover:bg-slate-100 text-slate-700'
                  }`}
                >
                  <span>{m.name}</span>
                  <span className="font-mono text-[9px] opacity-75">{m.code}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mt-2.5 pt-2 border-t border-slate-100 flex items-center justify-between text-[11px]">
            <span className="text-slate-500">Selected:</span>
            <span className="font-mono font-bold text-teal-800">
              {String(selectedMonth).padStart(2, '0')}/{selectedYear}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
