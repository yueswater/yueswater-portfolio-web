import React, { useEffect, useState, useRef } from 'react';
import { Send, ImageIcon, DollarSign, X, MessageSquare, Briefcase, ArrowLeft } from 'lucide-react';
import { API_BASE } from '../api';
import { ChatRoom as ChatRoomUI } from '../pages/ChatPage';
import { useToast } from './Toast';

interface Room {
    id: string;
    quote_id: string;
    quote_number: string;
    client_name: string;
    client_email: string;
    admin_last_read_at: string | null;
    client_last_read_at: string | null;
    created_at: string;
    last_message: {
        content: string | null;
        message_type: string;
        sender_type: string;
        created_at: string;
    } | null;
    unread_count: number;
}

function authHeaders() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function AdminChat() {
    const { toast } = useToast();
    const [rooms, setRooms] = useState<Room[]>([]);
    const [activeRoom, setActiveRoom] = useState<string | null>(null);
    const [loading, setLoading] = useState(true);
    const [offerModal, setOfferModal] = useState(false);
    const [offerAmount, setOfferAmount] = useState('');
    const [caseCreating, setCaseCreating] = useState(false);
    const [caseQuoteIds, setCaseQuoteIds] = useState<Set<string>>(new Set());

    const token = localStorage.getItem('token') || '';

    const fetchRooms = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/chat/rooms`, { headers: authHeaders() });
            if (res.ok) setRooms(await res.json());
        } catch { }
        setLoading(false);
    };

    const fetchCaseQuoteIds = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/cases`, { headers: authHeaders() });
            if (res.ok) {
                const cases: { quote_id: string }[] = await res.json();
                setCaseQuoteIds(new Set(cases.map(c => c.quote_id)));
            }
        } catch { }
    };

    useEffect(() => {
        fetchRooms();
        fetchCaseQuoteIds();
        const interval = setInterval(fetchRooms, 5000);
        return () => clearInterval(interval);
    }, []);

    const sendOffer = async () => {
        const amount = parseFloat(offerAmount);
        if (!amount || !activeRoom) return;
        await fetch(`${API_BASE}/api/chat/rooms/${activeRoom}/offer`, {
            method: 'POST',
            headers: authHeaders(),
            body: JSON.stringify({ amount }),
        });
        setOfferModal(false);
        setOfferAmount('');
    };

    const activeRoomData = rooms.find(r => r.id === activeRoom);

    const handleCreateCase = async () => {
        if (!activeRoomData) return;
        setCaseCreating(true);
        try {
            const res = await fetch(`${API_BASE}/api/cases`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ quote_id: activeRoomData.quote_id }),
            });
            if (res.status === 400) {
                const data = await res.json();
                toast(data.detail || '此報價已成立案件', 'error');
                return;
            }
            if (!res.ok) { toast('操作失敗', 'error'); return; }
            toast('案件已成立');
            setCaseQuoteIds(prev => new Set(prev).add(activeRoomData.quote_id));
        } catch {
            toast('操作失敗', 'error');
        } finally {
            setCaseCreating(false);
        }
    };

    const parseDate = (iso: string) => new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');

    const formatTime = (iso: string) => {
        const d = parseDate(iso);
        const now = new Date();
        if (d.toDateString() === now.toDateString()) {
            return d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
        }
        return d.toLocaleDateString(undefined, { month: '2-digit', day: '2-digit' });
    };

    const getPreview = (room: Room): string => {
        if (!room.last_message) return '尚無訊息';
        if (room.last_message.message_type === 'image') return '📷 圖片';
        if (room.last_message.message_type === 'quote_offer') return '💰 報價';
        return room.last_message.content || '';
    };

    if (loading) {
        return <div className="text-center py-20 opacity-60">載入中...</div>;
    }

    if (rooms.length === 0) {
        return (
            <div className="text-center py-20 opacity-60 flex flex-col items-center gap-4">
                <MessageSquare size={48} className="opacity-30" />
                <p>尚無聊天室</p>
            </div>
        );
    }

    return (
        <div className="flex border border-[#020202]/10 h-[calc(100vh-280px)] sm:h-[calc(100vh-320px)] min-h-[400px] sm:min-h-[500px]">
            {/* Room List */}
            <div className={`w-full md:w-80 border-r border-[#020202]/10 overflow-y-auto md:shrink-0 ${activeRoom ? 'hidden md:block' : ''}`}>
                {rooms.map(room => (
                    <button
                        key={room.id}
                        onClick={() => setActiveRoom(room.id)}
                        className={`w-full text-left p-4 border-b border-[#020202]/5 hover:bg-[#020202]/5 transition-colors ${activeRoom === room.id ? 'bg-[#020202]/5' : ''}`}
                    >
                        <div className="flex items-start justify-between">
                            <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                    <span className="font-semibold text-sm truncate">{room.client_name}</span>
                                    {room.unread_count > 0 && (
                                        <span className="bg-[#020202] text-[#f3f3f3] text-[10px] font-bold px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
                                            {room.unread_count}
                                        </span>
                                    )}
                                </div>
                                <p className="text-[10px] font-mono opacity-40 mt-0.5">{room.quote_number}</p>
                                <p className="text-xs opacity-50 mt-1 truncate">{getPreview(room)}</p>
                            </div>
                            {room.last_message && (
                                <span className="text-[10px] opacity-30 shrink-0 ml-2">{formatTime(room.last_message.created_at)}</span>
                            )}
                        </div>
                    </button>
                ))}
            </div>

            {/* Chat Panel */}
            <div className={`flex-1 flex flex-col min-w-0 ${!activeRoom ? 'hidden md:flex' : ''}`}>
                {activeRoom && activeRoomData ? (
                    <>
                        {/* Header */}
                        <div className="p-3 sm:p-4 border-b border-[#020202]/10 flex items-center justify-between shrink-0 gap-2">
                            <div className="flex items-center gap-3 min-w-0">
                                <button onClick={() => setActiveRoom(null)} className="md:hidden shrink-0 opacity-60 hover:opacity-100 transition-opacity"><ArrowLeft size={20} /></button>
                                <div className="min-w-0">
                                    <h3 className="font-bold text-sm truncate">{activeRoomData.client_name}</h3>
                                    <p className="text-[10px] font-mono opacity-40 truncate">{activeRoomData.quote_number} · {activeRoomData.client_email}</p>
                                </div>
                            </div>
                            <div className="flex items-center gap-2 shrink-0">
                                <button
                                    onClick={handleCreateCase}
                                    disabled={caseCreating || caseQuoteIds.has(activeRoomData.quote_id)}
                                    className="hidden sm:flex items-center gap-1.5 border border-[#020202]/20 text-[#020202] px-4 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-[#020202]/5 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Briefcase size={14} /> {caseQuoteIds.has(activeRoomData.quote_id) ? '已成立案件' : '成立案件'}
                                </button>
                                <button
                                    onClick={handleCreateCase}
                                    disabled={caseCreating || caseQuoteIds.has(activeRoomData.quote_id)}
                                    title={caseQuoteIds.has(activeRoomData.quote_id) ? '已成立案件' : '成立案件'}
                                    className="sm:hidden p-2 border border-[#020202]/20 text-[#020202] disabled:opacity-30 disabled:cursor-not-allowed"
                                >
                                    <Briefcase size={16} />
                                </button>
                                <button
                                    onClick={() => setOfferModal(true)}
                                    className="hidden sm:flex items-center gap-1.5 bg-[#020202] text-[#f3f3f3] px-4 py-2 text-xs font-semibold uppercase tracking-widest hover:bg-[#333] transition-colors"
                                >
                                    <DollarSign size={14} /> 報價
                                </button>
                                <button
                                    onClick={() => setOfferModal(true)}
                                    className="sm:hidden p-2 bg-[#020202] text-[#f3f3f3]"
                                >
                                    <DollarSign size={16} />
                                </button>
                            </div>
                        </div>
                        {/* Chat */}
                        <div className="flex-1 px-4 min-h-0 flex flex-col">
                            <ChatRoomUI token={token} roomId={activeRoom} senderType="admin" />
                        </div>
                    </>
                ) : (
                    <div className="flex-1 flex items-center justify-center opacity-30">
                        <div className="text-center">
                            <MessageSquare size={48} className="mx-auto mb-4 opacity-50" />
                            <p className="text-sm">選擇一個聊天室開始對話</p>
                        </div>
                    </div>
                )}
            </div>

            {/* Offer Modal */}
            {offerModal && (
                <div className="fixed inset-0 bg-[#020202]/50 z-50 flex items-center justify-center p-6">
                    <div className="bg-[#f3f3f3] p-6 w-full max-w-sm relative">
                        <button onClick={() => setOfferModal(false)} className="absolute top-3 right-3 opacity-60 hover:opacity-100"><X size={18} /></button>
                        <h3 className="text-lg font-bold mb-4">發送報價</h3>
                        <div className="flex items-center gap-2 mb-6">
                            <span className="text-sm font-medium opacity-60">NT$</span>
                            <input
                                type="number"
                                min="0"
                                value={offerAmount}
                                onChange={e => setOfferAmount(e.target.value)}
                                placeholder="輸入金額"
                                className="flex-1 bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-2 text-2xl font-bold tracking-tight"
                                autoFocus
                            />
                        </div>
                        <button
                            onClick={sendOffer}
                            disabled={!offerAmount || parseFloat(offerAmount) <= 0}
                            className="w-full bg-[#020202] text-[#f3f3f3] py-2.5 text-sm font-semibold uppercase tracking-widest disabled:opacity-30"
                        >
                            發送報價
                        </button>
                    </div>
                </div>
            )}
        </div>
    );
}
