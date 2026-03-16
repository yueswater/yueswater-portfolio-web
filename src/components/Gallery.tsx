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

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
                {projects.map((project, index) => (
                    <motion.div
                        key={project.id}
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true, margin: "-100px" }}
                        transition={{ duration: 0.8, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                        className="group relative flex flex-col overflow-hidden bg-[#e5e5e5] border border-[#020202]/10 rounded-xl shadow-sm hover:shadow-md transition-shadow duration-500"
                    >
                        {/* Safari Window Header */}
                        <div className="h-8 md:h-10 border-b border-[#020202]/10 flex items-center px-4 gap-2 shrink-0 bg-[#f3f3f3] z-10">
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ff5f56]" />
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#ffbd2e]" />
                            <div className="w-2.5 h-2.5 md:w-3 md:h-3 rounded-full bg-[#27c93f]" />
                        </div>

                        {/* Safari Window Content */}
                        <div className="relative flex-1 aspect-[4/3] md:aspect-[16/10] overflow-hidden bg-[#e5e5e5]">
                            <img
                                src={project.image}
                                alt={project.name_en}
                                className="w-full h-full object-cover object-top scale-[1.25] transition-all duration-700 ease-out group-hover:scale-[1.3] group-hover:grayscale"
                            />
                            <div className="absolute inset-0 bg-[#020202]/0 group-hover:bg-[#020202]/30 transition-colors duration-500" />
                            <div className="absolute bottom-0 left-0 p-6 md:p-8 translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500 ease-out">
                                <h3 className="text-[#f3f3f3] text-xl md:text-3xl font-bold mb-1 md:mb-2">{project.name_zh}</h3>
                                <p className="text-[#f3f3f3]/80 text-xs md:text-sm uppercase tracking-widest">{project.tags[0] || ''}</p>
                            </div>
                        </div>
                    </motion.div>
                ))}
            </div>
        </section>
    );
}
