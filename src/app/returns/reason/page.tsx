"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { loadDraft, saveDraft } from "@/lib/return-draft";

const REASONS = [
  "Changed my mind",
  "Wrong size / fit",
  "Defective / Not as described",
  "Arrived damaged",
  "Better price elsewhere",
  "Other",
];

export default function ReasonPage() {
  const router = useRouter();
  const initialDraft = loadDraft();
  const [reason, setReason] = useState(initialDraft.reason ?? "");
  const [notes, setNotes] = useState(initialDraft.notes ?? "");
  const [email, setEmail] = useState(initialDraft.email ?? "");

  function continueFlow() {
    if (!reason || !email) {
      return;
    }

    const draft = loadDraft();
    saveDraft({
      ...draft,
      email,
      reason,
      notes,
    });
    router.push("/returns/shipping");
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
        <h1 className="text-2xl font-bold text-white">Return reason</h1>
        <p className="mt-2 text-slate-400">
          Why are you returning these items? This helps us improve.
        </p>
        <div className="mt-8 space-y-2">
          {REASONS.map((r) => (
            <label
              key={r}
              className={`flex cursor-pointer items-center gap-3 rounded-xl border p-4 transition ${
                reason === r
                  ? "border-emerald-500/50 bg-slate-900"
                  : "border-slate-800 bg-slate-900/30 hover:border-slate-700"
              }`}
            >
              <input
                type="radio"
                name="reason"
                value={r}
                checked={reason === r}
                onChange={() => setReason(r)}
                className="h-4 w-4 text-emerald-500"
              />
              <span className="text-white">{r}</span>
            </label>
          ))}
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-400">
            Email
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="you@example.com"
            required
          />
        </div>
        <div className="mt-6">
          <label className="block text-sm font-medium text-slate-400">
            Additional notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
            placeholder="Any details that might help..."
          />
        </div>
        <div className="mt-8 flex justify-between">
          <Link
            href="/returns/select-items"
            className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
          >
            Back
          </Link>
          <button
            type="button"
            onClick={continueFlow}
            className={`rounded-lg px-6 py-2 font-medium ${
              reason && email
                ? "bg-emerald-500 text-white hover:bg-emerald-600"
                : "cursor-not-allowed bg-slate-700 text-slate-400"
            }`}
          >
            Continue
          </button>
        </div>
      </main>
    </div>
  );
}
