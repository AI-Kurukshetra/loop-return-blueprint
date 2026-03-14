"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadDraft, saveDraft } from "@/lib/return-draft";

const DEMO_ITEMS = [
  { id: "1", name: "Classic Tshirt", sku: "TSH-001", quantity: 1, price: 29.99 },
  { id: "2", name: "Wireless Headphones", sku: "AUD-002", quantity: 1, price: 79.99 },
  { id: "3", name: "Running Shoes", sku: "SHO-003", quantity: 2, price: 129.99 },
];

export default function SelectItemsPage() {
  const router = useRouter();
  const [selected, setSelected] = useState<Record<string, { qty: number; condition: string }>>({});

  function toggle(id: string) {
    if (selected[id]) {
      const next = { ...selected };
      delete next[id];
      setSelected(next);
    } else {
      setSelected({ ...selected, [id]: { qty: 1, condition: "unopened" } });
    }
  }

  function updateCondition(id: string, condition: string) {
    if (selected[id]) {
      setSelected({ ...selected, [id]: { ...selected[id], condition } });
    }
  }

  const selectedCount = Object.keys(selected).length;

  function continueFlow() {
    if (selectedCount === 0) {
      return;
    }

    const draft = loadDraft();
    const items = DEMO_ITEMS.filter((item) => selected[item.id]).map((item) => ({
      id: item.id,
      name: item.name,
      sku: item.sku,
      quantity: selected[item.id].qty,
      condition: selected[item.id].condition as "unopened" | "opened" | "damaged" | "defective",
    }));

    saveDraft({
      ...draft,
      items,
    });
    router.push("/returns/reason");
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <nav className="border-b border-slate-800 bg-slate-950/80 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-4xl items-center px-4 sm:px-6">
          <Link href="/returns" className="text-lg font-bold text-white">
            Loop Return
          </Link>
        </div>
      </nav>
      <main className="mx-auto max-w-2xl px-4 py-12">
        <h1 className="text-2xl font-bold text-white">Select items to return</h1>
        <p className="mt-2 text-slate-400">
          Choose which items you want to return and their condition.
        </p>
        <div className="mt-8 space-y-4">
          {DEMO_ITEMS.map((item) => (
            <div
              key={item.id}
              className={`rounded-xl border p-4 transition ${
                selected[item.id]
                  ? "border-emerald-500/50 bg-slate-900"
                  : "border-slate-800 bg-slate-900/30"
              }`}
            >
              <label className="flex cursor-pointer items-start gap-4">
                <input
                  type="checkbox"
                  checked={!!selected[item.id]}
                  onChange={() => toggle(item.id)}
                  className="mt-1 h-4 w-4 rounded border-slate-600 text-emerald-500 focus:ring-emerald-500"
                />
                <div className="flex-1">
                  <p className="font-medium text-white">{item.name}</p>
                  <p className="text-sm text-slate-500">
                    SKU: {item.sku} · ${item.price}
                  </p>
                  {selected[item.id] && (
                    <div className="mt-3">
                      <label className="block text-xs text-slate-400">
                        Condition
                      </label>
                      <select
                        value={selected[item.id].condition}
                        onChange={(e) =>
                          updateCondition(item.id, e.target.value)
                        }
                        className="mt-1 rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-sm text-white"
                      >
                        <option value="unopened">Unopened</option>
                        <option value="opened">Opened</option>
                        <option value="damaged">Damaged</option>
                        <option value="defective">Defective</option>
                      </select>
                    </div>
                  )}
                </div>
              </label>
            </div>
          ))}
        </div>
        <div className="mt-8 flex justify-between">
          <Link
            href="/returns"
            className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
          >
            Back
          </Link>
          <button
            type="button"
            onClick={continueFlow}
            className={`rounded-lg px-6 py-2 font-medium ${
              selectedCount > 0
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "cursor-not-allowed bg-slate-700 text-slate-400"
            }`}
          >
            Continue ({selectedCount} selected)
          </button>
        </div>
      </main>
    </div>
  );
}
