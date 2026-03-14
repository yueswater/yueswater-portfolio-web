import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown } from 'lucide-react';

interface Option {
    value: string;
    label: string;
}

interface CustomSelectProps {
    value: string;
    onChange: (value: string) => void;
    options: Option[];
    placeholder?: string;
    required?: boolean;
    className?: string;
}

export default function CustomSelect({ value, onChange, options, placeholder, required, className = '' }: CustomSelectProps) {
    const [open, setOpen] = useState(false);
    const ref = useRef<HTMLDivElement>(null);

    const selected = options.find(o => o.value === value);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    return (
        <div ref={ref} className={`relative ${className}`}>
            {/* Hidden native input for form validation */}
            {required && (
                <input
                    tabIndex={-1}
                    value={value}
                    required
                    onChange={() => { }}
                    className="absolute inset-0 opacity-0 pointer-events-none"
                />
            )}
            <button
                type="button"
                onClick={() => setOpen(o => !o)}
                className="w-full flex items-center justify-between bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-3 text-lg font-light transition-colors text-left"
            >
                <span className={selected ? 'text-[#020202]' : 'opacity-40'}>
                    {selected ? selected.label : placeholder}
                </span>
                <ChevronDown size={18} className={`opacity-40 transition-transform duration-200 ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute z-50 left-0 right-0 mt-1 max-h-60 overflow-y-auto bg-[#f3f3f3] border border-[#020202]/10 shadow-lg">
                    {options.map(opt => (
                        <button
                            key={opt.value}
                            type="button"
                            onClick={() => { onChange(opt.value); setOpen(false); }}
                            className={`w-full text-left px-4 py-3 text-sm transition-colors hover:bg-[#020202] hover:text-[#f3f3f3] ${opt.value === value ? 'bg-[#020202] text-[#f3f3f3]' : ''
                                }`}
                        >
                            {opt.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    );
}
