import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { MarketSnapshot } from "../types";
import { Badge } from "../components/Badge";

function fmtPrice(n: number | null): string {
  if (n === null) return "—";
  return n.toFixed(2);
}

export function Markets() {
  const [markets, setMarkets] = useState<MarketSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getMarkets(30)
      .then(setMarkets)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted">Loading markets...</div>;
  if (error) return <div className="text-warning">Failed to load markets: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text mb-1">Markets</h1>
        <p className="text-sm text-muted">Latest snapshots from Kalshi — {markets.length} markets</p>
      </div>

      <div className="border border-border rounded-lg bg-surface overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-muted text-xs border-b border-border bg-bg/40">
              <th className="px-4 py-3 font-normal">Market</th>
              <th className="px-4 py-3 font-normal text-right">Yes Bid</th>
              <th className="px-4 py-3 font-normal text-right">Yes Ask</th>
              <th className="px-4 py-3 font-normal text-right">Spread</th>
              <th className="px-4 py-3 font-normal text-right">Volume</th>
              <th className="px-4 py-3 font-normal text-right">Status</th>
            </tr>
          </thead>
          <tbody className="font-mono">
            {markets.map((m) => (
              <tr key={`${m.market_id}-${m.timestamp}`} className="border-b border-border/50 hover:bg-bg/30">
                <td className="px-4 py-3 text-text">{m.market_id}</td>
                <td className="px-4 py-3 text-right">{fmtPrice(m.yes_bid)}</td>
                <td className="px-4 py-3 text-right">{fmtPrice(m.yes_ask)}</td>
                <td className="px-4 py-3 text-right text-muted">{fmtPrice(m.spread)}</td>
                <td className="px-4 py-3 text-right text-muted">
                  {m.volume !== null ? m.volume.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}
                </td>
                <td className="px-4 py-3 text-right">
                  <Badge tone={m.status === "active" ? "positive" : "neutral"}>{m.status ?? "unknown"}</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}