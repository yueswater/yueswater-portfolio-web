import React from 'react';
import { Github, Linkedin, Mail, Globe } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useI18n } from '../i18n';

export default function Contact() {
    const { t } = useI18n();

    return (
        <section id="contact" className="border-t border-[#020202]/20 pt-16 pb-12">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-12">
                <div>
                    <h2 className="text-4xl md:text-6xl font-bold tracking-tighter mb-6">{t('contact.title')}</h2>
                    <Link
                        to="/quote"
                        className="hover-fill text-2xl md:text-4xl font-light border-b border-[#020202] pb-1"
                    >
                        {t('contact.cta')}
                    </Link>
                </div>

                <div className="flex gap-4">
                    <a href="https://github.com/yueswater" className="hover-icon-shrink">
                        <Github size={28} />
                    </a>
                    <a href="https://www.linkedin.com/in/anthonysung/" className="hover-icon-shrink">
                        <Linkedin size={28} />
                    </a>
                    <a href="mailto:sungpinyue@gmail.com" className="hover-icon-shrink">
                        <Mail size={28} />
                    </a>
                    <a href="https://yueswater.com" className="hover-icon-shrink">
                        <Globe size={28} />
                    </a>
                </div>
            </div>
        </section>
    );
}
