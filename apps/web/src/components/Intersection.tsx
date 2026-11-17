"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import {
  GEOM,
  runHeadless,
  websterPlan,
  type Phase,
  type Plan,
  type Demand,
  type Snapshot,
} from "@/sim/engine";

const COLORS: Record<Phase, string> = {
  green: "#6aa57a",
  amber: "#ffd60a",
  red: "#c4564b",
};
const DIM = "#2a2a28";
const VIEW = 62;
const HALF_ROAD = GEOM.laneOff + 3;
const AMBER = 3;
const ALL_RED = 2;
const NAMES = ["N", "E", "S", "W"];
const HEADING = [Math.PI / 2, Math.PI, -Math.PI / 2, 0];

function toWorld(a: number, s: number, o: number) {
  if (a === 0) return { x: -o, y: s };
  if (a === 1) return { x: -s, y: -o };
  if (a === 2) return { x: o, y: -s };
  return { x: s, y: o };
}

function draw(
  g: CanvasRenderingContext2D,
  w: number,
  h: number,
  snap: Snapshot,
  ahead: number,
  family: string,
) {
  g.clearRect(0, 0, w, h);
  g.save();
  g.translate(w / 2, h / 2);
  const k = Math.min(w, h) / (2 * VIEW);
  g.scale(k, k);

  // roads
  g.fillStyle = "#1b1b1a";
  g.fillRect(-HALF_ROAD, -VIEW, HALF_ROAD * 2, VIEW * 2);
  g.fillRect(-VIEW, -HALF_ROAD, VIEW * 2, HALF_ROAD * 2);

  // muted center lines, so they don't compete with the cars
  g.strokeStyle = "#5c5c56";
  g.lineWidth = 0.25;
  g.setLineDash([2, 2.5]);
  g.beginPath();
  g.moveTo(0, -VIEW); g.lineTo(0, -HALF_ROAD);
  g.moveTo(0, HALF_ROAD); g.lineTo(0, VIEW);
  g.moveTo(-VIEW, 0); g.lineTo(-HALF_ROAD, 0);
  g.moveTo(HALF_ROAD, 0); g.lineTo(VIEW, 0);
  g.stroke();
  g.setLineDash([]);

  for (let a = 0; a < 4; a++) {
    const phase = a % 2 === 0 ? snap.ns : snap.ew;

    // stop bar
    const p1 = toWorld(a, GEOM.stop, 0.3);
    const p2 = toWorld(a, GEOM.stop, HALF_ROAD - 0.3);
    g.strokeStyle = COLORS[phase];
    g.lineWidth = 0.9;
    g.beginPath();
    g.moveTo(p1.x, p1.y);
    g.lineTo(p2.x, p2.y);
    g.stroke();

    // signal head: red on top, amber, green on the bottom
    const head = toWorld(a, GEOM.stop - 1.5, HALF_ROAD + 2.6);
    g.fillStyle = "#0b0b0a";
    g.strokeStyle = "#3a3a37";
    g.lineWidth = 0.25;
    g.beginPath();
    g.roundRect(head.x - 1.5, head.y - 4, 3, 8, 0.8);
    g.fill();
    g.stroke();
    const lamps: Phase[] = ["red", "amber", "green"];
    lamps.forEach((l, i) => {
      g.fillStyle = phase === l ? COLORS[l] : DIM;
      g.beginPath();
      g.arc(head.x, head.y + (i - 1) * 2.5, 1, 0, Math.PI * 2);
      g.fill();
    });

    // road label + queue count
    const lab = toWorld(a, -VIEW + 7, HALF_ROAD + 9);
    g.textAlign = "center";
    g.textBaseline = "middle";
    g.fillStyle = "#ffd60a";
    g.font = `800 4px ${family}`;
    g.fillText(NAMES[a], lab.x, lab.y - 2);
    g.fillStyle = snap.queues[a] > 0 ? "#f2f1ec" : "#5c5c56";
    g.font = `500 2.6px ${family}`;
    g.fillText(`${snap.queues[a]} waiting`, lab.x, lab.y + 2);
  }

  // cars: yellow while moving, white while stopped. Positions are estimated
  // forward from the last snapshot so motion stays smooth between steps.
  for (const c of snap.cars) {
    const pos = c.p + c.v * ahead;
    const mid = toWorld(c.a, pos - GEOM.carLen / 2, GEOM.laneOff);
    const len = GEOM.carLen;
    const wid = 2.6;
    g.save();
    g.translate(mid.x, mid.y);
    g.rotate(HEADING[c.a]);
    g.fillStyle = c.v < 0.5 ? "#f2f1ec" : "#ffd60a";
    g.beginPath();
    g.roundRect(-len / 2, -wid / 2, len, wid, 0.8);
    g.fill();
    g.fillStyle = "rgba(11,11,10,0.55)";
    g.fillRect(len * 0.1, -wid / 2 + 0.4, len * 0.2, wid - 0.8);
    g.restore();
  }
  g.restore();
}

function Slider({
  label,
  value,
  min,
  max,
  unit,
  onChange,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  unit: string;
  onChange: (v: number) => void;
}) {
  return (
    <label className="block">
      <div className="flex justify-between text-xs tracking-[0.25em] uppercase">
        <span className="text-signal/70">{label}</span>
        <span>
          {value}
          {unit}
        </span>
      </div>
      <input
        type="range"
        min={min}
        max={max}
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="mt-1 w-full accent-[#ffd60a]"
      />
    </label>
  );
}

const fmt = (d: number) => {
  const v = Math.min(d, 999);
  return v >= 100 ? v.toFixed(0) : v.toFixed(1);
};

export default function Intersection() {
  const wrapRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const workerRef = useRef<Worker | null>(null);
  const snapRef = useRef<{ snap: Snapshot; at: number } | null>(null);
  const speedRef = useRef(4);
  const tick = useRef(0);

  const [nsGreen, setNsGreen] = useState(25);
  const [ewGreen, setEwGreen] = useState(25);
  const [demandNs, setDemandNs] = useState(12);
  const [demandEw, setDemandEw] = useState(12);
  const [speed, setSpeed] = useState(4);
  const [stats, setStats] = useState({ delay: 0, done: 0 });

  // Fixed-seed 10-minute test of your plan vs. the Webster plan.
  const test = useMemo(() => {
    const demand: Demand = { ns: demandNs, ew: demandEw };
    const best = websterPlan(demand, AMBER, ALL_RED);
    const mine = runHeadless({ nsGreen, ewGreen, amber: AMBER, allRed: ALL_RED }, demand, 7, 600);
    const opt = runHeadless(best, demand, 7, 600);
    return { best, mine, opt };
  }, [nsGreen, ewGreen, demandNs, demandEw]);

  const saving =
    test.mine.avgDelay > test.opt.avgDelay * 1.03
      ? Math.round((1 - test.opt.avgDelay / test.mine.avgDelay) * 100)
      : 0;

  useEffect(() => {
    const canvas = canvasRef.current!;
    const wrap = wrapRef.current!;
    const g = canvas.getContext("2d")!;
    const family = getComputedStyle(canvas).fontFamily || "sans-serif";
    let w = 0;
    let h = 0;
    let dpr = 1;
    let raf = 0;

    const resize = () => {
      const r = wrap.getBoundingClientRect();
      dpr = window.devicePixelRatio || 1;
      w = r.width;
      h = r.height;
      canvas.width = Math.round(w * dpr);
      canvas.height = Math.round(h * dpr);
    };
    const ro = new ResizeObserver(resize);
    ro.observe(wrap);
    resize();

    const frame = () => {
      const s = snapRef.current;
      if (s) {
        const ahead = Math.min(0.4, ((performance.now() - s.at) / 1000) * speedRef.current);
        g.setTransform(dpr, 0, 0, dpr, 0, 0);
        draw(g, w, h, s.snap, ahead, family);
      }
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);

    const worker = new Worker(new URL("../sim/worker.ts", import.meta.url), { type: "module" });
    workerRef.current = worker;
    worker.onmessage = (e: MessageEvent<Snapshot>) => {
      snapRef.current = { snap: e.data, at: performance.now() };
      if (++tick.current % 4 === 0) setStats({ delay: e.data.avgDelay, done: e.data.completed });
    };

    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      worker.terminate();
    };
  }, []);

  useEffect(() => {
    const plan: Plan = { nsGreen, ewGreen, amber: AMBER, allRed: ALL_RED };
    const demand: Demand = { ns: demandNs, ew: demandEw };
    workerRef.current?.postMessage({ type: "config", plan, demand });
  }, [nsGreen, ewGreen, demandNs, demandEw]);

  useEffect(() => {
    speedRef.current = speed;
    workerRef.current?.postMessage({ type: "speed", speed });
  }, [speed]);

  const preset = (ns: number, ew: number) => {
    setDemandNs(ns);
    setDemandEw(ew);
  };
  const cycle = nsGreen + ewGreen + 2 * (AMBER + ALL_RED);
  const bigNum =
    "text-[clamp(3.5rem,7.5vw,8rem)] leading-[0.85] font-black tracking-tighter whitespace-nowrap [font-stretch:125%] [font-variant-numeric:tabular-nums]";
  const btn = "border border-signal/40 px-3 py-1 text-xs tracking-[0.2em] uppercase";

  return (
    <section className="grid min-h-screen grid-cols-1 items-center gap-[4vw] bg-black p-[4vw] text-signal md:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)]">
      <div ref={wrapRef} className="relative aspect-square max-h-[88vh] w-full min-w-0 self-center">
        <canvas ref={canvasRef} className="absolute inset-0 h-full w-full" />
      </div>

      <div className="flex min-w-0 flex-col gap-6">
        <div>
          <h2 className="text-[clamp(2rem,4vw,4.25rem)] leading-[0.9] font-black tracking-tighter uppercase [font-stretch:125%]">
            You run the lights.
          </h2>
          <p className="mt-3 max-w-md text-sm text-signal/80">
            Cars arrive at random from all four roads. Give each road a green and the clock does the
            rest. Goal: the shortest average wait.
          </p>
        </div>

        <div>
          <p className="text-xs tracking-[0.35em] text-signal/70 uppercase">Live average wait</p>
          <div className="relative overflow-hidden">
            <p className={`${bigNum} invisible`} aria-hidden>
              888.8<span className="text-[0.3em]">s</span>
            </p>
            <p className={`${bigNum} absolute inset-0`}>
              {fmt(stats.delay)}
              <span className="text-[0.3em]">s</span>
            </p>
          </div>
          <p className="text-xs text-signal/70">{stats.done} cars through</p>
        </div>

        <div className="grid grid-cols-2 gap-4 border-y border-signal/30 py-4">
          <div>
            <p className="text-xs tracking-[0.25em] text-signal/70 uppercase">Your plan, 10-min test</p>
            <p className="text-3xl font-black [font-variant-numeric:tabular-nums]">
              {fmt(test.mine.avgDelay)}s
            </p>
          </div>
          <div>
            <p className="text-xs tracking-[0.25em] text-signal/70 uppercase">Webster formula</p>
            <p className="text-3xl font-black [font-variant-numeric:tabular-nums]">
              {fmt(test.opt.avgDelay)}s
            </p>
            <p className="text-xs text-signal/70">
              N–S {test.best.nsGreen}s · E–W {test.best.ewGreen}s
            </p>
          </div>
          <p className="col-span-2 text-sm">
            {saving > 0
              ? `Webster's timing would cut waits by about ${saving}%.`
              : "You match or beat the formula."}{" "}
            <button
              className="underline underline-offset-4"
              onClick={() => {
                setNsGreen(test.best.nsGreen);
                setEwGreen(test.best.ewGreen);
              }}
            >
              Use it
            </button>
          </p>
        </div>

        <div className="space-y-3">
          <Slider label="N–S green" value={nsGreen} min={5} max={60} unit="s" onChange={setNsGreen} />
          <Slider label="E–W green" value={ewGreen} min={5} max={60} unit="s" onChange={setEwGreen} />
          <Slider label="N–S traffic" value={demandNs} min={2} max={30} unit="/min" onChange={setDemandNs} />
          <Slider label="E–W traffic" value={demandEw} min={2} max={30} unit="/min" onChange={setDemandEw} />
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs tracking-[0.25em] text-signal/70 uppercase">Try</span>
          <button className={btn} onClick={() => preset(12, 12)}>Balanced</button>
          <button className={btn} onClick={() => preset(26, 6)}>Rush hour</button>
          <button className={btn} onClick={() => preset(6, 22)}>Side street</button>
          <button className={btn} onClick={() => preset(3, 3)}>Quiet night</button>
        </div>

        <div className="flex flex-wrap items-center gap-2 text-xs tracking-[0.25em] uppercase">
          <span className="text-signal/70">Cycle {cycle}s · Speed</span>
          {[1, 4, 8].map((s) => (
            <button
              key={s}
              onClick={() => setSpeed(s)}
              className={`px-3 py-1 ${speed === s ? "bg-signal text-black" : "border border-signal/40"}`}
            >
              {s}×
            </button>
          ))}
          <button
            onClick={() => workerRef.current?.postMessage({ type: "reset" })}
            className="ml-auto border border-signal/40 px-3 py-1"
          >
            Reset
          </button>
        </div>
      </div>
    </section>
  );
}