"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ApiReturn = {
  id: string;
  rmaNumber: string;
  status: string;
  returnReason: string | null;
  notes: string | null;
  requestedAt: string;
  order: { orderNumber: string };
  returnItems: Array<{
    id: string;
    quantity: number;
    product: { name: string };
  }>;
};

const statusColors: Record<string, string> = {
  pending: "bg-amber-500/20 text-amber-400 border-amber-500/40",
  approved: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  received: "bg-sky-500/20 text-sky-400 border-sky-500/40",
  processing: "bg-violet-500/20 text-violet-400 border-violet-500/40",
  refunded: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40",
  rejected: "bg-red-500/20 text-red-400 border-red-500/40",
  cancelled: "bg-slate-500/20 text-slate-400 border-slate-500/40",
};

export default function ClientReturnsPage() {
  const [returns, setReturns] = useState<ApiReturn[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/client/returns")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.returns) ? data.returns : [];
        setReturns(list);
      })
      .catch(() => setError("Unable to load your returns."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-4xl">
      <div className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">My Returns</h1>
          <p className="mt-1 text-sm text-slate-400">
            View all your return requests and their status.
          </p>
        </div>
        <Link
          href="/client/new"
          className="inline-flex items-center gap-2 rounded-lg bg-emerald-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-emerald-600"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Return
        </Link>
      </div>

      {error ? (
        <div className="mt-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <div className="mt-6 space-y-4">
        {returns.length === 0 ? (
          <div className="rounded-xl border border-slate-700 bg-slate-900/50 p-12 text-center">
            <p className="text-slate-400">You haven&apos;t submitted any returns yet.</p>
            <Link
              href="/client/new"
              className="mt-4 inline-block text-sm font-medium text-emerald-400 hover:text-emerald-300"
            >
              Start a return →
            </Link>
          </div>
        ) : (
          returns.map((r) => {
            const statusStyle = statusColors[r.status] ?? "bg-slate-500/20 text-slate-400 border-slate-500/40";
            return (
              <div
                key={r.id}
                className="rounded-xl border border-slate-700 bg-slate-900/50 p-5 transition hover:border-slate-600"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-white">RMA {r.rmaNumber}</p>
                    <p className="text-sm text-slate-400">
                      Order {r.order.orderNumber} · {new Date(r.requestedAt).toLocaleDateString()}
                    </p>
                  </div>
                  <span
                    className={`rounded-full border px-3 py-1 text-xs font-medium capitalize ${statusStyle}`}
                  >
                    {r.status}
                  </span>
                </div>
                {r.returnReason ? (
                  <p className="mt-2 text-sm text-slate-300">Reason: {r.returnReason}</p>
                ) : null}
                <div className="mt-3 flex flex-wrap gap-2">
                  {r.returnItems.map((item) => (
                    <span
                      key={item.id}
                      className="rounded-lg bg-slate-800/80 px-2.5 py-1 text-xs text-slate-300"
                    >
                      {item.product.name} × {item.quantity}
                    </span>
                  ))}
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
