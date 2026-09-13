import { NavLink } from "react-router-dom";
import { LayoutDashboard, LineChart, Wallet, Receipt, Radar, ShieldAlert } from "lucide-react";

const navItems = [
  { to: "/", label: "Dashboard", icon: LayoutDashboard },
  { to: "/markets", label: "Markets", icon: LineChart },
  { to: "/positions", label: "Positions", icon: Wallet },
  { to: "/trades", label: "Trades", icon: Receipt },
  { to: "/signals", label: "Signals", icon: Radar },
  { to: "/risk", label: "Risk", icon: ShieldAlert },
];

export function Sidebar() {
  return (
    <aside className="w-56 shrink-0 border-r border-border bg-surface flex flex-col">
      <div className="px-5 py-6 border-b border-border">
        <div className="font-mono text-sm text-accent tracking-tight">KALSHI</div>
        <div className="font-semibold text-text text-lg leading-tight">Quant Trader</div>
      </div>
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/"}
            className={({ isActive }) =>
              `flex items-center gap-3 px-3 py-2 rounded-md text-sm transition-colors ${
                isActive
                  ? "bg-bg text-text border border-border"
                  : "text-muted hover:text-text hover:bg-bg/50"
              }`
            }
          >
            <Icon size={16} strokeWidth={1.75} />
            {label}
          </NavLink>
        ))}
      </nav>
      <div className="px-5 py-4 border-t border-border">
        <div className="flex items-center gap-2 text-xs text-muted">
          <span className="w-1.5 h-1.5 rounded-full bg-accent" />
          Paper trading
        </div>
      </div>
    </aside>
  );
}