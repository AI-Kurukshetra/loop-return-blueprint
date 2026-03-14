"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type ApiOrder = {
  id: string;
  orderNumber: string;
  orderItems: Array<{
    id: string;
    quantity: number;
    product: { id: string; name: string };
  }>;
};

export default function NewReturnPage() {
  const [orders, setOrders] = useState<ApiOrder[]>([]);
  const [reason, setReason] = useState("Wrong size / fit");
  const [notes, setNotes] = useState("");
  const [selectedOrderId, setSelectedOrderId] = useState("");
  const [selectedItems, setSelectedItems] = useState<Record<string, number>>({});
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/client/orders")
      .then((r) => r.json())
      .then((data) => {
        const list = Array.isArray(data?.orders) ? data.orders : [];
        setOrders(list);
        setSelectedOrderId(list[0]?.id ?? "");
      })
      .catch(() => setError("Unable to load your orders."))
      .finally(() => setLoading(false));
  }, []);

  const selectedOrder = orders.find((o) => o.id === selectedOrderId);

  async function submitReturn(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");
    if (!selectedOrder) {
      setError("Select an order.");
      return;
    }

    const items = selectedOrder.orderItems
      .map((item) => ({
        orderItemId: item.id,
        quantity: Number(selectedItems[item.id] ?? 0),
        condition: "opened" as const,
      }))
      .filter((item) => item.quantity > 0);

    if (items.length === 0) {
      setError("Select at least one item quantity.");
      return;
    }

    const response = await fetch("/api/client/returns", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        orderId: selectedOrder.id,
        returnReason: reason,
        notes,
        items,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Unable to submit return.");
      return;
    }
    setMessage(`Return submitted. RMA: ${payload.rmaNumber}`);
  }

  if (loading) {
    return (
      <div className="flex min-h-[20rem] items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-2 border-emerald-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl">
      <div className="mb-6">
        <Link
          href="/client"
          className="text-sm text-slate-400 hover:text-white"
        >
          ← Back to My Returns
        </Link>
        <h1 className="mt-2 text-2xl font-bold text-white">New Return Request</h1>
        <p className="mt-1 text-sm text-slate-400">
          Select an order and items you want to return.
        </p>
      </div>

      {message ? (
        <div className="mb-6 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm text-emerald-400">
          {message}
          <Link href="/client" className="ml-2 font-medium underline">
            View returns
          </Link>
        </div>
      ) : null}
      {error ? (
        <div className="mb-6 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-400">
          {error}
        </div>
      ) : null}

      <form
        onSubmit={submitReturn}
        className="space-y-5 rounded-xl border border-slate-700 bg-slate-900/50 p-6"
      >
        <div>
          <label className="block text-sm font-medium text-slate-300">Order</label>
          <select
            value={selectedOrderId}
            onChange={(e) => setSelectedOrderId(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          >
            {orders.map((order) => (
              <option key={order.id} value={order.id}>
                {order.orderNumber}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Return reason</label>
          <input
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-300">Notes</label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="mt-1.5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            rows={3}
          />
        </div>

        <div>
          <p className="text-sm font-medium text-slate-300">Items to return</p>
          <div className="mt-2 space-y-2">
            {(selectedOrder?.orderItems ?? []).map((item) => (
              <div
                key={item.id}
                className="flex flex-col gap-2 rounded-lg border border-slate-700 bg-slate-950/70 p-3 sm:flex-row sm:items-center sm:justify-between"
              >
                <p className="text-sm text-slate-200">
                  {item.product.name} <span className="text-slate-500">(max {item.quantity})</span>
                </p>
                <input
                  type="number"
                  min={0}
                  max={item.quantity}
                  value={selectedItems[item.id] ?? 0}
                  onChange={(e) =>
                    setSelectedItems((prev) => ({
                      ...prev,
                      [item.id]: Number(e.target.value),
                    }))
                  }
                  className="w-24 rounded-lg border border-slate-700 bg-slate-900 px-3 py-2 text-white"
                />
              </div>
            ))}
          </div>
        </div>

        <button
          type="submit"
          className="w-full rounded-lg bg-emerald-500 px-4 py-2.5 font-medium text-white hover:bg-emerald-600 sm:w-auto"
        >
          Submit Return Request
        </button>
      </form>
    </div>
  );
}
