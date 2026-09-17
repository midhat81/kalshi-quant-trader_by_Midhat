import asyncio
import json
import time
from typing import Any

from websockets import connect

from app.adapters.kalshi import kalshi_client
from app.core.config import settings


class LiveMarketFeed:
    """Shared Kalshi WebSocket market feed for connected terminal clients."""

    WS_PATH = "/trade-api/ws/v2"
    WS_URL = "wss://external-api-ws.kalshi.com/trade-api/ws/v2"

    def __init__(self) -> None:
        self.clients: set[Any] = set()
        self.task: asyncio.Task | None = None
        self._sequence = 0

    def _headers(self) -> dict[str, str]:
        timestamp_ms = str(int(time.time() * 1000))
        signature = kalshi_client._sign(timestamp_ms, "GET", self.WS_PATH)
        return {
            "KALSHI-ACCESS-KEY": settings.kalshi_api_key,
            "KALSHI-ACCESS-SIGNATURE": signature,
            "KALSHI-ACCESS-TIMESTAMP": timestamp_ms,
        }

    async def connect_client(self, websocket: Any) -> None:
        self.clients.add(websocket)
        if self.task is None or self.task.done():
            self.task = asyncio.create_task(self._run())

    async def disconnect_client(self, websocket: Any) -> None:
        self.clients.discard(websocket)
        if not self.clients and self.task and not self.task.done():
            self.task.cancel()
            try:
                await self.task
            except asyncio.CancelledError:
                pass
            self.task = None

    async def _broadcast(self, payload: dict[str, Any]) -> None:
        if not self.clients:
            return
        message = json.dumps(payload, separators=(",", ":"))
        dead: list[Any] = []
        for client in tuple(self.clients):
            try:
                await client.send_text(message)
            except Exception:
                dead.append(client)
        for client in dead:
            self.clients.discard(client)

    async def _market_tickers(self) -> list[str]:
        data = await asyncio.to_thread(kalshi_client.get_markets, 50, None, "open", None)
        markets = data.get("markets", [])
        return [m.get("ticker") for m in markets if m.get("ticker")][:50]

    async def _run(self) -> None:
        backoff = 1
        while self.clients:
            try:
                headers = self._headers()
                async with connect(
                    self.WS_URL,
                    additional_headers=headers,
                    ping_interval=None,
                    close_timeout=5,
                ) as ws:
                    tickers = await self._market_tickers()
                    if not tickers:
                        await self._broadcast({"type": "status", "status": "no_markets"})
                        await asyncio.sleep(15)
                        continue

                    self._sequence += 1
                    await ws.send(json.dumps({
                        "id": self._sequence,
                        "cmd": "subscribe",
                        "params": {
                            "channels": ["ticker"],
                            "market_tickers": tickers,
                        },
                    }))
                    await self._broadcast({
                        "type": "status",
                        "status": "connected",
                        "markets": len(tickers),
                        "source": "kalshi_ws",
                    })
                    backoff = 1

                    while self.clients:
                        raw = await ws.recv()
                        if isinstance(raw, bytes):
                            raw = raw.decode("utf-8")
                        message = json.loads(raw)
                        if message.get("type") != "ticker":
                            continue

                        msg = message.get("msg", message)
                        ticker = msg.get("ticker")
                        if not ticker:
                            continue

                        def number(*keys: str):
                            for key in keys:
                                value = msg.get(key)
                                if value is not None:
                                    try:
                                        return float(value)
                                    except (TypeError, ValueError):
                                        return None
                            return None

                        yes_bid = number("yes_bid_dollars", "yes_bid")
                        yes_ask = number("yes_ask_dollars", "yes_ask")
                        no_bid = number("no_bid_dollars", "no_bid")
                        no_ask = number("no_ask_dollars", "no_ask")
                        volume = number("volume_fp", "volume")
                        spread = round(yes_ask - yes_bid, 6) if yes_bid is not None and yes_ask is not None else None

                        await self._broadcast({
                            "type": "ticker",
                            "market_id": ticker,
                            "timestamp": msg.get("timestamp") or msg.get("ts") or msg.get("created_time"),
                            "yes_bid": yes_bid,
                            "yes_ask": yes_ask,
                            "no_bid": no_bid,
                            "no_ask": no_ask,
                            "spread": spread,
                            "volume": volume,
                            "status": msg.get("status"),
                            "last_price": number("last_price_dollars", "last_price"),
                        })
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                await self._broadcast({"type": "status", "status": "reconnecting", "error": str(exc)[:180]})
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)


live_market_feed = LiveMarketFeed()
