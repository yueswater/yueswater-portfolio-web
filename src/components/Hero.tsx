import React from 'react';
import { motion } from 'motion/react';
import { useI18n } from '../i18n';

export default function Hero() {
    const { t } = useI18n();

    return (
        <section className="min-h-[60vh] flex flex-col justify-center mb-32">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
                <h1 className="text-6xl md:text-8xl lg:text-[11rem] font-black leading-[0.9] tracking-tighter mb-10 uppercase">
                    {t('hero.greeting')} <br />
                    {t('hero.name')}
                </h1>
                <p className="text-xl md:text-3xl font-light max-w-3xl leading-relaxed opacity-80">
                    {t('hero.subtitle')}
                </p>
            </motion.div>
        </section>
    );
}
