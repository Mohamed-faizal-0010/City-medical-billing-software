import React, { useState, useEffect } from 'react';
import { Calendar, ChevronDown, Check, Clock } from 'lucide-react';
import { formatDateDMY, toInputDateValue, getDateParts } from '../utils/dateUtils';

interface DateMonthYearPickerProps {
  value: string; // ISO date string or YYYY-MM-DD
  onChange: (newIsoDate: string) => void;
  label?: string;
  size?: 'sm' | 'md';
  allowFuture?: boolean;
  className?: string;
  id?: string;
}

export const DateMonthYearPicker: React.FC<DateMonthYearPickerProps> = ({
  value,
  onChange,
  label = 'Bill Date',
  size = 'md',
  className = '',
  id = 'dmy-picker'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dateObj = value ? new Date(value) : new Date();
  const safeDate = isNaN(dateObj.getTime()) ? new Date() : dateObj;

  const [day, setDay] = useState<number>(safeDate.getDate());
  const [month, setMonth] = useState<number>(safeDate.getMonth() + 1);
  const [year, setYear] = useState<number>(safeDate.getFullYear());

  useEffect(() => {
    const d = value ? new Date(value) : new Date();
    if (!isNaN(d.getTime())) {
      setDay(d.getDate());
      setMonth(d.getMonth() + 1);
      setYear(d.getFullYear());
    }
  }, [value]);

  const emitDate = (d: number, m: number, y: number) => {
    // clamp day to month days
    const maxDays = new Date(y, m, 0).getDate();
    const clampedDay = Math.min(d, maxDays);
    const mm = String(m).padStart(2, '0');
    const dd = String(clampedDay).padStart(2, '0');
    const iso = `${y}-${mm}-${dd}`;
    onChange(iso);
  };

  const handleSetToday = () => {
    const today = new Date();
    setDay(today.getDate());
    setMonth(today.getMonth() + 1);
    setYear(today.getFullYear());
    emitDate(today.getDate(), today.getMonth() + 1, today.getFullYear());
    setIsOpen(false);
  };

  const handleSetYesterday = () => {
    const yest = new Date();
    yest.setDate(yest.getDate() - 1);
    setDay(yest.getDate());
    setMonth(yest.getMonth() + 1);
    setYear(yest.getFullYear());
    emitDate(yest.getDate(), yest.getMonth() + 1, yest.getFullYear());
    setIsOpen(false);
  };

  const months = [
    { num: 1, name: 'Jan - 01' },
    { num: 2, name: 'Feb - 02' },
    { num: 3, name: 'Mar - 03' },
    { num: 4, name: 'Apr - 04' },
    { num: 5, name: 'May - 05' },
    { num: 6, name: 'Jun - 06' },
    { num: 7, name: 'Jul - 07' },
    { num: 8, name: 'Aug - 08' },
    { num: 9, name: 'Sep - 09' },
    { num: 10, name: 'Oct - 10' },
    { num: 11, name: 'Nov - 11' },
    { num: 12, name: 'Dec - 12' }
  ];

  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 15 }, (_, i) => currentYear - 5 + i);

  const formattedDisplay = formatDateDMY(value);

  return (
    <div className={`relative inline-block ${className}`} id={id}>
      {/* Trigger Button showing Date/Month/Year */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`flex items-center gap-2 bg-white hover:bg-slate-50 border border-slate-300 hover:border-teal-500 rounded-xl transition-all cursor-pointer shadow-2xs ${
          size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3 py-1.5 text-xs'
        }`}
        title="Click to change Invoice / Bill Date (Date/Month/Year model)"
      >
        <Calendar className="w-3.5 h-3.5 text-teal-600 shrink-0" />
        <div className="flex flex-col text-left">
          {label && (
            <span className="text-[9px] font-bold uppercase tracking-wider text-slate-400 leading-none">
              {label} (DD/MM/YYYY)
            </span>
          )}
          <span className="font-mono font-bold text-slate-800 tracking-tight leading-tight mt-0.5">
            {formattedDisplay}
          </span>
        </div>
        <ChevronDown className="w-3 h-3 text-slate-400 ml-0.5 shrink-0" />
      </button>

      {/* Popover Dropdown for Segmented Date / Month / Year */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute left-0 top-full mt-1.5 z-50 bg-white border border-slate-200 rounded-2xl shadow-xl p-3.5 w-76 text-xs text-slate-800 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2 mb-3">
              <span className="font-bold text-slate-800 flex items-center gap-1.5">
                <Calendar className="w-3.5 h-3.5 text-teal-600" />
                <span>Date/Month/Year Model</span>
              </span>
              <span className="px-1.5 py-0.5 bg-teal-50 text-teal-800 text-[10px] font-mono font-bold rounded">
                DD/MM/YYYY
              </span>
            </div>

            {/* Quick Presets */}
            <div className="flex gap-1.5 mb-3">
              <button
                type="button"
                onClick={handleSetToday}
                className="flex-1 py-1 px-2 bg-slate-100 hover:bg-teal-50 hover:text-teal-700 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer text-center"
              >
                Today
              </button>
              <button
                type="button"
                onClick={handleSetYesterday}
                className="flex-1 py-1 px-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-[11px] transition-colors cursor-pointer text-center"
              >
                Yesterday
              </button>
            </div>

            {/* Segmented Inputs: Day (DD), Month (MM), Year (YYYY) */}
            <div className="grid grid-cols-3 gap-2 mb-3">
              {/* Day DD */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Day (DD)
                </label>
                <select
                  value={day}
                  onChange={e => {
                    const newDay = parseInt(e.target.value, 10);
                    setDay(newDay);
                    emitDate(newDay, month, year);
                  }}
                  className="w-full px-2 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  {Array.from({ length: 31 }, (_, i) => i + 1).map(d => (
                    <option key={d} value={d}>
                      {String(d).padStart(2, '0')}
                    </option>
                  ))}
                </select>
              </div>

              {/* Month MM */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Month (MM)
                </label>
                <select
                  value={month}
                  onChange={e => {
                    const newMonth = parseInt(e.target.value, 10);
                    setMonth(newMonth);
                    emitDate(day, newMonth, year);
                  }}
                  className="w-full px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  {months.map(m => (
                    <option key={m.num} value={m.num}>
                      {m.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year YYYY */}
              <div>
                <label className="text-[10px] font-bold text-slate-500 uppercase block mb-1">
                  Year (YYYY)
                </label>
                <select
                  value={year}
                  onChange={e => {
                    const newYear = parseInt(e.target.value, 10);
                    setYear(newYear);
                    emitDate(day, month, newYear);
                  }}
                  className="w-full px-1.5 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono font-bold text-slate-800 focus:ring-2 focus:ring-teal-500"
                >
                  {years.map(y => (
                    <option key={y} value={y}>
                      {y}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Standard native date picker fallback */}
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between">
              <span className="text-[11px] text-slate-500">Pick from Calendar:</span>
              <input
                type="date"
                value={toInputDateValue(value)}
                onChange={e => {
                  if (e.target.value) {
                    onChange(e.target.value);
                  }
                }}
                className="text-xs font-mono px-2 py-1 border border-slate-200 rounded-lg bg-slate-50"
              />
            </div>

            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="mt-3 w-full py-1.5 bg-teal-600 hover:bg-teal-700 text-white font-bold rounded-xl text-xs flex items-center justify-center gap-1 cursor-pointer transition-colors shadow-2xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Confirm Date ({formattedDisplay})</span>
            </button>
          </div>
        </>
      )}
    </div>
  );
};
