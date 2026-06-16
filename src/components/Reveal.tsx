import { useEffect, useRef, useState, type ReactNode } from "react";

interface RevealProps {
    children: ReactNode;
    /** Verzögerung in ms für gestaffelte Sequenzen (30–80ms zwischen Items) */
    delay?: number;
    className?: string;
    as?: "div" | "section" | "article" | "li";
}

/**
 * Blendet seinen Inhalt beim Scrollen einmalig ein (translateY + opacity).
 * Fällt auf "sofort sichtbar" zurück, wenn IntersectionObserver fehlt.
 * Bewegung wird global via prefers-reduced-motion in index.css deaktiviert.
 */
function Reveal({ children, delay = 0, className = "", as = "div" }: RevealProps) {
    const ref = useRef<HTMLElement | null>(null);
    const [visible, setVisible] = useState(false);

    useEffect(() => {
        const node = ref.current;
        if (!node) return;
        if (typeof IntersectionObserver === "undefined") {
            setVisible(true);
            return;
        }

        const observer = new IntersectionObserver(
            (entries) => {
                if (entries[0]?.isIntersecting) {
                    setVisible(true);
                    observer.disconnect();
                }
            },
            { threshold: 0.15, rootMargin: "0px 0px -80px 0px" },
        );
        observer.observe(node);
        return () => observer.disconnect();
    }, []);

    const Tag = as;
    return (
        <Tag
            ref={ref as never}
            className={`reveal ${visible ? "is-visible" : ""} ${className}`}
            style={delay ? { transitionDelay: `${delay}ms` } : undefined}
        >
            {children}
        </Tag>
    );
}

export default Reveal;
