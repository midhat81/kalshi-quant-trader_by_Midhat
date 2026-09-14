import { useEffect, useState } from "react";
import { api } from "../api/client";
import type { RiskDecision, RiskLimits } from "../types";
import { Badge } from "../components/Badge";

function fmtTime(ts: string): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function Risk() {
  const [decisions, setDecisions] = useState<RiskDecision[]>([]);
  const [limits, setLimits] = useState<RiskLimits | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([api.getRiskDecisions(50), api.getRiskLimits()])
      .then(([d, l]) => {
        setDecisions(d);
        setLimits(l);
      })
      .catch((err) => setError(String(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-muted">Loading risk data...</div>;
  if (error) return <div className="text-warning">Failed to load risk data: {error}</div>;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-text mb-1">Risk</h1>
        <p className="text-sm text-muted">Position limits and approval history</p>
      </div>

      {limits && (
        <div className="border border-border rounded-lg bg-surface p-5">
          <h2 className="text-sm font-medium text-text mb-4">Active Limits</h2>
          <div className="grid grid-cols-3 gap-4 font-mono text-sm">
            <div>
              <div className="text-xs text-muted mb-1">Max Position Size</div>
              <div className="text-text">{limits.max_position_size} contracts</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Max Market Exposure</div>
              <div className="text-text">${limits.max_market_exposure_usd}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Max Portfolio Exposure</div>
              <div className="text-text">${limits.max_portfolio_exposure_usd}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Max Daily Loss</div>
              <div className="text-text">${limits.max_daily_loss_usd}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Max Open Positions</div>
              <div className="text-text">{limits.max_open_positions}</div>
            </div>
            <div>
              <div className="text-xs text-muted mb-1">Default Order Size</div>
              <div className="text-text">{limits.default_order_size} contracts</div>
            </div>
          </div>
        </div>
      )}

      <div>
        <h2 className="text-sm font-medium text-text mb-3">Decision History</h2>
        {decisions.length === 0 ? (
          <div className="border border-border rounded-lg bg-surface p-8 text-center text-muted text-sm">
            No risk decisions yet.
          </div>
        ) : (
          <div className="border border-border rounded-lg bg-surface overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-muted text-xs border-b border-border bg-bg/40">
                  <th className="px-4 py-3 font-normal">Timestamp</th>
                  <th className="px-4 py-3 font-normal">Market</th>
                  <th className="px-4 py-3 font-normal">Side</th>
                  <th className="px-4 py-3 font-normal text-right">Size</th>
                  <th className="px-4 py-3 font-normal">Decision</th>
                  <th className="px-4 py-3 font-normal">Reason</th>
                </tr>
              </thead>
              <tbody className="font-mono">
                {decisions.map((d) => (
                  <tr key={d.id} className="border-b border-border/50 hover:bg-bg/30">
                    <td className="px-4 py-3 text-muted text-xs">{fmtTime(d.timestamp)}</td>
                    <td className="px-4 py-3 text-text">{d.market_id}</td>
                    <td className="px-4 py-3 text-muted uppercase text-xs">{d.proposed_side}</td>
                    <td className="px-4 py-3 text-right">{d.proposed_size}</td>
                    <td className="px-4 py-3">
                      <Badge tone={d.approved ? "positive" : "negative"}>
                        {d.approved ? "APPROVED" : "REJECTED"}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted text-xs max-w-xs truncate" title={d.reason ?? ""}>
                      {d.reason}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}