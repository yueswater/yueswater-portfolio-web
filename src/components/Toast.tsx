import React, { createContext, useCallback, useContext, useState } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface Toast {
    id: number;
    message: string;
    type: 'success' | 'error';
}

interface ToastContextValue {
    toast: (message: string, type?: 'success' | 'error') => void;
}

const ToastContext = createContext<ToastContextValue>(null!);

let nextId = 0;

export function ToastProvider({ children }: { children: React.ReactNode }) {
    const [toasts, setToasts] = useState<Toast[]>([]);

    const remove = useCallback((id: number) => {
        setToasts(prev => prev.filter(t => t.id !== id));
    }, []);

    const addToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
        const id = ++nextId;
        setToasts(prev => [...prev, { id, message, type }]);
        setTimeout(() => remove(id), 3000);
    }, [remove]);

    return (
        <>
            {React.createElement(ToastContext.Provider, { value: { toast: addToast } }, children)}
            {createPortal(
                <div style={{ position: 'fixed', top: '5rem', right: '1.5rem', zIndex: 9999, display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <AnimatePresence>
                        {toasts.map(t => (
                            <motion.div
                                key={t.id}
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                                transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
                                className={`flex items-center gap-3 pl-5 pr-3 py-3 text-sm font-medium tracking-wide shadow-lg ${t.type === 'error'
                                    ? 'bg-white text-red-600'
                                    : 'bg-white text-[#020202]'
                                    }`}
                            >
                                <span>{t.message}</span>
                                <button onClick={() => remove(t.id)} className="opacity-40 hover:opacity-100 transition-opacity">
                                    <X size={14} />
                                </button>
                            </motion.div>
                        ))}
                    </AnimatePresence>
                </div>,
                document.body
            )}
        </>
    );
}

export function useToast() {
    return useContext(ToastContext);
}
