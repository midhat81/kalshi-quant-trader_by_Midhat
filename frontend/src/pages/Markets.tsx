import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDown, ArrowUp, RefreshCw, Search, Wifi } from "lucide-react";
import { api } from "../api/client";
import { useLiveMarketFeed } from "../hooks/useLiveMarketFeed";
import type { MarketSnapshot } from "../types";

function fmtPrice(n: number | null): string { return n === null ? "—" : n.toFixed(2); }

export function Markets() {
  const [markets, setMarkets] = useState<MarketSnapshot[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const { status: liveStatus, markets: liveMarkets, lastTick } = useLiveMarketFeed(true);

  const loadMarkets = async () => {
    setRefreshing(true); setError(null);
    try { setMarkets(await api.getMarkets(30)); }
    catch (err) { setError(String(err)); }
    finally { setLoading(false); setRefreshing(false); }
  };

  useEffect(() => { void loadMarkets(); }, []);

  const liveMap = useMemo(() => new Map(liveMarkets.map((market) => [market.market_id, market])), [liveMarkets]);
  const mergedMarkets = useMemo(() => markets.map((market) => liveMap.get(market.market_id) ?? market), [markets, liveMap]);
  const filteredMarkets = useMemo(() => mergedMarkets.filter((m) => m.market_id.toLowerCase().includes(query.toLowerCase())), [mergedMarkets, query]);

  if (loading) return <div className="flex min-h-[60vh] items-center justify-center text-sm text-muted"><RefreshCw size={15} className="mr-3 animate-spin" />Loading markets...</div>;
  if (error) return <div className="rounded-xl border border-warning/30 bg-warning/5 p-5 text-sm text-warning">Failed to load markets: {error}</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-6 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="mb-2 flex items-center gap-2 text-[11px] font-mono uppercase tracking-[0.16em] text-accent"><span className={`h-1.5 w-1.5 rounded-full ${liveStatus === "connected" ? "animate-pulse bg-accent" : "bg-warning"}`} />Market monitor <span className="text-subtle">/</span> {liveStatus === "connected" ? "LIVE" : liveStatus.toUpperCase()}</div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Markets</h1>
          <p className="mt-1 text-sm text-muted">Live market snapshots, liquidity and trading conditions.</p>
        </div>
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2"><Search size={14} className="text-muted" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Filter markets" className="w-32 bg-transparent text-xs text-text outline-none placeholder:text-muted/60" /></div>
          <button type="button" onClick={() => void loadMarkets()} disabled={refreshing} className="flex items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-xs text-text transition hover:border-accent/40 disabled:opacity-50"><RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />Refresh</button>
        </div>
      </header>

      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Markets tracked</div><div className="mt-2 font-mono text-xl text-text">{mergedMarkets.length}</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Active</div><div className="mt-2 font-mono text-xl text-accent">{mergedMarkets.filter((m) => m.status === "active").length}</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Volume</div><div className="mt-2 font-mono text-xl text-text">{mergedMarkets.reduce((sum, m) => sum + (m.volume ?? 0), 0).toLocaleString()}</div></div>
        <div className="rounded-xl border border-border bg-surface p-4"><div className="text-[10px] uppercase tracking-[0.12em] text-muted">Showing</div><div className="mt-2 font-mono text-xl text-text">{filteredMarkets.length}</div></div>
      </div>

      <section className="overflow-hidden rounded-xl border border-border bg-surface">
        <div className="flex items-center justify-between border-b border-border px-5 py-4"><div className="flex items-center gap-2 text-sm font-semibold text-text"><Activity size={15} className="text-accent" />Market data <span className="ml-1 inline-flex items-center gap-1 border border-accent/20 bg-accent-soft px-1.5 py-1 font-mono text-[8px] font-bold uppercase text-accent"><Wifi size={9} /> {liveStatus === "connected" ? "WS LIVE" : "REST"}</span></div><span className="font-mono text-[10px] text-muted">{lastTick ? `TICK ${lastTick.toLocaleTimeString(undefined, { hour12: false })}` : `${filteredMarkets.length} / ${mergedMarkets.length}`}</span></div>
        <div className="overflow-x-auto"><table className="w-full min-w-[760px] text-sm">
          <thead className="border-b border-border bg-bg/40 text-[10px] uppercase tracking-wider text-muted"><tr><th className="px-5 py-3 text-left font-medium">Market</th><th className="px-3 py-3 text-right font-medium">Yes Bid</th><th className="px-3 py-3 text-right font-medium">Yes Ask</th><th className="px-3 py-3 text-right font-medium">Spread</th><th className="px-3 py-3 text-right font-medium">Volume</th><th className="px-5 py-3 text-right font-medium">Status</th></tr></thead>
          <tbody>{filteredMarkets.map((m) => { const spread = m.spread ?? 0; return <tr key={m.market_id} className="border-b border-border/60 transition hover:bg-bg/35">
            <td className="px-5 py-3.5"><div className="font-mono text-xs text-text">{m.market_id}</div><div className="mt-1 text-[10px] text-muted">{liveMap.has(m.market_id) ? "WebSocket tick" : `REST snapshot ${new Date(m.timestamp).toLocaleTimeString()}`}</div></td>
            <td className="px-3 py-3.5 text-right font-mono text-xs text-text">{fmtPrice(m.yes_bid)}</td><td className="px-3 py-3.5 text-right font-mono text-xs text-text">{fmtPrice(m.yes_ask)}</td>
            <td className="px-3 py-3.5 text-right font-mono text-xs text-muted"><span className="inline-flex items-center gap-1">{spread > 0.05 ? <ArrowUp size={11} /> : <ArrowDown size={11} />}{fmtPrice(m.spread)}</span></td>
            <td className="px-3 py-3.5 text-right font-mono text-xs text-muted">{m.volume !== null ? m.volume.toLocaleString(undefined, { maximumFractionDigits: 0 }) : "—"}</td>
            <td className="px-5 py-3.5 text-right"><span className={`inline-flex rounded-md border px-2 py-1 text-[10px] font-semibold uppercase ${m.status === "active" ? "border-accent/25 bg-accent/10 text-accent" : "border-border bg-bg text-muted"}`}>{m.status ?? "unknown"}</span></td>
          </tr>; })}</tbody>
        </table></div>
        {filteredMarkets.length === 0 && <div className="p-8 text-center text-sm text-muted">No markets match your filter.</div>}
      </section>
    </div>
  );
}
