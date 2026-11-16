"use client";

import { useRef } from "react";
import {
  motion,
  useReducedMotion,
  useScroll,
  useSpring,
  useTransform,
  type MotionValue,
} from "motion/react";
import clsx from "clsx";

// Clip path covering one side of a line through the screen center.
function halfPlane(deg: number, side: 1 | -1) {
  const r = (deg * Math.PI) / 180;
  const L = 150; // vmax, far enough to cover any screen
  const dx = Math.cos(r) * L;
  const dy = Math.sin(r) * L;
  const nx = -Math.sin(r) * L * side;
  const ny = Math.cos(r) * L * side;
  const pts = [
    [dx, dy],
    [-dx, -dy],
    [-dx + nx, -dy + ny],
    [dx + nx, dy + ny],
  ];
  const p = pts
    .map(([x, y]) => `calc(50% + ${x.toFixed(2)}vmax) calc(50% + ${y.toFixed(2)}vmax)`)
    .join(",");
  return `polygon(${p})`;
}

function Layer({
  tone,
  clip,
  hidden,
}: {
  tone: "dark" | "light";
  clip: MotionValue<string>;
  hidden?: boolean;
}) {
  const dark = tone === "dark";
  const Heading = hidden ? "div" : "h1";

  return (
    <motion.div
      aria-hidden={hidden}
      style={{ clipPath: clip }}
      className={clsx(
        "absolute inset-0",
        dark ? "bg-ink text-paper" : "bg-paper text-ink",
      )}
    >
      <div className="absolute top-[12vh] left-[6vw]">
        <p className="text-xs tracking-[0.35em] uppercase sm:text-sm">
          Signal timing, explorable
        </p>
        <Heading className="mt-4 text-[21vw] leading-[0.78] font-bold tracking-tighter uppercase">
          Grid
          <br />
          <span
            className={clsx(
              "ml-[16vw] text-signal",
              !dark && "[-webkit-text-stroke:3px_#0a0a0a]",
            )}
          >
            Lock
          </span>
        </Heading>
      </div>

      <div className="absolute right-[8vw] bottom-[10vh] flex gap-4">
        {["bg-go", "bg-caution", "bg-stop"].map((c) => (
          <span
            key={c}
            className={clsx(
              "size-[clamp(1.5rem,4vw,3.5rem)] rounded-full ring-4",
              c,
              dark ? "ring-paper/20" : "ring-ink",
            )}
          />
        ))}
      </div>

      <p className="absolute bottom-[10vh] left-[6vw] text-xs tracking-[0.35em] uppercase">
        Scroll ↓
      </p>
    </motion.div>
  );
}

export default function Hero() {
  const ref = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end end"],
  });

  const raw = useTransform(scrollYProgress, [0, 1], reduce ? [28, 28] : [28, 118]);
  const angle = useSpring(raw, { stiffness: 80, damping: 24, mass: 0.6 });

  const clipDark = useTransform(angle, (a) => halfPlane(a, 1));
  const clipLight = useTransform(angle, (a) => halfPlane(a, -1));

  return (
    <div ref={ref} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <Layer tone="dark" clip={clipDark} />
        <Layer tone="light" clip={clipLight} hidden />
        <motion.div
          style={{ x: "-50%", y: "-50%", rotate: angle }}
          className="pointer-events-none absolute top-1/2 left-1/2 h-[6px] w-[300vmax] bg-signal"
        />
      </div>
    </div>
  );
}