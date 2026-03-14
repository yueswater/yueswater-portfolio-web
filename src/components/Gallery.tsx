import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { API_BASE } from '../api';
import { useI18n } from '../i18n';

interface Portfolio {
    id: string;
    name_zh: string;
    name_en: string;
    image: string;
    description: string;
    tags: string[];
    created_at: string;
}

const SPAN_PATTERN = [
    'md:col-span-2 md:row-span-2',
    'md:col-span-2 md:row-span-1',
    'md:col-span-1 md:row-span-1',
    'md:col-span-1 md:row-span-1',
];

export default function Gallery() {
    const { t } = useI18n();
    const [projects, setProjects] = useState<Portfolio[]>([]);

    useEffect(() => {
        fetch(`${API_BASE}/api/portfolios`)
            .then(r => r.json())
            .then(setProjects)
            .catch(() => setProjects([]));
    }, []);

    if (projects.length === 0) return null;

    return (
        <section id="work" className="mb-40">
            <div className="flex justify-between items-end mb-12 border-b border-[#020202]/20 pb-6">
                <h2 className="text-3xl md:text-5xl font-bold tracking-tight">{t('gallery.title')}</h2>
                <span className="text-sm uppercase tracking-widest opacity-60 hidden md:block">{t('gallery.period')}</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:gap-6 auto-rows-[300px] md:auto-rows-[350px]">
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className={`group relative overflow-hidden bg-[#e5e5e5] ${SPAN_PATTERN[index % SPAN_PATTERN.length]}`}
                    >
                        <img
                            src={project.image}
                            alt={project.name_en}
                            className="w-full h-full object-cover transition-all duration-700 ease-out group-hover:scale-105 group-hover:grayscale"
                        />
                        <div className="absolute inset-0 bg-[#020202]/0 group-hover:bg-[#020202]/30 transition-colors duration-500" />
                        <div className="absolute bottom-0 left-0 p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                            <h3 className="text-[#f3f3f3] text-2xl md:text-3xl font-bold mb-2">{project.name_zh}</h3>
                            <p className="text-[#f3f3f3]/80 text-sm uppercase tracking-widest">{project.tags[0] || ''}</p>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
