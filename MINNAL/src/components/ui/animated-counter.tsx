import { useEffect, useRef, useState } from "react";
import { motion, useInView, animate } from "framer-motion";

export function AnimatedCounter({ value, duration = 1.1 }: { value: number; duration?: number }) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: false, margin: "-20% 0px" });
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (!inView) return;
    const controls = animate(display, value, {
      duration,
      ease: "easeOut",
      onUpdate: (v) => setDisplay(Math.round(v)),
    });
    return () => controls.stop();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value, inView]);

  return <motion.span ref={ref}>{display}</motion.span>;
}
