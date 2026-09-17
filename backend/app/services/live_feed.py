import asyncio
import json
import logging
import time
from datetime import datetime, timezone
from typing import Any

from websockets.legacy.client import connect

from app.adapters.kalshi import kalshi_client
from app.core.config import settings

logger = logging.getLogger(__name__)


class LiveMarketFeed:
    """Shared authenticated Kalshi WebSocket market feed for terminal clients."""

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

    async def _markets(self) -> list[dict[str, Any]]:
        data = await asyncio.to_thread(kalshi_client.get_markets, 50, None, "open", None)
        return [m for m in data.get("markets", []) if m.get("ticker")][:50]

    async def _broadcast_initial_snapshot(self, markets: list[dict[str, Any]]) -> None:
        now = datetime.now(timezone.utc).isoformat()
        for market in markets:
            yes_bid = self._number(market, "yes_bid_dollars", "yes_bid")
            yes_ask = self._number(market, "yes_ask_dollars", "yes_ask")
            spread = round(yes_ask - yes_bid, 6) if yes_bid is not None and yes_ask is not None else None
            await self._broadcast({
                "type": "ticker",
                "market_id": market["ticker"],
                "timestamp": market.get("last_updated_ts") or market.get("updated_time") or now,
                "yes_bid": yes_bid,
                "yes_ask": yes_ask,
                "no_bid": self._number(market, "no_bid_dollars", "no_bid"),
                "no_ask": self._number(market, "no_ask_dollars", "no_ask"),
                "spread": spread,
                "volume": self._number(market, "volume_fp", "volume"),
                "status": market.get("status"),
                "last_price": self._number(market, "last_price_dollars", "last_price"),
                "source": "rest_snapshot",
            })

    @staticmethod
    def _number(data: dict[str, Any], *keys: str) -> float | None:
        for key in keys:
            value = data.get(key)
            if value is not None:
                try:
                    return float(value)
                except (TypeError, ValueError):
                    return None
        return None

    async def _run(self) -> None:
        backoff = 1
        while self.clients:
            try:
                await self._broadcast({"type": "status", "status": "connecting"})
                headers = self._headers()
                await self._broadcast({"type": "status", "status": "authenticating"})

                async with connect(
                    self.WS_URL,
                    extra_headers=headers,
                    ping_interval=None,
                    close_timeout=5,
                ) as ws:
                    logger.info("Kalshi WebSocket connected")
                    await self._broadcast({"type": "status", "status": "kalshi_connected"})

                    markets = await self._markets()
                    if not markets:
                        logger.warning("Kalshi returned no open markets for live feed")
                        await self._broadcast({"type": "status", "status": "no_markets"})
                        await asyncio.sleep(15)
                        continue

                    tickers = [m["ticker"] for m in markets]
                    self._sequence += 1
                    command_id = self._sequence
                    await self._broadcast({
                        "type": "status",
                        "status": "subscribing",
                        "markets": len(tickers),
                    })
                    await ws.send(json.dumps({
                        "id": command_id,
                        "cmd": "subscribe",
                        "params": {
                            "channels": ["ticker"],
                            "market_tickers": tickers,
                        },
                    }))

                    subscribed = False
                    while self.clients:
                        raw = await ws.recv()
                        if isinstance(raw, bytes):
                            raw = raw.decode("utf-8")
                        message = json.loads(raw)
                        message_type = message.get("type")

                        if message_type == "subscribed":
                            if message.get("id") not in (None, command_id):
                                continue
                            subscribed = True
                            sid = (message.get("msg") or {}).get("sid")
                            logger.info("Kalshi ticker subscription confirmed: sid=%s markets=%s", sid, len(tickers))
                            await self._broadcast({
                                "type": "status",
                                "status": "connected",
                                "markets": len(tickers),
                                "source": "kalshi_ws",
                                "sid": sid,
                            })
                            await self._broadcast_initial_snapshot(markets)
                            backoff = 1
                            continue

                        if message_type == "error":
                            error = message.get("msg") or message.get("error") or message
                            logger.error("Kalshi WebSocket subscription error: %s", error)
                            await self._broadcast({
                                "type": "status",
                                "status": "error",
                                "error": str(error)[:240],
                            })
                            raise RuntimeError(f"Kalshi WebSocket error: {error}")

                        if message_type != "ticker":
                            logger.debug("Kalshi WebSocket message: %s", message)
                            continue

                        msg = message.get("msg", message)
                        ticker = msg.get("market_ticker") or msg.get("ticker")
                        if not ticker:
                            logger.warning("Kalshi ticker message missing market ticker: %s", message)
                            continue

                        yes_bid = self._number(msg, "yes_bid_dollars", "yes_bid")
                        yes_ask = self._number(msg, "yes_ask_dollars", "yes_ask")
                        no_bid = self._number(msg, "no_bid_dollars", "no_bid")
                        no_ask = self._number(msg, "no_ask_dollars", "no_ask")
                        volume = self._number(msg, "volume_fp", "volume", "volume_24h_fp")
                        spread = round(yes_ask - yes_bid, 6) if yes_bid is not None and yes_ask is not None else None

                        await self._broadcast({
                            "type": "ticker",
                            "market_id": ticker,
                            "timestamp": msg.get("timestamp") or msg.get("ts") or msg.get("created_time") or datetime.now(timezone.utc).isoformat(),
                            "yes_bid": yes_bid,
                            "yes_ask": yes_ask,
                            "no_bid": no_bid,
                            "no_ask": no_ask,
                            "spread": spread,
                            "volume": volume,
                            "status": msg.get("status"),
                            "last_price": self._number(msg, "last_price_dollars", "last_price"),
                            "source": "kalshi_ws",
                        })

                        if not subscribed:
                            subscribed = True
                            await self._broadcast({
                                "type": "status",
                                "status": "connected",
                                "markets": len(tickers),
                                "source": "kalshi_ws",
                            })
                            backoff = 1
            except asyncio.CancelledError:
                raise
            except Exception as exc:
                logger.exception("Kalshi live feed error")
                await self._broadcast({
                    "type": "status",
                    "status": "reconnecting",
                    "error": str(exc)[:240],
                })
                await asyncio.sleep(backoff)
                backoff = min(backoff * 2, 30)


live_market_feed = LiveMarketFeed()
