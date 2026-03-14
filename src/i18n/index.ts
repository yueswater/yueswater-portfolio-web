import React, { createContext, useContext, useState, useCallback } from 'react';
import { translations, type Locale, type TranslationKey } from './locales';

interface I18nContextValue {
    locale: Locale;
    toggleLocale: () => void;
    t: (key: TranslationKey) => string;
}

function detectLocale(): Locale {
    const saved = localStorage.getItem('locale');
    if (saved === 'zh' || saved === 'en') return saved;
    const browserLang = navigator.language || '';
    return browserLang.startsWith('zh') ? 'zh' : 'en';
}

const I18nContext = createContext<I18nContextValue>(null!);

export function I18nProvider({ children }: { children: React.ReactNode }) {
    const [locale, setLocale] = useState<Locale>(detectLocale);

    const toggleLocale = useCallback(() => {
        setLocale(prev => {
            const next = prev === 'zh' ? 'en' : 'zh';
            localStorage.setItem('locale', next);
            return next;
        });
    }, []);

    const t = useCallback((key: TranslationKey) => {
        return translations[locale][key] ?? key;
    }, [locale]);

    return React.createElement(
        I18nContext.Provider,
        { value: { locale, toggleLocale, t } },
        children
    );
}

export function useI18n() {
    return useContext(I18nContext);
}
