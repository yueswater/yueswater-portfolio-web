import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import ReactMarkdown from 'react-markdown';
import { API_BASE } from '../api';
import { useI18n } from '../i18n';

export default function AboutPage() {
    const { locale, t } = useI18n();
    const [content, setContent] = useState('');
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/about`)
            .then(r => r.json())
            .then(data => {
                setContent(locale === 'zh' ? data.content_zh : data.content_en);
            })
            .catch(() => setContent(''))
            .finally(() => setLoading(false));
    }, [locale]);

    return (
        <main className="px-6 md:px-12 lg:px-24 pt-40 pb-24 max-w-[1800px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
                <h1 className="text-5xl md:text-7xl lg:text-[9rem] font-black leading-[0.85] tracking-tighter mb-16 uppercase">
                    {t('about.title')}
                </h1>
            </motion.div>

            {loading ? (
                <div className="text-center py-20 opacity-60">Loading...</div>
            ) : (
                <motion.article
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                    className="about-content prose prose-lg max-w-4xl
                        prose-headings:font-bold prose-headings:tracking-tight
                        prose-h1:text-4xl prose-h2:text-3xl prose-h3:text-2xl
                        prose-p:font-light prose-p:leading-relaxed prose-p:opacity-80
                        prose-a:text-[#020202] prose-a:no-underline
                        prose-img:rounded-none prose-img:my-8
                        prose-strong:font-semibold
                        prose-ul:font-light prose-ol:font-light"
                >
                    <ReactMarkdown>{content}</ReactMarkdown>
                </motion.article>
            )}
        </main>
    );
}
