import React, { useState, useEffect, useRef } from 'react';
import { X, Plus } from 'lucide-react';
import { API_BASE } from '../api';

interface TagSelectorProps {
    selected: string[];
    onChange: (tags: string[]) => void;
    max?: number;
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

export default function TagSelector({ selected, onChange, max = 5 }: TagSelectorProps) {
    const [allTags, setAllTags] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [focused, setFocused] = useState(false);
    const [creating, setCreating] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/tags`)
            .then(r => r.json())
            .then((data: any[]) => setAllTags(data.map(t => t.name)))
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
        ? allTags.filter(t => !selected.includes(t) && fuzzyMatch(t, input.trim()))
        : allTags.filter(t => !selected.includes(t));

    const addTag = (name: string) => {
        if (selected.length >= max) return;
        if (!selected.includes(name)) onChange([...selected, name]);
        setInput('');
    };

    const removeTag = (name: string) => {
        onChange(selected.filter(t => t !== name));
    };

    const createAndAdd = async () => {
        const name = input.trim();
        if (!name || selected.length >= max) return;
        setCreating(true);
        try {
            const token = localStorage.getItem('token');
            const res = await fetch(`${API_BASE}/api/tags`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
                body: JSON.stringify({ name }),
            });
            if (res.ok || res.status === 409) {
                if (!allTags.includes(name)) setAllTags(prev => [...prev, name].sort());
                addTag(name);
            }
        } catch { /* noop */ }
        setCreating(false);
    };

    const handleKeyDown = (e: React.KeyboardEvent) => {
        if (e.nativeEvent.isComposing) return;
        if (e.key === 'Enter') {
            e.preventDefault();
            if (candidates.length > 0) {
                addTag(candidates[0]);
            } else if (input.trim()) {
                createAndAdd();
            }
        }
    };

    const showDropdown = focused && (candidates.length > 0 || (input.trim() && !allTags.includes(input.trim())));
    const exactExists = allTags.includes(input.trim());

    return (
        <div ref={wrapperRef} className="relative">
            <label className="block text-xs uppercase tracking-widest opacity-50 mb-2">
                標籤（至多 {max} 個）
            </label>

            {/* Selected tags */}
            {selected.length > 0 && (
                <div className="flex flex-wrap gap-2 mb-3">
                    {selected.map(tag => (
                        <span key={tag} className="inline-flex items-center gap-1 bg-[#020202] text-[#f3f3f3] px-3 py-1 text-xs font-medium uppercase tracking-wider">
                            {tag}
                            <button type="button" onClick={() => removeTag(tag)} className="opacity-60 hover:opacity-100 transition-opacity">
                                <X size={12} />
                            </button>
                        </span>
                    ))}
                </div>
            )}

            {/* Input */}
            {selected.length < max && (
                <input
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    onFocus={() => setFocused(true)}
                    onKeyDown={handleKeyDown}
                    placeholder="輸入搜尋或新增標籤..."
                    className="w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-2 text-base font-light transition-colors placeholder:opacity-40"
                />
            )}

            {/* Dropdown */}
            {showDropdown && (
                <div className="absolute z-10 left-0 right-0 mt-1 bg-[#f3f3f3] border border-[#020202]/20 max-h-48 overflow-y-auto shadow-lg">
                    {candidates.map(tag => (
                        <button
                            key={tag}
                            type="button"
                            onClick={() => addTag(tag)}
                            className="w-full text-left px-4 py-2.5 text-sm hover:bg-[#020202]/5 transition-colors flex items-center justify-between group"
                        >
                            <span>{tag}</span>
                            <Plus size={14} className="opacity-0 group-hover:opacity-40 transition-opacity" />
                        </button>
                    ))}
                    {input.trim() && !exactExists && (
                        <button
                            type="button"
                            onClick={createAndAdd}
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
