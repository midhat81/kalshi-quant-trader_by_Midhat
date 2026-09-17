import { useEffect, useRef, useState } from "react";
import type { MarketSnapshot } from "../types";

export type LiveFeedStatus = "connecting" | "connected" | "reconnecting" | "offline";

type LiveMessage =
  | { type: "status"; status: LiveFeedStatus | "no_markets"; markets?: number; error?: string }
  | ({ type: "ticker" } & MarketSnapshot & { last_price?: number | null });

function wsUrl(): string {
  const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
  const url = new URL(base);
  url.protocol = url.protocol === "https:" ? "wss:" : "ws:";
  url.pathname = `${url.pathname.replace(/\/$/, "")}/ws/market-feed`;
  return url.toString();
}

export function useLiveMarketFeed(enabled = true) {
  const [status, setStatus] = useState<LiveFeedStatus>(enabled ? "connecting" : "offline");
  const [markets, setMarkets] = useState<Record<string, MarketSnapshot>>({});
  const [lastTick, setLastTick] = useState<Date | null>(null);
  const socketRef = useRef<WebSocket | null>(null);
  const retryRef = useRef<number | null>(null);
  const stoppedRef = useRef(false);

  useEffect(() => {
    stoppedRef.current = false;
    if (!enabled) {
      setStatus("offline");
      return;
    }

    let retryMs = 1000;

    const connect = () => {
      if (stoppedRef.current) return;
      setStatus("connecting");
      const socket = new WebSocket(wsUrl());
      socketRef.current = socket;

      socket.onopen = () => {
        retryMs = 1000;
        setStatus("connected");
      };

      socket.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data) as LiveMessage;
          if (message.type === "status") {
            if (message.status === "connected" || message.status === "reconnecting") setStatus(message.status);
            return;
          }
          if (message.type !== "ticker") return;

          const snapshot: MarketSnapshot = {
            market_id: message.market_id,
            timestamp: message.timestamp || new Date().toISOString(),
            yes_bid: message.yes_bid,
            yes_ask: message.yes_ask,
            no_bid: message.no_bid,
            no_ask: message.no_ask,
            spread: message.spread,
            volume: message.volume,
            status: message.status,
          };
          setMarkets((current) => ({ ...current, [snapshot.market_id]: snapshot }));
          setLastTick(new Date(snapshot.timestamp));
        } catch {
          // Ignore malformed upstream messages; REST remains the fallback.
        }
      };

      socket.onclose = () => {
        if (stoppedRef.current) return;
        setStatus("reconnecting");
        retryRef.current = window.setTimeout(connect, retryMs);
        retryMs = Math.min(retryMs * 2, 30000);
      };

      socket.onerror = () => setStatus("reconnecting");
    };

    connect();
    return () => {
      stoppedRef.current = true;
      if (retryRef.current) window.clearTimeout(retryRef.current);
      socketRef.current?.close();
      socketRef.current = null;
    };
  }, [enabled]);

  return { status, markets: Object.values(markets), lastTick };
}
