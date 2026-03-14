import Link from "next/link";
import PublicHeader from "@/components/public-header";

export default function Home() {
  return (
    <div className="min-h-screen bg-slate-950 text-white">
      <div className="pointer-events-none absolute inset-0 overflow-hidden">
        <div className="absolute -left-20 top-20 h-72 w-72 rounded-full bg-emerald-500/20 blur-3xl" />
        <div className="absolute right-0 top-52 h-80 w-80 rounded-full bg-cyan-500/20 blur-3xl" />
      </div>
      <PublicHeader />

      <main className="relative mx-auto max-w-7xl px-4 pb-20 pt-20 sm:px-6 lg:px-8">
        <section id="product" className="grid items-center gap-12 lg:grid-cols-2">
          <div>
            <div className="inline-flex items-center rounded-full border border-emerald-400/30 bg-emerald-400/10 px-3 py-1 text-xs font-medium text-emerald-300">
              Built for Shopify brands doing 1,000+ orders/month
            </div>
            <h1 className="mt-6 text-4xl font-bold tracking-tight sm:text-5xl lg:text-6xl">
              Turn returns into
              <span className="bg-linear-to-r from-emerald-300 via-cyan-300 to-blue-300 bg-clip-text text-transparent">
                {" "}
                profit and loyalty
              </span>
            </h1>
            <p className="mt-6 max-w-xl text-lg text-slate-300">
              Loop Return helps brands automate returns, recommend exchanges,
              reduce refund leakage, and prevent abuse with fraud detection.
            </p>
            <div className="mt-8 flex flex-wrap gap-4">
              <Link
                href="/signup"
                className="rounded-lg bg-emerald-500 px-6 py-3 text-base font-medium text-white shadow-lg shadow-emerald-600/25 hover:bg-emerald-600"
              >
                Start Free Trial
              </Link>
              <Link
                href="/dashboard"
                className="rounded-lg border border-slate-600 px-6 py-3 text-base font-medium text-white hover:bg-slate-800"
              >
                Go to Dashboard
              </Link>
            </div>
            <div className="mt-4 flex flex-wrap gap-3">
              <Link
                href="/returns"
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800"
              >
                Start Return
              </Link>
              <Link
                href="/returns/shipping"
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800"
              >
                Track Status
              </Link>
              <Link
                href="/dashboard/policies"
                className="rounded-full border border-slate-700 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-200 hover:bg-slate-800"
              >
                Return Policies
              </Link>
            </div>
            <div className="mt-10 grid grid-cols-3 gap-4 text-sm">
              <Stat title="38%" value="avg exchange uplift" />
              <Stat title="22%" value="refund reduction" />
              <Stat title="2.1x" value="faster processing" />
            </div>
          </div>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 shadow-2xl">
            <p className="text-sm font-medium text-slate-400">Live Return Health</p>
            <div className="mt-4 grid gap-4 sm:grid-cols-2">
              <MetricCard label="Return rate" value="6.4%" trend="-1.2%" trendColor="text-emerald-400" />
              <MetricCard label="Fraud risk" value="1.1%" trend="+0.2%" trendColor="text-yellow-400" />
              <MetricCard label="Refunds" value="$12.8k" trend="-9%" trendColor="text-emerald-400" />
              <MetricCard label="Exchanges" value="41%" trend="+7.3%" trendColor="text-emerald-400" />
            </div>
            <div className="mt-6 rounded-xl border border-slate-800 bg-slate-950 p-4">
              <p className="text-xs text-slate-400">AI Recommendations</p>
              <ul className="mt-3 space-y-2 text-sm text-slate-300">
                <li>• Offer store credit for low-margin SKUs</li>
                <li>• Flag repeat serial returns for manual review</li>
                <li>• Incentivize exchanges on top 20 products</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="solutions" className="mt-20">
          <h2 className="text-2xl font-semibold">Everything to run returns at scale</h2>
          <div className="mt-6 grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <FeatureCard title="Return Portal" description="Self-serve flow for customers: item selection, reason capture, and shipping." />
            <FeatureCard title="Shipping Labels" description="Generate labels and track status updates in one place." />
            <FeatureCard title="Refund + Exchange" description="Route customers to credits or exchanges before refunding cash." />
            <FeatureCard title="Fraud Detection" description="Identify suspicious patterns and reduce abuse automatically." />
          </div>
        </section>

        <section id="pricing" className="mt-20 rounded-2xl border border-slate-800 bg-linear-to-r from-slate-900 to-slate-800 p-8 text-center">
          <h3 className="text-2xl font-semibold">Ready to launch Loop Return?</h3>
          <p className="mx-auto mt-3 max-w-2xl text-slate-300">
            Connect your store, configure policies, and start processing returns in
            minutes.
          </p>
          <div className="mt-6 flex justify-center gap-4">
            <Link
              href="/signup"
              className="rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white hover:bg-emerald-600"
            >
              Create Merchant Account
            </Link>
            <Link
              href="/returns"
              className="rounded-lg border border-slate-600 px-6 py-3 font-medium hover:bg-slate-700"
            >
              Try Return Portal
            </Link>
          </div>
          <div className="mt-10 grid gap-4 text-left sm:grid-cols-3">
            <PricingCard plan="Starter" price="$49/mo" limit="Up to 500 returns" />
            <PricingCard plan="Growth" price="$199/mo" limit="Up to 3,000 returns" />
            <PricingCard plan="Enterprise" price="Custom" limit="Unlimited + advanced controls" />
          </div>
        </section>
      </main>
    </div>
  );
}

function Stat({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900/50 p-3">
      <p className="text-xl font-semibold text-white">{value}</p>
      <p className="text-slate-400">{title}</p>
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
  trendColor,
}: {
  label: string;
  value: string;
  trend: string;
  trendColor: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-950 p-4">
      <p className="text-xs text-slate-400">{label}</p>
      <p className="mt-1 text-2xl font-bold">{value}</p>
      <p className={`mt-1 text-sm ${trendColor}`}>{trend}</p>
    </div>
  );
}

function FeatureCard({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/50 p-5">
      <h3 className="font-semibold">{title}</h3>
      <p className="mt-2 text-sm text-slate-400">{description}</p>
    </div>
  );
}

function PricingCard({
  plan,
  price,
  limit,
}: {
  plan: string;
  price: string;
  limit: string;
}) {
  return (
    <div className="rounded-xl border border-slate-700 bg-slate-900/70 p-5">
      <p className="text-sm text-slate-400">{plan}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{price}</p>
      <p className="mt-2 text-sm text-slate-300">{limit}</p>
    </div>
  );
}
