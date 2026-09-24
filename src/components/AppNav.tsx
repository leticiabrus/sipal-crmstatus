import { Link } from "@tanstack/react-router";

const items = [
  { to: "/", label: "Burnup" },
  { to: "/fatias", label: "Fatias" },
  { to: "/marcos", label: "Marcos" },
] as const;

export function AppNav() {
  return (
    <nav className="border-b border-line bg-bg">
      <div className="mx-auto flex h-12 max-w-[1280px] items-center gap-6 px-6">
        <span className="font-mono text-xs text-text-2">
          <span className="text-green">●</span> burnup
        </span>
        <div className="flex gap-1">
          {items.map((i) => (
            <Link
              key={i.to}
              to={i.to}
              activeOptions={{ exact: true }}
              className="rounded-md px-3 py-1.5 text-sm text-text-2 transition-colors duration-150 hover:text-text"
              activeProps={{ className: "bg-surface-2 !text-text" }}
            >
              {i.label}
            </Link>
          ))}
        </div>
      </div>
    </nav>
  );
}

export function PageHeader({ title, accent, children }: { title: string; accent: string; children?: React.ReactNode }) {
  return (
    <header className="brand-gradient -mx-6 mb-6 flex flex-wrap items-end justify-between gap-4 border-b border-line px-6 py-8">
      <h1 className="text-[32px] font-bold leading-tight tracking-[-0.03em]">
        {title} <span className="text-grad">{accent}</span>
      </h1>
      {children}
    </header>
  );
}

export function Card({ className = "", children }: { className?: string; children: React.ReactNode }) {
  return <div className={`rounded-xl border border-line bg-surface ${className}`}>{children}</div>;
}
