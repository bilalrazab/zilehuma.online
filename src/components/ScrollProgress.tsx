import { useEffect, useState } from "react";
import { CalendarDays } from "lucide-react";

const ScrollProgress = () => {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? (window.scrollY / h) * 100 : 0);
    };
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <div className="scroll-progress" style={{ width: `${progress}%` }} />
      {/* Floating Book Button */}
      <a
        href="#booking"
        className="fixed bottom-6 right-6 z-40 glass rounded-full p-4 shadow-lg hover:scale-110 transition-transform duration-300"
        aria-label="Book a session"
      >
        <CalendarDays className="w-5 h-5 text-primary" />
      </a>
    </>
  );
};

export default ScrollProgress;
