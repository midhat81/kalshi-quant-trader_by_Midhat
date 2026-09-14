import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Signal } from "../types";
import { Badge } from "../components/Badge";

function fmtTime(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Signals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getSignals(50)
      .then(setSignals)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted">Loading signals...</div>;
  if (error) return <div className="text-warning">Failed to load signals: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text mb-1">Signals</h1>
        <p className="text-sm text-muted">{signals.length} signals generated — probability edge strategy</p>
      </div>

      {signals.length === 0 ? (
        <div className="border border-border rounded-lg bg-surface p-8 text-center text-muted text-sm">
          No signals generated yet.
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs border-b border-border bg-bg/40">
                <th className="px-4 py-3 font-normal">Timestamp</th>
                <th className="px-4 py-3 font-normal">Market</th>
                <th className="px-4 py-3 font-normal">Side</th>
                <th className="px-4 py-3 font-normal text-right">Market Prob</th>
                <th className="px-4 py-3 font-normal text-right">Model Prob</th>
                <th className="px-4 py-3 font-normal text-right">Edge</th>
                <th className="px-4 py-3 font-normal text-right">Confidence</th>
                <th className="px-4 py-3 font-normal">Strategy</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {signals.map((s) => (
                <tr key={s.id} className="border-b border-border/50 hover:bg-bg/30">
                  <td className="px-4 py-3 text-muted text-xs">{fmtTime(s.timestamp)}</td>
                  <td className="px-4 py-3 text-text">{s.market_id}</td>
                  <td className="px-4 py-3">
                    <Badge tone={s.side === "yes" ? "positive" : "negative"}>{s.side.toUpperCase()}</Badge>
                  </td>
                  <td className="px-4 py-3 text-right text-muted">{s.market_probability.toFixed(3)}</td>
                  <td className="px-4 py-3 text-right text-muted">{s.model_probability.toFixed(3)}</td>
                  <td className={`px-4 py-3 text-right ${s.edge >= 0 ? "text-accent" : "text-warning"}`}>
                    {s.edge >= 0 ? "+" : ""}{(s.edge * 100).toFixed(2)}%
                  </td>
                  <td className="px-4 py-3 text-right text-muted">{(s.confidence * 100).toFixed(0)}%</td>
                  <td className="px-4 py-3 text-muted text-xs">{s.strategy_name}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}