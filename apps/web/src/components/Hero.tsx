"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useTransform } from "motion/react";

export default function Hero() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const x = useTransform(scrollYProgress, [0, 1], reduce ? ["0vw", "0vw"] : ["0vw", "-14vw"]);

  return (
    <section ref={ref} className="relative h-screen overflow-hidden bg-signal text-ink">
      <div className="absolute top-[6vh] left-[4vw] flex gap-3">
        {["bg-go", "bg-caution", "bg-stop"].map((c) => (
          <span key={c} className={`size-3 rounded-full ring-1 ring-ink/50 sm:size-4 ${c}`} />
        ))}
      </div>

      <motion.div style={{ x }} className="absolute top-1/2 left-[4vw] -translate-y-1/2">
        <h1 className="text-[clamp(4rem,15vw,22rem)] leading-[0.8] font-black tracking-tighter uppercase [font-stretch:125%]">
          Gridlock
        </h1>
        <p className="mt-6 max-w-md text-lg font-medium sm:text-xl">
          Slow down. Look first. The light changes in 4.2 seconds.
        </p>
      </motion.div>

      <p className="absolute right-[4vw] bottom-[6vh] text-xs tracking-[0.35em] uppercase">
        Scroll ↓
      </p>
    </section>
  );
}