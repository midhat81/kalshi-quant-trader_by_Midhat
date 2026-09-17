import { useEffect, useState, type ReactNode } from "react";
import { Clock3, Radio } from "lucide-react";
import { Sidebar } from "./Sidebar";

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const date = new Intl.DateTimeFormat(undefined, { weekday: "short", month: "short", day: "2-digit", year: "numeric" }).format(now);
  const time = new Intl.DateTimeFormat(undefined, { hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false }).format(now);
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone.replace("Asia/", "");

  return (
    <div className="flex items-center gap-2 text-[10px] text-muted" title={`Local time: ${zone}`}>
      <Clock3 size={13} strokeWidth={1.7} />
      <span className="hidden sm:inline">{date}</span>
      <span className="text-border-strong">·</span>
      <span className="font-mono tabular-nums text-text">{time}</span>
      <span className="hidden md:inline font-mono text-subtle">{zone}</span>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar />
      <main className="dashboard-scroll-area min-w-0 flex-1">
        <header className="sticky top-0 z-30 border-b border-border bg-bg/90 backdrop-blur-xl">
          <div className="flex min-h-14 items-center justify-between gap-4 px-5 sm:px-7 lg:px-9">
            <div className="flex items-center gap-2.5">
              <Radio size={13} className="text-accent" />
              <span className="font-mono text-[9px] uppercase tracking-[0.17em] text-muted">Market data</span>
              <span className="hidden items-center gap-1.5 rounded-full border border-accent/15 bg-accent-soft px-2 py-0.5 text-[9px] font-medium text-accent sm:flex"><span className="h-1 w-1 rounded-full bg-accent" />CONNECTED</span>
            </div>
            <LiveClock />
          </div>
        </header>
        <div className="mx-auto w-full max-w-[1540px] px-5 py-6 sm:px-7 lg:px-9 lg:py-8">{children}</div>
      </main>
    </div>
  );
}
