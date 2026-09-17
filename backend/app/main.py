from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware

from app.api import markets, signals, orders, positions, trades, risk
from app.services.live_feed import live_market_feed

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


@app.websocket("/ws/market-feed")
async def market_feed(websocket: WebSocket):
    await websocket.accept()
    await live_market_feed.connect_client(websocket)
    try:
        while True:
            # Keep the downstream socket alive. The upstream Kalshi feed is
            # managed centrally by LiveMarketFeed and broadcasts ticker data.
            await websocket.receive_text()
    except WebSocketDisconnect:
        pass
    finally:
        await live_market_feed.disconnect_client(websocket)


@app.get("/health")
def health():
    return {"status": "ok"}
