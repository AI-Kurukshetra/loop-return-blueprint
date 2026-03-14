"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { clearDraft, loadDraft } from "@/lib/return-draft";

type SubmitResult = {
  rmaNumber: string;
  status: string;
  orderNumber: string;
};

export default function ShippingPage() {
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState<SubmitResult | null>(null);
  const [draftReady, setDraftReady] = useState(false);

  useEffect(() => {
    const draft = loadDraft();
    setDraftReady(Boolean(draft.email && draft.reason && draft.items.length > 0));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      const draft = loadDraft();
      const response = await fetch("/api/returns/portal", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: draft.email,
          reason: draft.reason,
          notes: draft.notes,
          items: draft.items,
        }),
      });
      const payload = await response.json();

      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to submit return");
      }

      setResult(payload);
      clearDraft();
      setSubmitted(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setSubmitting(false);
    }
  }

  if (submitted) {
    return (
      <div className="min-h-screen bg-slate-950">
        <nav className="border-b border-slate-800 bg-slate-950/80">
          <div className="mx-auto flex h-16 max-w-4xl items-center px-4">
            <Link href="/" className="text-lg font-bold text-white">
              Loop Return
            </Link>
          </div>
        </nav>
        <main className="mx-auto max-w-2xl px-4 py-16 text-center">
          <div className="rounded-full bg-emerald-500/20 p-4 mx-auto w-fit">
            <svg
              className="h-12 w-12 text-emerald-500"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M5 13l4 4L19 7"
              />
            </svg>
          </div>
          <h1 className="mt-6 text-2xl font-bold text-white">
            Return submitted
          </h1>
          <p className="mt-2 text-slate-400">
            Your return request has been received.
            {result ? ` RMA: ${result.rmaNumber} for order ${result.orderNumber}.` : ""}
          </p>
          <p className="mt-2 text-sm text-slate-500">
            You can track this request in the merchant dashboard returns table.
          </p>
          <Link
            href="/"
            className="mt-8 inline-flex rounded-lg bg-emerald-500 px-6 py-3 font-medium text-white hover:bg-emerald-600"
          >
            Back to home
          </Link>
        </main>
      </div>
    );
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
        <h1 className="text-2xl font-bold text-white">Shipping</h1>
        <p className="mt-2 text-slate-400">
          We&apos;ll send you a prepaid label once your return is approved.
        </p>
        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            {!draftReady ? (
              <p className="text-sm text-amber-400">
                Please complete item selection and reason first.
              </p>
            ) : (
              <p className="text-sm text-slate-500">
                Submit to create the return request and generate an RMA in the database.
              </p>
            )}
            {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
          </div>
          <div className="flex justify-between">
            <Link
              href="/returns/reason"
              className="rounded-lg border border-slate-700 px-4 py-2 text-slate-300 hover:bg-slate-800"
            >
              Back
            </Link>
            <button
              type="submit"
              disabled={!draftReady || submitting}
              className="rounded-lg bg-emerald-500 px-6 py-2 font-medium text-white hover:bg-emerald-600"
            >
              {submitting ? "Submitting..." : "Submit return"}
            </button>
          </div>
        </form>
      </main>
    </div>
  );
}
