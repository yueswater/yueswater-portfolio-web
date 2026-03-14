import React, { useRef } from 'react';
import { Bold, Italic, Heading2, Link, List, ListOrdered, ImageIcon, Upload } from 'lucide-react';
import { API_BASE } from '../api';

interface MarkdownToolbarProps {
    textareaRef: React.RefObject<HTMLTextAreaElement | null>;
    value: string;
    onChange: (value: string) => void;
    enableImage?: boolean;
}

type Action = { icon: React.ReactNode; title: string; handler: () => void };

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
    const selected = value.slice(start, end) || placeholder;
    const before = value.slice(0, start);
    const after = value.slice(end);
    const inserted = `${prefix}${selected}${suffix}`;
    const newValue = `${before}${inserted}${after}`;
    onChange(newValue);

    requestAnimationFrame(() => {
        textarea.focus();
        const cursorStart = start + prefix.length;
        const cursorEnd = cursorStart + selected.length;
        textarea.setSelectionRange(cursorStart, cursorEnd);
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

export default function MarkdownToolbar({ textareaRef, value, onChange, enableImage }: MarkdownToolbarProps) {
    const fileRef = useRef<HTMLInputElement>(null);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !textareaRef.current) return;

        const token = localStorage.getItem('token');
        const fd = new FormData();
        fd.append('file', file);

        try {
            const res = await fetch(`${API_BASE}/api/portfolios/upload-image`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) throw new Error('Upload failed');
            const { url } = await res.json();

            const textarea = textareaRef.current;
            const start = textarea.selectionStart;
            const before = value.slice(0, start);
            const after = value.slice(start);
            const tag = `![image](${url})`;
            onChange(`${before}${tag}${after}`);

            requestAnimationFrame(() => {
                textarea.focus();
                textarea.setSelectionRange(start + tag.length, start + tag.length);
            });
        } catch {
            // silently fail
        }

        if (fileRef.current) fileRef.current.value = '';
    };

    const actions: Action[] = [
        {
            icon: <Heading2 size={16} />,
            title: 'Heading',
            handler: () => {
                const ta = textareaRef.current;
                if (!ta) return;
                insertLinePrefix(ta, value, onChange, '## ');
            },
        },
        {
            icon: <Bold size={16} />,
            title: 'Bold',
            handler: () => {
                const ta = textareaRef.current;
                if (!ta) return;
                insertMarkdown(ta, value, onChange, '**', '**', 'bold');
            },
        },
        {
            icon: <Italic size={16} />,
            title: 'Italic',
            handler: () => {
                const ta = textareaRef.current;
                if (!ta) return;
                insertMarkdown(ta, value, onChange, '*', '*', 'italic');
            },
        },
        {
            icon: <Link size={16} />,
            title: 'Link',
            handler: () => {
                const ta = textareaRef.current;
                if (!ta) return;
                const start = ta.selectionStart;
                const end = ta.selectionEnd;
                const selected = value.slice(start, end) || 'text';
                const before = value.slice(0, start);
                const after = value.slice(end);
                const inserted = `[${selected}](url)`;
                onChange(`${before}${inserted}${after}`);
                requestAnimationFrame(() => {
                    ta.focus();
                    const urlStart = start + selected.length + 3;
                    ta.setSelectionRange(urlStart, urlStart + 3);
                });
            },
        },
        {
            icon: <List size={16} />,
            title: 'Unordered List',
            handler: () => {
                const ta = textareaRef.current;
                if (!ta) return;
                insertLinePrefix(ta, value, onChange, '- ');
            },
        },
        {
            icon: <ListOrdered size={16} />,
            title: 'Ordered List',
            handler: () => {
                const ta = textareaRef.current;
                if (!ta) return;
                insertLinePrefix(ta, value, onChange, '1. ');
            },
        },
    ];

    if (enableImage) {
        actions.push({
            icon: <ImageIcon size={16} />,
            title: 'Upload Image',
            handler: () => fileRef.current?.click(),
        });
    }

    return (
        <div className="flex items-center gap-1 border border-[#020202]/20 rounded-none px-2 py-1.5 bg-[#f3f3f3]">
            {actions.map((action, i) => (
                <button
                    key={i}
                    type="button"
                    title={action.title}
                    onClick={action.handler}
                    className="p-1.5 rounded hover:bg-[#020202]/10 transition-colors opacity-60 hover:opacity-100"
                >
                    {action.icon}
                </button>
            ))}
            {enableImage && (
                <input
                    ref={fileRef}
                    type="file"
                    accept=".jpg,.jpeg,.png"
                    onChange={handleImageUpload}
                    className="hidden"
                />
            )}
        </div>
    );
}
