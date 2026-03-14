"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import PublicHeader from "@/components/public-header";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const callbackUrl =
      new URLSearchParams(window.location.search).get("callbackUrl") ??
      "/dashboard";

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl,
    });

    if (result?.error) {
      setError("Invalid email or password");
      setLoading(false);
      return;
    }

    window.location.href = result?.url ?? callbackUrl;
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PublicHeader compact />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-10 top-0 h-44 w-44 rounded-full bg-emerald-500/25 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-10 h-52 w-52 rounded-full bg-cyan-500/20 blur-3xl" />
          <p className="relative inline-flex rounded-full border border-emerald-400/35 bg-emerald-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-emerald-300">
            Merchant Console
          </p>
          <h1 className="relative mt-4 text-4xl font-semibold leading-tight text-white">
            Keep returns fast, safe, and profitable.
          </h1>
          <p className="relative mt-4 max-w-lg text-slate-300">
            Manage returns, approvals, labels, refunds, fraud checks, and customer communication from one dashboard.
          </p>
          <div className="relative mt-8 grid gap-3 sm:grid-cols-2">
            <AuthStat label="Avg approval SLA" value="< 8 hrs" />
            <AuthStat label="Fraud alerts reviewed" value="99.2%" />
            <AuthStat label="Exchange recovery" value="+38%" />
            <AuthStat label="Ops time saved" value="2.1x" />
          </div>
        </section>

        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/65 p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white">Sign in</h2>
          <p className="mt-1 text-slate-400">
            New to Loop Return?{" "}
            <Link href="/signup" className="font-medium text-emerald-400 hover:underline">
              Create an account
            </Link>
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-slate-300">
                Work email
              </label>
              <input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-slate-300">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            {error ? <p className="text-sm text-red-400">{error}</p> : null}
            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-xl bg-emerald-500 px-4 py-2.5 font-medium text-white hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? "Signing in..." : "Sign in to Dashboard"}
            </button>
          </form>
          <div className="mt-6 flex items-center justify-between text-xs text-slate-500">
            <Link href="/returns" className="hover:text-slate-300">
              Customer return portal
            </Link>
            <Link href="/" className="hover:text-slate-300">
              Back to website
            </Link>
          </div>
        </section>
      </main>
    </div>
  );
}

function AuthStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-slate-700/70 bg-slate-950/70 p-3">
      <p className="text-lg font-semibold text-white">{value}</p>
      <p className="text-xs uppercase tracking-wide text-slate-400">{label}</p>
    </div>
  );
}
