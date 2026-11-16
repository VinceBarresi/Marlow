export function Empty({ message, testId }: { message: string; testId: string }) {
  return (
    <div className="empty" data-testid={testId}>
      <svg viewBox="0 0 200 140" width="180" height="126" aria-hidden="true">
        <path
          d="M68 16h56l10 10v98l-9-7-9 7-9-7-9 7-9-7-9 7-9-7-9 7V16z"
          fill="#fffdf8"
          stroke="#1c1915"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <path
          d="M84 48h32M84 64h32M84 80h18"
          stroke="#1f6b45"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <p>{message}</p>
    </div>
  );
}
