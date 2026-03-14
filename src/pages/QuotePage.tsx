import React, { useEffect, useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Send, CheckCircle, MessageSquare } from 'lucide-react';
import { useSearchParams, Link } from 'react-router-dom';
import { API_BASE } from '../api';
import { useI18n } from '../i18n';
import MarkdownEditor from '../components/MarkdownEditor';

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

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
        setForm(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
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
                        <p className="text-lg md:text-2xl font-mono font-semibold tracking-widest mb-6 opacity-90">
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

            <form onSubmit={handleSubmit} className="max-w-3xl space-y-10">
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
                        onChange={handleChange}
                        placeholder={t('quote.phone')}
                        required
                        className={inputBase}
                    />
                </div>

                {/* Service */}
                <div className="space-y-8">
                    <h3 className="text-xs uppercase tracking-[0.3em] font-semibold opacity-50 mb-4">{t('quote.sectionService')}</h3>
                    <select
                        name="service_id"
                        value={form.service_id}
                        onChange={handleChange}
                        required
                        className={`${inputBase} cursor-pointer`}
                    >
                        <option value="">{t('quote.selectService')}</option>
                        {services.map(s => (
                            <option key={s.id} value={s.id}>
                                {s.name} — {s.price != null ? `NT$ ${s.price.toLocaleString('zh-TW')}` : t('services.negotiate')}
                            </option>
                        ))}
                    </select>
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
                            type="number"
                            min="0"
                            value={form.budget_min}
                            onChange={handleChange}
                            placeholder={t('quote.budgetMin')}
                            required
                            className={inputBase}
                        />
                        <input
                            name="budget_max"
                            type="number"
                            min="0"
                            value={form.budget_max}
                            onChange={handleChange}
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
        </main>
    );
}
