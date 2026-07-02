export function Logo({ className }: { className?: string }) {
  return (
    <span className={`inline-flex items-center gap-2 ${className ?? ""}`}>
      <svg
        viewBox="0 0 32 32"
        className="h-8 w-8"
        role="img"
        aria-label="Leadly logo"
      >
        <rect width="32" height="32" rx="9" fill="#4f46e5" />
        <path
          d="M10 8v13h9"
          fill="none"
          stroke="white"
          strokeWidth="2.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
        <circle cx="21.5" cy="11.5" r="3" fill="#34d399" />
      </svg>
      <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
        Leadly
      </span>
    </span>
  );
}
