"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";

type AdminReturn = {
  id: string;
  rmaNumber: string;
  status: string;
  returnReason: string | null;
  requestedAt: string;
  customer: { email: string | null };
  order: { orderNumber: string };
  merchant: { id: string; name: string; email: string };
  aiTag: "safe" | "review" | "fraud_suspected";
  aiScore: number;
};

type MerchantRow = {
  id: string;
  name: string;
  email: string;
  createdAt: string;
};

export default function AdminPage() {
  const [rows, setRows] = useState<AdminReturn[]>([]);
  const [merchants, setMerchants] = useState<MerchantRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [tagFilter, setTagFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [isApplyingBulk, setIsApplyingBulk] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function load() {
    setLoading(true);
    const response = await fetch("/api/admin/returns");
    const payload = await response.json();
    setRows(Array.isArray(payload) ? payload : []);
    setLoading(false);
  }

  useEffect(() => {
    Promise.all([
      fetch("/api/admin/returns").then((r) => r.json()),
      fetch("/api/merchants").then((r) => r.json()),
    ])
      .then(([returnsPayload, merchantsPayload]) => {
        setRows(Array.isArray(returnsPayload) ? returnsPayload : []);
        setMerchants(Array.isArray(merchantsPayload) ? merchantsPayload : []);
      })
      .catch(() => setError("Unable to load admin data"))
      .finally(() => setLoading(false));
  }, []);

  async function takeAction(id: string, action: "approve" | "reject" | "fraud_hold") {
    setMessage("");
    setError("");
    const response = await fetch(`/api/admin/returns/${id}/action`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Action failed");
      return;
    }
    setMessage(`Action ${action} applied successfully.`);
    setSelectedIds((prev) => prev.filter((value) => value !== id));
    await load();
  }

  async function takeBulkAction(action: "approve" | "reject" | "fraud_hold") {
    if (selectedIds.length === 0) {
      setError("Select at least one return.");
      return;
    }
    setIsApplyingBulk(true);
    setError("");
    setMessage("");

    const results = await Promise.all(
      selectedIds.map(async (id) => {
        const response = await fetch(`/api/admin/returns/${id}/action`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action }),
        });
        return response.ok;
      })
    );

    const successCount = results.filter(Boolean).length;
    const failedCount = results.length - successCount;
    setSelectedIds([]);
    setIsApplyingBulk(false);
    setMessage(
      failedCount > 0
        ? `Bulk action applied to ${successCount} returns, ${failedCount} failed.`
        : `Bulk action applied to ${successCount} returns.`
    );
    await load();
  }

  const filteredRows = useMemo(() => {
    return rows.filter((row) => {
      const byStatus = statusFilter === "all" || row.status === statusFilter;
      const byTag = tagFilter === "all" || row.aiTag === tagFilter;
      const term = query.trim().toLowerCase();
      const byQuery =
        term.length === 0 ||
        row.rmaNumber.toLowerCase().includes(term) ||
        row.order?.orderNumber?.toLowerCase().includes(term) ||
        row.customer?.email?.toLowerCase().includes(term) ||
        row.merchant?.name?.toLowerCase().includes(term);
      return byStatus && byTag && byQuery;
    });
  }, [rows, statusFilter, tagFilter, query]);

  const metrics = useMemo(() => {
    const total = filteredRows.length;
    const pending = filteredRows.filter((r) => r.status === "pending").length;
    const highRisk = filteredRows.filter((r) => r.aiTag === "fraud_suspected").length;
    const approved = filteredRows.filter((r) => r.status === "approved").length;
    const merchantCount = new Set(filteredRows.map((r) => r.merchant?.id)).size;
    return { total, pending, highRisk, approved, merchantCount };
  }, [filteredRows]);

  const allFilteredSelected =
    filteredRows.length > 0 && filteredRows.every((row) => selectedIds.includes(row.id));

  function toggleSelect(id: string) {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((value) => value !== id) : [...prev, id]
    );
  }

  function toggleSelectAll() {
    if (allFilteredSelected) {
      setSelectedIds((prev) =>
        prev.filter((id) => !filteredRows.some((row) => row.id === id))
      );
      return;
    }
    const next = new Set(selectedIds);
    filteredRows.forEach((row) => next.add(row.id));
    setSelectedIds([...next]);
  }

  return (
    <div className="min-h-screen bg-slate-950 p-8 text-white">
      <h1 className="text-3xl font-bold">Admin Panel</h1>
      <p className="mt-2 text-slate-300">
        Platform operations console for fraud review, moderation, and return decisions.
      </p>

      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <section className="mt-6 rounded-xl border border-cyan-500/30 bg-gradient-to-r from-cyan-900/20 via-slate-900 to-orange-900/20 p-5">
        <h2 className="text-lg font-semibold text-white">All Features Access</h2>
        <p className="mt-1 text-sm text-slate-300">
          Super-admin shortcuts to every operational module.
        </p>
        <div className="mt-4 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <FeatureLink href="/dashboard">Overview</FeatureLink>
          <FeatureLink href="/dashboard/returns">Returns Management</FeatureLink>
          <FeatureLink href="/dashboard/analytics">Analytics</FeatureLink>
          <FeatureLink href="/dashboard/inventory">Inventory & Products</FeatureLink>
          <FeatureLink href="/dashboard/communications">Communications</FeatureLink>
          <FeatureLink href="/dashboard/policies">Return Policies</FeatureLink>
          <FeatureLink href="/dashboard/settings">Settings</FeatureLink>
          <FeatureLink href="/seller">Seller View</FeatureLink>
        </div>
      </section>

      <div className="mt-6 grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <Metric title="Total Queue" value={String(metrics.total)} />
        <Metric title="Pending" value={String(metrics.pending)} />
        <Metric title="High Risk" value={String(metrics.highRisk)} />
        <Metric title="Approved" value={String(metrics.approved)} />
        <Metric title="Merchants" value={String(metrics.merchantCount)} />
      </div>

      <div className="mt-6 grid gap-3 rounded-xl border border-slate-800 bg-slate-900/70 p-4 md:grid-cols-3">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search RMA / order / customer / merchant"
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        />
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          <option value="all">All statuses</option>
          <option value="pending">Pending</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
          <option value="processing">Processing</option>
          <option value="refunded">Refunded</option>
        </select>
        <select
          value={tagFilter}
          onChange={(e) => setTagFilter(e.target.value)}
          className="rounded-md border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
        >
          <option value="all">All AI tags</option>
          <option value="safe">Safe</option>
          <option value="review">Review</option>
          <option value="fraud_suspected">Fraud Suspected</option>
        </select>
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        <button
          onClick={() => takeBulkAction("approve")}
          disabled={isApplyingBulk || selectedIds.length === 0}
          className="rounded-md border border-blue-500/40 px-3 py-1.5 text-xs text-blue-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Approve Selected
        </button>
        <button
          onClick={() => takeBulkAction("reject")}
          disabled={isApplyingBulk || selectedIds.length === 0}
          className="rounded-md border border-amber-500/40 px-3 py-1.5 text-xs text-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Reject Selected
        </button>
        <button
          onClick={() => takeBulkAction("fraud_hold")}
          disabled={isApplyingBulk || selectedIds.length === 0}
          className="rounded-md border border-red-500/40 px-3 py-1.5 text-xs text-red-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          Fraud Hold Selected
        </button>
      </div>

      <div className="mt-6 overflow-hidden rounded-xl border border-slate-700">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-900">
            <tr className="text-left text-slate-400">
              <th className="px-4 py-3">
                <input
                  type="checkbox"
                  checked={allFilteredSelected}
                  onChange={toggleSelectAll}
                  className="h-4 w-4"
                />
              </th>
              <th className="px-4 py-3">RMA</th>
              <th className="px-4 py-3">Merchant</th>
              <th className="px-4 py-3">Order</th>
              <th className="px-4 py-3">Customer</th>
              <th className="px-4 py-3">Status</th>
              <th className="px-4 py-3">Reason</th>
              <th className="px-4 py-3">AI Tag</th>
              <th className="px-4 py-3">Score</th>
              <th className="px-4 py-3">Requested</th>
              <th className="px-4 py-3">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                  Loading admin queue...
                </td>
              </tr>
            ) : null}
            {filteredRows.map((row) => (
              <tr key={row.id} className="border-t border-slate-800">
                <td className="px-4 py-3">
                  <input
                    type="checkbox"
                    checked={selectedIds.includes(row.id)}
                    onChange={() => toggleSelect(row.id)}
                    className="h-4 w-4"
                  />
                </td>
                <td className="px-4 py-3">{row.rmaNumber}</td>
                <td className="px-4 py-3">{row.merchant?.name ?? "—"}</td>
                <td className="px-4 py-3">{row.order?.orderNumber ?? "—"}</td>
                <td className="px-4 py-3">{row.customer?.email ?? "—"}</td>
                <td className="px-4 py-3">{row.status}</td>
                <td className="px-4 py-3">{row.returnReason ?? "—"}</td>
                <td className="px-4 py-3">
                  <span
                    className={`rounded-full px-2 py-0.5 text-xs ${
                      row.aiTag === "fraud_suspected"
                        ? "bg-red-500/20 text-red-300"
                        : row.aiTag === "review"
                          ? "bg-amber-500/20 text-amber-300"
                          : "bg-emerald-500/20 text-emerald-300"
                    }`}
                  >
                    {row.aiTag}
                  </span>
                </td>
                <td className="px-4 py-3">{Number(row.aiScore).toFixed(2)}</td>
                <td className="px-4 py-3">
                  {new Date(row.requestedAt).toLocaleDateString()}
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => takeAction(row.id, "approve")}
                      className="rounded-md border border-blue-500/40 px-2 py-1 text-xs text-blue-300"
                    >
                      Approve
                    </button>
                    <button
                      onClick={() => takeAction(row.id, "reject")}
                      className="rounded-md border border-amber-500/40 px-2 py-1 text-xs text-amber-300"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => takeAction(row.id, "fraud_hold")}
                      className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300"
                    >
                      Fraud Hold
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && filteredRows.length === 0 ? (
              <tr>
                <td colSpan={11} className="px-4 py-8 text-center text-slate-500">
                  No returns match current filters.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <section className="mt-8 rounded-xl border border-slate-700 bg-slate-900/70 p-4">
        <h2 className="text-lg font-semibold text-white">Merchant Management</h2>
        <p className="mt-1 text-sm text-slate-400">
          Platform-wide merchant directory for admin oversight.
        </p>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2">Merchant</th>
                <th className="py-2">Email</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {merchants.map((merchant) => (
                <tr key={merchant.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-2">{merchant.name}</td>
                  <td className="py-2">{merchant.email}</td>
                  <td className="py-2">
                    {new Date(merchant.createdAt).toLocaleDateString()}
                  </td>
                </tr>
              ))}
              {merchants.length === 0 ? (
                <tr>
                  <td colSpan={3} className="py-4 text-center text-slate-500">
                    No merchants found.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function Metric({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-800 bg-slate-900/70 p-4">
      <p className="text-xs uppercase tracking-[0.14em] text-slate-400">{title}</p>
      <p className="mt-2 text-2xl font-semibold text-white">{value}</p>
    </div>
  );
}

function FeatureLink({ href, children }: { href: string; children: React.ReactNode }) {
  return (
    <Link
      href={href}
      className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-2 text-sm text-slate-200 hover:border-cyan-500/40 hover:text-white"
    >
      {children}
    </Link>
  );
}
