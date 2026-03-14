import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Send, ImageIcon, CheckCheck, X } from 'lucide-react';
import { API_BASE } from '../api';
import { useI18n } from '../i18n';

const WS_BASE = API_BASE.replace(/^http/, 'ws');

// ── Notification helpers ──

const ORIGINAL_TITLE = document.title;

function useNotification() {
    const flashTimer = useRef<ReturnType<typeof setInterval>>(undefined);
    const audioCtx = useRef<AudioContext | null>(null);

    // Request browser notification permission on mount
    useEffect(() => {
        if ('Notification' in window && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Restore title on focus
    useEffect(() => {
        const restore = () => {
            if (flashTimer.current) {
                clearInterval(flashTimer.current);
                flashTimer.current = undefined;
            }
            document.title = ORIGINAL_TITLE;
        };
        window.addEventListener('focus', restore);
        return () => {
            window.removeEventListener('focus', restore);
            restore();
        };
    }, []);

    const notify = useCallback((sender: string, preview: string) => {
        // 1) Tab title flash
        if (!document.hasFocus() && !flashTimer.current) {
            let on = false;
            flashTimer.current = setInterval(() => {
                document.title = (on = !on) ? `💬 ${sender}` : ORIGINAL_TITLE;
            }, 1000);
        }

        // 2) Sound — short beep via Web Audio API
        try {
            if (!audioCtx.current) audioCtx.current = new AudioContext();
            const ctx = audioCtx.current;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();
            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.frequency.value = 880;
            gain.gain.value = 0.15;
            osc.start();
            gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.3);
            osc.stop(ctx.currentTime + 0.3);
        } catch { /* AudioContext may fail in some contexts */ }

        // 3) Browser Notification
        if ('Notification' in window && Notification.permission === 'granted' && !document.hasFocus()) {
            new Notification(sender, {
                body: preview || '💬',
                icon: '/favicon.ico',
                tag: 'chat-msg',            // collapse duplicates
            });
        }
    }, []);

    return notify;
}

interface ChatMsg {
    id: string;
    room_id: string;
    sender_type: 'admin' | 'client';
    message_type: 'text' | 'image' | 'quote_offer';
    content: string | null;
    image_url: string | null;
    created_at: string;
    offer?: {
        id: string;
        message_id: string;
        amount: number;
        status: 'pending' | 'accepted' | 'rejected';
        reject_reason: string | null;
        responded_at: string | null;
    };
}

export default function ChatPage() {
    const { t } = useI18n();
    const [token, setToken] = useState(() => sessionStorage.getItem('chat_token') || '');
    const [roomId, setRoomId] = useState(() => sessionStorage.getItem('chat_room_id') || '');
    const [clientName, setClientName] = useState(() => sessionStorage.getItem('chat_client_name') || '');
    const [quoteNumber, setQuoteNumber] = useState(() => sessionStorage.getItem('chat_quote_number') || '');

    if (token && roomId) {
        return (
            <main className="px-6 md:px-12 lg:px-24 pt-28 pb-6 max-w-[1800px] mx-auto h-screen flex flex-col">
                <div className="flex items-center justify-between mb-4">
                    <div>
                        <h2 className="text-lg font-bold tracking-tight">{clientName}</h2>
                        <p className="text-xs font-mono opacity-50">{quoteNumber}</p>
                    </div>
                    <button
                        onClick={() => {
                            sessionStorage.removeItem('chat_token');
                            sessionStorage.removeItem('chat_room_id');
                            sessionStorage.removeItem('chat_client_name');
                            sessionStorage.removeItem('chat_quote_number');
                            setToken('');
                            setRoomId('');
                        }}
                        className="text-xs uppercase tracking-widest opacity-50 hover:opacity-100 transition-opacity"
                    >
                        {t('chat.leave')}
                    </button>
                </div>
                <ChatRoom token={token} roomId={roomId} senderType="client" onAuthFailed={() => {
                    sessionStorage.removeItem('chat_token');
                    sessionStorage.removeItem('chat_room_id');
                    sessionStorage.removeItem('chat_client_name');
                    sessionStorage.removeItem('chat_quote_number');
                    setToken(''); setRoomId('');
                }} />
            </main>
        );
    }

    return <AuthForm onAuth={(t, r, name, qn) => {
        sessionStorage.setItem('chat_token', t);
        sessionStorage.setItem('chat_room_id', r);
        sessionStorage.setItem('chat_client_name', name);
        sessionStorage.setItem('chat_quote_number', qn);
        setToken(t); setRoomId(r); setClientName(name); setQuoteNumber(qn);
    }} />;
}

// ── Auth Form ──

function AuthForm({ onAuth }: { onAuth: (token: string, roomId: string, name: string, qn: string) => void }) {
    const { t } = useI18n();
    const [quoteNumber, setQuoteNumber] = useState('');
    const [email, setEmail] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const res = await fetch(`${API_BASE}/api/chat/auth`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ quote_number: quoteNumber, email }),
            });
            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || t('chat.authError'));
            }
            const data = await res.json();
            onAuth(data.access_token, data.room_id, data.client_name, data.quote_number);
        } catch (err: any) {
            setError(err.message || t('chat.authError'));
        } finally {
            setLoading(false);
        }
    };

    const inputBase = "w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-3 text-lg font-light transition-colors placeholder:opacity-40";

    return (
        <main className="px-6 md:px-12 lg:px-24 pt-40 pb-24 max-w-[1800px] mx-auto">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}>
                <h1 className="text-5xl md:text-7xl lg:text-[9rem] font-black leading-[0.85] tracking-tighter mb-6 uppercase">
                    {t('chat.title')}
                </h1>
                <p className="text-xl md:text-2xl font-light max-w-2xl leading-relaxed opacity-80 mb-20">
                    {t('chat.subtitle')}
                </p>
            </motion.div>

            <form onSubmit={handleSubmit} className="max-w-md space-y-8">
                <input
                    value={quoteNumber}
                    onChange={e => setQuoteNumber(e.target.value)}
                    placeholder={t('chat.quoteNumber')}
                    required
                    className={inputBase}
                />
                <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder={t('chat.email')}
                    required
                    className={inputBase}
                />
                {error && <p className="text-red-600 font-medium text-sm">{error}</p>}
                <button
                    type="submit"
                    disabled={loading}
                    className="hover-fill-invert group flex items-center gap-3 bg-[#020202] text-[#f3f3f3] px-10 py-4 text-sm font-semibold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                    {loading ? t('chat.entering') : t('chat.enter')}
                    <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </form>
        </main>
    );
}

// ── Chat Room (shared between customer and admin) ──

export function ChatRoom({ token, roomId, senderType, onAuthFailed }: { token: string; roomId: string; senderType: 'admin' | 'client'; onAuthFailed?: () => void }) {
    const { t } = useI18n();
    const notify = useNotification();
    const [messages, setMessages] = useState<ChatMsg[]>([]);
    const [input, setInput] = useState('');
    const [typing, setTyping] = useState(false);
    const [peerRead, setPeerRead] = useState<string | null>(null);
    const wsRef = useRef<WebSocket | null>(null);
    const listRef = useRef<HTMLDivElement>(null);
    const typingTimeout = useRef<ReturnType<typeof setTimeout>>(undefined);
    const fileRef = useRef<HTMLInputElement>(null);
    const composingRef = useRef(false);
    const [rejectModal, setRejectModal] = useState<{ offerId: string; msgId: string } | null>(null);
    const [rejectReason, setRejectReason] = useState('');
    const [previewImg, setPreviewImg] = useState<string | null>(null);

    // Load history
    useEffect(() => {
        fetch(`${API_BASE}/api/chat/rooms/${roomId}/messages?token=${encodeURIComponent(token)}`)
            .then(r => r.json())
            .then(data => {
                setMessages(data);
                setTimeout(() => scrollBottom(), 50);
            })
            .catch(() => { });
    }, [roomId, token]);

    // WebSocket
    useEffect(() => {
        let cancelled = false;
        let delay = 1000;
        let reconnectTimer: ReturnType<typeof setTimeout>;
        let currentWs: WebSocket | null = null;

        function connect() {
            if (cancelled) return;
            const ws = new WebSocket(`${WS_BASE}/api/chat/ws/${roomId}?token=${encodeURIComponent(token)}`);
            currentWs = ws;
            wsRef.current = ws;

            ws.onopen = () => {
                delay = 1000;
                if (document.hasFocus()) ws.send(JSON.stringify({ type: 'read' }));
            };

            ws.onerror = () => { console.error('[ChatRoom] WebSocket error'); };

            ws.onmessage = (e) => {
                const data = JSON.parse(e.data);
                if (data.type === 'error' && data.code === 'auth_failed') {
                    cancelled = true;
                    onAuthFailed?.();
                    return;
                }
                if (data.type === 'message') {
                    const { type: _, ...msg } = data;
                    setMessages(prev => {
                        if (prev.some(m => m.id === msg.id)) return prev;
                        return [...prev, msg as ChatMsg];
                    });
                    setTimeout(() => scrollBottom(), 50);
                    // Auto mark-read if the message is from the peer and page is visible
                    if ((msg as ChatMsg).sender_type !== senderType && document.hasFocus()) {
                        ws.readyState === WebSocket.OPEN && ws.send(JSON.stringify({ type: 'read' }));
                    }
                    // Notify if peer message and page not focused
                    if ((msg as ChatMsg).sender_type !== senderType) {
                        const sender = senderType === 'client' ? 'Anthony' : (msg as ChatMsg).sender_type;
                        const preview = (msg as ChatMsg).content || ((msg as ChatMsg).image_url ? '📷' : '💬');
                        notify(sender, preview);
                    }
                } else if (data.type === 'typing') {
                    if (data.sender_type !== senderType) {
                        setTyping(true);
                        clearTimeout(typingTimeout.current);
                        typingTimeout.current = setTimeout(() => setTyping(false), 3000);
                    }
                } else if (data.type === 'read') {
                    if (data.reader_type !== senderType) {
                        setPeerRead(data.timestamp);
                    }
                } else if (data.type === 'offer_updated') {
                    setMessages(prev => prev.map(m =>
                        m.offer && m.offer.id === data.offer.id ? { ...m, offer: data.offer } : m
                    ));
                }
            };

            ws.onclose = (e) => {
                if (cancelled) return;
                // Don't reconnect on auth failures
                if (e.code >= 4000) {
                    onAuthFailed?.();
                    return;
                }
                reconnectTimer = setTimeout(() => {
                    delay = Math.min(delay * 2, 30000);
                    connect();
                }, delay);
            };
        }

        connect();
        return () => {
            cancelled = true;
            clearTimeout(reconnectTimer);
            currentWs?.close();
        };
    }, [roomId, token, senderType]);

    // Mark read on focus
    useEffect(() => {
        const markRead = () => {
            wsRef.current?.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify({ type: 'read' }));
        };
        markRead();
        window.addEventListener('focus', markRead);
        return () => window.removeEventListener('focus', markRead);
    }, [roomId]);

    const scrollBottom = () => {
        listRef.current?.scrollTo({ top: listRef.current.scrollHeight, behavior: 'smooth' });
    };

    const sendMessage = useCallback(() => {
        const text = input.trim();
        if (!text || !wsRef.current || wsRef.current.readyState !== WebSocket.OPEN) return;
        wsRef.current.send(JSON.stringify({ type: 'message', message_type: 'text', content: text }));
        setInput('');
    }, [input]);

    const sendTyping = useCallback(() => {
        wsRef.current?.readyState === WebSocket.OPEN && wsRef.current.send(JSON.stringify({ type: 'typing' }));
    }, []);

    const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        const ext = file.name.split('.').pop()?.toLowerCase();
        if (!ext || !['jpg', 'jpeg', 'png'].includes(ext)) return;
        if (file.size > 5 * 1024 * 1024) return;

        const fd = new FormData();
        fd.append('file', file);
        try {
            const res = await fetch(`${API_BASE}/api/chat/rooms/${roomId}/upload-image?token=${encodeURIComponent(token)}`, {
                method: 'POST',
                body: fd,
            });
            if (!res.ok) return;
            const { url } = await res.json();
            wsRef.current?.send(JSON.stringify({ type: 'message', message_type: 'image', image_url: url }));
        } catch { }
        if (fileRef.current) fileRef.current.value = '';
    };

    const respondOffer = async (offerId: string, status: 'accepted' | 'rejected', reason?: string) => {
        await fetch(`${API_BASE}/api/chat/offers/${offerId}/respond?token=${encodeURIComponent(token)}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ status, reject_reason: reason || null }),
        });
        setRejectModal(null);
        setRejectReason('');
    };

    const parseDate = (iso: string) => {
        // Backend stores UTC naive datetimes; tell browser it's UTC
        return new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
    };

    const formatTime = (iso: string) => {
        return parseDate(iso).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit', second: '2-digit' });
    };

    const formatDate = (iso: string) => {
        return parseDate(iso).toLocaleDateString(undefined, { year: 'numeric', month: '2-digit', day: '2-digit' });
    };

    // Group messages by date
    const groupedMessages: { date: string; msgs: ChatMsg[] }[] = [];
    let currentDate = '';
    for (const msg of messages) {
        const date = formatDate(msg.created_at);
        if (date !== currentDate) {
            currentDate = date;
            groupedMessages.push({ date, msgs: [] });
        }
        groupedMessages[groupedMessages.length - 1].msgs.push(msg);
    }

    return (
        <div className="flex-1 flex flex-col min-h-0">
            {/* Messages */}
            <div ref={listRef} className="flex-1 overflow-y-auto py-4 space-y-1">
                {groupedMessages.map(group => (
                    <div key={group.date}>
                        <div className="text-center my-4">
                            <span className="text-[10px] uppercase tracking-widest opacity-40 bg-[#f3f3f3] px-3 py-1">{group.date}</span>
                        </div>
                        {group.msgs.map(msg => {
                            const isOwn = msg.sender_type === senderType;
                            return (
                                <div key={msg.id} className={`flex mb-2 ${isOwn ? 'justify-end' : 'justify-start'}`}>
                                    <div className={`max-w-[75%] ${isOwn ? 'items-end' : 'items-start'} flex flex-col`}>
                                        {msg.message_type === 'text' && (
                                            <div className={`px-4 py-2.5 text-sm leading-relaxed select-text ${isOwn ? 'bg-[#020202] text-[#f3f3f3] rounded-2xl rounded-br-sm' : 'bg-white text-[#020202] rounded-2xl rounded-bl-sm shadow-sm'}`}>
                                                {msg.content}
                                            </div>
                                        )}
                                        {msg.message_type === 'image' && msg.image_url && (
                                            <button onClick={() => setPreviewImg(msg.image_url)}>
                                                <img
                                                    src={msg.image_url}
                                                    alt=""
                                                    className={`max-w-[280px] max-h-[200px] object-cover cursor-pointer ${isOwn ? 'rounded-2xl rounded-br-sm' : 'rounded-2xl rounded-bl-sm'}`}
                                                />
                                            </button>
                                        )}
                                        {msg.message_type === 'quote_offer' && msg.offer && (
                                            <div className={`border ${msg.offer.status === 'accepted' ? 'border-green-400 bg-green-50' : msg.offer.status === 'rejected' ? 'border-red-300 bg-red-50' : 'border-[#020202]/20 bg-white'} p-4 rounded-xl min-w-[220px]`}>
                                                <p className="text-[10px] uppercase tracking-widest opacity-50 mb-1">{t('chat.offer')}</p>
                                                <p className="text-2xl font-black tracking-tight">NT$ {msg.offer.amount.toLocaleString('zh-TW')}</p>
                                                {msg.offer.status === 'pending' && senderType === 'client' && (
                                                    <div className="flex gap-2 mt-3">
                                                        <button
                                                            onClick={() => respondOffer(msg.offer!.id, 'accepted')}
                                                            className="flex-1 bg-[#020202] text-[#f3f3f3] px-3 py-1.5 text-xs font-semibold uppercase tracking-widest"
                                                        >
                                                            {t('chat.accept')}
                                                        </button>
                                                        <button
                                                            onClick={() => setRejectModal({ offerId: msg.offer!.id, msgId: msg.id })}
                                                            className="flex-1 border border-[#020202]/20 px-3 py-1.5 text-xs font-semibold uppercase tracking-widest"
                                                        >
                                                            {t('chat.reject')}
                                                        </button>
                                                    </div>
                                                )}
                                                {msg.offer.status === 'pending' && senderType === 'admin' && (
                                                    <p className="text-xs mt-2 opacity-50">{t('chat.pending')}</p>
                                                )}
                                                {msg.offer.status === 'accepted' && (
                                                    <p className="text-xs mt-2 text-green-700 font-semibold">{t('chat.accepted')}</p>
                                                )}
                                                {msg.offer.status === 'rejected' && (
                                                    <div className="mt-2">
                                                        <p className="text-xs text-red-600 font-semibold">{t('chat.rejected')}</p>
                                                        {msg.offer.reject_reason && (
                                                            <p className="text-xs text-red-500 mt-1">{msg.offer.reject_reason}</p>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        <span className={`text-[10px] mt-1 opacity-30 ${isOwn ? 'text-right' : 'text-left'}`}>
                                            {formatTime(msg.created_at)}
                                        </span>
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                ))}
                {typing && (
                    <div className="flex justify-start mb-2">
                        <div className="bg-white rounded-2xl rounded-bl-sm px-4 py-3 shadow-sm">
                            <div className="flex gap-1">
                                <span className="w-1.5 h-1.5 bg-[#020202]/40 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                                <span className="w-1.5 h-1.5 bg-[#020202]/40 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                                <span className="w-1.5 h-1.5 bg-[#020202]/40 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
                            </div>
                        </div>
                    </div>
                )}
                {peerRead && messages.length > 0 && (
                    <div className="flex justify-end">
                        <span className="text-[10px] opacity-30 flex items-center gap-1">
                            <CheckCheck size={10} /> {t('chat.read')} {formatTime(peerRead)}
                        </span>
                    </div>
                )}
            </div>

            {/* Input */}
            <div className="border-t border-[#020202]/10 pt-3 pb-2 flex items-end gap-2">
                <input ref={fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={handleImageUpload} className="hidden" />
                <button onClick={() => fileRef.current?.click()} className="p-2 opacity-40 hover:opacity-100 transition-opacity shrink-0">
                    <ImageIcon size={20} />
                </button>
                <input
                    value={input}
                    onChange={e => { setInput(e.target.value); sendTyping(); }}
                    onCompositionStart={() => { composingRef.current = true; }}
                    onCompositionEnd={() => { composingRef.current = false; }}
                    onKeyDown={e => { if (e.key === 'Enter' && !composingRef.current && !e.nativeEvent.isComposing) { e.preventDefault(); sendMessage(); } }}
                    placeholder={t('chat.placeholder')}
                    className="flex-1 bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-2 text-sm font-light transition-colors placeholder:opacity-40"
                />
                <button onClick={sendMessage} className="p-2 opacity-60 hover:opacity-100 transition-opacity shrink-0">
                    <Send size={18} />
                </button>
            </div>

            {/* Reject Modal */}
            {rejectModal && (
                <div className="fixed inset-0 bg-[#020202]/50 z-50 flex items-center justify-center p-6">
                    <div className="bg-[#f3f3f3] p-6 w-full max-w-sm relative">
                        <button onClick={() => { setRejectModal(null); setRejectReason(''); }} className="absolute top-3 right-3 opacity-60 hover:opacity-100"><X size={18} /></button>
                        <h3 className="text-lg font-bold mb-4">{t('chat.reject')}</h3>
                        <textarea
                            value={rejectReason}
                            onChange={e => setRejectReason(e.target.value.slice(0, 100))}
                            placeholder={t('chat.rejectReason')}
                            rows={3}
                            className="w-full bg-transparent border border-[#020202]/20 focus:border-[#020202] outline-none p-3 text-sm mb-2 resize-none"
                        />
                        <p className="text-[10px] opacity-40 mb-4 text-right">{rejectReason.length}/100</p>
                        <button
                            onClick={() => respondOffer(rejectModal.offerId, 'rejected', rejectReason)}
                            className="w-full bg-[#020202] text-[#f3f3f3] py-2.5 text-sm font-semibold uppercase tracking-widest"
                        >
                            {t('chat.confirmReject')}
                        </button>
                    </div>
                </div>
            )}

            {/* Image Preview */}
            {previewImg && (
                <div className="fixed inset-0 bg-[#020202]/80 z-50 flex items-center justify-center p-6" onClick={() => setPreviewImg(null)}>
                    <img src={previewImg} alt="" className="max-w-full max-h-full object-contain" />
                </div>
            )}
        </div>
    );
}
