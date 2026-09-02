// Caminho: ./src/components/IconAlerta.tsx

export function IconAlerta({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <path
        d="M12 2.5 L22.5 21 H1.5 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <rect x="10.8" y="8.5" width="2.4" height="6.5" rx="1" fill="currentColor" />
      <rect x="10.8" y="16.5" width="2.4" height="2.4" rx="0.5" fill="currentColor" />
    </svg>
  );
}
