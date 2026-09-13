import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { Position, PortfolioSummary, Signal } from "../types";
import { StatStrip } from "../components/StatStrip";

function fmtUsd(n: number | null): string {
  if (n === null) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

export function Dashboard() {
  const [pnl, setPnl] = useState<PortfolioSummary | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([api.getPnl(), api.getPositions(), api.getSignals(5)])
      .then(([pnlData, positionsData, signalsData]) => {
        setPnl(pnlData);
        setPositions(positionsData);
        setSignals(signalsData);
      })
      .catch((err) => console.error("Failed to load dashboard data", err))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return <div className="text-muted">Loading portfolio...</div>;
  }

  const stats = [
    { label: "Total PnL", value: fmtUsd(pnl?.total_pnl ?? null), tone: (pnl?.total_pnl ?? 0) >= 0 ? "positive" as const : "negative" as const },
    { label: "Realized PnL", value: fmtUsd(pnl?.total_realized_pnl ?? 0) },
    { label: "Unrealized PnL", value: fmtUsd(pnl?.total_unrealized_pnl ?? null) },
    { label: "Exposure", value: fmtUsd(pnl?.total_exposure ?? 0) },
    { label: "Open Positions", value: String(pnl?.open_position_count ?? 0) },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-semibold text-text mb-1">Dashboard</h1>
        <p className="text-sm text-muted">Real-time portfolio overview — paper trading</p>
      </div>

      <StatStrip stats={stats} />

      <div className="grid grid-cols-2 gap-6">
        <section className="border border-border rounded-lg bg-surface p-5">
          <h2 className="text-sm font-medium text-text mb-4">Open Positions</h2>
          {positions.length === 0 ? (
            <p className="text-sm text-muted">No open positions yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-border">
                  <th className="pb-2 font-normal">Market</th>
                  <th className="pb-2 font-normal">Side</th>
                  <th className="pb-2 font-normal text-right">Qty</th>
                  <th className="pb-2 font-normal text-right">Entry</th>
                  <th className="pb-2 font-normal text-right">PnL</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {positions.map((p) => (
                  <tr key={`${p.market_id}-${p.side}`} className="border-b border-border/50">
                    <td className="py-2 text-text">{p.market_id}</td>
                    <td className="py-2 text-muted uppercase text-xs">{p.side}</td>
                    <td className="py-2 text-right">{p.quantity}</td>
                    <td className="py-2 text-right">{p.average_entry_price.toFixed(2)}</td>
                    <td className={`py-2 text-right ${p.unrealized_pnl === null ? "text-muted" : p.unrealized_pnl >= 0 ? "text-accent" : "text-warning"}`}>
                      {p.unrealized_pnl === null ? "closed" : fmtUsd(p.unrealized_pnl)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>

        <section className="border border-border rounded-lg bg-surface p-5">
          <h2 className="text-sm font-medium text-text mb-4">Recent Signals</h2>
          {signals.length === 0 ? (
            <p className="text-sm text-muted">No signals generated yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-border">
                  <th className="pb-2 font-normal">Market</th>
                  <th className="pb-2 font-normal">Side</th>
                  <th className="pb-2 font-normal text-right">Edge</th>
                  <th className="pb-2 font-normal text-right">Conf</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {signals.map((s) => (
                  <tr key={s.id} className="border-b border-border/50">
                    <td className="py-2 text-text">{s.market_id}</td>
                    <td className="py-2 text-muted uppercase text-xs">{s.side}</td>
                    <td className={`py-2 text-right ${s.edge >= 0 ? "text-accent" : "text-warning"}`}>
                      {s.edge >= 0 ? "+" : ""}{(s.edge * 100).toFixed(2)}%
                    </td>
                    <td className="py-2 text-right text-muted">{(s.confidence * 100).toFixed(0)}%</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </section>
      </div>
    </div>
  );
}