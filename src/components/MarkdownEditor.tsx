import React, { useRef, useState, useCallback } from 'react';
import { Bold, Italic, Heading2, Link, List, ListOrdered, ImageIcon, Eye, PenLine, Columns2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import { API_BASE } from '../api';

type ViewMode = 'edit' | 'preview' | 'split';

interface MarkdownEditorProps {
    value: string;
    onChange: (value: string) => void;
    textareaRef?: React.RefObject<HTMLTextAreaElement | null>;
    enableImage?: boolean;
    onSave?: () => void;
    rows?: number;
    placeholder?: string;
    className?: string;
}

/* ── helpers ── */

function insertMarkdown(
    textarea: HTMLTextAreaElement,
    value: string,
    onChange: (v: string) => void,
    prefix: string,
    suffix: string,
    placeholder: string,
) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selected = value.slice(start, end);

    // Toggle: if already wrapped, remove
    if (selected && value.slice(start - prefix.length, start) === prefix && value.slice(end, end + suffix.length) === suffix) {
        const newValue = value.slice(0, start - prefix.length) + selected + value.slice(end + suffix.length);
        onChange(newValue);
        requestAnimationFrame(() => {
            textarea.focus();
            textarea.setSelectionRange(start - prefix.length, end - prefix.length);
        });
        return;
    }

    const text = selected || placeholder;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const newValue = `${before}${prefix}${text}${suffix}${after}`;
    onChange(newValue);

    requestAnimationFrame(() => {
        textarea.focus();
        const cursorStart = start + prefix.length;
        textarea.setSelectionRange(cursorStart, cursorStart + text.length);
    });
}

function insertLinePrefix(
    textarea: HTMLTextAreaElement,
    value: string,
    onChange: (v: string) => void,
    prefix: string,
) {
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const lineStart = value.lastIndexOf('\n', start - 1) + 1;
    const lineEnd = value.indexOf('\n', end);
    const blockEnd = lineEnd === -1 ? value.length : lineEnd;
    const block = value.slice(lineStart, blockEnd);
    const lines = block.split('\n');
    const prefixed = lines.map((line, i) => {
        const p = prefix === '1. ' ? `${i + 1}. ` : prefix;
        return `${p}${line}`;
    }).join('\n');

    const newValue = value.slice(0, lineStart) + prefixed + value.slice(blockEnd);
    onChange(newValue);
    requestAnimationFrame(() => {
        textarea.focus();
        textarea.setSelectionRange(lineStart, lineStart + prefixed.length);
    });
}

/* ── component ── */

export default function MarkdownEditor({
    value,
    onChange,
    textareaRef: externalRef,
    enableImage,
    onSave,
    rows = 12,
    placeholder,
    className = '',
}: MarkdownEditorProps) {
    const internalRef = useRef<HTMLTextAreaElement>(null);
    const taRef = externalRef ?? internalRef;
    const fileRef = useRef<HTMLInputElement>(null);
    const composingRef = useRef(false);
    const [mode, setMode] = useState<ViewMode>('edit');

    /* ── image upload ── */
    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !taRef.current) return;
        const token = localStorage.getItem('token');
        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/api/portfolios/upload-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) throw new Error();
            const { url } = await res.json();
            const textarea = taRef.current;
            const start = textarea.selectionStart;
            const tag = `![image](${url})`;
            onChange(value.slice(0, start) + tag + value.slice(start));
            requestAnimationFrame(() => {
                textarea.focus();
                textarea.setSelectionRange(start + tag.length, start + tag.length);
            });
        } catch { /* ignore */ }
        if (fileRef.current) fileRef.current.value = '';
    };

    /* ── toolbar actions ── */
    const doBold = useCallback(() => { if (taRef.current) insertMarkdown(taRef.current, value, onChange, '**', '**', 'bold'); }, [value, onChange]);
    const doItalic = useCallback(() => { if (taRef.current) insertMarkdown(taRef.current, value, onChange, '*', '*', 'italic'); }, [value, onChange]);
    const doHeading = useCallback(() => { if (taRef.current) insertLinePrefix(taRef.current, value, onChange, '## '); }, [value, onChange]);
    const doLink = useCallback(() => {
        const ta = taRef.current;
        if (!ta) return;
        const start = ta.selectionStart;
        const end = ta.selectionEnd;
        const selected = value.slice(start, end) || 'text';
        const inserted = `[${selected}](url)`;
        onChange(value.slice(0, start) + inserted + value.slice(end));
        requestAnimationFrame(() => {
            ta.focus();
            const urlStart = start + selected.length + 3;
            ta.setSelectionRange(urlStart, urlStart + 3);
        });
    }, [value, onChange]);
    const doUL = useCallback(() => { if (taRef.current) insertLinePrefix(taRef.current, value, onChange, '- '); }, [value, onChange]);
    const doOL = useCallback(() => { if (taRef.current) insertLinePrefix(taRef.current, value, onChange, '1. '); }, [value, onChange]);

    /* ── keyboard handler ── */
    const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        const mod = e.metaKey || e.ctrlKey;
        const ta = taRef.current;
        if (!ta) return;

        // Cmd+S — save
        if (mod && e.key === 's') {
            e.preventDefault();
            onSave?.();
            return;
        }
        // Cmd+B — bold
        if (mod && e.key === 'b') {
            e.preventDefault();
            doBold();
            return;
        }
        // Cmd+I — italic
        if (mod && e.key === 'i') {
            e.preventDefault();
            doItalic();
            return;
        }

        // Enter — auto-continue lists (skip during IME composition)
        if (e.key === 'Enter' && !composingRef.current && !e.nativeEvent.isComposing) {
            const cursor = ta.selectionStart;
            const lineStart = value.lastIndexOf('\n', cursor - 1) + 1;
            const line = value.slice(lineStart, cursor);

            // Unordered list
            const ulMatch = line.match(/^(\s*)([-*+])\s/);
            if (ulMatch) {
                // If line is just the prefix with no content, remove it
                if (line.trim() === ulMatch[2]) {
                    e.preventDefault();
                    onChange(value.slice(0, lineStart) + value.slice(cursor));
                    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(lineStart, lineStart); });
                    return;
                }
                e.preventDefault();
                const prefix = `\n${ulMatch[1]}${ulMatch[2]} `;
                onChange(value.slice(0, cursor) + prefix + value.slice(cursor));
                requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(cursor + prefix.length, cursor + prefix.length); });
                return;
            }

            // Ordered list
            const olMatch = line.match(/^(\s*)(\d+)\.\s/);
            if (olMatch) {
                const num = parseInt(olMatch[2], 10);
                if (line.trim() === `${olMatch[2]}.`) {
                    e.preventDefault();
                    onChange(value.slice(0, lineStart) + value.slice(cursor));
                    requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(lineStart, lineStart); });
                    return;
                }
                e.preventDefault();
                const prefix = `\n${olMatch[1]}${num + 1}. `;
                onChange(value.slice(0, cursor) + prefix + value.slice(cursor));
                requestAnimationFrame(() => { ta.focus(); ta.setSelectionRange(cursor + prefix.length, cursor + prefix.length); });
                return;
            }
        }
    }, [value, onChange, onSave, doBold, doItalic]);

    const toolbarBtns: { icon: React.ReactNode; title: string; handler: () => void }[] = [
        { icon: <Heading2 size={16} />, title: 'Heading (H2)', handler: doHeading },
        { icon: <Bold size={16} />, title: 'Bold (⌘B)', handler: doBold },
        { icon: <Italic size={16} />, title: 'Italic (⌘I)', handler: doItalic },
        { icon: <Link size={16} />, title: 'Link', handler: doLink },
        { icon: <List size={16} />, title: 'Unordered List', handler: doUL },
        { icon: <ListOrdered size={16} />, title: 'Ordered List', handler: doOL },
    ];
    if (enableImage) {
        toolbarBtns.push({ icon: <ImageIcon size={16} />, title: 'Upload Image', handler: () => fileRef.current?.click() });
    }

    const modeBtns: { mode: ViewMode; icon: React.ReactNode; title: string }[] = [
        { mode: 'edit', icon: <PenLine size={14} />, title: '純編輯' },
        { mode: 'split', icon: <Columns2 size={14} />, title: '編輯 + 預覽' },
        { mode: 'preview', icon: <Eye size={14} />, title: '純預覽' },
    ];

    const textareaBase = "w-full bg-transparent border border-[#020202]/20 focus:border-[#020202] outline-none p-3 text-base font-light font-mono transition-colors placeholder:opacity-40 resize-none";

    return (
        <div className={`space-y-0 ${className}`}>
            {/* Toolbar */}
            <div className="flex items-center justify-between border border-[#020202]/20 border-b-0 px-2 py-1.5 bg-[#f3f3f3]">
                <div className="flex items-center gap-1">
                    {toolbarBtns.map((btn, i) => (
                        <button
                            key={i}
                            type="button"
                            title={btn.title}
                            onClick={btn.handler}
                            className="p-1.5 rounded hover:bg-[#020202]/10 transition-colors opacity-60 hover:opacity-100"
                        >
                            {btn.icon}
                        </button>
                    ))}
                </div>
                <div className="flex items-center gap-0.5 border border-[#020202]/15 rounded overflow-hidden">
                    {modeBtns.map(mb => (
                        <button
                            key={mb.mode}
                            type="button"
                            title={mb.title}
                            onClick={() => setMode(mb.mode)}
                            className={`p-1.5 transition-colors ${mode === mb.mode ? 'bg-[#020202] text-[#f3f3f3]' : 'opacity-50 hover:opacity-100'}`}
                        >
                            {mb.icon}
                        </button>
                    ))}
                </div>
            </div>

            {/* Editor / Preview */}
            {mode === 'edit' && (
                <textarea
                    ref={taRef}
                    value={value}
                    onChange={e => onChange(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onCompositionStart={() => { composingRef.current = true; }}
                    onCompositionEnd={() => { composingRef.current = false; }}
                    rows={rows}
                    placeholder={placeholder}
                    className={textareaBase}
                />
            )}

            {mode === 'preview' && (
                <div className="border border-[#020202]/20 p-4 min-h-[200px] prose prose-sm max-w-none
                    prose-headings:font-bold prose-headings:tracking-tight
                    prose-p:font-light prose-p:leading-relaxed prose-p:opacity-80
                    prose-a:text-[#020202] prose-a:underline prose-a:underline-offset-4
                    prose-img:rounded-none prose-img:my-4
                    prose-strong:font-semibold
                    prose-ul:font-light prose-ol:font-light">
                    {value ? <ReactMarkdown>{value}</ReactMarkdown> : <p className="opacity-30 italic">無內容</p>}
                </div>
            )}

            {mode === 'split' && (
                <div className="grid grid-cols-2 gap-0">
                    <textarea
                        ref={taRef}
                        value={value}
                        onChange={e => onChange(e.target.value)}
                        onKeyDown={handleKeyDown}
                        onCompositionStart={() => { composingRef.current = true; }}
                        onCompositionEnd={() => { composingRef.current = false; }}
                        rows={rows}
                        placeholder={placeholder}
                        className={`${textareaBase} border-r-0`}
                    />
                    <div className="border border-[#020202]/20 p-4 overflow-y-auto prose prose-sm max-w-none
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-p:font-light prose-p:leading-relaxed prose-p:opacity-80
                        prose-a:text-[#020202] prose-a:underline prose-a:underline-offset-4
                        prose-img:rounded-none prose-img:my-4
                        prose-strong:font-semibold
                        prose-ul:font-light prose-ol:font-light">
                        {value ? <ReactMarkdown>{value}</ReactMarkdown> : <p className="opacity-30 italic">無內容</p>}
                    </div>
                </div>
            )}

            {enableImage && (
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleImageUpload} className="hidden" />
            )}
        </div>
    );
}
