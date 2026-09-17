import { useEffect, useMemo, useState } from "react";
import { ArrowDownLeft, ArrowUpRight, ClipboardList, RefreshCw } from "lucide-react";
import { api } from "../api/client";
import type { Fill } from "../types";

function fmtUsd(n: number): string { return `$${n.toFixed(2)}`; }
function fmtTime(ts: string): string { return new Date(ts).toLocaleString(undefined, { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit", second: "2-digit" }); }

export function Trades() {
  const [trades, setTrades] = useState<Fill[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadTrades = async () => {
    setRefreshing(true); setError(null);
    try { setTrades(await api.getTrades(50)); }
    catch (err) { setError(String(err)); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { void loadTrades(); }, []);

  const stats = useMemo(() => ({
    fills: trades.length,
    volume: trades.reduce((sum, t) => sum + t.quantity, 0),
    fees: trades.reduce((sum, t) => sum + t.fee, 0),
    markets: new Set(trades.map((t) => t.market_id)).size,
  }), [trades]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted"><RefreshCw size={15} className="mr-3 animate-spin" />Loading executions...</div>;
  if (error) return <div className="rounded-xl border border-warning/30 bg-warning/5 p-5 text-sm text-warning">Failed to load trades: {error}</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 sm:flex-row sm:items-end sm:justify-between">
        <div><div className="mb-2 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-accent"><ClipboardList size={13} />Execution blotter</div><h1 className="text-2xl font-semibold tracking-tight text-text">Trade Ledger</h1><p className="mt-1 text-sm text-muted">Filled orders with execution price, fees and order lineage.</p></div>
        <button type="button" onClick={() => void loadTrades()} disabled={refreshing} className="flex items-center justify-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text transition hover:border-accent/40 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />Refresh</button>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Fills</div><div className="mt-2 font-mono text-xl text-text">{stats.fills}</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Contracts</div><div className="mt-2 font-mono text-xl text-text">{stats.volume.toLocaleString()}</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Fees</div><div className="mt-2 font-mono text-xl text-text">{fmtUsd(stats.fees)}</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Markets</div><div className="mt-2 font-mono text-xl text-text">{stats.markets}</div></div>
      </div>

      {trades.length === 0 ? <div className="rounded-xl border border-border bg-surface p-10 text-center"><div className="mx-auto flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-bg text-muted"><ClipboardList size={18} /></div><p className="mt-4 text-sm font-medium text-text">No executions yet</p><p className="mt-1 text-xs text-muted">Filled orders will appear here with their execution details.</p></div> :
        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-5 py-4"><div><div className="text-sm font-semibold text-text">Recent fills</div><div className="mt-0.5 text-xs text-muted">Most recent execution events from the trading engine</div></div><span className="rounded-md border border-border bg-bg px-2 py-1 font-mono text-[10px] text-muted">FILLS</span></div>
          <div className="overflow-x-auto"><table className="w-full min-w-[820px] text-sm"><thead className="border-b border-border bg-bg/40 text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-3 text-left font-medium">Timestamp</th><th className="px-3 py-3 text-left font-medium">Market</th><th className="px-3 py-3 text-right font-medium">Qty</th><th className="px-3 py-3 text-right font-medium">Price</th><th className="px-3 py-3 text-right font-medium">Fee</th><th className="px-5 py-3 text-left font-medium">Order ID</th></tr></thead>
          <tbody>{trades.map((t) => <tr key={t.id} className="border-b border-border/60 transition hover:bg-bg/35"><td className="px-5 py-3.5 font-mono text-[11px] text-muted">{fmtTime(t.timestamp)}</td><td className="px-3 py-3.5 font-mono text-xs text-text">{t.market_id}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-text"><span className="inline-flex items-center gap-1"><ArrowUpRight size={11} className="text-accent" />{t.quantity}</span></td><td className="px-3 py-3.5 text-right font-mono text-xs font-medium text-text">{t.price.toFixed(2)}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-muted">{fmtUsd(t.fee)}</td><td className="px-5 py-3.5 font-mono text-[11px] text-muted"><span className="rounded bg-bg px-2 py-1">{t.order_id.slice(0, 8)}...</span></td></tr>)}</tbody></table></div>
        </section>}
    </div>
  );
}
