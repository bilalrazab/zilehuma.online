import { useState, useEffect, useRef, Suspense, ReactNode } from "react";

interface LazyVisibleProps {
  children: ReactNode;
  rootMargin?: string;
  fallback?: ReactNode;
}

/** Only renders children once the container scrolls into view */
const LazyVisible = ({ children, rootMargin = "200px", fallback = null }: LazyVisibleProps) => {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin }
    );
    obs.observe(el);
    return () => obs.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref}>
      {visible ? <Suspense fallback={fallback}>{children}</Suspense> : fallback}
    </div>
  );
};

export default LazyVisible;
