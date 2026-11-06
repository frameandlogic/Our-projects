export function Logo({ compact = false }: { compact?: boolean }) {
  return (
    <span className="inline-flex items-center gap-2.5 text-ink">
      <svg width="34" height="40" viewBox="0 0 34 40" aria-hidden>
        <path d="M2 2h22L12 18h18L4 38V2Z" fill="#DC143C" />
        <path d="M2 2h22L12 18H2V2Z" fill="#003893" />
        <circle cx="9.5" cy="8.5" r="2.2" fill="#fff" />
        <path d="M8 27.5h8" stroke="#fff" strokeWidth="1.6" />
        <path d="M10 25.2c1.4 1.6 4.2 1.6 5.6 0" stroke="#fff" strokeWidth="1.3" fill="none" />
      </svg>
      {!compact && (
        <span className="leading-none">
          <span className="block font-display text-[1.35rem] tracking-tight">Doko</span>
          <span className="mt-0.5 block font-deva text-[11px] tracking-[0.22em] text-navy uppercase">
            डोको
          </span>
        </span>
      )}
    </span>
  );
}
