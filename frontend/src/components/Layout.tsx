import { useEffect, useState, type ReactNode } from "react";
import { Clock3 } from "lucide-react";
import { Sidebar } from "./Sidebar";

function LiveClock() {
  const [now, setNow] = useState(() => new Date());

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const date = new Intl.DateTimeFormat(undefined, {
    weekday: "short",
    month: "short",
    day: "2-digit",
    year: "numeric",
  }).format(now);

  const time = new Intl.DateTimeFormat(undefined, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(now);

  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone.replace("Asia/", "");

  return (
    <div className="flex items-center gap-2 text-xs text-muted" title={`Local time: ${zone}`}>
      <Clock3 size={14} strokeWidth={1.7} />
      <span>{date}</span>
      <span className="text-border-strong">·</span>
      <span className="font-mono text-text tabular-nums">{time}</span>
      <span className="hidden sm:inline text-subtle">{zone}</span>
    </div>
  );
}

export function Layout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-bg text-text">
      <Sidebar />
      <main className="dashboard-scroll-area min-w-0 flex-1">
        <header className="sticky top-0 z-20 border-b border-border bg-bg/95 backdrop-blur supports-[backdrop-filter]:bg-bg/85">
          <div className="flex min-h-16 items-center justify-between gap-4 px-5 py-3 sm:px-7 lg:px-9">
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent shadow-[0_0_10px_rgba(79,209,197,0.55)]" />
                <span className="text-xs font-medium uppercase tracking-[0.14em] text-muted">Live paper environment</span>
              </div>
            </div>
            <LiveClock />
          </div>
        </header>

        <div className="mx-auto w-full max-w-[1500px] px-5 py-7 sm:px-7 lg:px-9 lg:py-8">
          {children}
        </div>
      </main>
    </div>
  );
}
