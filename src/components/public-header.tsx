import Link from "next/link";

type PublicHeaderProps = {
  compact?: boolean;
};

export default function PublicHeader({ compact = false }: PublicHeaderProps) {
  return (
    <header className="sticky top-0 z-30 border-b border-slate-800/80 bg-slate-950/75 backdrop-blur-xl">
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <Link href="/" className="text-lg font-semibold tracking-tight text-white">
          Loop Return
        </Link>

        {!compact ? (
          <nav className="hidden items-center gap-6 md:flex">
            <Link href="/#product" className="text-sm text-slate-300 hover:text-white">
              Product
            </Link>
            <Link href="/#solutions" className="text-sm text-slate-300 hover:text-white">
              Solutions
            </Link>
            <Link href="/#pricing" className="text-sm text-slate-300 hover:text-white">
              Pricing
            </Link>
            <Link href="/returns" className="text-sm text-slate-300 hover:text-white">
              Return Portal
            </Link>
          </nav>
        ) : (
          <div />
        )}

        <div className="flex items-center gap-2">
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            Sign in
          </Link>
          <Link
            href="/signup"
            className="rounded-lg bg-emerald-500 px-3 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Start free
          </Link>
        </div>
      </div>
    </header>
  );
}
