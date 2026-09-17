import { NavLink } from "react-router-dom";
import { Activity, BarChart3, LayoutDashboard, Radar, Receipt, ShieldAlert, Wallet } from "lucide-react";

const navItems = [
  { to: "/", label: "Overview", icon: LayoutDashboard },
  { to: "/markets", label: "Markets", icon: BarChart3 },
  { to: "/positions", label: "Positions", icon: Wallet },
  { to: "/trades", label: "Executions", icon: Receipt },
  { to: "/signals", label: "Signals", icon: Radar },
  { to: "/risk", label: "Risk", icon: ShieldAlert },
];

export function Sidebar() {
  return (
    <aside className="hidden w-[248px] shrink-0 border-r border-border bg-surface lg:flex lg:min-h-screen lg:flex-col">
      <div className="px-5 pb-5 pt-6">
        <div className="flex items-center gap-3">
          <div className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-accent/20 bg-accent-soft text-accent shadow-[0_0_24px_rgba(85,214,199,0.06)]">
            <Activity size={17} strokeWidth={2} />
          </div>
          <div>
            <div className="text-[15px] font-semibold tracking-tight text-text">Kalshi Quant</div>
            <div className="mt-0.5 font-mono text-[9px] uppercase tracking-[0.15em] text-subtle">Trading terminal</div>
          </div>
        </div>
      </div>

      <div className="px-3 pt-3">
        <div className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[0.18em] text-subtle">Workspace</div>
        <nav className="space-y-0.5">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className="group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-[13px] transition-all duration-150">
              {({ isActive }) => (
                <>
                  {isActive && <span className="absolute inset-0 rounded-lg border border-border-strong bg-surface-raised" />}
                  <span className={`relative z-10 flex h-7 w-7 items-center justify-center rounded-md transition-colors ${isActive ? "bg-accent-soft text-accent" : "text-subtle group-hover:bg-bg group-hover:text-muted"}`}>
                    <Icon size={15} strokeWidth={isActive ? 2 : 1.7} />
                  </span>
                  <span className={`relative z-10 flex-1 ${isActive ? "font-medium text-text" : "text-muted group-hover:text-text"}`}>{label}</span>
                  {isActive && <span className="relative z-10 h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_9px_rgba(85,214,199,0.7)]" />}
                </>
              )}
            </NavLink>
          ))}
        </nav>
      </div>

      <div className="mt-auto p-4">
        <div className="rounded-xl border border-border bg-bg/60 p-3.5">
          <div className="flex items-center justify-between">
            <span className="font-mono text-[9px] uppercase tracking-[0.14em] text-subtle">Environment</span>
            <span className="flex items-center gap-1.5 text-[10px] font-medium text-accent"><span className="h-1.5 w-1.5 rounded-full bg-accent shadow-[0_0_8px_rgba(85,214,199,0.6)]" />LIVE</span>
          </div>
          <div className="mt-2 text-xs text-text">Paper trading</div>
          <div className="mt-1 text-[10px] leading-relaxed text-muted">Simulated execution · real system state</div>
        </div>
      </div>
    </aside>
  );
}
