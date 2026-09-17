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
    <aside className="hidden w-[232px] shrink-0 border-r border-border bg-[#0a0a0a] lg:flex lg:min-h-screen lg:flex-col">
      <div className="border-b border-border px-5 py-5">
        <div className="flex items-center gap-3">
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-accent text-black"><Activity size={16} strokeWidth={2.5} /></div>
          <div className="min-w-0"><div className="text-[14px] font-semibold tracking-tight">KALSHI QUANT</div><div className="mt-0.5 font-mono text-[9px] uppercase tracking-[.16em] text-subtle">Research terminal</div></div>
        </div>
      </div>
      <div className="px-3 pt-5">
        <div className="px-3 pb-2 font-mono text-[9px] uppercase tracking-[.2em] text-subtle">Terminal</div>
        <nav className="space-y-1">
          {navItems.map(({ to, label, icon: Icon }) => (
            <NavLink key={to} to={to} end={to === "/"} className="group relative flex items-center gap-3 rounded-md px-3 py-2.5 text-[12px] transition-colors">
              {({ isActive }) => <>
                {isActive && <span className="absolute left-0 top-1/2 h-5 w-0.5 -translate-y-1/2 bg-accent" />}
                <Icon size={15} strokeWidth={isActive ? 2 : 1.6} className={isActive ? "text-accent" : "text-subtle group-hover:text-muted"} />
                <span className={isActive ? "font-medium text-text" : "text-muted group-hover:text-text"}>{label}</span>
                {isActive && <span className="ml-auto font-mono text-[8px] text-accent">●</span>}
              </>}
            </NavLink>
          ))}
        </nav>
      </div>
      <div className="mt-auto border-t border-border p-4">
        <div className="flex items-center justify-between font-mono text-[9px] uppercase tracking-[.14em] text-subtle"><span>Environment</span><span className="text-accent">LIVE</span></div>
        <div className="mt-2 flex items-center gap-2 text-[11px] text-muted"><span className="h-1.5 w-1.5 rounded-full bg-accent" />Paper execution</div>
        <div className="mt-3 border-t border-border pt-3 font-mono text-[8px] uppercase tracking-[.12em] text-subtle">KQ · v1.0 · Connected</div>
      </div>
    </aside>
  );
}
