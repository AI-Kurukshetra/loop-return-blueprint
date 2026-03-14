import Link from "next/link";

export default function DashboardPage() {
  return (
    <div>
      <div className="rounded-3xl border border-orange-500/20 bg-gradient-to-br from-orange-500/20 via-slate-900/70 to-cyan-950/60 p-8">
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="mt-1 text-slate-200">
        Welcome to your returns management center.
        </p>
      </div>
      <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        <DashboardCard
          title="Returns"
          value="—"
          subtitle="This period"
          href="/dashboard/returns"
        />
        <DashboardCard
          title="Refunded"
          value="—"
          subtitle="Total amount"
          href="/dashboard/returns?status=refunded"
        />
        <DashboardCard
          title="Approval Rate"
          value="—"
          subtitle="Last 30 days"
          href="/dashboard/analytics"
        />
        <DashboardCard
          title="Avg. Processing"
          value="—"
          subtitle="Hours"
          href="/dashboard/analytics"
        />
      </div>
      <div className="mt-12 rounded-xl border border-slate-800 bg-slate-900/60 p-6">
        <h2 className="text-lg font-semibold text-white">Quick actions</h2>
        <div className="mt-4 flex flex-wrap gap-4">
          <Link
            href="/dashboard/returns"
            className="rounded-lg border border-slate-700 px-4 py-2 text-sm font-medium text-slate-300 hover:bg-slate-800 hover:text-white"
          >
            View returns
          </Link>
          <Link
            href="/returns"
            className="rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Test return portal
          </Link>
        </div>
      </div>
    </div>
  );
}

function DashboardCard({
  title,
  value,
  subtitle,
  href,
}: {
  title: string;
  value: string;
  subtitle: string;
  href: string;
}) {
  return (
    <Link
      href={href}
      className="block rounded-xl border border-slate-800 bg-slate-900/50 p-6 transition hover:border-slate-700"
    >
      <p className="text-sm font-medium text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      <p className="mt-1 text-xs text-slate-500">{subtitle}</p>
    </Link>
  );
}
