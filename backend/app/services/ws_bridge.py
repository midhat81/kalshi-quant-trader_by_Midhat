import asyncio
import json

import websockets

from app.adapters.kalshi import kalshi_client

latest_ticks: dict[str, dict] = {}

_connection_status = {"connected": False, "error": None}


def get_connection_status() -> dict:
    return dict(_connection_status)


async def stream_kalshi_ticks(market_tickers: list[str]):
    """
    Connects to Kalshi's authenticated WebSocket and keeps latest_ticks
    updated in memory. Reconnects on failure. Real data only -- if the
    connection fails, status reflects that honestly rather than silently
    falling back to fake ticks.
    """
    while True:
        try:
            headers = kalshi_client.get_ws_auth_headers()
            async with websockets.connect(
                kalshi_client.ws_url,
                extra_headers=headers,
            ) as ws:
                _connection_status["connected"] = True
                _connection_status["error"] = None

                subscribe_msg = {
                    "id": 1,
                    "cmd": "subscribe",
                    "params": {
                        "channels": ["ticker"],
                        "market_tickers": market_tickers,
                    },
                }
                await ws.send(json.dumps(subscribe_msg))

                async for message in ws:
                    
                    data = json.loads(message)
                    if data.get("type") == "ticker":
                        msg = data.get("msg", {})
                        market_id = msg.get("market_ticker")
                        if market_id:
                            latest_ticks[market_id] = msg

        except Exception as e:
            _connection_status["connected"] = False
            _connection_status["error"] = str(e)
            await asyncio.sleep(5)