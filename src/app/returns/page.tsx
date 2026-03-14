import Link from "next/link";

export default function ReturnsPortalPage() {
  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4 sm:px-6">
          <Link href="/" className="text-lg font-bold text-white">
            Loop Return
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-2xl px-4 py-16">
        <h1 className="text-2xl font-bold text-white">Start your return</h1>
        <p className="mt-2 text-slate-400">
          Enter your order number and email to look up your order.
        </p>
        <div className="mt-8">
          <Link
            href="/returns/select-items"
            className="inline-flex rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white hover:bg-emerald-600"
          >
            Continue to return
          </Link>
        </div>
        <p className="mt-6 text-sm text-slate-500">
          For demo: the flow continues to select items, reason, and shipping.
        </p>
      </main>
    </div>
  );
}
