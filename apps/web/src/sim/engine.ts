export type Phase = "green" | "amber" | "red";

export interface Plan {
  nsGreen: number; // seconds
  ewGreen: number;
  amber: number;
  allRed: number;
}
export interface Demand {
  ns: number; // vehicles per minute, per approach
  ew: number;
}
export interface CarView {
  id: number;
  a: number; // approach: 0=N, 1=E, 2=S, 3=W
  p: number; // front-bumper position along the approach
  v: number; // speed
}
export interface Snapshot {
  t: number;
  ns: Phase;
  ew: Phase;
  cars: CarView[];
  avgDelay: number; // rolling, seconds
  completed: number;
  queues: number[]; // stopped cars per approach
}

export const GEOM = { L: 90, stop: -8, carLen: 4.5, carW: 2, laneOff: 3.2 };

// Intelligent Driver Model parameters
const V0 = 13.9; // desired speed (m/s)
const A = 2.0; // max acceleration
const B = 3.0; // comfortable braking
const T = 1.2; // time headway
const S0 = 2.0; // minimum gap

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function idm(v: number, gap: number, dv: number) {
  const sStar = S0 + Math.max(0, v * T + (v * dv) / (2 * Math.sqrt(A * B)));
  const a = A * (1 - Math.pow(v / V0, 4) - Math.pow(sStar / Math.max(gap, 0.1), 2));
  return Math.max(a, -9);
}

export function signalAt(t: number, p: Plan): { ns: Phase; ew: Phase } {
  const c1 = p.nsGreen;
  const c2 = c1 + p.amber;
  const c3 = c2 + p.allRed;
  const c4 = c3 + p.ewGreen;
  const c5 = c4 + p.amber;
  const cycle = c5 + p.allRed;
  const x = t % cycle;
  if (x < c1) return { ns: "green", ew: "red" };
  if (x < c2) return { ns: "amber", ew: "red" };
  if (x < c3) return { ns: "red", ew: "red" };
  if (x < c4) return { ns: "red", ew: "green" };
  if (x < c5) return { ns: "red", ew: "amber" };
  return { ns: "red", ew: "red" };
}

interface Car {
  id: number;
  a: number;
  p: number;
  v: number;
  arrive: number;
}

export class Sim {
  t = 0;
  completed = 0;
  private sumDelay = 0;
  private recent: number[] = [];
  private nextId = 1;
  private rng: () => number;
  private lanes: Car[][] = [[], [], [], []];
  private pending: number[][] = [[], [], [], []];

  constructor(
    public plan: Plan,
    public demand: Demand,
    seed = 1,
  ) {
    this.rng = mulberry32(seed);
  }

  step(dt: number) {
    const { L, stop, carLen } = GEOM;
    this.t += dt;
    const sig = signalAt(this.t, this.plan);

    for (let a = 0; a < 4; a++) {
      const ns = a % 2 === 0;
      const phase = ns ? sig.ns : sig.ew;
      const rate = (ns ? this.demand.ns : this.demand.ew) / 60;

      // arrivals wait in a pending queue until there's room to enter
      if (this.rng() < rate * dt) this.pending[a].push(this.t);
      const lane = this.lanes[a];
      const last = lane[lane.length - 1];
      if (this.pending[a].length && (!last || last.p - carLen > -L + 6)) {
        const arrive = this.pending[a].shift()!;
        lane.push({ id: this.nextId++, a, p: -L, v: Math.min(V0, last ? last.v : V0), arrive });
      }

      // lane[0] is the front-most car
      for (let i = 0; i < lane.length; i++) {
        const c = lane[i];
        const lead = lane[i - 1];
        let acc = lead ? idm(c.v, lead.p - carLen - c.p, c.v - lead.v) : idm(c.v, Infinity, 0);

        if (c.p < stop) {
          const dist = stop - c.p;
          const canStopOnAmber = (c.v * c.v) / (2 * B) <= dist;
          const mustStop = phase === "red" || (phase === "amber" && canStopOnAmber);
          if (mustStop) acc = Math.min(acc, idm(c.v, dist, c.v));
        }

        c.v = Math.max(0, c.v + acc * dt);
        c.p += c.v * dt;
      }

      while (lane.length && lane[0].p > L) {
        const c = lane.shift()!;
        const delay = Math.max(0, this.t - c.arrive - (2 * L) / V0);
        this.completed++;
        this.sumDelay += delay;
        this.recent.push(delay);
        if (this.recent.length > 60) this.recent.shift();
      }
    }
  }

  meanDelayAll() {
    return this.completed ? this.sumDelay / this.completed : 0;
  }

  snapshot(): Snapshot {
    const sig = signalAt(this.t, this.plan);
    const cars: CarView[] = [];
    const queues = [0, 0, 0, 0];
    for (let a = 0; a < 4; a++) {
      for (const c of this.lanes[a]) {
        cars.push({ id: c.id, a, p: c.p, v: c.v });
        if (c.p < GEOM.stop && c.v < 1) queues[a]++;
      }
    }
    const avg = this.recent.length
      ? this.recent.reduce((s, d) => s + d, 0) / this.recent.length
      : 0;
    return { t: this.t, ns: sig.ns, ew: sig.ew, cars, avgDelay: avg, completed: this.completed, queues };
  }
}

// Fast, deterministic run with no rendering. The eval harness will use this.
export function runHeadless(plan: Plan, demand: Demand, seed = 1, seconds = 600) {
  const sim = new Sim(plan, demand, seed);
  for (let i = 0; i < seconds / 0.1; i++) sim.step(0.1);
  return { avgDelay: sim.meanDelayAll(), completed: sim.completed };
}

// Approximate Webster optimum for this two-phase junction.
// ASSUMPTION: saturation flow of 30 vehicles/min per approach (not calibrated).
export function websterPlan(d: Demand, amber = 3, allRed = 2): Plan {
  const S = 30;
  const yNs = d.ns / S;
  const yEw = d.ew / S;
  const Y = Math.min(0.85, yNs + yEw);
  const lostPerCycle = 2 * (amber + allRed);
  const cycle = Math.min(120, (1.5 * lostPerCycle * 0.8 + 5) / (1 - Y));
  const green = Math.max(10, cycle - lostPerCycle);
  const share = yNs + yEw > 0 ? yNs / (yNs + yEw) : 0.5;
  const clamp = (v: number) => Math.max(5, Math.min(60, Math.round(v)));
  return { nsGreen: clamp(green * share), ewGreen: clamp(green * (1 - share)), amber, allRed };
}