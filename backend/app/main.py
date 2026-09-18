import asyncio
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api import markets, signals, orders, positions, trades, risk, chat
from app.services.ws_bridge import stream_kalshi_ticks, latest_ticks, get_connection_status

app = FastAPI(title="Prediction Market Quant Trader API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(markets.router)
app.include_router(signals.router)
app.include_router(orders.router)
app.include_router(positions.router)
app.include_router(trades.router)
app.include_router(risk.router)
app.include_router(chat.router)

WATCHED_MARKETS = ["KXHIGHNY-26SEP18-B80.5", "KXHIGHNY-26SEP18-B82.5", "KXHIGHNY-26SEP18-T80"]


@app.on_event("startup")
async def start_ws_bridge():
    asyncio.create_task(stream_kalshi_ticks(WATCHED_MARKETS))


@app.get("/api/live-ticks")
def get_live_ticks():
    return {
        "status": get_connection_status(),
        "ticks": latest_ticks,
    }


def _to_float(value):
    if value is None:
        return None
    try:
        return float(value)
    except (TypeError, ValueError):
        return None


def _tick_to_frontend_shape(market_id: str, tick: dict) -> dict:
    """
    Translates a raw Kalshi WS ticker payload into the exact shape the
    frontend's useLiveMarketFeed hook expects (matches MarketSnapshot).
    Field names are read defensively since Kalshi's raw WS payload uses
    slightly different keys than the REST snapshot fields.
    """
    yes_bid = _to_float(tick.get("yes_bid_dollars") or tick.get("yes_bid"))
    yes_ask = _to_float(tick.get("yes_ask_dollars") or tick.get("yes_ask"))
    no_bid = _to_float(tick.get("no_bid_dollars") or tick.get("no_bid"))
    no_ask = _to_float(tick.get("no_ask_dollars") or tick.get("no_ask"))
    spread = round(yes_ask - yes_bid, 4) if yes_bid is not None and yes_ask is not None else None

    return {
        "type": "ticker",
        "market_id": market_id,
        "timestamp": tick.get("ts") or tick.get("timestamp"),
        "yes_bid": yes_bid,
        "yes_ask": yes_ask,
        "no_bid": no_bid,
        "no_ask": no_ask,
        "spread": spread,
        "volume": _to_float(tick.get("volume") or tick.get("volume_delta")),
        "status": "active",
        "last_price": _to_float(tick.get("price_dollars") or tick.get("price")),
        "source": "kalshi_ws",
    }


@app.websocket("/ws/market-feed")
async def market_feed_ws(websocket: WebSocket):
    """
    Relays real Kalshi tick data out to the browser, using the exact
    {type: "status"|"ticker", ...} protocol the frontend's
    useLiveMarketFeed hook expects.
    """
    await websocket.accept()

    await websocket.send_json({"type": "status", "status": "authenticating"})

    try:
        # Wait for the backend's own Kalshi WS bridge to report connected
        for _ in range(20):  # up to ~10s
            conn = get_connection_status()
            if conn["connected"]:
                break
            if conn["error"]:
                await websocket.send_json({"type": "status", "status": "error", "error": conn["error"]})
            await asyncio.sleep(0.5)

        conn = get_connection_status()
        if not conn["connected"]:
            await websocket.send_json({
                "type": "status",
                "status": "error",
                "error": conn["error"] or "Kalshi WebSocket not connected",
            })
        else:
            await websocket.send_json({"type": "status", "status": "subscribing"})
            await asyncio.sleep(0.3)
            await websocket.send_json({
                "type": "status",
                "status": "connected",
                "markets": len(WATCHED_MARKETS),
            })

        sent_market_ids = set()

        while True:
            conn = get_connection_status()

            if not conn["connected"]:
                await websocket.send_json({
                    "type": "status",
                    "status": "reconnecting",
                    "error": conn["error"],
                })
            elif not latest_ticks:
                await websocket.send_json({
                    "type": "status",
                    "status": "no_markets",
                    "markets": len(WATCHED_MARKETS),
                })
            else:
                for market_id, tick in latest_ticks.items():
                    await websocket.send_json(_tick_to_frontend_shape(market_id, tick))
                    sent_market_ids.add(market_id)

            await asyncio.sleep(1)

    except WebSocketDisconnect:
        pass


@app.get("/health")
def health():
    return {"status": "ok"}