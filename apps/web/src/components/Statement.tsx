"use client";

import { useRef } from "react";
import { motion, useReducedMotion, useScroll, useSpring, useTransform } from "motion/react";

export default function Statement() {
  const ref = useRef<HTMLElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.5 });

  const a = useTransform(p, [0, 1], reduce ? ["0vw", "0vw"] : ["12vw", "-18vw"]);
  const b = useTransform(p, [0, 1], reduce ? ["0vw", "0vw"] : ["-20vw", "8vw"]);

  const line =
    "text-[clamp(3.5rem,13vw,18rem)] leading-[0.85] font-black tracking-tighter whitespace-nowrap uppercase [font-stretch:125%]";

  return (
    <section ref={ref} className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-paper py-[12vh] text-ink">
      <motion.p style={{ x: a }} className={line}>
        The light changes
      </motion.p>
      <motion.p style={{ x: b }} className={line}>
        in{" "}
        <span className="inline-block -rotate-2 bg-signal px-[0.15em]">4.2</span>{" "}
        seconds.
      </motion.p>
    </section>
  );
}