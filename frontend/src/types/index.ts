export interface MarketSnapshot {
    market_id: string;
    timestamp: string;
    yes_bid: number | null;
    yes_ask: number | null;
    no_bid: number | null;
    no_ask: number | null;
    spread: number | null;
    volume: number | null;
    status: string | null;
  }
  
  export interface Signal {
    id: string;
    market_id: string;
    timestamp: string;
    side: "yes" | "no";
    market_probability: number;
    model_probability: number;
    edge: number;
    confidence: number;
    strategy_name: string;
    reason: string | null;
  }
  
  export interface Order {
    id: string;
    market_id: string;
    side: "yes" | "no";
    price: number;
    quantity: number;
    status: string;
    strategy: string | null;
    created_at: string;
    filled_at: string | null;
  }
  
  export interface Position {
    market_id: string;
    side: "yes" | "no";
    quantity: number;
    average_entry_price: number;
    current_price: number | null;
    market_value: number | null;
    unrealized_pnl: number | null;
    realized_pnl: number;
    fees_paid: number;
    market_status: string | null;
  }
  
  export interface PortfolioSummary {
    total_realized_pnl: number;
    total_unrealized_pnl: number | null;
    total_pnl: number | null;
    total_fees: number;
    total_exposure: number;
    open_position_count: number;
    positions_missing_price_count: number;
  }