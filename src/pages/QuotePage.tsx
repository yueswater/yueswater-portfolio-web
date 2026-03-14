import React, { useEffect, useState, useRef, useMemo } from 'react';
import { motion } from 'motion/react';
import { Send, CheckCircle, MessageSquare, X, ShieldCheck } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_BASE } from '../api';
import { useI18n } from '../i18n';
import MarkdownEditor from '../components/MarkdownEditor';
import CustomSelect from '../components/CustomSelect';

interface Service {
    id: string;
    name: string;
    category: string;
    price: number | null;
}

export default function QuotePage() {
    const { t } = useI18n();
    const [searchParams] = useSearchParams();
    const preselectedServiceId = searchParams.get('service') || '';
    const [services, setServices] = useState<Service[]>([]);
    const [submitted, setSubmitted] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState('');
    const [quoteNumber, setQuoteNumber] = useState('');

    const [form, setForm] = useState({
        client_name: '',
        client_email: '',
        client_phone: '',
        service_id: preselectedServiceId,
        requirement: '',
        budget_min: '',
        budget_max: '',
        expected_completion: '',
    });
    const requirementRef = useRef<HTMLTextAreaElement>(null);

    useEffect(() => {
        fetch(`${API_BASE}/api/services`)
            .then(res => res.json())
            .then(data => setServices(data))
            .catch(() => { });
    }, []);

    useEffect(() => {
        if (preselectedServiceId) {
            setForm(prev => ({ ...prev, service_id: preselectedServiceId }));
        }
    }, [preselectedServiceId]);

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const [phoneError, setPhoneError] = useState('');
    const phoneTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

    const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const digits = e.target.value.replace(/[^\d]/g, '').slice(0, 10);
        let formatted = digits;
        if (digits.length > 4) formatted = digits.slice(0, 4) + '-' + digits.slice(4);
        if (digits.length > 7) formatted = digits.slice(0, 4) + '-' + digits.slice(4, 7) + '-' + digits.slice(7);
        setForm(prev => ({ ...prev, client_phone: formatted }));
    };

    const validatePhone = () => {
        const v = form.client_phone;
        if (!v) return;
        if (phoneTimer.current) clearTimeout(phoneTimer.current);
        if (!/^09\d{2}-\d{3}-\d{3}$/.test(v)) {
            const msg = !v.startsWith('09') ? '電話須以 09 開頭'
                : v.replace(/[^\d]/g, '').length < 10 ? '電話號碼須為 10 碼'
                    : '格式須為 09xx-xxx-xxx';
            setPhoneError(msg);
            phoneTimer.current = setTimeout(() => setPhoneError(''), 3000);
        } else {
            setPhoneError('');
        }
    };

    const formatMoney = (v: string) => {
        const num = v.replace(/[^\d]/g, '');
        return num ? Number(num).toLocaleString('en-US') : '';
    };
    const handleMoneyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value.replace(/[^\d]/g, '') }));
    };

    // --- Confirmation modal + CAPTCHA ---
    const [showConfirm, setShowConfirm] = useState(false);
    const [captchaInput, setCaptchaInput] = useState('');
    const [captchaError, setCaptchaError] = useState('');
    const captcha = useMemo(() => {
        const a = Math.floor(Math.random() * 20) + 1;
        const b = Math.floor(Math.random() * 20) + 1;
        return { a, b, answer: a + b };
    }, [showConfirm]); // regenerate when modal opens

    const handlePreSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        if (!/^09\d{2}-\d{3}-\d{3}$/.test(form.client_phone)) {
            setPhoneError('格式須為 09xx-xxx-xxx');
            if (phoneTimer.current) clearTimeout(phoneTimer.current);
            phoneTimer.current = setTimeout(() => setPhoneError(''), 3000);
            return;
        }
        setCaptchaInput('');
        setCaptchaError('');
        setShowConfirm(true);
    };

    const handleConfirmSubmit = async () => {
        if (parseInt(captchaInput, 10) !== captcha.answer) {
            setCaptchaError(t('quote.captchaWrong'));
            return;
        }
        setShowConfirm(false);
        setSubmitting(true);

        try {
            const payload = {
                ...form,
                budget_min: parseFloat(form.budget_min),
                budget_max: form.budget_max ? parseFloat(form.budget_max) : null,
            };

            const res = await fetch(`${API_BASE}/api/quotes`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(payload),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || t('quote.errorFallback'));
            }

            const result = await res.json();
            setQuoteNumber(result.quote_number);
            setSubmitted(true);
        } catch (err: any) {
            setError(err.message || t('quote.errorGeneric'));
        } finally {
            setSubmitting(false);
        }
    };

    if (submitted) {
        return (
            <main className="px-6 md:px-12 lg:px-24 pt-40 pb-24 max-w-[1800px] mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 30 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                    className="flex flex-col items-center justify-center min-h-[60vh] text-center"
                >
                    <CheckCircle size={64} className="mb-8 opacity-80" />
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-4 uppercase">{t('quote.submitted')}</h1>
                    {quoteNumber && (
                        <p className="text-lg md:text-2xl font-mono font-semibold tracking-widest mb-6 opacity-90 select-text">
                            {quoteNumber}
                        </p>
                    )}
                    <p className="text-xl font-light opacity-80 max-w-lg mb-10">
                        {t('quote.thankYou')}
                    </p>
                    <Link
                        to="/chat"
                        className="hover-fill group inline-flex items-center gap-3 border border-[#020202] px-8 py-4 text-sm font-semibold uppercase tracking-widest transition-colors"
                    >
                        <MessageSquare size={16} />
                        {t('quote.goChat')}
                    </Link>
                </motion.div>
            </main>
        );
    }

    const inputBase = "w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-3 text-lg font-light transition-colors placeholder:opacity-40";

    return (
        <main className="px-6 md:px-12 lg:px-24 pt-40 pb-24 max-w-[1800px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
                <h1 className="text-5xl md:text-7xl lg:text-[9rem] font-black leading-[0.85] tracking-tighter mb-6 uppercase">
                    {t('quote.title')}
                </h1>
                <p className="text-xl md:text-2xl font-light max-w-2xl leading-relaxed opacity-80 mb-20">
                    {t('quote.subtitle')}
                </p>
            </motion.div>

            <form onSubmit={handlePreSubmit} className="max-w-3xl space-y-10">
                {/* Personal Info */}
                <div className="space-y-8">
                    <h3 className="text-xs uppercase tracking-[0.3em] font-semibold opacity-50 mb-4">{t('quote.sectionInfo')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <input
                            name="client_name"
                            value={form.client_name}
                            onChange={handleChange}
                            placeholder={t('quote.name')}
                            required
                            className={inputBase}
                        />
                        <input
                            name="client_email"
                            type="email"
                            value={form.client_email}
                            onChange={handleChange}
                            placeholder={t('quote.email')}
                            required
                            className={inputBase}
                        />
                    </div>
                    <input
                        name="client_phone"
                        type="tel"
                        value={form.client_phone}
                        onChange={handlePhoneChange}
                        onBlur={validatePhone}
                        placeholder={t('quote.phone') + '  09xx-xxx-xxx'}
                        required
                        className={inputBase}
                    />
                    {phoneError && (
                        <p className="text-red-600 text-xs mt-1 animate-pulse">{phoneError}</p>
                    )}
                </div>

                {/* Service */}
                <div className="space-y-8">
                    <h3 className="text-xs uppercase tracking-[0.3em] font-semibold opacity-50 mb-4">{t('quote.sectionService')}</h3>
                    <CustomSelect
                        value={form.service_id}
                        onChange={v => setForm(prev => ({ ...prev, service_id: v }))}
                        options={services.map(s => ({
                            value: s.id,
                            label: `${s.name} — ${s.price != null ? `NT$ ${s.price.toLocaleString('zh-TW')}` : t('services.negotiate')}`,
                        }))}
                        placeholder={t('quote.selectService')}
                        required
                    />
                </div>

                {/* Requirement */}
                <div className="space-y-8">
                    <h3 className="text-xs uppercase tracking-[0.3em] font-semibold opacity-50 mb-4">{t('quote.sectionRequirement')}</h3>
                    <div className="space-y-2">
                        <MarkdownEditor textareaRef={requirementRef} value={form.requirement} onChange={v => setForm(prev => ({ ...prev, requirement: v }))} rows={6} placeholder={t('quote.requirementPlaceholder')} />
                    </div>
                </div>

                {/* Budget */}
                <div className="space-y-8">
                    <h3 className="text-xs uppercase tracking-[0.3em] font-semibold opacity-50 mb-4">{t('quote.sectionBudget')}</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                        <input
                            name="budget_min"
                            type="text"
                            inputMode="numeric"
                            value={formatMoney(form.budget_min)}
                            onChange={handleMoneyChange}
                            placeholder={t('quote.budgetMin')}
                            required
                            className={inputBase}
                        />
                        <input
                            name="budget_max"
                            type="text"
                            inputMode="numeric"
                            value={formatMoney(form.budget_max)}
                            onChange={handleMoneyChange}
                            placeholder={t('quote.budgetMax')}
                            className={inputBase}
                        />
                    </div>
                </div>

                {/* Timeline */}
                <div className="space-y-8">
                    <h3 className="text-xs uppercase tracking-[0.3em] font-semibold opacity-50 mb-4">{t('quote.sectionTimeline')}</h3>
                    <input
                        name="expected_completion"
                        value={form.expected_completion}
                        onChange={handleChange}
                        placeholder={t('quote.timelinePlaceholder')}
                        required
                        className={inputBase}
                    />
                </div>

                {error && (
                    <p className="text-red-600 font-medium">{error}</p>
                )}

                <button
                    type="submit"
                    disabled={submitting}
                    className="hover-fill-invert group flex items-center gap-3 bg-[#020202] text-[#f3f3f3] px-10 py-4 text-sm font-semibold uppercase tracking-widest transition-colors disabled:opacity-50"
                >
                    {submitting ? t('quote.submitting') : t('quote.submit')}
                    <Send size={16} className="group-hover:translate-x-1 transition-transform" />
                </button>
            </form>

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-[#020202]/50 z-50 flex items-center justify-center p-6">
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="bg-[#f3f3f3] w-full max-w-lg p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto"
                    >
                        <button onClick={() => setShowConfirm(false)} className="absolute top-4 right-4 opacity-60 hover:opacity-100"><X size={20} /></button>
                        <h3 className="text-xl sm:text-2xl font-bold mb-6">{t('quote.confirmTitle')}</h3>

                        <div className="space-y-4 text-sm">
                            <div className="flex justify-between border-b border-[#020202]/10 pb-2">
                                <span className="opacity-50">{t('quote.name')}</span>
                                <span className="font-medium">{form.client_name}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#020202]/10 pb-2">
                                <span className="opacity-50">{t('quote.email')}</span>
                                <span className="font-medium">{form.client_email}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#020202]/10 pb-2">
                                <span className="opacity-50">{t('quote.phone')}</span>
                                <span className="font-medium">{form.client_phone}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#020202]/10 pb-2">
                                <span className="opacity-50">{t('quote.sectionService')}</span>
                                <span className="font-medium text-right max-w-[60%]">{services.find(s => s.id === form.service_id)?.name || '-'}</span>
                            </div>
                            <div className="flex justify-between border-b border-[#020202]/10 pb-2">
                                <span className="opacity-50">{t('quote.sectionBudget')}</span>
                                <span className="font-medium">
                                    NT$ {formatMoney(form.budget_min)}{form.budget_max ? ` ~ ${formatMoney(form.budget_max)}` : ` ${t('quote.budgetUp')}`}
                                </span>
                            </div>
                            <div className="flex justify-between border-b border-[#020202]/10 pb-2">
                                <span className="opacity-50">{t('quote.sectionTimeline')}</span>
                                <span className="font-medium">{form.expected_completion}</span>
                            </div>
                            {form.requirement && (
                                <div className="border-b border-[#020202]/10 pb-2">
                                    <span className="opacity-50 block mb-1">{t('quote.sectionRequirement')}</span>
                                    <p className="font-light whitespace-pre-wrap text-xs leading-relaxed opacity-80 max-h-32 overflow-y-auto">{form.requirement}</p>
                                </div>
                            )}
                        </div>

                        {/* CAPTCHA */}
                        <div className="mt-6 p-4 border border-[#020202]/10 bg-white/50">
                            <div className="flex items-center gap-2 mb-3">
                                <ShieldCheck size={16} className="opacity-50" />
                                <span className="text-xs uppercase tracking-widest font-semibold opacity-50">{t('quote.captchaLabel')}</span>
                            </div>
                            <p className="text-lg font-mono font-semibold mb-2">{captcha.a} + {captcha.b} = ?</p>
                            <input
                                type="text"
                                inputMode="numeric"
                                value={captchaInput}
                                onChange={e => { setCaptchaInput(e.target.value.replace(/[^\d]/g, '')); setCaptchaError(''); }}
                                onKeyDown={e => e.key === 'Enter' && handleConfirmSubmit()}
                                placeholder={t('quote.captchaPlaceholder')}
                                className="w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-2 text-base font-light transition-colors placeholder:opacity-40"
                                autoFocus
                            />
                            {captchaError && <p className="text-red-600 text-xs mt-1">{captchaError}</p>}
                        </div>

                        <div className="flex gap-3 mt-6">
                            <button
                                type="button"
                                onClick={() => setShowConfirm(false)}
                                className="flex-1 border border-[#020202] py-3 text-sm font-semibold uppercase tracking-widest hover:bg-[#020202]/5 transition-colors"
                            >
                                {t('quote.editBack')}
                            </button>
                            <button
                                type="button"
                                onClick={handleConfirmSubmit}
                                disabled={!captchaInput}
                                className="flex-1 bg-[#020202] text-[#f3f3f3] py-3 text-sm font-semibold uppercase tracking-widest hover:bg-[#333] transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
                            >
                                {t('quote.confirmSubmit')}
                            </button>
                        </div>
                    </motion.div>
                </div>
            )}
        </main>
    );
}
