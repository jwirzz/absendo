import { useEffect, useRef, useState } from "react";

/**
 * Zählt eine Zahl hoch, sobald sie ins Sichtfeld kommt.
 * Nur transform/opacity-freundlich (reines Textupdate), respektiert prefers-reduced-motion.
 */
function CountUp({
    value,
    duration = 900,
    className,
}: {
    value: number;
    duration?: number;
    className?: string;
}) {
    const ref = useRef<HTMLSpanElement>(null);
    const [display, setDisplay] = useState(0);
    const startedRef = useRef(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;

        const prefersReduced =
            typeof window.matchMedia === "function" &&
            window.matchMedia("(prefers-reduced-motion: reduce)").matches;

        const run = () => {
            if (startedRef.current) return;
            startedRef.current = true;

            if (prefersReduced || value <= 0) {
                setDisplay(value);
                return;
            }

            const start = performance.now();
            const tick = (now: number) => {
                const t = Math.min(1, (now - start) / duration);
                // emil ease-out: schnell starten, sanft auslaufen
                const eased = 1 - Math.pow(1 - t, 3);
                setDisplay(Math.round(value * eased));
                if (t < 1) requestAnimationFrame(tick);
            };
            requestAnimationFrame(tick);
        };

        if (typeof IntersectionObserver !== "function") {
            run();
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries.some((e) => e.isIntersecting)) {
                    run();
                    observer.disconnect();
                }
            },
            { threshold: 0.4 },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, [value, duration]);

    return (
        <span ref={ref} className={className}>
            {display.toLocaleString("de-CH")}
        </span>
    );
}

export default CountUp;
