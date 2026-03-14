import React, { useState, useEffect, useRef } from 'react';
import { Plus, ChevronDown } from 'lucide-react';
import { API_BASE } from '../api';

interface CategorySelectorProps {
    value: string;
    onChange: (category: string) => void;
}

function fuzzyMatch(text: string, query: string): boolean {
    const lower = text.toLowerCase();
    const q = query.toLowerCase();
    let qi = 0;
    for (let i = 0; i < lower.length && qi < q.length; i++) {
        if (lower[i] === q[qi]) qi++;
    }
    return qi === q.length;
}

export default function CategorySelector({ value, onChange }: CategorySelectorProps) {
    const [allCategories, setAllCategories] = useState<string[]>([]);
    const [input, setInput] = useState(value);
    const [focused, setFocused] = useState(false);
    const [creating, setCreating] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/categories`)
            .then(r => r.json())
            .then((data: any[]) => setAllCategories(data.map(c => c.name)))
            .catch(() => { });
    }, []);

    useEffect(() => {
        const handler = (e: MouseEvent) => {
            if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
                setFocused(false);
            }
        };
        document.addEventListener('mousedown', handler);
        return () => document.removeEventListener('mousedown', handler);
    }, []);

    const candidates = input.trim()
        ? allCategories.filter(c => fuzzyMatch(c, input.trim()))
        : allCategories;

    const selectCategory = (name: string) => {
        onChange(name);
        setInput(name);
        setFocused(false);
    };

    const createAndSelect = async () => {
        const name = input.trim();
        if (!name) return;
        setCreating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/categories`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok || res.status === 409) {
                if (!allCategories.includes(name)) setAllCategories(prev => [...prev, name].sort());
                selectCategory(name);
            }
        } catch { /* noop */ }
        setCreating(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            if (candidates.length > 0 && candidates.some(c => c.toLowerCase() === input.trim().toLowerCase())) {
                selectCategory(candidates.find(c => c.toLowerCase() === input.trim().toLowerCase())!);
            } else if (candidates.length > 0) {
                selectCategory(candidates[0]);
            } else if (input.trim()) {
                createAndSelect();
            }
        }
    };

    const showDropdown = focused && (candidates.length > 0 || (input.trim() && !allCategories.includes(input.trim())));
    const exactExists = allCategories.some(c => c.toLowerCase() === input.trim().toLowerCase());

    return (
        <div ref={wrapperRef} className="relative">
            <label className="block text-xs uppercase tracking-widest opacity-50 mb-2">服務分類</label>
            <div className="relative">
                <input
                    value={input}
                    onChange={e => { setInput(e.target.value); onChange(e.target.value); }}
                    onFocus={() => setFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="輸入搜尋或新增分類..."
                    required
                    className="w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-2 text-base font-light transition-colors placeholder:opacity-40 pr-8"
                />
                <ChevronDown size={16} className="absolute right-0 top-1/2 -translate-y-1/2 opacity-30 pointer-events-none" />
            </div>

            {showDropdown && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-[#f3f3f3] border border-[#020202]/20 max-h-48 overflow-y-auto shadow-lg">
                    {candidates.map(cat => (
                        <button
                            key={cat}
                            type="button"
                            onClick={() => selectCategory(cat)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#020202]/5 transition-colors"
                        >
                            {cat}
                        </button>
                    ))}
                    {input.trim() && !exactExists && (
                        <button
                            type="button"
                            onClick={createAndSelect}
                            disabled={creating}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#020202]/5 transition-colors border-t border-[#020202]/10 flex items-center gap-2 font-medium"
                        >
                            <Plus size={14} />
                            {creating ? '建立中...' : `新增「${input.trim()}」`}
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
