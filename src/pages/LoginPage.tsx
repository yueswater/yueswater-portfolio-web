import React, { useState } from 'react';
import { motion } from 'motion/react';
import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { API_BASE } from '../api';
import { useI18n } from '../i18n';

export default function LoginPage() {
    const navigate = useNavigate();
    const { t } = useI18n();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setLoading(true);

        try {
            const res = await fetch(`${API_BASE}/api/auth/login`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ username, password }),
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.detail || t('login.errorFallback'));
            }

            const { access_token } = await res.json();
            localStorage.setItem('token', access_token);
            navigate('/admin');
        } catch (err: any) {
            setError(err.message || t('login.errorGeneric'));
        } finally {
            setLoading(false);
        }
    };

    const inputBase = "w-full bg-transparent border-b border-[#020202]/20 focus:border-[#020202] outline-none py-3 text-lg font-light transition-colors placeholder:opacity-40";

    return (
        <main className="px-6 md:px-12 lg:px-24 pt-40 pb-24 max-w-[1800px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
                className="max-w-md mx-auto"
            >
                <h1 className="text-4xl md:text-6xl font-black tracking-tighter mb-12 uppercase text-center">
                    {t('login.title')}
                </h1>

                <form onSubmit={handleSubmit} className="space-y-8">
                    <input
                        value={username}
                        onChange={e => setUsername(e.target.value)}
                        placeholder={t('login.username')}
                        required
                        autoComplete="username"
                        className={inputBase}
                    />
                    <input
                        type="password"
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={t('login.password')}
                        required
                        autoComplete="current-password"
                        className={inputBase}
                    />

                    {error && <p className="text-red-600 font-medium">{error}</p>}

                    <button
                        type="submit"
                        disabled={loading}
                        className="group w-full flex items-center justify-center gap-3 bg-[#020202] text-[#f3f3f3] px-10 py-4 text-sm font-semibold uppercase tracking-widest hover:bg-[#333] transition-colors disabled:opacity-50"
                    >
                        {loading ? t('login.submitting') : t('login.submit')}
                        <LogIn size={16} className="group-hover:translate-x-1 transition-transform" />
                    </button>
                </form>
            </motion.div>
        </main>
    );
}
