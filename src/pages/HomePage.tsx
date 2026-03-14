import React from 'react';
import Hero from '../components/Hero';
import Gallery from '../components/Gallery';
import Contact from '../components/Contact';

export default function HomePage() {
    return (
        <main className="px-6 md:px-12 lg:px-24 pt-40 pb-24 max-w-[1800px] mx-auto">
            <Hero />
            <Gallery />
            <Contact />
        </main>
    );
}
