import time
import base64
from typing import Any, Optional

import httpx
from cryptography.hazmat.primitives import hashes, serialization
from cryptography.hazmat.primitives.asymmetric import padding

from app.core.config import settings


class KalshiClient:
    """
    Adapter for Kalshi's Trade API v2.
    Handles RSA-PSS request signing and basic market/account/order operations.
    Exchange-specific logic stays isolated in this file.
    """

    def __init__(self):
        self.base_url = settings.kalshi_base_url.rstrip("/")
        self.api_key_id = settings.kalshi_api_key
        self._private_key = self._load_private_key()
        self._client = httpx.Client(base_url=self.base_url, timeout=10.0)

    def _load_private_key(self):
        key_path = settings.kalshi_private_key_full_path
        with open(key_path, "rb") as f:
            return serialization.load_pem_private_key(f.read(), password=None)

    def _sign(self, timestamp_ms: str, method: str, path: str) -> str:
        message = f"{timestamp_ms}{method}{path}".encode("utf-8")
        signature = self._private_key.sign(
            message,
            padding.PSS(
                mgf=padding.MGF1(hashes.SHA256()),
                salt_length=padding.PSS.DIGEST_LENGTH,
            ),
            hashes.SHA256(),
        )
        return base64.b64encode(signature).decode("utf-8")

    def _headers(self, method: str, path: str) -> dict:
        timestamp_ms = str(int(time.time() * 1000))
        signature = self._sign(timestamp_ms, method, path)
        return {
            "KALSHI-ACCESS-KEY": self.api_key_id,
            "KALSHI-ACCESS-SIGNATURE": signature,
            "KALSHI-ACCESS-TIMESTAMP": timestamp_ms,
            "Content-Type": "application/json",
        }

    def _request(self, method: str, path: str, params: Optional[dict] = None, json_body: Optional[dict] = None) -> Any:
        headers = self._headers(method, path)
        response = self._client.request(method, path, headers=headers, params=params, json=json_body)
        if response.status_code >= 400:
            print(f"Kalshi API error {response.status_code}: {response.text}")
        response.raise_for_status()
        return response.json()

    # ---------- Market data ----------

    def get_markets(
        self,
        limit: int = 100,
        cursor: Optional[str] = None,
        status: Optional[str] = None,
        series_ticker: Optional[str] = None,
    ) -> dict:
        params = {"limit": limit}
        if cursor:
            params["cursor"] = cursor
        if status:
            params["status"] = status
        if series_ticker:
            params["series_ticker"] = series_ticker
        return self._request("GET", "/markets", params=params)

    def get_market(self, ticker: str) -> dict:
        return self._request("GET", f"/markets/{ticker}")

    def get_orderbook(self, ticker: str) -> dict:
        return self._request("GET", f"/markets/{ticker}/orderbook")

    def get_series_list(self, category: Optional[str] = None) -> dict:
        params = {"category": category} if category else None
        return self._request("GET", "/series", params=params)

    def get_events(self, limit: int = 50, status: Optional[str] = None, series_ticker: Optional[str] = None) -> dict:
        params = {"limit": limit}
        if status:
            params["status"] = status
        if series_ticker:
            params["series_ticker"] = series_ticker
        return self._request("GET", "/events", params=params)

    # ---------- Account ----------

    def get_balance(self) -> dict:
        return self._request("GET", "/portfolio/balance")

    def get_orders(self, status: Optional[str] = None) -> dict:
        params = {"status": status} if status else None
        return self._request("GET", "/portfolio/orders", params=params)

    def get_fills(self, ticker: Optional[str] = None) -> dict:
        params = {"ticker": ticker} if ticker else None
        return self._request("GET", "/portfolio/fills", params=params)

    # ---------- Orders ----------

    def create_order(self, ticker: str, side: str, action: str, count: int, price_cents: int, order_type: str = "limit") -> dict:
        body = {
            "ticker": ticker,
            "side": side,
            "action": action,
            "count": count,
            "type": order_type,
            "yes_price": price_cents if side == "yes" else None,
            "no_price": price_cents if side == "no" else None,
        }
        return self._request("POST", "/portfolio/orders", json_body=body)

    def cancel_order(self, order_id: str) -> dict:
        return self._request("DELETE", f"/portfolio/orders/{order_id}")

    # ---------- WebSocket auth ----------

    def get_ws_auth_headers(self) -> dict:
        """
        Builds auth headers for Kalshi's WebSocket handshake.
        Per Kalshi's docs, the signed string is: {timestamp}GET/trade-api/ws/v2
        (no query params, no body) -- distinct from REST request signing,
        which signs the actual request path (e.g. /markets).
        """
        timestamp_ms = str(int(time.time() * 1000))
        ws_path = "/trade-api/ws/v2"
        signature = self._sign(timestamp_ms, "GET", ws_path)
        return {
            "KALSHI-ACCESS-KEY": self.api_key_id,
            "KALSHI-ACCESS-SIGNATURE": signature,
            "KALSHI-ACCESS-TIMESTAMP": timestamp_ms,
        }

    @property
    def ws_url(self) -> str:
        return "wss://api.elections.kalshi.com/trade-api/ws/v2"


kalshi_client = KalshiClient()