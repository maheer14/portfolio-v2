import { Geist, Archivo, Anton, Inter_Tight } from "next/font/google";

const geist = Geist({ subsets: ["latin"], weight: ["400", "700", "900"] });
const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
});
const anton = Anton({ subsets: ["latin"], weight: "400" });
const interTight = Inter_Tight({ subsets: ["latin"], weight: ["400", "700", "900"] });

const samples = [
  { name: "Geist 900", cls: geist.className, style: { fontWeight: 900 } },
  { name: "Archivo 900, wide", cls: archivo.className, style: { fontWeight: 900, fontStretch: "125%" } },
  { name: "Archivo 800, normal width", cls: archivo.className, style: { fontWeight: 800, fontStretch: "100%" } },
  { name: "Anton", cls: anton.className, style: {} },
  { name: "Inter Tight 900", cls: interTight.className, style: { fontWeight: 900 } },
];

export default function TypeTest() {
  return (
    <main className="min-h-screen bg-signal p-[4vw] text-ink">
      {samples.map((s) => (
        <section key={s.name} className="mb-10">
          <p className="mb-2 text-xs tracking-[0.3em] uppercase">{s.name}</p>
          <p
            className={`${s.cls} uppercase leading-[0.8] tracking-tighter`}
            style={{ fontSize: "clamp(4rem, 17vw, 24rem)", ...s.style }}
          >
            Gridlock
          </p>
          <p className={`${s.cls} mt-3 max-w-xl text-lg`} style={{ fontWeight: 400 }}>
            Slow down. Look first. The light changes in 4.2 seconds.
          </p>
        </section>
      ))}
    </main>
  );
}