export function Badge({ children, tone = "neutral" }: { children: React.ReactNode; tone?: "positive" | "negative" | "neutral" }) {
  const styles = {
    positive: "bg-accent/10 text-accent border-accent/30",
    negative: "bg-warning/10 text-warning border-warning/30",
    neutral: "bg-border/50 text-muted border-border",
  }[tone];

  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-mono border ${styles}`}>
      {children}
    </span>
  );
}