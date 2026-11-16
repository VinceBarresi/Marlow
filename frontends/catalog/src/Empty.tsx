export function Empty({ message, testId }: { message: string; testId: string }) {
  return (
    <div className="empty" data-testid={testId}>
      <svg viewBox="0 0 200 140" width="180" height="126" aria-hidden="true">
        <rect
          x="28"
          y="24"
          width="144"
          height="96"
          rx="8"
          fill="#fffdf8"
          stroke="#1c1915"
          strokeWidth="2"
        />
        <path d="M28 56h144M28 88h144" stroke="#e3dacb" strokeWidth="2" />
        <rect
          x="86"
          y="64"
          width="28"
          height="16"
          rx="3"
          fill="none"
          stroke="#1f6b45"
          strokeWidth="2"
        />
      </svg>
      <p>{message}</p>
    </div>
  );
}
