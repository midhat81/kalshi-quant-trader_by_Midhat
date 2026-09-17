import { useCallback, useEffect, useMemo, useState } from "react";
import { AlertTriangle, CheckCircle2, Clock3, RefreshCw, ShieldCheck, XCircle } from "lucide-react";
import { api } from "../api/client";
import type { RiskDecision, RiskLimits } from "../types";
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

function fmtUsd(value: number): string {
  return `$${value.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
}

function fmtAgo(ts: string): string {
  const seconds = Math.max(0, Math.floor((Date.now() - new Date(ts).getTime()) / 1000));
  if (seconds < 60) return `${seconds}s ago`;
  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  return `${hours}h ago`;
}

function limitLabel(value: number): string {
  return value.toLocaleString(undefined, { maximumFractionDigits: 2 });
}

export function Risk() {
  const [decisions, setDecisions] = useState<RiskDecision[]>([]);
  const [limits, setLimits] = useState<RiskLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [now, setNow] = useState(Date.now());

  const loadRisk = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    setError(null);
    try {
      const [d, l] = await Promise.all([api.getRiskDecisions(50), api.getRiskLimits()]);
      setDecisions(d);
      setLimits(l);
      setLastUpdated(new Date());
    } catch (err) {
      setError(String(err));
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadRisk();
    const refresh = window.setInterval(() => void loadRisk(), 30_000);
    const clock = window.setInterval(() => setNow(Date.now()), 1_000);
    return () => {
      window.clearInterval(refresh);
      window.clearInterval(clock);
    };
  }, [loadRisk]);

  const approved = useMemo(() => decisions.filter((d) => d.approved).length, [decisions]);
  const rejected = decisions.length - approved;
  const approvalRate = decisions.length ? (approved / decisions.length) * 100 : 0;
  const latestDecision = decisions[0];
  const latestRejected = decisions.find((d) => !d.approved);

  if (loading) return <div className="text-muted">Loading risk data...</div>;

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2 text-xs font-mono uppercase tracking-[0.16em] text-accent">
            <ShieldCheck size={14} /> Risk engine
          </div>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-text">Risk controls</h1>
          <p className="mt-1 text-sm text-muted">Pre-trade limits, approvals, and rejection history</p>
        </div>
        <div className="flex items-center gap-3">
          {lastUpdated && (
            <span className="hidden text-xs text-muted sm:inline">Updated {fmtAgo(lastUpdated.toISOString())}</span>
          )}
          <button
            type="button"
            onClick={() => void loadRisk(true)}
            disabled={refreshing}
            className="inline-flex items-center gap-2 rounded-md border border-border bg-surface px-3 py-2 text-sm text-text transition-colors hover:border-muted/50 hover:bg-bg disabled:cursor-not-allowed disabled:opacity-60"
          >
            <RefreshCw size={15} className={refreshing ? "animate-spin" : ""} />
            Refresh
          </button>
        </div>
      </header>

      {error && (
        <div className="flex items-center gap-2 rounded-md border border-warning/30 bg-warning/5 px-4 py-3 text-sm text-warning">
          <AlertTriangle size={16} /> Failed to refresh risk data: {error}
        </div>
      )}

      <section className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-xs text-muted"><span>Decisions</span><ShieldCheck size={15} /></div>
          <div className="mt-2 font-mono text-2xl text-text">{decisions.length}</div>
          <div className="mt-1 text-xs text-muted">last 50 checks</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-xs text-muted"><span>Approved</span><CheckCircle2 size={15} /></div>
          <div className="mt-2 font-mono text-2xl text-accent">{approved}</div>
          <div className="mt-1 text-xs text-muted">{approvalRate.toFixed(0)}% approval rate</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-xs text-muted"><span>Rejected</span><XCircle size={15} /></div>
          <div className="mt-2 font-mono text-2xl text-warning">{rejected}</div>
          <div className="mt-1 text-xs text-muted">blocked by controls</div>
        </div>
        <div className="rounded-lg border border-border bg-surface p-4">
          <div className="flex items-center justify-between text-xs text-muted"><span>Engine</span><Clock3 size={15} /></div>
          <div className="mt-2 flex items-center gap-2 font-mono text-lg text-accent"><span className="h-2 w-2 rounded-full bg-accent" />ACTIVE</div>
          <div className="mt-1 text-xs text-muted">{new Date(now).toLocaleTimeString()}</div>
        </div>
      </section>

      {limits && (
        <section>
          <div className="mb-3 flex items-end justify-between">
            <div>
              <h2 className="text-sm font-medium text-text">Active limits</h2>
              <p className="mt-1 text-xs text-muted">Configured guardrails applied before order submission</p>
            </div>
            <span className="hidden font-mono text-[11px] uppercase tracking-wider text-muted sm:block">Pre-trade controls</span>
          </div>
          <div className="grid gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-2 lg:grid-cols-3">
            {[
              ["Max position size", `${limitLabel(limits.max_position_size)} contracts`],
              ["Max market exposure", fmtUsd(limits.max_market_exposure_usd)],
              ["Max portfolio exposure", fmtUsd(limits.max_portfolio_exposure_usd)],
              ["Max daily loss", fmtUsd(limits.max_daily_loss_usd)],
              ["Max open positions", `${limitLabel(limits.max_open_positions)} positions`],
              ["Default order size", `${limitLabel(limits.default_order_size)} contracts`],
            ].map(([label, value]) => (
              <div key={label} className="bg-surface px-4 py-4">
                <div className="text-[11px] uppercase tracking-wider text-muted">{label}</div>
                <div className="mt-2 font-mono text-sm text-text">{value}</div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section>
        <div className="mb-3 flex items-end justify-between">
          <div>
            <h2 className="text-sm font-medium text-text">Decision history</h2>
            <p className="mt-1 text-xs text-muted">Latest risk-engine evaluations</p>
          </div>
          {latestDecision && <span className="font-mono text-[11px] text-muted">Latest {fmtAgo(latestDecision.timestamp)}</span>}
        </div>

        {decisions.length === 0 ? (
          <div className="rounded-lg border border-border bg-surface p-10 text-center">
            <ShieldCheck className="mx-auto text-muted" size={22} />
            <div className="mt-3 text-sm text-text">No risk decisions yet</div>
            <div className="mt-1 text-xs text-muted">The table will populate as signals reach the risk engine.</div>
          </div>
        ) : (
          <div className="overflow-x-auto rounded-lg border border-border bg-surface">
            <table className="w-full min-w-[850px] text-sm">
              <thead>
                <tr className="border-b border-border bg-bg/40 text-left text-[11px] uppercase tracking-wider text-muted">
                  <th className="px-4 py-3 font-medium">Time</th>
                  <th className="px-4 py-3 font-medium">Market</th>
                  <th className="px-4 py-3 font-medium">Side</th>
                  <th className="px-4 py-3 text-right font-medium">Proposed size</th>
                  <th className="px-4 py-3 font-medium">Decision</th>
                  <th className="px-4 py-3 font-medium">Reason</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {decisions.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 transition-colors last:border-0 hover:bg-bg/30">
                    <td className="whitespace-nowrap px-4 py-3 text-xs text-muted" title={d.timestamp}>{fmtTime(d.timestamp)}</td>
                    <td className="px-4 py-3 font-medium text-text">{d.market_id}</td>
                    <td className="px-4 py-3"><Badge tone={d.proposed_side.toLowerCase() === "yes" ? "positive" : "negative"}>{d.proposed_side.toUpperCase()}</Badge></td>
                    <td className="px-4 py-3 text-right text-text">{d.proposed_size}</td>
                    <td className="px-4 py-3"><Badge tone={d.approved ? "positive" : "negative"}>{d.approved ? "APPROVED" : "REJECTED"}</Badge></td>
                    <td className="max-w-[360px] px-4 py-3 text-xs text-muted" title={d.reason ?? "No reason provided"}>{d.reason ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {latestRejected && (
        <section className="rounded-lg border border-warning/20 bg-warning/5 p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="mt-0.5 shrink-0 text-warning" size={17} />
            <div>
              <div className="text-sm font-medium text-text">Latest rejected decision</div>
              <div className="mt-1 text-xs text-muted">
                {latestRejected.market_id} · {latestRejected.proposed_side.toUpperCase()} · {latestRejected.proposed_size} contracts · {fmtAgo(latestRejected.timestamp)}
              </div>
              {latestRejected.reason && <div className="mt-2 text-sm text-warning">{latestRejected.reason}</div>}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}