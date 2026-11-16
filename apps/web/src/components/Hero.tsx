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

const PIVOT = { x: 62, y: 44 }; // off-center seam pivot, in %

// Clip path covering one side of a line through PIVOT at `deg`.
function halfPlane(deg: number, side: 1 | -1) {
  const r = (deg * Math.PI) / 180;
  const L = 160; // vmax, far enough to cover any screen
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
    .map(
      ([x, y]) =>
        `calc(${PIVOT.x}% + ${x.toFixed(2)}vmax) calc(${PIVOT.y}% + ${y.toFixed(2)}vmax)`,
    )
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
  const Title = hidden ? "div" : "h1";

  return (
    <motion.div
      aria-hidden={hidden}
      style={{ clipPath: clip }}
      className={clsx(
        "absolute inset-0",
        dark ? "bg-ink text-paper" : "bg-paper text-ink",
      )}
    >
      <div className="absolute top-[8vh] left-[4vw] flex gap-3">
        {["bg-go", "bg-caution", "bg-stop"].map((c) => (
          <span
            key={c}
            className={clsx(
              "size-3 rounded-full ring-1 sm:size-4",
              c,
              dark ? "ring-slate/60" : "ring-slate",
            )}
          />
        ))}
      </div>

      {/* wordmark: one word, middle-left, huge */}
      <div className="absolute top-1/2 left-[4vw] -translate-y-1/2">
        <p className="mb-4 text-[0.65rem] tracking-[0.35em] text-slate uppercase sm:text-xs">
          Signal timing, explorable
        </p>
        <Title className="text-[clamp(4rem,16vw,22rem)] leading-[0.8] font-bold tracking-tighter uppercase">
          Grid
          <span className={dark ? "text-signal" : "text-slate"}>Lock</span>
        </Title>
      </div>

      <p className="absolute right-[4vw] bottom-[8vh] text-[0.65rem] tracking-[0.35em] text-slate uppercase sm:text-xs">
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

  const raw = useTransform(scrollYProgress, [0, 1], reduce ? [24, 24] : [24, 114]);
  const angle = useSpring(raw, { stiffness: 80, damping: 24, mass: 0.6 });

  const clipDark = useTransform(angle, (a) => halfPlane(a, 1));
  const clipLight = useTransform(angle, (a) => halfPlane(a, -1));

  return (
    <div ref={ref} className="relative h-[300vh]">
      <div className="sticky top-0 h-screen overflow-hidden">
        <Layer tone="dark" clip={clipDark} />
        <Layer tone="light" clip={clipLight} hidden />
        <motion.div
          style={{
            left: `${PIVOT.x}%`,
            top: `${PIVOT.y}%`,
            x: "-50%",
            y: "-50%",
            rotate: angle,
          }}
          className="pointer-events-none absolute h-[2px] w-[320vmax] bg-signal"
        />
      </div>
    </div>
  );
}