import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Fill } from "../types";

function fmtUsd(n: number): string {
  return `$${n.toFixed(2)}`;
}

function fmtTime(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Trades() {
  const [trades, setTrades] = useState<Fill[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api
      .getTrades(50)
      .then(setTrades)
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted">Loading trades...</div>;
  if (error) return <div className="text-warning">Failed to load trades: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text mb-1">Trade Ledger</h1>
        <p className="text-sm text-muted">{trades.length} fills — every trade traceable to its order</p>
      </div>

      {trades.length === 0 ? (
        <div className="border border-border rounded-lg bg-surface p-8 text-center text-muted text-sm">
          No trades yet.
        </div>
      ) : (
        <div className="border border-border rounded-lg bg-surface overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-muted text-xs border-b border-border bg-bg/40">
                <th className="px-4 py-3 font-normal">Timestamp</th>
                <th className="px-4 py-3 font-normal">Market</th>
                <th className="px-4 py-3 font-normal text-right">Qty</th>
                <th className="px-4 py-3 font-normal text-right">Price</th>
                <th className="px-4 py-3 font-normal text-right">Fee</th>
                <th className="px-4 py-3 font-normal">Order ID</th>
              </tr>
            </thead>
            <tbody className="font-mono">
              {trades.map((t) => (
                <tr key={t.id} className="border-b border-border/50 hover:bg-bg/30">
                  <td className="px-4 py-3 text-muted text-xs">{fmtTime(t.timestamp)}</td>
                  <td className="px-4 py-3 text-text">{t.market_id}</td>
                  <td className="px-4 py-3 text-right">{t.quantity}</td>
                  <td className="px-4 py-3 text-right">{t.price.toFixed(2)}</td>
                  <td className="px-4 py-3 text-right text-muted">{fmtUsd(t.fee)}</td>
                  <td className="px-4 py-3 text-xs text-muted">{t.order_id.slice(0, 8)}...</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}