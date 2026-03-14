import React, { useEffect, useState, useRef, useCallback } from 'react';
import { motion } from 'motion/react';
import { Plus, Pencil, Trash2, LogOut, X, Upload, ImageIcon, Lock, Briefcase, Search } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import TagSelector from '../components/TagSelector';
import CategorySelector from '../components/CategorySelector';
import MarkdownEditor from '../components/MarkdownEditor';
import AdminChat from '../components/AdminChat';
import AdminCases from '../components/AdminCases';
import { useToast } from '../components/Toast';

const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB
const ACCEPTED_TYPES = ['image/png', 'image/jpeg'];

type Tab = 'portfolios' | 'services' | 'quotes' | 'cases' | 'about' | 'chat';

function authHeaders() {
    const token = localStorage.getItem('token');
    return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

// --- Image Upload Hook ---
function useImageUpload(endpoint: string, initialUrl: string) {
    const [imageUrl, setImageUrl] = useState(initialUrl);
    const [uploading, setUploading] = useState(false);
    const [error, setError] = useState('');
    const fileRef = useRef<HTMLInputElement>(null);

    const handleFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;
        setError('');
        if (!ACCEPTED_TYPES.includes(file.type)) { setError('僅支援 JPG / PNG 格式'); return; }
        if (file.size > MAX_FILE_SIZE) { setError('圖片大小不得超過 5 MB'); return; }

        setUploading(true);
        try {
            const token = localStorage.getItem('token');
            const fd = new FormData();
            fd.append('file', file);
            const res = await fetch(`${API_BASE}${endpoint}`, {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
                body: fd,
            });
            if (!res.ok) throw new Error((await res.json()).detail || '上傳失敗');
            const { url } = await res.json();
            setImageUrl(url);
        } catch (err: any) {
            setError(err.message || '上傳失敗');
        } finally {
            setUploading(false);
        }
    };

    return { imageUrl, setImageUrl, uploading, error, fileRef, handleFile };
}

// --- Portfolio Form ---
function PortfolioForm({ item, onClose, onSaved }: { item?: any; onClose: () => void; onSaved: () => void }) {
    const { toast } = useToast();
    const [form, setForm] = useState({
        name_zh: item?.name_zh || '',
        name_en: item?.name_en || '',
        description: item?.description || '',
    });
    const [tags, setTags] = useState<string[]>(item?.tags || []);
    const img = useImageUpload('/api/portfolios/upload-image', item?.image || '');

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!img.imageUrl) return;
        const payload = { ...form, image: img.imageUrl, tags };
        const url = item ? `${API_BASE}/api/portfolios/${item.id}` : `${API_BASE}/api/portfolios`;
        const res = await fetch(url, { method: item ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
        if (res.ok) toast(item ? '作品集已更新' : '作品集已新增');
        else toast('儲存失敗', 'error');
        onSaved();
    };

    const inputBase = "w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-2 text-base font-light transition-colors placeholder:opacity-40";
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));

    return (
        <div className="fixed inset-0 bg-[#020202]/50 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#f3f3f3] w-full max-w-lg p-5 sm:p-8 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 opacity-60 hover:opacity-100"><X size={20} /></button>
                <h3 className="text-xl sm:text-2xl font-bold mb-6">{item ? '編輯作品集' : '新增作品集'}</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <input value={form.name_zh} onChange={set('name_zh')} placeholder="中文名稱" required className={inputBase} />
                    <input value={form.name_en} onChange={set('name_en')} placeholder="英文名稱" required className={inputBase} />

                    {/* Image Upload */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest opacity-50 mb-2">作品圖片（JPG / PNG，最大 5 MB）</label>
                        <input ref={img.fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={img.handleFile} className="hidden" />
                        {img.imageUrl ? (
                            <div className="relative group">
                                <img src={img.imageUrl} alt="preview" className="w-full h-48 object-cover" />
                                <button type="button" onClick={() => img.fileRef.current?.click()} className="absolute inset-0 bg-[#020202]/0 group-hover:bg-[#020202]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <Upload size={24} className="text-[#f3f3f3]" />
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => img.fileRef.current?.click()} className="w-full h-48 border-2 border-dashed border-[#020202]/20 flex flex-col items-center justify-center gap-2 hover:border-[#020202]/50 transition-colors">
                                {img.uploading ? <span className="text-sm opacity-60">上傳中...</span> : <><ImageIcon size={32} className="opacity-30" /><span className="text-sm opacity-40">點擊上傳圖片</span></>}
                            </button>
                        )}
                        {img.error && <p className="text-red-600 text-xs mt-1">{img.error}</p>}
                    </div>

                    <textarea value={form.description} onChange={set('description')} placeholder="作品敘述" required rows={3} className={`${inputBase} resize-none`} />

                    <TagSelector selected={tags} onChange={setTags} max={5} />

                    <button type="submit" disabled={!img.imageUrl || img.uploading} className="w-full bg-[#020202] text-[#f3f3f3] py-3 text-sm font-semibold uppercase tracking-widest hover:bg-[#333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        {item ? '更新' : '新增'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

// --- Service Form ---
function ServiceForm({ item, onClose, onSaved }: { item?: any; onClose: () => void; onSaved: () => void }) {
    const { toast } = useToast();
    const [form, setForm] = useState({
        name: item?.name || '',
        description: item?.description || '',
        price: item?.price != null ? String(item.price) : '',
    });
    const [category, setCategory] = useState(item?.category || '');
    const img = useImageUpload('/api/services/upload-image', item?.thumbnail || '');
    const descRef = useRef<HTMLTextAreaElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!img.imageUrl || !category.trim()) return;
        const payload = { ...form, category, thumbnail: img.imageUrl, price: form.price ? parseFloat(form.price) : null };
        const url = item ? `${API_BASE}/api/services/${item.id}` : `${API_BASE}/api/services`;
        const res = await fetch(url, { method: item ? 'PUT' : 'POST', headers: authHeaders(), body: JSON.stringify(payload) });
        if (res.ok) toast(item ? '服務已更新' : '服務已新增');
        else toast('儲存失敗', 'error');
        onSaved();
    };

    const inputBase = "w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-2 text-base font-light transition-colors placeholder:opacity-40";
    const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setForm(p => ({ ...p, [k]: e.target.value }));
    const formatMoney = (v: string) => { const n = v.replace(/[^\d]/g, ''); return n ? Number(n).toLocaleString('en-US') : ''; };
    const setPrice = (e: React.ChangeEvent<HTMLInputElement>) => setForm(p => ({ ...p, price: e.target.value.replace(/[^\d]/g, '') }));

    return (
        <div className="fixed inset-0 bg-[#020202]/50 z-50 flex items-center justify-center p-6">
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#f3f3f3] w-full max-w-lg p-5 sm:p-8 relative max-h-[90vh] overflow-y-auto">
                <button onClick={onClose} className="absolute top-4 right-4 opacity-60 hover:opacity-100"><X size={20} /></button>
                <h3 className="text-xl sm:text-2xl font-bold mb-6">{item ? '編輯服務' : '新增服務'}</h3>
                <form onSubmit={handleSubmit} className="space-y-5">
                    <input value={form.name} onChange={set('name')} placeholder="服務名稱" required className={inputBase} />

                    <CategorySelector value={category} onChange={setCategory} />

                    {/* Thumbnail Upload */}
                    <div>
                        <label className="block text-xs uppercase tracking-widest opacity-50 mb-2">服務縮圖（JPG / PNG，最大 5 MB）</label>
                        <input ref={img.fileRef} type="file" accept=".jpg,.jpeg,.png" onChange={img.handleFile} className="hidden" />
                        {img.imageUrl ? (
                            <div className="relative group">
                                <img src={img.imageUrl} alt="preview" className="w-full h-48 object-cover" />
                                <button type="button" onClick={() => img.fileRef.current?.click()} className="absolute inset-0 bg-[#020202]/0 group-hover:bg-[#020202]/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                                    <Upload size={24} className="text-[#f3f3f3]" />
                                </button>
                            </div>
                        ) : (
                            <button type="button" onClick={() => img.fileRef.current?.click()} className="w-full h-48 border-2 border-dashed border-[#020202]/20 flex flex-col items-center justify-center gap-2 hover:border-[#020202]/50 transition-colors">
                                {img.uploading ? <span className="text-sm opacity-60">上傳中...</span> : <><ImageIcon size={32} className="opacity-30" /><span className="text-sm opacity-40">點擊上傳縮圖</span></>}
                            </button>
                        )}
                        {img.error && <p className="text-red-600 text-xs mt-1">{img.error}</p>}
                    </div>

                    <div>
                        <MarkdownEditor textareaRef={descRef} value={form.description} onChange={v => setForm(p => ({ ...p, description: v }))} rows={4} placeholder="服務描述（支援 Markdown）" />
                    </div>
                    <input value={formatMoney(form.price)} onChange={setPrice} placeholder="價格（空白為議價）" type="text" inputMode="numeric" className={inputBase} />
                    <button type="submit" disabled={!img.imageUrl || img.uploading || !category.trim()} className="w-full bg-[#020202] text-[#f3f3f3] py-3 text-sm font-semibold uppercase tracking-widest hover:bg-[#333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed">
                        {item ? '更新' : '新增'}
                    </button>
                </form>
            </motion.div>
        </div>
    );
}

// --- About Editor ---
function AboutEditor() {
    const { toast } = useToast();
    const [contentZh, setContentZh] = useState('');
    const [contentEn, setContentEn] = useState('');
    const [loaded, setLoaded] = useState(false);
    const [saving, setSaving] = useState(false);
    const [lastSaved, setLastSaved] = useState<Date | null>(null);
    const zhRef = useRef<HTMLTextAreaElement>(null);
    const enRef = useRef<HTMLTextAreaElement>(null);
    const dirtyRef = useRef(false);

    // Load content
    useEffect(() => {
        fetch(`${API_BASE}/api/about`)
            .then(r => r.json())
            .then(data => { setContentZh(data.content_zh); setContentEn(data.content_en); setLoaded(true); })
            .catch(() => setLoaded(true));
    }, []);

    // Save function
    const save = useCallback(async () => {
        if (!dirtyRef.current) return;
        setSaving(true);
        try {
            await fetch(`${API_BASE}/api/about`, {
                method: 'PUT',
                headers: authHeaders(),
                body: JSON.stringify({ content_zh: contentZh, content_en: contentEn }),
            });
            dirtyRef.current = false;
            setLastSaved(new Date());
            toast('已儲存');
        } catch {
            toast('儲存失敗', 'error');
        }
        setSaving(false);
    }, [contentZh, contentEn]);

    // Auto-save every 30 seconds
    useEffect(() => {
        const timer = setInterval(() => { save(); }, 30_000);
        return () => clearInterval(timer);
    }, [save]);

    // Mark dirty on change
    const handleZh = (v: string) => { setContentZh(v); dirtyRef.current = true; };
    const handleEn = (v: string) => { setContentEn(v); dirtyRef.current = true; };

    if (!loaded) return <div className="text-center py-20 opacity-60">載入中...</div>;

    const inputBase = "w-full bg-transparent border border-[#020202]/20 focus:border-[#020202] outline-none p-3 text-base font-light font-mono transition-colors placeholder:opacity-40 resize-none";

    return (
        <div className="space-y-10">
            <div className="flex items-center justify-between">
                <p className="text-xs uppercase tracking-widest opacity-50">
                    {saving ? '儲存中...' : lastSaved ? `上次儲存 ${lastSaved.toLocaleTimeString('zh-TW')}` : '每 30 秒自動儲存'}
                </p>
                <button
                    type="button"
                    onClick={save}
                    className="bg-[#020202] text-[#f3f3f3] px-6 py-2 text-sm font-semibold uppercase tracking-widest hover:bg-[#333] transition-colors"
                >
                    立即儲存
                </button>
            </div>

            {/* Chinese */}
            <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest opacity-50">繁體中文（Markdown）</label>
                <MarkdownEditor textareaRef={zhRef} value={contentZh} onChange={handleZh} enableImage onSave={save} rows={16} placeholder="以 Markdown 撰寫關於我的內容..." />
            </div>

            {/* English */}
            <div className="space-y-2">
                <label className="block text-xs uppercase tracking-widest opacity-50">English（Markdown）</label>
                <MarkdownEditor textareaRef={enRef} value={contentEn} onChange={handleEn} enableImage onSave={save} rows={16} placeholder="Write your about me content in Markdown..." />
            </div>
        </div>
    );
}

export default function AdminPage() {
    const navigate = useNavigate();
    const { toast } = useToast();
    const [tab, setTab] = useState<Tab>('portfolios');
    const [data, setData] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [editing, setEditing] = useState<any | null>(null);
    const [creating, setCreating] = useState(false);
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null);
    const [deletePassword, setDeletePassword] = useState('');
    const [deleteError, setDeleteError] = useState('');
    const [caseCreating, setCaseCreating] = useState(false);
    const [search, setSearch] = useState('');

    const fetchData = async () => {
        if (tab === 'about' || tab === 'chat' || tab === 'cases') { setLoading(false); return; }
        setLoading(true);
        try {
            const headers = tab === 'quotes' ? authHeaders() : {};
            const res = await fetch(`${API_BASE}/api/${tab}`, { headers });
            if (res.status === 401) { localStorage.removeItem('token'); navigate('/login'); return; }
            setData(await res.json());
        } catch { setData([]); }
        setLoading(false);
    };

    useEffect(() => {
        const token = localStorage.getItem('token');
        if (!token) { navigate('/login'); return; }
        // Verify token
        fetch(`${API_BASE}/api/auth/me`, { headers: { Authorization: `Bearer ${token}` } })
            .then(r => { if (!r.ok) throw new Error(); })
            .catch(() => { localStorage.removeItem('token'); navigate('/login'); });
    }, [navigate]);

    useEffect(() => { fetchData(); setSearch(''); }, [tab]);

    const fuzzy = (text: string) => text.toLowerCase().includes(search.toLowerCase().trim());
    const filteredData = search.trim()
        ? data.filter(item => {
            if (tab === 'portfolios') return fuzzy(item.name_zh) || fuzzy(item.name_en) || (item.tags || []).some((t: string) => fuzzy(t));
            if (tab === 'services') return fuzzy(item.name) || fuzzy(item.category) || (item.price != null && fuzzy(String(item.price)));
            if (tab === 'quotes') return fuzzy(item.quote_number) || fuzzy(item.client_name) || fuzzy(item.client_email) || fuzzy(item.expected_completion);
            return true;
        })
        : data;

    const handleDelete = async (id: string) => {
        if (tab === 'quotes') {
            setDeleteTarget(id);
            setDeletePassword('');
            setDeleteError('');
            return;
        }
        if (!confirm('確定要刪除嗎？')) return;
        await fetch(`${API_BASE}/api/${tab}/${id}`, { method: 'DELETE', headers: authHeaders() });
        fetchData();
    };

    const handleQuoteDelete = async () => {
        if (!deleteTarget || !deletePassword) return;
        setDeleteError('');
        try {
            const res = await fetch(`${API_BASE}/api/quotes/${deleteTarget}/delete`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ password: deletePassword }),
            });
            if (res.status === 403) { setDeleteError('密碼錯誤'); return; }
            if (!res.ok) { setDeleteError('操作失敗'); return; }
            toast('已刪除');
            setDeleteTarget(null);
            setDeletePassword('');
            fetchData();
        } catch {
            setDeleteError('操作失敗');
        }
    };

    const handleCreateCase = async (quoteId: string) => {
        setCaseCreating(true);
        try {
            const res = await fetch(`${API_BASE}/api/cases`, {
                method: 'POST',
                headers: authHeaders(),
                body: JSON.stringify({ quote_id: quoteId }),
            });
            if (res.status === 400) {
                const data = await res.json();
                toast(data.detail || '此報價已成立案件', 'error');
                return;
            }
            if (!res.ok) { toast('操作失敗', 'error'); return; }
            toast('案件已成立');
        } catch {
            toast('操作失敗', 'error');
        } finally {
            setCaseCreating(false);
        }
    };

    const handleSaved = () => {
        setCreating(false);
        setEditing(null);
        fetchData();
    };

    const logout = () => {
        localStorage.removeItem('token');
        navigate('/login');
    };

    const tabs: { key: Tab; label: string }[] = [
        { key: 'portfolios', label: '作品集' },
        { key: 'services', label: '服務' },
        { key: 'quotes', label: '客戶報價' },
        { key: 'cases', label: '案件' },
        { key: 'about', label: '關於我' },
        { key: 'chat', label: '聊天' },
    ];

    return (
        <main className="px-4 sm:px-6 md:px-12 lg:px-24 pt-28 sm:pt-40 pb-24 max-w-[1800px] mx-auto">
            <div className="flex justify-between items-center mb-8 sm:mb-12">
                <h1 className="text-3xl sm:text-4xl md:text-6xl font-black tracking-tighter uppercase">Admin</h1>
                <button onClick={logout} className="flex items-center gap-2 text-sm font-medium uppercase tracking-widest opacity-60 hover:opacity-100 transition-opacity">
                    <LogOut size={16} /> 登出
                </button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-10 border-b border-[#020202]/20 overflow-x-auto -mx-6 px-6 md:mx-0 md:px-0">
                {tabs.map(t => (
                    <button
                        key={t.key}
                        onClick={() => setTab(t.key)}
                        className={`px-3 sm:px-6 py-3 text-xs sm:text-sm font-semibold uppercase tracking-widest whitespace-nowrap transition-colors ${tab === t.key ? 'border-b-2 border-[#020202] opacity-100' : 'opacity-40 hover:opacity-70'}`}
                    >
                        {t.label}
                    </button>
                ))}
            </div>

            {/* Actions */}
            {tab !== 'about' && tab !== 'chat' && tab !== 'cases' && (
                <div className="flex flex-col sm:flex-row gap-3 mb-8">
                    {tab !== 'quotes' && (
                        <button
                            onClick={() => setCreating(true)}
                            className="flex items-center gap-2 bg-[#020202] text-[#f3f3f3] px-6 py-3 text-sm font-semibold uppercase tracking-widest hover:bg-[#333] transition-colors shrink-0"
                        >
                            <Plus size={16} /> 新增{tab === 'portfolios' ? '作品集' : '服務'}
                        </button>
                    )}
                    <div className="relative flex-1 max-w-md">
                        <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-30" />
                        <input
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            placeholder="搜尋..."
                            className="w-full bg-transparent border border-[#020202]/20 focus:border-[#020202] outline-none pl-10 pr-3 py-3 text-sm font-light transition-colors placeholder:opacity-40"
                        />
                    </div>
                </div>
            )}

            {/* Table */}
            {tab !== 'about' && tab !== 'chat' && tab !== 'cases' && (loading ? (
                <div className="text-center py-20 opacity-60">載入中...</div>
            ) : filteredData.length === 0 ? (
                <div className="text-center py-20 opacity-60">{search ? '無符合結果' : '尚無資料'}</div>
            ) : (
                <>
                    {/* Mobile Cards */}
                    <div className="md:hidden space-y-3">
                        {filteredData.map(item => (
                            <div key={item.id} className="border border-[#020202]/10 p-4 hover:bg-[#020202]/[0.02] transition-colors">
                                {tab === 'portfolios' && (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{item.name_zh}</p>
                                                <p className="text-sm opacity-40 truncate">{item.name_en}</p>
                                            </div>
                                            <div className="flex gap-3 shrink-0 ml-3">
                                                <button onClick={() => setEditing(item)} className="opacity-40 hover:opacity-100 transition-opacity"><Pencil size={16} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="opacity-40 hover:opacity-100 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        {item.tags?.length > 0 && <p className="text-xs opacity-50 mt-2">{item.tags.join(', ')}</p>}
                                        <p className="text-xs opacity-30 mt-1">{new Date(item.created_at).toLocaleDateString('zh-TW')}</p>
                                    </>
                                )}
                                {tab === 'services' && (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-medium truncate">{item.name}</p>
                                                <p className="text-sm opacity-50">{item.category}</p>
                                            </div>
                                            <div className="flex gap-3 shrink-0 ml-3">
                                                <button onClick={() => setEditing(item)} className="opacity-40 hover:opacity-100 transition-opacity"><Pencil size={16} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="opacity-40 hover:opacity-100 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        <p className="text-sm mt-2">{item.price != null ? `NT$ ${item.price.toLocaleString('zh-TW')}` : '議價'}</p>
                                    </>
                                )}
                                {tab === 'quotes' && (
                                    <>
                                        <div className="flex justify-between items-start">
                                            <div className="min-w-0 flex-1">
                                                <p className="font-mono font-semibold text-sm">{item.quote_number}</p>
                                                <p className="font-medium mt-1">{item.client_name}</p>
                                                <p className="text-sm opacity-50 truncate">{item.client_email}</p>
                                            </div>
                                            <div className="flex gap-3 shrink-0 ml-3">
                                                <button onClick={() => handleCreateCase(item.id)} disabled={caseCreating} title="成立案件" className="opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20"><Briefcase size={16} /></button>
                                                <button onClick={() => handleDelete(item.id)} className="opacity-40 hover:opacity-100 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                                            </div>
                                        </div>
                                        <div className="flex flex-wrap gap-x-4 gap-y-1 mt-2 text-sm">
                                            <span>NT$ {item.budget_min?.toLocaleString('zh-TW')}{item.budget_max ? ` ~ ${item.budget_max.toLocaleString('zh-TW')}` : ' 起'}</span>
                                            <span className="opacity-50">{item.expected_completion}</span>
                                        </div>
                                    </>
                                )}
                            </div>
                        ))}
                    </div>
                    {/* Desktop Table */}
                    <div className="hidden md:block overflow-x-auto">
                        <table className="w-full text-left">
                            <thead>
                                <tr className="border-b border-[#020202]/20 text-xs uppercase tracking-widest opacity-50">
                                    {tab === 'portfolios' && <><th className="py-3 pr-4">名稱</th><th className="py-3 pr-4">標籤</th><th className="py-3 pr-4">建立時間</th><th className="py-3">操作</th></>}
                                    {tab === 'services' && <><th className="py-3 pr-4">名稱</th><th className="py-3 pr-4">分類</th><th className="py-3 pr-4">價格</th><th className="py-3">操作</th></>}
                                    {tab === 'quotes' && <><th className="py-3 pr-4">編號</th><th className="py-3 pr-4">客戶</th><th className="py-3 pr-4">信箱</th><th className="py-3 pr-4">服務</th><th className="py-3 pr-4">預算</th><th className="py-3 pr-4">時間</th><th className="py-3">操作</th></>}
                                </tr>
                            </thead>
                            <tbody>
                                {filteredData.map(item => (
                                    <tr key={item.id} className="border-b border-[#020202]/10 hover:bg-[#020202]/5 transition-colors">
                                        {tab === 'portfolios' && (
                                            <>
                                                <td className="py-4 pr-4 font-medium">{item.name_zh}<span className="opacity-40 ml-2 text-sm">{item.name_en}</span></td>
                                                <td className="py-4 pr-4 text-sm opacity-60">{item.tags?.join(', ')}</td>
                                                <td className="py-4 pr-4 text-sm opacity-60">{new Date(item.created_at).toLocaleDateString('zh-TW')}</td>
                                                <td className="py-4">
                                                    <div className="flex gap-3">
                                                        <button onClick={() => setEditing(item)} className="opacity-40 hover:opacity-100 transition-opacity"><Pencil size={16} /></button>
                                                        <button onClick={() => handleDelete(item.id)} className="opacity-40 hover:opacity-100 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                        {tab === 'services' && (
                                            <>
                                                <td className="py-4 pr-4 font-medium">{item.name}</td>
                                                <td className="py-4 pr-4 text-sm opacity-60">{item.category}</td>
                                                <td className="py-4 pr-4 text-sm">{item.price != null ? `NT$ ${item.price.toLocaleString('zh-TW')}` : '議價'}</td>
                                                <td className="py-4">
                                                    <div className="flex gap-3">
                                                        <button onClick={() => setEditing(item)} className="opacity-40 hover:opacity-100 transition-opacity"><Pencil size={16} /></button>
                                                        <button onClick={() => handleDelete(item.id)} className="opacity-40 hover:opacity-100 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                        {tab === 'quotes' && (
                                            <>
                                                <td className="py-4 pr-4 text-sm font-mono font-semibold">{item.quote_number}</td>
                                                <td className="py-4 pr-4 font-medium">{item.client_name}</td>
                                                <td className="py-4 pr-4 text-sm opacity-60">{item.client_email}</td>
                                                <td className="py-4 pr-4 text-sm opacity-60">{item.service_id}</td>
                                                <td className="py-4 pr-4 text-sm">NT$ {item.budget_min?.toLocaleString('zh-TW')}{item.budget_max ? ` ~ ${item.budget_max.toLocaleString('zh-TW')}` : ' 起'}</td>
                                                <td className="py-4 pr-4 text-sm opacity-60">{item.expected_completion}</td>
                                                <td className="py-4">
                                                    <div className="flex gap-3">
                                                        <button
                                                            onClick={() => handleCreateCase(item.id)}
                                                            disabled={caseCreating}
                                                            title="成立案件"
                                                            className="opacity-40 hover:opacity-100 transition-opacity disabled:opacity-20"
                                                        >
                                                            <Briefcase size={16} />
                                                        </button>
                                                        <button onClick={() => handleDelete(item.id)} className="opacity-40 hover:opacity-100 hover:text-red-600 transition-all"><Trash2 size={16} /></button>
                                                    </div>
                                                </td>
                                            </>
                                        )}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </>
            ))}

            {/* Modals */}
            {creating && tab === 'portfolios' && <PortfolioForm onClose={() => setCreating(false)} onSaved={handleSaved} />}
            {creating && tab === 'services' && <ServiceForm onClose={() => setCreating(false)} onSaved={handleSaved} />}
            {editing && tab === 'portfolios' && <PortfolioForm item={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}
            {editing && tab === 'services' && <ServiceForm item={editing} onClose={() => setEditing(null)} onSaved={handleSaved} />}

            {/* About Editor */}
            {tab === 'about' && <AboutEditor />}

            {/* Chat */}
            {tab === 'chat' && <AdminChat />}

            {/* Cases */}
            {tab === 'cases' && <AdminCases />}

            {/* Delete Password Modal */}
            {deleteTarget && (
                <div className="fixed inset-0 bg-[#020202]/50 z-50 flex items-center justify-center p-6">
                    <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="bg-[#f3f3f3] p-6 w-full max-w-sm relative">
                        <button onClick={() => setDeleteTarget(null)} className="absolute top-3 right-3 opacity-60 hover:opacity-100"><X size={18} /></button>
                        <h3 className="text-lg font-bold mb-2 flex items-center gap-2"><Lock size={18} /> 確認刪除</h3>
                        <p className="text-sm opacity-60 mb-4">請輸入密碼以確認刪除操作</p>
                        <input
                            type="password"
                            value={deletePassword}
                            onChange={e => setDeletePassword(e.target.value)}
                            onKeyDown={e => e.key === 'Enter' && handleQuoteDelete()}
                            placeholder="輸入密碼"
                            className="w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-2 text-base mb-2"
                            autoFocus
                        />
                        {deleteError && <p className="text-red-600 text-xs mb-2">{deleteError}</p>}
                        <button
                            onClick={handleQuoteDelete}
                            disabled={!deletePassword}
                            className="w-full bg-red-600 text-[#f3f3f3] py-2.5 text-sm font-semibold uppercase tracking-widest mt-4 disabled:opacity-30 hover:bg-red-700 transition-colors"
                        >
                            確認刪除
                        </button>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
