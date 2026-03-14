"use client";

import { useEffect, useState } from "react";

type ReturnRecord = {
  id: string;
  rmaNumber: string;
  status: string;
  requestedAt: string;
  returnReason?: string | null;
  order?: { orderNumber: string };
  customer?: { email: string };
};

export default function ReturnsPage() {
  const [records, setRecords] = useState<ReturnRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function loadReturns() {
    const response = await fetch("/api/returns");
    const payload = await response.json();
    setRecords(Array.isArray(payload) ? payload : []);
  }

  useEffect(() => {
    loadReturns()
      .catch(() => setError("Failed to load returns"))
      .finally(() => setLoading(false));
  }, []);

  async function updateStatus(id: string, status: string) {
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/returns/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to update return");
      }
      setMessage(`Return updated to ${status}.`);
      await loadReturns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to update return");
    } finally {
      setBusyId("");
    }
  }

  async function deleteReturn(id: string) {
    if (!window.confirm("Delete this return request?")) {
      return;
    }
    setBusyId(id);
    setError("");
    setMessage("");
    try {
      const response = await fetch(`/api/returns/${id}`, {
        method: "DELETE",
      });
      const payload = await response.json();
      if (!response.ok) {
        throw new Error(payload?.error ?? "Unable to delete return");
      }
      setMessage("Return deleted successfully.");
      await loadReturns();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to delete return");
    } finally {
      setBusyId("");
    }
  }

  if (loading) {
    return (
      <div>
        <h1 className="text-2xl font-bold text-white">Returns Management</h1>
        <p className="mt-4 text-slate-400">Loading return requests...</p>
      </div>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold text-white">Returns Management</h1>
      <p className="mt-1 text-slate-400">
        Track, review, update, and delete return requests from a single workflow.
      </p>
      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}

      <div className="mt-8 overflow-hidden rounded-xl border border-slate-800">
        {records.length === 0 ? (
          <div className="p-12 text-center text-slate-500">
            No return requests found.
          </div>
        ) : (
          <table className="min-w-full divide-y divide-slate-800">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  RMA
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Order
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Customer
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Reason
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Requested
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium uppercase text-slate-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800">
              {records.map((row) => (
                <tr key={row.id} className="hover:bg-slate-900/30">
                  <td className="whitespace-nowrap px-4 py-4 text-sm font-medium text-white">
                    {row.rmaNumber}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {row.order?.orderNumber ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {row.customer?.email ?? "—"}
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-400">
                    {row.returnReason ?? "—"}
                  </td>
                  <td className="px-4 py-4">
                    <span
                      className={`inline-flex rounded-full px-2 py-0.5 text-xs font-medium ${
                        row.status === "refunded"
                          ? "bg-emerald-500/20 text-emerald-400"
                          : row.status === "approved"
                            ? "bg-blue-500/20 text-blue-400"
                            : row.status === "rejected"
                              ? "bg-red-500/20 text-red-400"
                              : "bg-slate-500/20 text-slate-400"
                      }`}
                    >
                      {row.status}
                    </span>
                  </td>
                  <td className="px-4 py-4 text-sm text-slate-500">
                    {row.requestedAt ? new Date(row.requestedAt).toLocaleDateString() : "—"}
                  </td>
                  <td className="px-4 py-4">
                    {row.status === "pending" ? (
                      <div className="flex flex-wrap gap-2">
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => updateStatus(row.id, "approved")}
                          className="rounded-md border border-blue-500/40 px-2 py-1 text-xs text-blue-300 hover:bg-blue-500/10 disabled:opacity-50"
                        >
                          Approve
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => updateStatus(row.id, "rejected")}
                          className="rounded-md border border-amber-500/40 px-2 py-1 text-xs text-amber-300 hover:bg-amber-500/10 disabled:opacity-50"
                        >
                          Reject
                        </button>
                        <button
                          type="button"
                          disabled={busyId === row.id}
                          onClick={() => deleteReturn(row.id)}
                          className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10 disabled:opacity-50"
                        >
                          Delete
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-slate-500">No actions</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
