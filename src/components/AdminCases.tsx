import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Briefcase, CheckCircle, X, Lock } from 'lucide-react';
import { API_BASE } from '../api';
import { useToast } from './Toast';

interface Case {
    id: string;
    case_number: string;
    quote_id: string;
    client_name: string;
    client_email: string;
    status: string;
    closed_at: string | null;
    created_at: string;
    quote_number: string | null;
}

function authHeaders() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

export default function AdminCases() {
    const { toast } = useToast();
    const [cases, setCases] = useState<Case[]>([]);
    const [loading, setLoading] = useState(true);
    const [closingId, setClosingId] = useState<string | null>(null);
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const fetchCases = async () => {
        try {
            const res = await fetch(`${API_BASE}/api/cases`, { headers: authHeaders() });
            if (res.ok) setCases(await res.json());
        } catch { }
        setLoading(false);
    };

    useEffect(() => { fetchCases(); }, []);

    const handleClose = async () => {
        if (!closingId || !password) return;
        setError('');
        try {
            const res = await fetch(`${API_BASE}/api/cases/${closingId}/close`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ password }),
            });
            if (res.status === 403) { setError('密碼錯誤'); return; }
            if (!res.ok) { setError('操作失敗'); return; }
            toast('案件已結案');
            setClosingId(null);
            setPassword('');
            fetchCases();
        } catch {
            setError('操作失敗');
        }
    };

    const parseDate = (iso: string) => {
        const d = new Date(iso.endsWith('Z') || iso.includes('+') ? iso : iso + 'Z');
        return d.toLocaleDateString('zh-TW');
    };

    if (loading) return <div className="text-center py-20 opacity-60">載入中...</div>;

    if (cases.length === 0) {
        return (
            <div className="text-center py-20 opacity-60 flex flex-col items-center gap-4">
                <Briefcase size={48} className="opacity-30" />
                <p>尚無案件</p>
            </div>
        );
    }

    return (
        <>
            {/* Mobile Cards */}
            <div className="md:hidden space-y-3">
                {cases.map(c => (
                    <div key={c.id} className="border border-[#020202]/10 p-4 hover:bg-[#020202]/[0.02] transition-colors">
                        <div className="flex justify-between items-start">
                            <div className="min-w-0 flex-1">
                                <p className="font-mono font-semibold text-sm">{c.case_number}</p>
                                <p className="text-xs font-mono opacity-40 mt-0.5">{c.quote_number || '—'}</p>
                            </div>
                            <span className={`text-xs font-semibold uppercase tracking-widest px-2 py-1 shrink-0 ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-[#020202]/10 text-[#020202]/50'}`}>
                                {c.status === 'active' ? '進行中' : '已結案'}
                            </span>
                        </div>
                        <p className="font-medium mt-2">{c.client_name}</p>
                        <p className="text-sm opacity-50 truncate">{c.client_email}</p>
                        <div className="flex justify-between items-center mt-3">
                            <span className="text-xs opacity-40">{parseDate(c.created_at)}</span>
                            {c.status === 'active' && (
                                <button
                                    onClick={() => { setClosingId(c.id); setPassword(''); setError(''); }}
                                    className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                                >
                                    <CheckCircle size={14} /> 結案
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left">
                    <thead>
                        <tr className="border-b border-[#020202]/20 text-xs uppercase tracking-widest opacity-50">
                            <th className="py-3 pr-4">案件編號</th>
                            <th className="py-3 pr-4">報價編號</th>
                            <th className="py-3 pr-4">客戶</th>
                            <th className="py-3 pr-4">信箱</th>
                            <th className="py-3 pr-4">狀態</th>
                            <th className="py-3 pr-4">成立時間</th>
                            <th className="py-3">操作</th>
                        </tr>
                    </thead>
                    <tbody>
                        {cases.map(c => (
                            <tr key={c.id} className="border-b border-[#020202]/10 hover:bg-[#020202]/5 transition-colors">
                                <td className="py-4 pr-4 text-sm font-mono font-semibold">{c.case_number}</td>
                                <td className="py-4 pr-4 text-sm font-mono opacity-60">{c.quote_number || '—'}</td>
                                <td className="py-4 pr-4 font-medium">{c.client_name}</td>
                                <td className="py-4 pr-4 text-sm opacity-60">{c.client_email}</td>
                                <td className="py-4 pr-4">
                                    <span className={`text-xs font-semibold uppercase tracking-widest px-2 py-1 ${c.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-[#020202]/10 text-[#020202]/50'}`}>
                                        {c.status === 'active' ? '進行中' : '已結案'}
                                    </span>
                                </td>
                                <td className="py-4 pr-4 text-sm opacity-60">{parseDate(c.created_at)}</td>
                                <td className="py-4">
                                    {c.status === 'active' && (
                                        <button
                                            onClick={() => { setClosingId(c.id); setPassword(''); setError(''); }}
                                            className="flex items-center gap-1 text-xs font-semibold uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity"
                                        >
                                            <CheckCircle size={14} /> 結案
                                        </button>
                                    )}
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* Close Case Modal */}
            {closingId && (
                <div className="fixed inset-0 bg-[#020202]/50 z-50 flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#f3f3f3] p-6 w-full max-w-sm relative">
                        <button onClick={() => setClosingId(null)} className="absolute top-3 right-3 opacity-60 hover:opacity-100"><X size={18} /></button>
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Lock size={18} /> 確認結案</h3>
                        <p className="text-sm opacity-60 mb-4">請輸入密碼以確認結案操作</p>
                        <input
                            type="password"
                            value={password}
                            onChange={e => setPassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleClose()}
                            placeholder="輸入密碼"
                            className="w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-2 text-base mb-2"
                            autoFocus
                        />
                        {error && <p className="text-red-600 text-xs mb-2">{error}</p>}
                        <button
                            onClick={handleClose}
                            disabled={!password}
                            className="w-full bg-[#020202] text-[#f3f3f3] py-2.5 text-sm font-semibold uppercase tracking-widest mt-4 disabled:opacity-30 hover:bg-[#333] transition-colors"
                        >
                            確認結案
                        </button>
                    </motion.div>
                </div>
            )}
        </>
    );
}
