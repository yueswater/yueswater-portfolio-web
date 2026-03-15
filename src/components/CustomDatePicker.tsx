import React, { useState, useEffect, useRef } from 'react';
import { ChevronDown } from 'lucide-react';
import { useI18n } from '../i18n';

interface CustomDatePickerProps {
    value: string;
    onChange: (value: string) => void;
    required?: boolean;
    minYear?: number;
    maxYear?: number;
    placeholder?: string;
    className?: string;
}

function getDaysInMonth(year: number, month: number) {
    return new Date(year, month + 1, 0).getDate();
}

export default function CustomDatePicker({
    value,
    onChange,
    required = false,
    minYear = 2020,
    maxYear = new Date().getFullYear() + 3,
    placeholder = 'YYYY-MM-DD',
    className = '',
}: CustomDatePickerProps) {
    const { t } = useI18n ? useI18n() : { t: (k: string) => k };
    const today = new Date();
    const [open, setOpen] = useState(false);
    const [year, setYear] = useState<number | null>(null);
    const [month, setMonth] = useState<number | null>(null);
    const [day, setDay] = useState<number | null>(null);
    const pickerRef = useRef<HTMLDivElement>(null);

    // Close dropdown only if click outside
    useEffect(() => {
        if (!open) return;
        const handleClick = (e: MouseEvent) => {
            if (pickerRef.current && !pickerRef.current.contains(e.target as Node)) {
                setOpen(false);
            }
        };
        document.addEventListener('mousedown', handleClick);
        return () => document.removeEventListener('mousedown', handleClick);
    }, [open]);

    // Parse value if present
    useEffect(() => {
        if (value && /^\d{4}-\d{2}-\d{2}$/.test(value)) {
            const [y, m, d] = value.split('-').map(Number);
            setYear(y);
            setMonth(m - 1);
            setDay(d);
        } else {
            setYear(null);
            setMonth(null);
            setDay(null);
        }
    }, [value]);

    // Update value on change
    useEffect(() => {
        if (year !== null && month !== null && day !== null) {
            const mm = String(month + 1).padStart(2, '0');
            const dd = String(day).padStart(2, '0');
            onChange(`${year}-${mm}-${dd}`);
        }
    }, [year, month, day]);

    // UI helpers
    const years = Array.from({ length: maxYear - minYear + 1 }, (_, i) => minYear + i);
    const months = [
        '01', '02', '03', '04', '05', '06',
        '07', '08', '09', '10', '11', '12',
    ];
    const days = year !== null && month !== null
        ? Array.from({ length: getDaysInMonth(year, month) }, (_, i) => i + 1)
        : [];

    // Dropdown open states for each select
    const [openYear, setOpenYear] = useState(false);
    const [openMonth, setOpenMonth] = useState(false);
    const [openDay, setOpenDay] = useState(false);

    return (
        <div ref={pickerRef} className={`relative ${className}`}>
            <button
                type="button"
                className="w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-3 text-lg font-light transition-colors text-left"
                onClick={() => setOpen(o => !o)}
            >
                <span className={value ? 'text-[#020202]' : 'opacity-40'}>
                    {value || placeholder}
                </span>
            </button>
            {open && (
                <div className="absolute z-50 left-0 mt-1 bg-[#f3f3f3] border border-[#020202]/10 shadow-lg p-4 flex flex-col gap-2 min-w-[260px]">
                    <div className="flex gap-2 mb-2">
                        {/* Year dropdown */}
                        <div className="relative min-w-[90px]">
                            <button
                                type="button"
                                className="w-full flex items-center justify-between bg-transparent border border-[#020202]/10 rounded px-2 py-1 text-base text-left"
                                onClick={() => { setOpenYear(o => !o); setOpenMonth(false); setOpenDay(false); }}
                                disabled={false}
                            >
                                <span className={year !== null ? 'text-[#020202]' : 'opacity-40'}>
                                    {year !== null ? year : t('date.year') || '年'}
                                </span>
                                <ChevronDown size={16} className={`opacity-40 transition-transform duration-200 ${openYear ? 'rotate-180' : ''}`} />
                            </button>
                            {openYear && (
                                <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#f3f3f3] border border-[#020202]/10 shadow-lg">
                                    {years.map(y => (
                                        <button
                                            key={y}
                                            type="button"
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[#020202] hover:text-[#f3f3f3] ${year === y ? 'bg-[#020202] text-[#f3f3f3]' : ''}`}
                                            onClick={() => { setYear(y); setOpenYear(false); }}
                                        >
                                            {y}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Month dropdown */}
                        <div className="relative min-w-[70px]">
                            <button
                                type="button"
                                className="w-full flex items-center justify-between bg-transparent border border-[#020202]/10 rounded px-2 py-1 text-base text-left"
                                onClick={() => { if (year !== null) { setOpenMonth(o => !o); setOpenYear(false); setOpenDay(false); } }}
                                disabled={year === null}
                            >
                                <span className={month !== null ? 'text-[#020202]' : 'opacity-40'}>
                                    {month !== null ? months[month] : t('date.month') || '月'}
                                </span>
                                <ChevronDown size={16} className={`opacity-40 transition-transform duration-200 ${openMonth ? 'rotate-180' : ''}`} />
                            </button>
                            {openMonth && year !== null && (
                                <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#f3f3f3] border border-[#020202]/10 shadow-lg">
                                    {months.map((m, idx) => (
                                        <button
                                            key={m}
                                            type="button"
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[#020202] hover:text-[#f3f3f3] ${month === idx ? 'bg-[#020202] text-[#f3f3f3]' : ''}`}
                                            onClick={() => { setMonth(idx); setOpenMonth(false); }}
                                        >
                                            {m}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                        {/* Day dropdown */}
                        <div className="relative min-w-[70px]">
                            <button
                                type="button"
                                className="w-full flex items-center justify-between bg-transparent border border-[#020202]/10 rounded px-2 py-1 text-base text-left"
                                onClick={() => { if (year !== null && month !== null) { setOpenDay(o => !o); setOpenYear(false); setOpenMonth(false); } }}
                                disabled={year === null || month === null}
                            >
                                <span className={day !== null ? 'text-[#020202]' : 'opacity-40'}>
                                    {day !== null ? String(day).padStart(2, '0') : t('date.day') || '日'}
                                </span>
                                <ChevronDown size={16} className={`opacity-40 transition-transform duration-200 ${openDay ? 'rotate-180' : ''}`} />
                            </button>
                            {openDay && year !== null && month !== null && (
                                <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#f3f3f3] border border-[#020202]/10 shadow-lg">
                                    {days.map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            className={`w-full text-left px-4 py-2 text-sm transition-colors hover:bg-[#020202] hover:text-[#f3f3f3] ${day === d ? 'bg-[#020202] text-[#f3f3f3]' : ''}`}
                                            onClick={() => { setDay(d); setOpenDay(false); }}
                                        >
                                            {String(d).padStart(2, '0')}
                                        </button>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
