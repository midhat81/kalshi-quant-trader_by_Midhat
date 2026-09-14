import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Position } from "../types";
import { Badge } from "../components/Badge";

function fmtUsd(n: number | null): string {
  if (n === null) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getPositions()
      .then(setPositions)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted">Loading positions...</div>;
  if (error) return <div className="text-warning">Failed to load positions: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text mb-1">Positions</h1>
        <p className="text-sm text-muted">{positions.length} open positions</p>
      </div>

      {positions.length === 0 ? (
        <div className="border border-border rounded-lg bg-surface p-8 text-center text-muted text-sm">
          No open positions. Positions appear here once orders are filled.
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs border-b border-border bg-bg/40">
                <th className="px-4 py-3 font-normal">Market</th>
                <th className="px-4 py-3 font-normal">Side</th>
                <th className="px-4 py-3 font-normal text-right">Qty</th>
                <th className="px-4 py-3 font-normal text-right">Avg Entry</th>
                <th className="px-4 py-3 font-normal text-right">Current</th>
                <th className="px-4 py-3 font-normal text-right">Market Value</th>
                <th className="px-4 py-3 font-normal text-right">Unrealized PnL</th>
                <th className="px-4 py-3 font-normal text-right">Fees</th>
                <th className="px-4 py-3 font-normal text-right">Status</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {positions.map((p) => (
                <tr key={`${p.market_id}-${p.side}`} className="border-b border-border/50 hover:bg-bg/30">
                  <td className="px-4 py-3 text-text">{p.market_id}</td>
                  <td className="px-4 py-3 text-muted uppercase text-xs">{p.side}</td>
                  <td className="px-4 py-3 text-right">{p.quantity}</td>
                  <td className="px-4 py-3 text-right">{p.average_entry_price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right">{p.current_price !== null ? p.current_price.toFixed(2) : "—"}</td>
                  <td className="px-4 py-3 text-right">{fmtUsd(p.market_value)}</td>
                  <td className={`px-4 py-3 text-right ${p.unrealized_pnl === null ? "text-muted" : p.unrealized_pnl >= 0 ? "text-accent" : "text-warning"}`}>
                    {p.unrealized_pnl === null ? "N/A" : fmtUsd(p.unrealized_pnl)}
                  </td>
                  <td className="px-4 py-3 text-right text-muted">{fmtUsd(p.fees_paid)}</td>
                  <td className="px-4 py-3 text-right">
                    <Badge tone={p.market_status === "active" ? "positive" : "neutral"}>
                      {p.market_status ?? "unknown"}
                    </Badge>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}