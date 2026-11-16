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

  // Lines start offset, line up at mid-scroll (fully readable), then continue past.
  const a = useTransform(p, [0, 1], reduce ? ["0vw", "0vw"] : ["8vw", "-8vw"]);
  const b = useTransform(p, [0, 1], reduce ? ["0vw", "0vw"] : ["-8vw", "8vw"]);

  const line =
    "text-[clamp(2rem,9vw,13rem)] leading-[0.88] font-black tracking-tighter whitespace-nowrap uppercase [font-stretch:125%]";

  return (
    <section
      ref={ref}
      className="relative flex min-h-screen flex-col justify-center overflow-hidden bg-paper px-[4vw] py-[12vh] text-ink"
    >
      <motion.p style={{ x: a }} className={line}>The light</motion.p>
      <motion.p style={{ x: b }} className={line}>changes in</motion.p>
      <motion.p style={{ x: a }} className={line}>
        <span className="inline-block -rotate-2 bg-signal px-[0.15em]">4.2</span>
      </motion.p>
      <motion.p style={{ x: b }} className={line}>seconds.</motion.p>
    </section>
  );
}