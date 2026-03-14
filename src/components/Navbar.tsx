import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';
import { AnimatePresence, motion } from 'framer-motion';

export default function Navbar() {
    const { t, toggleLocale } = useI18n();
    const [scrolled, setScrolled] = useState(false);
    const [menuOpen, setMenuOpen] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    // Lock body scroll when menu is open
    useEffect(() => {
        document.body.style.overflow = menuOpen ? 'hidden' : '';
        return () => { document.body.style.overflow = ''; };
    }, [menuOpen]);

    const navLinks = [
        { to: '/#work', label: t('nav.work') },
        { to: '/about', label: t('nav.about') },
        { to: '/services', label: t('nav.services') },
        { to: '/quote', label: t('nav.contact') },
        { to: '/chat', label: t('nav.chat') },
    ];

    return (
        <>
            <nav className={`fixed top-0 left-0 right-0 p-6 md:p-10 flex justify-between items-center z-50 transition-all duration-300 ${scrolled || menuOpen ? 'bg-[#f3f3f3]/90 backdrop-blur-md text-[#020202] shadow-sm' : 'mix-blend-difference text-[#f3f3f3]'}`}>
                <Link to="/" className="font-bold text-xl tracking-tighter" onClick={() => setMenuOpen(false)}>ANTHONY.</Link>

                {/* Desktop */}
                <div className="hidden md:flex gap-6 text-sm font-medium uppercase tracking-widest">
                    {navLinks.map(l => <Link key={l.to} to={l.to} className="hover-fill">{l.label}</Link>)}
                    <button onClick={toggleLocale} className="hover-fill">{t('nav.langLabel')}</button>
                </div>

                {/* Mobile hamburger / X */}
                <button
                    className="md:hidden relative w-8 h-8 flex items-center justify-center z-[60]"
                    onClick={() => setMenuOpen(v => !v)}
                    aria-label="Toggle menu"
                >
                    <span className={`absolute block w-5 h-[2px] bg-current transition-all duration-300 ${menuOpen ? 'rotate-45' : '-translate-y-[6px]'}`} />
                    <span className={`absolute block w-5 h-[2px] bg-current transition-all duration-300 ${menuOpen ? 'opacity-0' : ''}`} />
                    <span className={`absolute block w-5 h-[2px] bg-current transition-all duration-300 ${menuOpen ? '-rotate-45' : 'translate-y-[6px]'}`} />
                </button>
            </nav>

            {/* Mobile fullscreen overlay */}
            <AnimatePresence>
                {menuOpen && (
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.3 }}
                        className="fixed inset-0 z-40 md:hidden bg-[#f3f3f3]/85 backdrop-blur-2xl"
                    >
                        <div className="flex flex-col items-center justify-center h-full gap-2">
                            {navLinks.map((l, i) => (
                                <motion.div
                                    key={l.to}
                                    initial={{ opacity: 0, y: 30 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -20 }}
                                    transition={{ delay: 0.1 + i * 0.06, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                                >
                                    <Link
                                        to={l.to}
                                        onClick={() => setMenuOpen(false)}
                                        className="block py-4 text-2xl font-semibold tracking-wide text-[#020202] hover:text-[#888] transition-colors"
                                    >
                                        {l.label}
                                    </Link>
                                </motion.div>
                            ))}
                            <motion.div
                                initial={{ opacity: 0, y: 30 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -20 }}
                                transition={{ delay: 0.1 + navLinks.length * 0.06, duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                            >
                                <button
                                    onClick={() => { toggleLocale(); setMenuOpen(false); }}
                                    className="block py-4 text-2xl font-semibold tracking-wide text-[#020202] hover:text-[#888] transition-colors"
                                >
                                    {t('nav.langLabel')}
                                </button>
                            </motion.div>
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>
        </>
    );
}
