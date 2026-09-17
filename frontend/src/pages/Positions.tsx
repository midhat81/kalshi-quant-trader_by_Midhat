import { useEffect, useMemo, useState } from "react";
import { ArrowDownRight, ArrowUpRight, BriefcaseBusiness, RefreshCw } from "lucide-react";
import { api } from "../api/client";
import type { Position } from "../types";

function fmtUsd(n: number | null): string {
  if (n === null) return "—";
  return `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`;
}

export function Positions() {
  const [positions, setPositions] = useState<Position[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadPositions = async () => {
    setRefreshing(true); setError(null);
    try { setPositions(await api.getPositions()); }
    catch (err) { setError(String(err)); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { void loadPositions(); }, []);

  const stats = useMemo(() => ({
    value: positions.reduce((sum, p) => sum + (p.market_value ?? 0), 0),
    pnl: positions.reduce((sum, p) => sum + (p.unrealized_pnl ?? 0), 0),
    fees: positions.reduce((sum, p) => sum + (p.fees_paid ?? 0), 0),
    active: positions.filter((p) => p.market_status === "active").length,
  }), [positions]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted"><RefreshCw size={15} className="mr-3 animate-spin" />Loading positions...</div>;
  if (error) return <div className="rounded-xl border border-warning/30 bg-warning/5 p-5 text-sm text-warning">Failed to load positions: {error}</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-accent"><BriefcaseBusiness size={13} />Portfolio exposure</div><h1 className="text-2xl font-semibold tracking-tight text-text">Positions</h1><p className="mt-1 text-sm text-muted">Open exposure, mark-to-market PnL and execution costs.</p></div>
        <button type="button" onClick={() => void loadPositions()} disabled={refreshing} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text transition hover:border-accent/40 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />Refresh</button>
      </header>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Market value</div><div className="mt-2 font-mono text-xl text-text">{fmtUsd(stats.value)}</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Unrealized PnL</div><div className={`mt-2 font-mono text-xl ${stats.pnl >= 0 ? "text-accent" : "text-warning"}`}>{fmtUsd(stats.pnl)}</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Fees paid</div><div className="mt-2 font-mono text-xl text-text">{fmtUsd(stats.fees)}</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Active markets</div><div className="mt-2 font-mono text-xl text-text">{stats.active}</div></div>
      </div>

      {positions.length === 0 ? <div className="rounded-xl border border-border bg-surface p-10 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg text-muted"><BriefcaseBusiness size={18} /></div><p className="mt-4 text-sm font-medium text-text">No open positions</p><p className="mt-1 text-xs text-muted">Positions appear here once orders are filled.</p></div> :
        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="text-sm font-semibold text-text">Open positions</div><div className="mt-0.5 text-xs text-muted">{positions.length} position{positions.length === 1 ? "" : "s"} currently held</div></div><span className="rounded-md border border-border bg-bg px-2 py-1 font-mono text-[10px] text-muted">MARK-TO-MARKET</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[980px] text-sm"><thead className="border-b border-border bg-bg/40 text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-3 text-left font-medium">Market</th><th className="px-3 py-3 text-left font-medium">Side</th><th className="px-3 py-3 text-right font-medium">Qty</th><th className="px-3 py-3 text-right font-medium">Avg entry</th><th className="px-3 py-3 text-right font-medium">Current</th><th className="px-3 py-3 text-right font-medium">Market value</th><th className="px-3 py-3 text-right font-medium">Unrealized PnL</th><th className="px-3 py-3 text-right font-medium">Fees</th><th className="px-5 py-3 text-right font-medium">Status</th></tr></thead>
          <tbody>{positions.map((p) => { const pnl = p.unrealized_pnl ?? 0; const positive = pnl >= 0; return <tr key={`${p.market_id}-${p.side}`} className="border-b border-border/60 transition hover:bg-bg/35">
            <td className="px-5 py-4"><div className="font-mono text-xs font-medium text-text">{p.market_id}</div><div className="mt-1 text-[10px] text-muted">Position exposure</div></td>
            <td className="px-3 py-4"><span className={`inline-flex items-center rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${p.side.toLowerCase() === "yes" ? "border-accent/25 bg-accent/10 text-accent" : "border-warning/25 bg-warning/10 text-warning"}`}>{p.side}</span></td>
            <td className="px-3 py-4 text-right font-mono text-xs text-text">{p.quantity}</td><td className="px-3 py-4 text-right font-mono text-xs text-muted">{p.average_entry_price.toFixed(2)}</td><td className="px-3 py-4 text-right font-mono text-xs text-text">{p.current_price !== null ? p.current_price.toFixed(2) : "—"}</td><td className="px-3 py-4 text-right font-mono text-xs text-text">{fmtUsd(p.market_value)}</td>
            <td className={`px-3 py-4 text-right font-mono text-xs font-medium ${p.unrealized_pnl === null ? "text-muted" : positive ? "text-accent" : "text-warning"}`}><span className="inline-flex items-center gap-1">{p.unrealized_pnl !== null && (positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />)}{p.unrealized_pnl === null ? "N/A" : fmtUsd(pnl)}</span></td>
            <td className="px-3 py-4 text-right font-mono text-xs text-muted">{fmtUsd(p.fees_paid)}</td><td className="px-5 py-4 text-right"><span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${p.market_status === "active" ? "border-accent/25 bg-accent/10 text-accent" : "border-border bg-bg text-muted"}`}>{p.market_status ?? "unknown"}</span></td>
          </tr>; })}</tbody></table></div>
        </section>}
    </div>
  );
}
