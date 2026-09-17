import { useEffect, useMemo, useState } from "react";
import { Activity, ArrowDownRight, ArrowUpRight, RefreshCw, Target, Zap } from "lucide-react";
import { api } from "../api/client";
import type { Signal } from "../types";
import { Badge } from "../components/Badge";

function fmtTime(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });
}

function fmtPct(value: number, digits = 1): string {
  return `${(value * 100).toFixed(digits)}%`;
}

function timeAgo(ts: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

export function Signals() {
  const [signals, setSignals] = useState<Signal[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [, setNow] = useState(Date.now());

  const loadSignals = async (manual = false) => {
    if (manual) setRefreshing(true);
    setError(null);
    try {
      const data = await api.getSignals(50);
      setSignals(data);
      setLastUpdated(new Date());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    void loadSignals();
    const refresh = window.setInterval(() => void loadSignals(), 30000);
    const clock = window.setInterval(() => setNow(Date.now()), 1000);
    return () => {
      window.clearInterval(refresh);
      window.clearInterval(clock);
    };
  }, []);

  const stats = useMemo(() => {
    const actionable = signals.filter((s) => s.edge > 0);
    const avgEdge = signals.length
      ? signals.reduce((sum, signal) => sum + signal.edge, 0) / signals.length
      : 0;
    const avgConfidence = signals.length
      ? signals.reduce((sum, signal) => sum + signal.confidence, 0) / signals.length
      : 0;
    const yesCount = signals.filter((s) => s.side === "yes").length;
    return {
      actionable: actionable.length,
      avgEdge,
      avgConfidence,
      yesCount,
      noCount: signals.length - yesCount,
    };
  }, [signals]);

  if (loading) return <div className="text-muted">Loading signals...</div>;
  if (error && signals.length === 0) {
    return (
      <div className="space-y-4">
        <div className="text-warning">Failed to load signals: {error}</div>
        <button onClick={() => void loadSignals(true)} className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text hover:bg-bg transition-colors">
          <RefreshCw size={14} /> Retry
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            <span className="text-[11px] uppercase tracking-[0.16em] text-muted">Signal engine</span>
          </div>
          <h1 className="text-2xl font-semibold tracking-tight text-text">Signal Workspace</h1>
          <p className="mt-1 text-sm text-muted">Market probability → model probability → edge → confidence</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="text-right hidden sm:block">
            <div className="text-[11px] uppercase tracking-wider text-muted">Last API update</div>
            <div className="font-mono text-xs text-text">{lastUpdated ? lastUpdated.toLocaleTimeString() : "—"}</div>
          </div>
          <button
            onClick={() => void loadSignals(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text hover:bg-bg transition-colors disabled:opacity-50"
          >
            <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="rounded-md border border-warning/30 bg-warning/5 px-3 py-2 text-xs text-warning">
          Refresh failed: {error}. Showing the latest available signals.
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-muted"><span className="text-xs">Signals</span><Activity size={15} /></div>
          <div className="mt-2 font-mono text-xl text-text">{signals.length}</div>
          <div className="mt-1 text-[11px] text-muted">latest engine output</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-muted"><span className="text-xs">Positive edge</span><Zap size={15} /></div>
          <div className="mt-2 font-mono text-xl text-accent">{stats.actionable}</div>
          <div className="mt-1 text-[11px] text-muted">signals above zero edge</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-muted"><span className="text-xs">Avg. edge</span><Target size={15} /></div>
          <div className={`mt-2 font-mono text-xl ${stats.avgEdge >= 0 ? "text-accent" : "text-warning"}`}>{fmtPct(stats.avgEdge, 2)}</div>
          <div className="mt-1 text-[11px] text-muted">across displayed signals</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-muted"><span className="text-xs">Avg. confidence</span><Activity size={15} /></div>
          <div className="mt-2 font-mono text-xl text-text">{fmtPct(stats.avgConfidence, 0)}</div>
          <div className="mt-1 text-[11px] text-muted">YES {stats.yesCount} · NO {stats.noCount}</div>
        </div>
      </section>

      {signals.length === 0 ? (
        <div className="rounded-lg border border-border bg-surface p-10 text-center">
          <Activity className="mx-auto mb-3 text-muted" size={22} />
          <div className="text-sm text-text">No signals generated yet.</div>
          <div className="mt-1 text-xs text-muted">Signals will appear here as the strategy evaluates market snapshots.</div>
        </div>
      ) : (
        <section className="overflow-hidden rounded-lg border border-border bg-surface">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div>
              <h2 className="text-sm font-medium text-text">Recent signals</h2>
              <p className="mt-0.5 text-[11px] text-muted">Most recent strategy outputs from the signal engine</p>
            </div>
            <div className="font-mono text-[11px] text-muted">{signals.length} shown</div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full min-w-[980px] text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/40 text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-normal">Signal</th>
                  <th className="px-4 py-3 font-normal">Market</th>
                  <th className="px-4 py-3 font-normal">Side</th>
                  <th className="px-4 py-3 text-right font-normal">Market prob.</th>
                  <th className="px-4 py-3 text-right font-normal">Model prob.</th>
                  <th className="px-4 py-3 text-right font-normal">Edge</th>
                  <th className="px-4 py-3 text-right font-normal">Confidence</th>
                  <th className="px-4 py-3 font-normal">Strategy</th>
                  <th className="px-4 py-3 font-normal">Time</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {signals.map((s) => {
                  const positive = s.edge >= 0;
                  return (
                    <tr key={s.id} className="border-b border-border/50 transition-colors hover:bg-bg/30">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className={`flex h-6 w-6 items-center justify-center rounded border ${positive ? "border-accent/20 bg-accent/5 text-accent" : "border-warning/20 bg-warning/5 text-warning"}`}>
                            {positive ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
                          </span>
                          <span className="text-[11px] text-muted">{s.id.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-medium text-text">{s.market_id}</td>
                      <td className="px-4 py-3">
                        <Badge tone={s.side === "yes" ? "positive" : "negative"}>{s.side.toUpperCase()}</Badge>
                      </td>
                      <td className="px-4 py-3 text-right text-muted">{fmtPct(s.market_probability, 1)}</td>
                      <td className="px-4 py-3 text-right text-text">{fmtPct(s.model_probability, 1)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${positive ? "text-accent" : "text-warning"}`}>
                        {positive ? "+" : ""}{fmtPct(s.edge, 2)}
                      </td>
                      <td className="px-4 py-3 text-right text-text">{fmtPct(s.confidence, 0)}</td>
                      <td className="max-w-[180px] truncate px-4 py-3 text-xs text-muted" title={s.strategy_name}>{s.strategy_name}</td>
                      <td className="px-4 py-3 text-xs text-muted whitespace-nowrap">
                        <div>{fmtTime(s.timestamp)}</div>
                        <div className="mt-0.5 text-[10px] text-muted/70">{timeAgo(s.timestamp)}</div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {signals.length > 0 && (
        <section className="grid gap-4 lg:grid-cols-2">
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-wider text-muted">Signal interpretation</div>
            <div className="mt-3 grid grid-cols-3 gap-3 text-center">
              <div className="rounded-md border border-border bg-bg/30 p-3"><div className="font-mono text-sm text-text">{fmtPct(stats.avgConfidence, 0)}</div><div className="mt-1 text-[10px] text-muted">AVG CONFIDENCE</div></div>
              <div className="rounded-md border border-border bg-bg/30 p-3"><div className="font-mono text-sm text-accent">{stats.yesCount}</div><div className="mt-1 text-[10px] text-muted">YES SIGNALS</div></div>
              <div className="rounded-md border border-border bg-bg/30 p-3"><div className="font-mono text-sm text-warning">{stats.noCount}</div><div className="mt-1 text-[10px] text-muted">NO SIGNALS</div></div>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-surface p-4">
            <div className="text-xs uppercase tracking-wider text-muted">Engine status</div>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex h-8 w-8 items-center justify-center rounded-md border border-accent/20 bg-accent/5 text-accent"><Activity size={16} /></span>
              <div><div className="text-sm text-text">Signal feed active</div><div className="mt-0.5 text-xs text-muted">Automatic refresh every 30 seconds</div></div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
