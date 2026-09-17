import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, ChevronRight, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { api } from "../api/client";
import type { Position, PortfolioSummary, Signal } from "../types";

function fmtUsd(n: number | null): string {
  if (n === null) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}
function fmtPrice(n: number | null): string { return n === null ? "—" : n.toFixed(2); }
function fmtPct(n: number): string { return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`; }
function timeAgo(timestamp: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function Label({ children }: { children: React.ReactNode }) {
  return <div className="font-mono text-[9px] uppercase tracking-[0.16em] text-subtle">{children}</div>;
}

function PanelTitle({ icon: Icon, title, detail }: { icon: typeof Activity; title: string; detail: string }) {
  return <div className="flex items-center justify-between border-b border-border px-5 py-4">
    <div className="flex items-center gap-2.5"><span className="flex h-7 w-7 items-center justify-center rounded-lg bg-bg text-accent"><Icon size={14} strokeWidth={1.8} /></span><div><div className="text-xs font-medium text-text">{title}</div><div className="mt-0.5 text-[10px] text-muted">{detail}</div></div></div>
    <ChevronRight size={14} className="text-subtle" />
  </div>;
}

export function Dashboard() {
  const [pnl, setPnl] = useState<PortfolioSummary | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());

  const loadDashboard = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [pnlData, positionsData, signalsData] = await Promise.all([api.getPnl(), api.getPositions(), api.getSignals(5)]);
      setPnl(pnlData); setPositions(positionsData); setSignals(signalsData); setLastUpdated(new Date());
    } catch (err) { console.error("Failed to load dashboard data", err); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => {
    void loadDashboard();
    const clock = window.setInterval(() => setNow(new Date()), 1000);
    const refresh = window.setInterval(() => void loadDashboard(true), 30000);
    return () => { window.clearInterval(clock); window.clearInterval(refresh); };
  }, []);

  const totalPnl = pnl?.total_pnl ?? 0;
  const pnlPositive = totalPnl >= 0;
  const exposure = pnl?.total_exposure ?? 0;
  const maxPosition = useMemo(() => positions.reduce((max, p) => Math.max(max, Math.abs(p.market_value ?? 0)), 0), [positions]);
  const activePositions = pnl?.open_position_count ?? positions.length;

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="flex items-center gap-3 text-xs text-muted"><RefreshCw size={14} className="animate-spin text-accent" />Loading trading terminal…</div></div>;

  return (
    <div className="space-y-5">
      <header className="flex flex-col gap-5 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2"><span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(85,214,199,0.65)]" /><span className="font-mono text-[9px] uppercase tracking-[0.18em] text-accent">Portfolio / live</span></div>
          <h1 className="text-[27px] font-semibold tracking-[-0.035em] text-text">Trading overview</h1>
          <p className="mt-1 text-xs text-muted">Real market data · model signals · simulated execution</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="hidden rounded-lg border border-border bg-surface px-3 py-2 text-[10px] text-muted sm:block"><span>{now.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}</span><span className="mx-2 text-subtle">·</span><span className="font-mono tabular-nums text-text">{now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</span></div>
          <button type="button" onClick={() => void loadDashboard()} disabled={refreshing} className="flex h-9 items-center gap-2 rounded-lg border border-border bg-surface px-3 text-[11px] font-medium text-text transition hover:border-border-strong hover:bg-surface-raised disabled:opacity-50"><RefreshCw size={13} className={refreshing ? "animate-spin" : ""} />Refresh</button>
        </div>
      </header>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="grid divide-y divide-border sm:grid-cols-2 sm:divide-x sm:divide-y-0 xl:grid-cols-5">
          <div className="p-5"><Label>Total PnL</Label><div className={`mt-2 font-mono text-[23px] font-semibold tracking-tight ${pnlPositive ? "text-accent" : "text-warning"}`}>{fmtUsd(pnl?.total_pnl ?? null)}</div><div className="mt-1 flex items-center gap-1 text-[10px] text-muted"><TrendingUp size={11} />Portfolio performance</div></div>
          <div className="p-5"><Label>Realized</Label><div className="mt-2 font-mono text-[20px] font-semibold tracking-tight text-text">{fmtUsd(pnl?.total_realized_pnl ?? 0)}</div><div className="mt-1 text-[10px] text-muted">Locked PnL</div></div>
          <div className="p-5"><Label>Unrealized</Label><div className="mt-2 font-mono text-[20px] font-semibold tracking-tight text-text">{fmtUsd(pnl?.total_unrealized_pnl ?? null)}</div><div className="mt-1 text-[10px] text-muted">Open positions</div></div>
          <div className="p-5"><Label>Exposure</Label><div className="mt-2 font-mono text-[20px] font-semibold tracking-tight text-text">{fmtUsd(exposure)}</div><div className="mt-1 text-[10px] text-muted">Capital deployed</div></div>
          <div className="p-5"><Label>Open positions</Label><div className="mt-2 font-mono text-[20px] font-semibold tracking-tight text-text">{activePositions}</div><div className="mt-1 text-[10px] text-muted">Active inventory</div></div>
        </div>
      </section>

      <div className="grid gap-5 xl:grid-cols-[minmax(0,1.55fr)_minmax(340px,0.9fr)]">
        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          <PanelTitle title="Open positions" detail="Current portfolio inventory" icon={BarChart3} />
          {positions.length === 0 ? <div className="px-5 py-12 text-center"><div className="text-xs text-text">No open positions</div><div className="mt-1 text-[10px] text-muted">Inventory will appear here after execution.</div></div> : <div className="overflow-x-auto"><table className="w-full min-w-[700px] text-xs">
            <thead className="bg-bg/45 font-mono text-[9px] uppercase tracking-[0.12em] text-subtle"><tr><th className="px-5 py-3 text-left font-medium">Market</th><th className="px-3 py-3 text-left font-medium">Side</th><th className="px-3 py-3 text-right font-medium">Qty</th><th className="px-3 py-3 text-right font-medium">Entry</th><th className="px-3 py-3 text-right font-medium">Mark</th><th className="px-5 py-3 text-right font-medium">PnL</th></tr></thead>
            <tbody>{positions.map((p) => { const positive = (p.unrealized_pnl ?? 0) >= 0; return <tr key={`${p.market_id}-${p.side}`} className="group border-t border-border/70 transition-colors hover:bg-surface-hover">
              <td className="px-5 py-3.5"><div className="font-mono text-[11px] font-medium text-text">{p.market_id}</div><div className="mt-0.5 text-[9px] text-subtle">{p.market_status ?? "market"}</div></td>
              <td className="px-3 py-3.5"><span className={`inline-flex rounded-md border px-2 py-1 font-mono text-[9px] font-semibold uppercase ${p.side === "yes" ? "border-accent/20 bg-accent-soft text-accent" : "border-warning/20 bg-warning/10 text-warning"}`}>{p.side}</span></td>
              <td className="px-3 py-3.5 text-right font-mono tabular-nums text-[11px] text-text">{p.quantity}</td>
              <td className="px-3 py-3.5 text-right font-mono tabular-nums text-[11px] text-muted">{fmtPrice(p.average_entry_price)}</td>
              <td className="px-3 py-3.5 text-right font-mono tabular-nums text-[11px] text-muted">{fmtPrice(p.current_price)}</td>
              <td className={`px-5 py-3.5 text-right font-mono tabular-nums text-[11px] font-semibold ${p.unrealized_pnl === null ? "text-muted" : positive ? "text-accent" : "text-warning"}`}>{p.unrealized_pnl === null ? "—" : <span className="inline-flex items-center gap-1">{positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{fmtUsd(p.unrealized_pnl)}</span>}</td>
            </tr>; })}</tbody>
          </table></div>}
        </section>

        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          <PanelTitle title="Signal monitor" detail="Latest model opportunities" icon={Activity} />
          {signals.length === 0 ? <div className="px-5 py-12 text-center text-[10px] text-muted">No signals generated yet.</div> : <div className="divide-y divide-border">{signals.map((s) => { const positive = s.edge >= 0; return <div key={s.id} className="p-4 transition-colors hover:bg-surface-hover">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate font-mono text-[10px] font-medium text-text">{s.market_id}</div><div className="mt-1 flex items-center gap-2"><span className={`font-mono text-[9px] font-semibold uppercase ${s.side === "yes" ? "text-accent" : "text-warning"}`}>{s.side}</span><span className="text-[9px] text-subtle">{s.strategy_name}</span></div></div><div className={`flex items-center gap-0.5 font-mono text-[11px] font-semibold ${positive ? "text-accent" : "text-warning"}`}>{positive ? <ArrowUpRight size={12} /> : <ArrowDownRight size={12} />}{fmtPct(s.edge)}</div></div>
            <div className="mt-3 grid grid-cols-3 gap-3"><div><Label>Market</Label><div className="mt-1 font-mono text-[11px] text-text">{(s.market_probability * 100).toFixed(1)}%</div></div><div><Label>Model</Label><div className="mt-1 font-mono text-[11px] text-text">{(s.model_probability * 100).toFixed(1)}%</div></div><div><Label>Confidence</Label><div className="mt-1 font-mono text-[11px] text-text">{(s.confidence * 100).toFixed(0)}%</div></div></div>
            <div className="mt-3 h-1 overflow-hidden rounded-full bg-bg"><div className="h-full rounded-full bg-accent/70" style={{ width: `${Math.min(100, Math.max(0, s.confidence * 100))}%` }} /></div>
            <div className="mt-2 flex items-center justify-between text-[9px] text-subtle"><span>{s.reason ?? "Model signal"}</span><span className="font-mono">{timeAgo(s.timestamp)}</span></div>
          </div>; })}</div>}
        </section>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <section className="rounded-xl border border-border bg-surface p-5"><div className="flex items-center gap-2"><ShieldCheck size={14} className="text-accent" /><Label>Risk posture</Label></div><div className="mt-3 text-sm font-medium text-text">{activePositions} active positions</div><div className="mt-1 font-mono text-[10px] text-muted">{fmtUsd(exposure)} total exposure</div></section>
        <section className="rounded-xl border border-border bg-surface p-5"><Label>Largest position</Label><div className="mt-3 font-mono text-lg font-semibold text-text">{fmtUsd(maxPosition)}</div><div className="mt-1 text-[10px] text-muted">Current market value</div></section>
        <section className="rounded-xl border border-border bg-surface p-5"><Label>System status</Label><div className="mt-3 flex items-center gap-2 text-sm font-medium text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(85,214,199,0.6)]" />Connected</div><div className="mt-1 text-[10px] text-muted">{lastUpdated ? `API updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for update"}</div></section>
      </div>
    </div>
  );
}
