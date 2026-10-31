import { useEffect, useRef, useState } from 'react';

// Marketing previews only: never changes a registered display or its playlist.
export default function useDemoCycle(length, paused = false) {
  const frameRef = useRef(null);
  const [index, setIndex] = useState(0);
  useEffect(() => {
    if (paused || length < 2) return;
    const motion = window.matchMedia('(prefers-reduced-motion: reduce)');
    let visible = false;
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
    if (frameRef.current) observer.observe(frameRef.current);
    const timer = window.setInterval(() => {
      if (visible && !document.hidden && !motion.matches) setIndex(value => (value + 1) % length);
    }, 3000);
    return () => { observer.disconnect(); window.clearInterval(timer); };
  }, [length, paused]);
  return { frameRef, index };
}
