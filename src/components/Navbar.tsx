import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Navbar() {
    const { t, toggleLocale } = useI18n();
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 20);
        onScroll();
        window.addEventListener('scroll', onScroll, { passive: true });
        return () => window.removeEventListener('scroll', onScroll);
    }, []);

    return (
        <nav className={`fixed top-0 left-0 right-0 p-6 md:p-10 flex justify-between items-center z-50 transition-all duration-300 ${scrolled ? 'bg-[#f3f3f3]/90 backdrop-blur-md text-[#020202] shadow-sm' : 'mix-blend-difference text-[#f3f3f3]'}`}>
            <Link to="/" className="font-bold text-xl tracking-tighter">ANTHONY.</Link>
            <div className="flex gap-6 text-sm font-medium uppercase tracking-widest">
                <Link to="/#work" className="hover-fill hidden md:block">{t('nav.work')}</Link>
                <Link to="/about" className="hover-fill hidden md:block">{t('nav.about')}</Link>
                <Link to="/services" className="hover-fill hidden md:block">{t('nav.services')}</Link>
                <Link to="/quote" className="hover-fill">{t('nav.contact')}</Link>
                <Link to="/chat" className="hover-fill">{t('nav.chat')}</Link>
                <button onClick={toggleLocale} className="hover-fill">{t('nav.langLabel')}</button>
            </div>
        </nav>
    );
}
