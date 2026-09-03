// Caminho: ./src/components/IconEngrenagem.tsx

export function IconEngrenagem({ className = 'w-6 h-6' }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
      <g fill="currentColor">
        <rect x="10.6" y="0.8" width="2.8" height="4.2" />
        <rect x="10.6" y="19" width="2.8" height="4.2" />
        <rect x="10.6" y="0.8" width="2.8" height="4.2" transform="rotate(45 12 12)" />
        <rect x="10.6" y="19" width="2.8" height="4.2" transform="rotate(45 12 12)" />
        <rect x="10.6" y="0.8" width="2.8" height="4.2" transform="rotate(90 12 12)" />
        <rect x="10.6" y="19" width="2.8" height="4.2" transform="rotate(90 12 12)" />
        <rect x="10.6" y="0.8" width="2.8" height="4.2" transform="rotate(135 12 12)" />
        <rect x="10.6" y="19" width="2.8" height="4.2" transform="rotate(135 12 12)" />
      </g>
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M12 18.5a6.5 6.5 0 1 0 0-13 6.5 6.5 0 0 0 0 13Zm0-3.5a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"
        fill="currentColor"
      />
    </svg>
  );
}
