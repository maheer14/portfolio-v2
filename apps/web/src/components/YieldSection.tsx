"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
} from "motion/react";

const TRI = "4,8 96,8 50,86";
const TRI_INNER = "16,17 84,17 50,70";

export default function YieldSection() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });
  const p = useSpring(scrollYProgress, { stiffness: 90, damping: 26, mass: 0.5 });

  // With reduced motion, everything just sits at its final state.
  function useMap(range: number[], out: number[], still: number) {
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return useTransform(p, range, reduce ? [still, still] : out);
  }

  const pole = useMap([0.05, 0.35], [0, 1], 1);
  const outline = useMap([0.3, 0.55], [0, 1], 1);
  const fill = useMap([0.5, 0.65], [0, 1], 1);
  const headScale = useMap([0.3, 0.6], [0.85, 1], 1);
  const text = useMap([0.55, 0.7], [0, 1], 1);
  const copy = useMap([0.4, 0.6], [0, 1], 1);
  const copyY = useMap([0.4, 0.6], [40, 0], 0);
  const exit = useMap([0.85, 1], [1, 0], 1);
  const exitY = useMap([0.85, 1], [0, -60], 0);

  return (
    <section ref={ref} className="relative h-[320vh] bg-ink text-paper">
      <div className="sticky top-0 h-screen overflow-hidden">
        <motion.div
          style={{ opacity: exit, y: exitY }}
          className="grid h-full grid-cols-1 md:grid-cols-2"
        >
          {/* left half: the sign builds itself */}
          <div className="relative h-full">
            <motion.div
              style={{ scaleY: pole, originY: 1 }}
              className="absolute bottom-0 left-1/2 h-[82vh] w-[1.4vmin] -translate-x-1/2 bg-slate"
            />
            <motion.div
              style={{ scale: headScale }}
              className="absolute top-[10vh] left-1/2 w-[min(44vw,72vh)] -translate-x-1/2"
            >
              <svg viewBox="0 0 100 90" className="w-full overflow-visible" role="img" aria-label="Yield sign">
                <motion.polygon points={TRI} fill="#ffd60a" style={{ opacity: fill }} />
                <motion.polygon
                  points={TRI}
                  fill="none"
                  stroke="#f2f1ec"
                  strokeWidth="3"
                  strokeLinejoin="round"
                  style={{ pathLength: outline }}
                />
                <motion.g style={{ opacity: text }}>
                  <polygon points={TRI_INNER} fill="none" stroke="#0b0b0a" strokeWidth="2.5" strokeLinejoin="round" />
                  <text
                    x="50"
                    y="37"
                    textAnchor="middle"
                    fontSize="10"
                    fontWeight="700"
                    fill="#0b0b0a"
                    className="font-sans"
                    style={{ letterSpacing: "0.06em" }}
                  >
                    YIELD
                  </text>
                </motion.g>
              </svg>
            </motion.div>
          </div>

          {/* right half: copy (placeholder text for now) */}
          <motion.div
            style={{ opacity: copy, y: copyY }}
            className="flex h-full flex-col justify-center px-[6vw]"
          >
            <p className="text-xs tracking-[0.35em] text-slate uppercase">01 / Yield</p>
            <h2 className="mt-4 text-[clamp(2.5rem,6vw,6rem)] leading-[0.9] font-bold tracking-tight uppercase">
              Slow down.
              <br />
              <span className="text-signal">Look first.</span>
            </h2>
            <p className="mt-6 max-w-md text-slate">
              Placeholder copy. This is where the first idea of the project gets
              introduced before you move on.
            </p>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}