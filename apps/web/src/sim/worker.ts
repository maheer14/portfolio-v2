import { Sim, type Demand, type Plan } from "./engine";

type Msg =
  | { type: "config"; plan: Plan; demand: Demand }
  | { type: "speed"; speed: number }
  | { type: "reset" };

const ctx = self as unknown as {
  postMessage: (m: unknown) => void;
  onmessage: ((e: MessageEvent<Msg>) => void) | null;
};

const DT = 0.1;
let plan: Plan = { nsGreen: 25, ewGreen: 25, amber: 3, allRed: 2 };
let demand: Demand = { ns: 12, ew: 12 };
let speed = 4;
let seed = 1;
let sim = new Sim(plan, demand, seed);
let acc = 0;
let last = performance.now();

setInterval(() => {
  const now = performance.now();
  acc += Math.min(0.25, (now - last) / 1000) * speed;
  last = now;
  let stepped = 0;
  while (acc >= DT) {
    sim.step(DT);
    acc -= DT;
    stepped++;
  }
  if (stepped) ctx.postMessage(sim.snapshot());
}, 16);

ctx.onmessage = (e) => {
  const m = e.data;
  if (m.type === "config") {
    plan = m.plan;
    demand = m.demand;
    sim.plan = plan;
    sim.demand = demand;
  } else if (m.type === "speed") {
    speed = m.speed;
  } else if (m.type === "reset") {
    sim = new Sim(plan, demand, ++seed);
    acc = 0;
  }
};