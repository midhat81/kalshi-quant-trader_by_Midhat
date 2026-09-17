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
    <aside className="hidden w-60 shrink-0 border-r border-border bg-surface lg:flex lg:min-h-screen lg:flex-col">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md border border-border-strong bg-surface-raised font-mono text-xs font-semibold text-accent">
            KQ
          </div>
          <div className="min-w-0">
            <div className="font-semibold leading-tight tracking-tight text-text">Kalshi Quant</div>
            <div className="mt-0.5 text-[11px] text-muted">Trading workspace</div>
          </div>
        </div>
      </div>

      <div className="px-3 pt-5">
        <div className="px-3 pb-2 text-[10px] font-medium uppercase tracking-[0.16em] text-subtle">Workspace</div>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink
              key={to}
              to={to}
              end={to === "/"}
              className={({ isActive }) =>
                `group flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm transition-all ${
                  isActive
                    ? "border-border-strong bg-surface-raised text-text shadow-sm"
                    : "border-transparent text-muted hover:border-border hover:bg-bg/60 hover:text-text"
                }`
              }
            >
              {({ isActive }) => (
                <>
                  <Icon size={16} strokeWidth={isActive ? 2 : 1.7} className={isActive ? "text-accent" : "text-subtle group-hover:text-muted"} />
                  <span className="flex-1">{label}</span>
                  {isActive && <span className="h-1.5 w-1.5 rounded-full bg-accent" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto border-t border-border p-4">
        <div className="rounded-md border border-border bg-bg/50 px-3 py-3">
          <div className="flex items-center gap-2 text-xs font-medium text-text">
            <span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(79,209,197,0.5)]" />
            Paper trading
          </div>
          <div className="mt-1.5 pl-3.5 text-[11px] leading-relaxed text-muted">Live system state · simulated execution</div>
        </div>
      </div>
    </aside>
  );
}
