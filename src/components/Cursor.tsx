import { useEffect, useRef, useState, useCallback } from 'react';

interface Trail {
    x: number;
    y: number;
    alpha: number;
}

export default function Cursor() {
    const dotRef = useRef<HTMLDivElement>(null);
    const ringRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const mouse = useRef({ x: -100, y: -100 });
    const ring = useRef({ x: -100, y: -100 });
    const trails = useRef<Trail[]>([]);
    const [hovering, setHovering] = useState(false);
    const [clicking, setClicking] = useState(false);
    const [hidden, setHidden] = useState(true);
    const rafRef = useRef<number>(0);

    const animate = useCallback(() => {
        const mx = mouse.current.x;
        const my = mouse.current.y;

        // Lerp ring
        ring.current.x += (mx - ring.current.x) * 0.20;
        ring.current.y += (my - ring.current.y) * 0.20;

        // Dot — instant
        if (dotRef.current) {
            const s = clicking ? 4 : hovering ? 0 : 8;
            dotRef.current.style.cssText = `
                position:fixed;top:0;left:0;pointer-events:none;z-index:9999;
                width:${s}px;height:${s}px;border-radius:50%;
                background:#020202;
                transform:translate(${mx}px,${my}px) translate(-50%,-50%);
                opacity:${hidden ? 0 : 1};
                transition:width 0.25s,height 0.25s,opacity 0.3s;
            `;
        }

        // Ring — delayed
        if (ringRef.current) {
            const scale = clicking ? 0.6 : hovering ? 2.2 : 1;
            const borderW = hovering ? 2 : 1.5;
            const bg = hovering ? 'rgba(2,2,2,0.06)' : 'transparent';
            ringRef.current.style.cssText = `
                position:fixed;top:0;left:0;pointer-events:none;z-index:9998;
                width:40px;height:40px;border-radius:50%;
                border:${borderW}px solid rgba(2,2,2,${hovering ? 0.5 : 0.25});
                background:${bg};
                transform:translate(${ring.current.x}px,${ring.current.y}px) translate(-50%,-50%) scale(${scale});
                opacity:${hidden ? 0 : 1};
                transition:border 0.3s,background 0.3s,opacity 0.3s,width 0.3s,height 0.3s;
            `;
        }

        // Trail particles on canvas
        const canvas = canvasRef.current;
        if (canvas) {
            const ctx = canvas.getContext('2d');
            if (ctx) {
                canvas.width = window.innerWidth;
                canvas.height = window.innerHeight;
                ctx.clearRect(0, 0, canvas.width, canvas.height);

                // Decay trails
                for (let i = trails.current.length - 1; i >= 0; i--) {
                    trails.current[i].alpha -= 0.025;
                    if (trails.current[i].alpha <= 0) {
                        trails.current.splice(i, 1);
                    }
                }

                // Draw trails
                for (const t of trails.current) {
                    ctx.beginPath();
                    ctx.arc(t.x, t.y, 2.5 * t.alpha, 0, Math.PI * 2);
                    ctx.fillStyle = `rgba(2, 2, 2, ${t.alpha * 0.35})`;
                    ctx.fill();
                }
            }
        }

        rafRef.current = requestAnimationFrame(animate);
    }, [hovering, clicking, hidden]);

    useEffect(() => {
        let lastTrailTime = 0;

        const onMove = (e: MouseEvent) => {
            mouse.current = { x: e.clientX, y: e.clientY };
            if (hidden) setHidden(false);

            // Add trail particle (throttled)
            const now = Date.now();
            if (now - lastTrailTime > 20) {
                trails.current.push({ x: e.clientX, y: e.clientY, alpha: 1 });
                if (trails.current.length > 40) trails.current.shift();
                lastTrailTime = now;
            }
        };

        const onLeave = () => setHidden(true);
        const onEnter = () => setHidden(false);
        const onDown = () => setClicking(true);
        const onUp = () => setClicking(false);

        const onOver = (e: MouseEvent) => {
            const target = e.target as HTMLElement;
            const hit = target.closest('a, button, [role="button"], input, textarea, select, label, .hover-fill, .hover-icon-shrink');
            setHovering(!!hit);
        };

        document.addEventListener('mousemove', onMove);
        document.addEventListener('mouseover', onOver);
        document.addEventListener('mouseenter', onEnter);
        document.addEventListener('mouseleave', onLeave);
        document.addEventListener('mousedown', onDown);
        document.addEventListener('mouseup', onUp);
        rafRef.current = requestAnimationFrame(animate);

        return () => {
            document.removeEventListener('mousemove', onMove);
            document.removeEventListener('mouseover', onOver);
            document.removeEventListener('mouseenter', onEnter);
            document.removeEventListener('mouseleave', onLeave);
            document.removeEventListener('mousedown', onDown);
            document.removeEventListener('mouseup', onUp);
            cancelAnimationFrame(rafRef.current);
        };
    }, [animate]);

    // No custom cursor on touch devices
    if (typeof window !== 'undefined' && window.matchMedia('(pointer: coarse)').matches) return null;

    return (
        <>
            <canvas
                ref={canvasRef}
                style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 9997 }}
            />
            <div ref={dotRef} />
            <div ref={ringRef} />
        </>
    );
}
