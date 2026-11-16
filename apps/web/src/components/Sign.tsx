type Kind = "yield" | "stop" | "crossing";

export default function Sign({
  kind,
  className,
}: {
  kind: Kind;
  className?: string;
}) {
  return (
    <svg viewBox="0 0 100 100" className={className} role="img" aria-label={kind}>
      {kind === "yield" && (
        <>
          <polygon points="2,10 98,10 50,94" fill="#f2f1ec" stroke="#c4564b" strokeWidth="6" strokeLinejoin="round" />
          <polygon points="18,19 82,19 50,74" fill="none" stroke="#c4564b" strokeWidth="3" strokeLinejoin="round" />
        </>
      )}

      {kind === "stop" && (
        <>
          <polygon points="30,3 70,3 97,30 97,70 70,97 30,97 3,70 3,30" fill="#c4564b" stroke="#f2f1ec" strokeWidth="3" />
          <text x="50" y="58" textAnchor="middle" fontSize="23" fontWeight="700" fill="#f2f1ec" style={{ letterSpacing: "0.04em" }}>
            STOP
          </text>
        </>
      )}

      {kind === "crossing" && (
        <>
          <polygon points="50,2 98,50 50,98 2,50" fill="#d8b84e" stroke="#0b0b0a" strokeWidth="2.5" strokeLinejoin="round" />
          <g stroke="#0b0b0a" strokeWidth="5" strokeLinecap="round" strokeLinejoin="round" fill="none">
            <circle cx="52" cy="27" r="5" fill="#0b0b0a" />
            <path d="M52 36 L47 55 M52 36 L61 47 M52 38 L42 46 M47 55 L40 70 M47 55 L56 62 L56 72" />
          </g>
        </>
      )}
    </svg>
  );
}