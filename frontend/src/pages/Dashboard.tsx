import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, RefreshCw, ShieldCheck, TrendingUp } from "lucide-react";
import { api } from "../api/client";
import type { Position, PortfolioSummary, Signal } from "../types";

function fmtUsd(n: number | null): string {
  if (n === null) return "—";
  const sign = n < 0 ? "-" : "";
  return `${sign}$${Math.abs(n).toFixed(2)}`;
}

function fmtPrice(n: number | null): string {
  return n === null ? "—" : n.toFixed(2);
}

function fmtPct(n: number): string {
  return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`;
}

function timeAgo(timestamp: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  return `${Math.floor(minutes / 60)}h ago`;
}

function SectionHeader({ title, subtitle, icon: Icon }: { title: string; subtitle?: string; icon: typeof Activity }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-border bg-bg text-accent"><Icon size={15} strokeWidth={1.8} /></div>
      <div><h2 className="text-sm font-semibold text-text">{title}</h2>{subtitle && <p className="mt-0.5 text-[11px] text-muted">{subtitle}</p>}</div>
    </div>
  );
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

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center"><div className="flex items-center gap-3 text-sm text-muted"><RefreshCw size={15} className="animate-spin" />Loading portfolio data...</div></div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_10px_rgba(79,209,197,0.65)]" />Live portfolio</div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Trading overview</h1>
          <p className="mt-1 text-sm text-muted">Real-time paper trading performance and execution signals.</p>
        </div>
        <div className="flex items-center gap-3 text-xs text-muted">
          <div className="rounded-lg border border-border bg-surface px-3 py-2 font-mono">{now.toLocaleDateString(undefined, { month: "short", day: "2-digit", year: "numeric" })}<span className="mx-2 text-border">•</span>{now.toLocaleTimeString(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit" })}</div>
          <button type="button" onClick={() => void loadDashboard()} disabled={refreshing} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-text transition hover:border-accent/40 hover:bg-surface/80 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />Refresh</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-5">
        {[
          ["Total PnL", fmtUsd(pnl?.total_pnl ?? null), pnlPositive ? "text-accent" : "text-warning", "Portfolio performance"],
          ["Realized", fmtUsd(pnl?.total_realized_pnl ?? 0), "text-text", "Locked PnL"],
          ["Unrealized", fmtUsd(pnl?.total_unrealized_pnl ?? null), "text-text", "Open positions"],
          ["Exposure", fmtUsd(exposure), "text-text", "Capital at risk"],
          ["Open positions", String(pnl?.open_position_count ?? 0), "text-text", "Active markets"],
        ].map(([label, value, tone, hint]) => (
          <div key={label} className="rounded-xl border border-border bg-surface p-4 transition hover:border-border/80 hover:bg-surface/80">
            <div className="mb-3 text-[10px] uppercase tracking-[0.12em] text-muted">{label}</div>
            <div className={`font-mono text-xl font-semibold tracking-tight ${tone}`}>{value}</div>
            <div className="mt-2 text-[11px] text-muted">{hint}</div>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.45fr_1fr]">
        <section className="overflow-hidden rounded-xl border border-border bg-surface">
          <div className="p-5 pb-0"><SectionHeader title="Open positions" subtitle="Current portfolio inventory" icon={BarChart3} /></div>
          {positions.length === 0 ? <div className="px-5 pb-6 text-sm text-muted">No open positions yet.</div> : <div className="overflow-x-auto"><table className="w-full min-w-[680px] text-sm">
            <thead className="border-y border-border bg-bg/40 text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-3 text-left font-medium">Market</th><th className="px-3 py-3 text-left font-medium">Side</th><th className="px-3 py-3 text-right font-medium">Qty</th><th className="px-3 py-3 text-right font-medium">Entry</th><th className="px-3 py-3 text-right font-medium">Current</th><th className="px-5 py-3 text-right font-medium">PnL</th></tr></thead>
            <tbody>{positions.map((p) => { const positive = (p.unrealized_pnl ?? 0) >= 0; return <tr key={`${p.market_id}-${p.side}`} className="border-b border-border/60 transition hover:bg-bg/35">
              <td className="px-5 py-3.5 font-mono text-xs text-text">{p.market_id}</td><td className="px-3 py-3.5"><span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${p.side === "yes" ? "border-accent/25 bg-accent/10 text-accent" : "border-warning/25 bg-warning/10 text-warning"}`}>{p.side}</span></td><td className="px-3 py-3.5 text-right font-mono text-xs text-text">{p.quantity}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-muted">{fmtPrice(p.average_entry_price)}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-muted">{fmtPrice(p.current_price)}</td><td className={`px-5 py-3.5 text-right font-mono text-xs font-medium ${p.unrealized_pnl === null ? "text-muted" : positive ? "text-accent" : "text-warning"}`}>{p.unrealized_pnl === null ? "—" : fmtUsd(p.unrealized_pnl)}</td>
            </tr>; })}</tbody>
          </table></div>}
        </section>

        <section className="rounded-xl border border-border bg-surface p-5">
          <SectionHeader title="Recent signals" subtitle="Model edge and confidence" icon={Activity} />
          {signals.length === 0 ? <p className="text-sm text-muted">No signals generated yet.</p> : <div className="space-y-2">{signals.map((s) => { const positive = s.edge >= 0; return <div key={s.id} className="rounded-lg border border-border/70 bg-bg/45 p-3 transition hover:border-border hover:bg-bg/65">
            <div className="flex items-start justify-between gap-3"><div className="min-w-0"><div className="truncate font-mono text-xs text-text">{s.market_id}</div><div className="mt-1 flex items-center gap-2 text-[10px] text-muted"><span className={`font-semibold uppercase ${s.side === "yes" ? "text-accent" : "text-warning"}`}>{s.side}</span><span>•</span><span>{s.strategy_name}</span></div></div><div className={`flex items-center gap-1 font-mono text-xs font-semibold ${positive ? "text-accent" : "text-warning"}`}>{positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}{fmtPct(s.edge)}</div></div>
            <div className="mt-3 grid grid-cols-3 gap-2 border-t border-border/60 pt-3"><div><div className="text-[9px] uppercase tracking-wide text-muted">Market</div><div className="mt-1 font-mono text-xs text-text">{(s.market_probability * 100).toFixed(1)}%</div></div><div><div className="text-[9px] uppercase tracking-wide text-muted">Model</div><div className="mt-1 font-mono text-xs text-text">{(s.model_probability * 100).toFixed(1)}%</div></div><div><div className="text-[9px] uppercase tracking-wide text-muted">Confidence</div><div className="mt-1 font-mono text-xs text-text">{(s.confidence * 100).toFixed(0)}%</div></div></div>
            <div className="mt-2 text-[10px] text-muted">{timeAgo(s.timestamp)}</div>
          </div>; })}</div>}
        </section>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <div className="rounded-xl border border-border bg-surface p-4"><div className="flex items-center gap-2 text-xs font-medium text-text"><ShieldCheck size={14} className="text-accent" />Risk posture</div><div className="mt-3 font-mono text-sm text-muted">{pnl?.open_position_count ?? 0} active positions</div><div className="mt-1 text-[11px] text-muted">{fmtUsd(exposure)} total exposure</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-xs font-medium text-text">Largest position</div><div className="mt-3 font-mono text-sm text-text">{fmtUsd(maxPosition)}</div><div className="mt-1 text-[11px] text-muted">Current market value</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-xs font-medium text-text">Data status</div><div className="mt-3 flex items-center gap-2 font-mono text-sm text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Connected</div><div className="mt-1 text-[11px] text-muted">{lastUpdated ? `Updated ${lastUpdated.toLocaleTimeString()}` : "Waiting for update"}</div></div>
      </div>
    </div>
  );
}
