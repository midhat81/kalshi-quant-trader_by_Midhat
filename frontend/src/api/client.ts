import type { MarketSnapshot, Signal, Order, Position, PortfolioSummary, Fill, RiskDecision, RiskLimits } from "../types";

const BASE_URL = "http://localhost:8000";

async function get<T>(path: string): Promise<T> {
  const res = await fetch(`${BASE_URL}${path}`);
  if (!res.ok) {
    throw new Error(`API error ${res.status}: ${await res.text()}`);
  }
  return res.json();
}

export const api = {
  getMarkets: (limit = 20) => get<MarketSnapshot[]>(`/api/markets?limit=${limit}`),
  getSignals: (limit = 20) => get<Signal[]>(`/api/signals?limit=${limit}`),
  getOrders: (limit = 20) => get<Order[]>(`/api/orders?limit=${limit}`),
  getTrades: (limit = 20) => get<Fill[]>(`/api/trades?limit=${limit}`),
  getPositions: () => get<Position[]>(`/api/positions`),
  getPnl: () => get<PortfolioSummary>(`/api/pnl`),
  getRiskDecisions: (limit = 20) => get<RiskDecision[]>(`/api/risk/decisions?limit=${limit}`),
  getRiskLimits: () => get<RiskLimits>(`/api/risk/limits`),
};