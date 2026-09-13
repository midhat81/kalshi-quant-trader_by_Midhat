interface Stat {
    label: string;
    value: string;
    tone?: "positive" | "negative" | "neutral";
  }
  
  function formatTone(tone: Stat["tone"]) {
    if (tone === "positive") return "text-accent";
    if (tone === "negative") return "text-warning";
    return "text-text";
  }
  
  export function StatStrip({ stats }: { stats: Stat[] }) {
    return (
      <div className="flex border border-border rounded-lg bg-surface divide-x divide-border overflow-hidden">
        {stats.map((stat) => (
          <div key={stat.label} className="flex-1 px-5 py-4">
            <div className="text-xs text-muted mb-1">{stat.label}</div>
            <div className={`font-mono text-xl font-medium ${formatTone(stat.tone)}`}>
              {stat.value}
            </div>
          </div>
        ))}
      </div>
    );
  }