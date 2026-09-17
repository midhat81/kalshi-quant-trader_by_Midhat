import { useEffect, useState, type ReactNode } from "react";
import { Clock3, Radio, Wifi } from "lucide-react";
import { Sidebar } from "./Sidebar";

function LiveClock() {
  const [now, setNow] = useState(() => new Date());
  useEffect(() => { const timer = window.setInterval(() => setNow(new Date()), 1000); return () => window.clearInterval(timer); }, []);
  const date = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "2-digit", year: "numeric" }).format(now);
  const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone.replace("Asia/", "");
  return <div className="flex items-center gap-2 font-mono text-[9px] tabular-nums text-muted" title={`Local time: ${zone}`}><Clock3 size={12}/><span className="hidden sm:inline">{date}</span><span className="text-border-strong">/</span><span className="text-text">{time}</span><span className="hidden md:inline text-subtle">{zone}</span></div>;
}

export function Layout({ children }: { children: ReactNode }) {
  return <div className="flex min-h-screen bg-bg text-text">
    <Sidebar />
    <main className="dashboard-scroll-area min-w-0 flex-1">
      <header className="sticky top-0 z-30 border-b border-border bg-bg/92 backdrop-blur-xl">
        <div className="flex min-h-14 items-center justify-between gap-4 px-5 sm:px-7 lg:px-9">
          <div className="flex items-center gap-3"><div className="flex items-center gap-2 border-r border-border pr-3"><Radio size={12} className="text-accent"/><span className="font-mono text-[9px] font-semibold uppercase tracking-[.18em]">KQ / TERMINAL</span></div><div className="hidden items-center gap-1.5 sm:flex"><Wifi size={11} className="text-accent"/><span className="font-mono text-[8px] uppercase tracking-[.14em] text-muted">Exchange feed connected</span></div></div>
          <LiveClock />
        </div>
      </header>
      <div className="mx-auto w-full max-w-[1540px] px-5 py-6 sm:px-7 lg:px-9 lg:py-8">{children}</div>
    </main>
  </div>;
}
