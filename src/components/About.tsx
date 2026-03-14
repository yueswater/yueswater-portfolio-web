import React from 'react';
import { useI18n } from '../i18n';

export default function About() {
    const { t } = useI18n();

    return (
        <section id="about" className="mb-40">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 md:gap-16 border-t border-[#020202]/20 pt-16">
                <div className="md:col-span-4 lg:col-span-5">
                    <h2 className="text-3xl md:text-5xl font-bold tracking-tight mb-8">{t('about.title')}</h2>
                </div>
                <div className="md:col-span-8 lg:col-span-7 text-lg md:text-2xl font-light leading-relaxed opacity-80 space-y-8">
                    <p>{t('about.p1')}</p>
                    <p>{t('about.p2')}</p>
                </div>
            </div>
        </section>
    );
}
