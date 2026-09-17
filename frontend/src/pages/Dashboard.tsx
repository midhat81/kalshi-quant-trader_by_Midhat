import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, BarChart3, RefreshCw, ShieldCheck, WifiOff, Zap } from "lucide-react";
import { api } from "../api/client";
import { useLiveMarketFeed } from "../hooks/useLiveMarketFeed";
import type { Position, PortfolioSummary, Signal } from "../types";

function usd(n: number | null): string { if (n === null) return "—"; return `${n < 0 ? "-" : ""}$${Math.abs(n).toFixed(2)}`; }
function price(n: number | null): string { return n === null ? "—" : n.toFixed(2); }
function pct(n: number): string { return `${n >= 0 ? "+" : ""}${(n * 100).toFixed(2)}%`; }
function ago(timestamp: string): string { const s = Math.max(0, Math.floor((Date.now() - new Date(timestamp).getTime()) / 1000)); return s < 60 ? `${s}s` : s < 3600 ? `${Math.floor(s / 60)}m` : `${Math.floor(s / 3600)}h`; }
function Tag({ children }: { children: React.ReactNode }) { return <span className="font-mono text-[9px] uppercase tracking-[.15em] text-subtle">{children}</span>; }

export function Dashboard() {
  const [pnl, setPnl] = useState<PortfolioSummary | null>(null);
  const [positions, setPositions] = useState<Position[]>([]);
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(() => new Date());
  const { status: liveStatus, markets: liveMarkets, lastTick } = useLiveMarketFeed(true);

  const load = async (silent = false) => {
    if (!silent) setRefreshing(true);
    try {
      const [p, pos, sig] = await Promise.all([api.getPnl(), api.getPositions(), api.getSignals(6)]);
      setPnl(p); setPositions(pos); setSignals(sig); setLastUpdated(new Date());
    } catch (e) { console.error("Dashboard data error", e); }
    finally { setLoading(false); setRefreshing(false); }
  };
  useEffect(() => { void load(); const c = window.setInterval(() => setNow(new Date()), 1000); const r = window.setInterval(() => void load(true), 30000); return () => { window.clearInterval(c); window.clearInterval(r); }; }, []);

  const livePositions = useMemo(() => positions.map((position) => {
    const quote = liveMarkets.find((market) => market.market_id === position.market_id);
    if (!quote) return position;
    const mark = position.side === "yes" ? quote.yes_bid : quote.no_bid;
    if (mark === null || mark <= 0) return position;
    const marketValue = mark * position.quantity;
    return { ...position, current_price: mark, market_value: marketValue, unrealized_pnl: (mark - position.average_entry_price) * position.quantity };
  }), [positions, liveMarkets]);

  const liveMarked = livePositions.some((position) => position.current_price !== null);
  const liveUnrealized = livePositions.reduce((sum, position) => sum + (position.unrealized_pnl ?? 0), 0);
  const liveExposure = livePositions.reduce((sum, position) => sum + (position.market_value ?? 0), 0);
  const total = liveMarked ? (pnl?.total_realized_pnl ?? 0) + liveUnrealized : (pnl?.total_pnl ?? 0);
  const exposure = liveMarked ? liveExposure : (pnl?.total_exposure ?? 0);
  const active = pnl?.open_position_count ?? positions.length;
  const maxPosition = useMemo(() => livePositions.reduce((m, p) => Math.max(m, Math.abs(p.market_value ?? 0)), 0), [livePositions]);

  if (loading) return <div className="flex min-h-[65vh] items-center justify-center font-mono text-[11px] text-muted"><RefreshCw size={14} className="mr-3 animate-spin text-accent" />INITIALIZING TERMINAL</div>;

  return (
    <div className="terminal-grid -mx-5 -my-7 min-h-[calc(100vh-64px)] px-5 py-7 sm:-mx-7 sm:px-7 lg:-mx-9 lg:px-9 lg:py-8">
      <div className="mx-auto max-w-[1540px] space-y-4">
        <header className="flex flex-col gap-4 border-b border-border pb-4 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex items-center gap-4"><div className="flex h-10 w-10 items-center justify-center border border-border bg-surface"><Activity size={17} className="text-accent" /></div><div><div className="flex items-center gap-2"><span className="font-mono text-[9px] uppercase tracking-[.2em] text-accent">Portfolio / 01</span><span className="h-1 w-1 rounded-full bg-border-strong" /><span className="font-mono text-[9px] text-subtle">PAPER</span></div><h1 className="mt-1 text-[23px] font-semibold tracking-[-.03em]">Quantitative trading terminal</h1></div></div>
          <div className="flex items-center gap-2"><div className="border border-border bg-surface px-3 py-2 font-mono text-[10px] tabular-nums text-muted">{now.toLocaleDateString(undefined, { weekday: "short", month: "short", day: "2-digit" })} <span className="mx-2 text-subtle">/</span> <span className="text-text">{now.toLocaleTimeString(undefined, { hour12: false })}</span></div><div className={`flex h-9 items-center gap-2 border px-3 font-mono text-[9px] uppercase tracking-[.08em] ${liveStatus === "connected" ? "border-accent/30 bg-accent-soft text-accent" : "border-border bg-surface text-muted"}`}>{liveStatus === "connected" ? <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent" /> : <WifiOff size={11} />}{liveStatus === "connected" ? "LIVE" : liveStatus.toUpperCase()}</div><button type="button" onClick={() => void load()} disabled={refreshing} className="flex h-9 items-center gap-2 border border-border bg-accent px-3 text-[10px] font-semibold uppercase tracking-[.08em] text-black transition hover:bg-[#e5ff78] disabled:opacity-50"><RefreshCw size={12} className={refreshing ? "animate-spin" : ""} />Sync</button></div>
        </header>

        <section className="grid border border-border bg-surface lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          <div className="border-b border-border p-5 lg:border-b-0 lg:border-r"><Tag>Total P&L</Tag><div className={`mt-2 font-mono text-[34px] font-medium tracking-[-.04em] ${total >= 0 ? "text-accent" : "text-warning"}`}>{usd(total)}</div><div className="mt-2 flex items-center gap-2 text-[10px] text-muted"><span className="inline-flex items-center gap-1 border border-border px-1.5 py-1"><span className={`h-1.5 w-1.5 rounded-full ${liveMarked ? "bg-accent" : "bg-subtle"}`} />{liveMarked ? "LIVE" : "REST"}</span> mark-to-market</div></div>
          <div className="border-b border-border p-5 lg:border-b-0 lg:border-r"><Tag>Realized</Tag><div className="mt-3 font-mono text-xl tabular-nums">{usd(pnl?.total_realized_pnl ?? 0)}</div><div className="mt-1 text-[10px] text-muted">closed P&L</div></div>
          <div className="border-b border-border p-5 lg:border-b-0 lg:border-r"><Tag>Exposure</Tag><div className="mt-3 font-mono text-xl tabular-nums">{usd(exposure)}</div><div className="mt-1 text-[10px] text-muted">{liveMarked ? "live marked exposure" : "capital deployed"}</div></div>
          <div className="p-5"><Tag>Inventory</Tag><div className="mt-3 font-mono text-xl tabular-nums">{active} <span className="text-sm text-muted">markets</span></div><div className="mt-1 text-[10px] text-muted">{pnl?.positions_missing_price_count ?? 0} missing marks</div></div>
        </section>

        <section className="overflow-hidden border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3"><div><div className="text-[11px] font-semibold uppercase tracking-[.08em]">Live market tape</div><div className="font-mono text-[9px] text-subtle">KALSHI WEBSOCKET · {liveMarkets.length} STREAMING MARKETS</div></div><div className="font-mono text-[8px] text-subtle">{lastTick ? `TICK ${lastTick.toLocaleTimeString(undefined, { hour12: false })}` : "WAITING FOR TICKS"}</div></div>
          {liveMarkets.length === 0 ? <div className="p-6 text-center font-mono text-[9px] text-muted">WAITING FOR LIVE MARKET DATA</div> : <div className="grid divide-y divide-border md:grid-cols-2 xl:grid-cols-4 xl:divide-x xl:divide-y-0">{liveMarkets.slice(0, 4).map((market) => <div key={market.market_id} className="p-4 transition-colors hover:bg-surface-hover"><div className="truncate font-mono text-[9px] font-semibold">{market.market_id}</div><div className="mt-3 flex items-end justify-between gap-3"><div><Tag>YES BID</Tag><div className="mt-1 font-mono text-lg text-accent">{market.yes_bid === null ? "—" : `$${market.yes_bid.toFixed(2)}`}</div></div><div className="text-right"><Tag>YES ASK</Tag><div className="mt-1 font-mono text-lg">{market.yes_ask === null ? "—" : `$${market.yes_ask.toFixed(2)}`}</div></div></div><div className="mt-3 flex justify-between border-t border-border pt-2 font-mono text-[8px] text-subtle"><span>SPREAD {market.spread === null ? "—" : `$${market.spread.toFixed(3)}`}</span><span>{market.volume === null ? "—" : `${market.volume.toFixed(0)} VOL`}</span></div></div>)}</div>}
        </section>

        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.8fr)_minmax(360px,.8fr)]">
          <section className="overflow-hidden border border-border bg-surface terminal-glow">
            <div className="flex items-center justify-between border-b border-border px-4 py-3"><div className="flex items-center gap-2"><BarChart3 size={14} className="text-accent" /><div><div className="text-[11px] font-semibold uppercase tracking-[.08em]">Position book</div><div className="font-mono text-[9px] text-subtle">LIVE INVENTORY · {livePositions.length} ROWS</div></div></div><Tag>MTM</Tag></div>
            {livePositions.length === 0 ? <div className="p-12 text-center text-[11px] text-muted">NO OPEN POSITIONS</div> : <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-[11px]"><thead className="border-b border-border bg-[#101010] font-mono text-[8px] uppercase tracking-[.16em] text-subtle"><tr><th className="px-4 py-3 text-left">Market</th><th className="px-3 py-3 text-left">Side</th><th className="px-3 py-3 text-right">Qty</th><th className="px-3 py-3 text-right">Avg</th><th className="px-3 py-3 text-right">Mark</th><th className="px-3 py-3 text-right">Value</th><th className="px-4 py-3 text-right">PnL</th></tr></thead><tbody>{livePositions.map(p => { const v = p.unrealized_pnl; const positive = (v ?? 0) >= 0; return <tr key={`${p.market_id}-${p.side}`} className="border-b border-border/70 transition-colors hover:bg-surface-hover"><td className="px-4 py-3.5"><div className="font-mono font-medium">{p.market_id}</div><div className="mt-0.5 text-[9px] text-subtle">{p.market_status ?? "—"}</div></td><td className="px-3"><span className={`inline-flex border px-2 py-1 font-mono text-[8px] font-bold uppercase ${p.side === "yes" ? "border-accent/30 bg-accent-soft text-accent" : "border-warning/30 bg-warning/10 text-warning"}`}>{p.side}</span></td><td className="px-3 text-right font-mono tabular-nums">{p.quantity}</td><td className="px-3 text-right font-mono tabular-nums text-muted">{price(p.average_entry_price)}</td><td className="px-3 text-right font-mono tabular-nums text-muted">{price(p.current_price)}</td><td className="px-3 text-right font-mono tabular-nums">{usd(p.market_value)}</td><td className={`px-4 text-right font-mono font-semibold tabular-nums ${v === null ? "text-muted" : positive ? "text-accent" : "text-warning"}`}>{v === null ? "—" : <span className="inline-flex items-center gap-1">{positive ? <ArrowUpRight size={11}/> : <ArrowDownRight size={11}/>} {usd(v)}</span>}</td></tr>; })}</tbody></table></div>}
          </section>

          <section className="overflow-hidden border border-border bg-surface">
            <div className="border-b border-border px-4 py-3"><div className="flex items-center gap-2"><Zap size={13} className="text-accent" /><div><div className="text-[11px] font-semibold uppercase tracking-[.08em]">Signal feed</div><div className="font-mono text-[9px] text-subtle">MODEL OUTPUT · REAL TIME</div></div></div></div>
            {signals.length === 0 ? <div className="p-10 text-center font-mono text-[10px] text-muted">NO SIGNALS</div> : <div className="divide-y divide-border">{signals.map(s => <div key={s.id} className="p-4 transition-colors hover:bg-surface-hover"><div className="flex items-center justify-between gap-3"><div className="min-w-0"><div className="truncate font-mono text-[10px] font-semibold">{s.market_id}</div><div className="mt-1 flex items-center gap-2"><span className={`font-mono text-[8px] font-bold uppercase ${s.side === "yes" ? "text-accent" : "text-warning"}`}>{s.side}</span><span className="text-[9px] text-muted">{s.strategy_name}</span></div></div><span className={`font-mono text-[11px] font-semibold ${s.edge >= 0 ? "text-accent" : "text-warning"}`}>{pct(s.edge)}</span></div><div className="mt-4 grid grid-cols-3 gap-2 border-t border-border pt-3"><div><Tag>Market</Tag><div className="mt-1 font-mono text-[10px]">{(s.market_probability * 100).toFixed(1)}%</div></div><div><Tag>Model</Tag><div className="mt-1 font-mono text-[10px]">{(s.model_probability * 100).toFixed(1)}%</div></div><div><Tag>Conf.</Tag><div className="mt-1 font-mono text-[10px]">{(s.confidence * 100).toFixed(0)}%</div></div></div><div className="mt-3 flex items-center justify-between font-mono text-[8px] text-subtle"><span className="truncate pr-2">{s.reason ?? "MODEL SIGNAL"}</span><span>{ago(s.timestamp)}</span></div></div>)}</div>}
          </section>
        </div>

        <section className="grid border border-border bg-surface md:grid-cols-3">
          <div className="border-b border-border p-4 md:border-b-0 md:border-r"><div className="flex items-center gap-2"><ShieldCheck size={13} className="text-accent"/><Tag>Risk state</Tag></div><div className="mt-2 text-sm">{active} active positions</div><div className="mt-1 font-mono text-[9px] text-muted">{usd(exposure)} exposure</div></div>
          <div className="border-b border-border p-4 md:border-b-0 md:border-r"><Tag>Largest mark</Tag><div className="mt-2 font-mono text-lg">{usd(maxPosition)}</div><div className="mt-1 text-[9px] text-muted">largest current position value</div></div>
          <div className="p-4"><Tag>System</Tag><div className="mt-2 flex items-center gap-2 text-sm"><span className={`h-1.5 w-1.5 rounded-full ${liveStatus === "connected" ? "bg-accent" : "bg-warning"}`}/>{liveStatus === "connected" ? "Kalshi WebSocket connected" : `Feed ${liveStatus}`}</div><div className="mt-1 font-mono text-[9px] text-muted">{lastTick ? `LAST TICK ${lastTick.toLocaleTimeString(undefined, { hour12: false })}` : lastUpdated ? `REST SYNC ${lastUpdated.toLocaleTimeString(undefined, { hour12: false })}` : "SYNCING"}</div></div>
        </section>
      </div>
    </div>
  );
}
