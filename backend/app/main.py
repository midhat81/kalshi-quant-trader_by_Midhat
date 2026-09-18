import asyncio
from fastapi import FastAPI
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

WATCHED_MARKETS = ["KXHIGHNY-26SEP18-B80.5", "KXHIGHNY-26SEP18-B82.5", "KXHIGHNY-26SEP18-T80"]  # extend as needed # extend as needed


@app.on_event("startup")
async def start_ws_bridge():
    asyncio.create_task(stream_kalshi_ticks(WATCHED_MARKETS))


@app.get("/api/live-ticks")
def get_live_ticks():
    return {
        "status": get_connection_status(),
        "ticks": latest_ticks,
    }


@app.get("/health")
def health():
    return {"status": "ok"}