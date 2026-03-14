import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { API_BASE } from '../api';
import { useI18n } from '../i18n';

interface Service {
    id: string;
    name: string;
    category: string;
    thumbnail: string;
    description: string;
    price: number | null;
    created_at: string;
}

export default function ServicesPage() {
    const { t } = useI18n();
    const [services, setServices] = useState<Service[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        fetch(`${API_BASE}/api/services`)
            .then(res => res.json())
            .then(data => { setServices(data); setLoading(false); })
            .catch(() => setLoading(false));
    }, []);

    const categories = [...new Set(services.map(s => s.category))];

    return (
        <main className="px-6 md:px-12 lg:px-24 pt-40 pb-24 max-w-[1800px] mx-auto">
            <motion.div
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 1, ease: [0.16, 1, 0.3, 1] }}
            >
                <h1 className="text-5xl md:text-7xl lg:text-[9rem] font-black leading-[0.85] tracking-tighter mb-6 uppercase">
                    {t('services.title')}
                </h1>
                <p className="text-xl md:text-2xl font-light max-w-2xl leading-relaxed opacity-80 mb-20">
                    {t('services.subtitle')}
                </p>
            </motion.div>

            {loading ? (
                <div className="text-center py-20 opacity-60 text-lg">{t('services.loading')}</div>
            ) : services.length === 0 ? (
                <div className="text-center py-20 opacity-60 text-lg">{t('services.empty')}</div>
            ) : (
                categories.map(category => (
                    <section key={category} className="mb-20">
                        <div className="flex justify-between items-end mb-8 border-b border-[#020202]/20 pb-4">
                            <h2 className="text-2xl md:text-4xl font-bold tracking-tight">{category}</h2>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                            {services
                                .filter(s => s.category === category)
                                .map((service, index) => (
                                    <motion.div
                                        key={service.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        whileInView={{ opacity: 1, y: 0 }}
                                        viewport={{ once: true }}
                                        transition={{ duration: 0.6, delay: index * 0.1, ease: [0.16, 1, 0.3, 1] }}
                                        className="group border border-[#020202]/10 hover:border-[#020202]/40 transition-colors duration-300"
                                    >
                                        <div className="aspect-[16/10] overflow-hidden bg-[#e5e5e5]">
                                            <img
                                                src={service.thumbnail}
                                                alt={service.name}
                                                className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="p-6">
                                            <h3 className="text-xl font-bold mb-2">{service.name}</h3>
                                            <p className="text-sm opacity-60 leading-relaxed line-clamp-3 mb-4">
                                                {service.description.replace(/[#*`_~]/g, '')}
                                            </p>
                                            <div className="flex justify-between items-center gap-4">
                                                <span className="font-semibold text-lg truncate">
                                                    {service.price != null ? `NT$ ${service.price.toLocaleString('zh-TW')}` : t('services.negotiate')}
                                                </span>
                                                <Link
                                                    to={`/quote?service=${service.id}`}
                                                    className="hover-fill inline-flex items-center gap-2 text-sm font-medium uppercase tracking-widest shrink-0 whitespace-nowrap"
                                                >
                                                    {t('services.quote')} <ArrowRight size={16} />
                                                </Link>
                                            </div>
                                        </div>
                                    </motion.div>
                                ))}
                        </div>
                    </section>
                ))
            )}
        </main>
    );
}
