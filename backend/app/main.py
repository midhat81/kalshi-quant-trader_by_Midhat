from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import markets, signals, orders, positions

app = FastAPI(title="Prediction Market Quant Trader API", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],  # Vite dev server default
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(markets.router)
app.include_router(signals.router)
app.include_router(orders.router)
app.include_router(positions.router)


@app.get("/health")
def health():
    return {"status": "ok"}