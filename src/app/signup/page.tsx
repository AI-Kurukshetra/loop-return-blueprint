"use client";

import { useState } from "react";
import Link from "next/link";
import { signIn } from "next-auth/react";
import PublicHeader from "@/components/public-header";

export default function SignupPage() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [merchantName, setMerchantName] = useState("");
  const [merchantEmail, setMerchantEmail] = useState("");
  const [role, setRole] = useState<"seller" | "client">("seller");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await fetch("/api/auth/signup", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name,
        email,
        password,
        merchantName: role === "seller" ? merchantName : undefined,
        merchantEmail: role === "client" ? merchantEmail : undefined,
        role,
      }),
    });
    const data = await res.json();
    if (!res.ok) {
      setError(data.error ?? "Signup failed");
      setLoading(false);
      return;
    }

    const loginResult = await signIn("credentials", {
      email,
      password,
      redirect: false,
      callbackUrl: "/panel",
    });

    if (loginResult?.error) {
      setError("Account created, but automatic sign in failed.");
      setLoading(false);
      return;
    }

    window.location.href = loginResult?.url ?? "/panel";
  }

  return (
    <div className="min-h-screen bg-slate-950">
      <PublicHeader compact />
      <main className="mx-auto grid min-h-[calc(100vh-4rem)] max-w-7xl items-center gap-8 px-4 py-10 sm:px-6 lg:grid-cols-2 lg:px-8">
        <section className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-900/60 p-8 lg:p-10">
          <div className="pointer-events-none absolute -left-16 top-6 h-48 w-48 rounded-full bg-emerald-500/20 blur-3xl" />
          <div className="pointer-events-none absolute right-0 top-0 h-52 w-52 rounded-full bg-sky-500/20 blur-3xl" />
          <p className="relative inline-flex rounded-full border border-cyan-400/40 bg-cyan-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-cyan-300">
            Launch in minutes
          </p>
          <h1 className="relative mt-4 text-4xl font-semibold leading-tight text-white">
            Build your returns engine with enterprise controls from day one.
          </h1>
          <p className="relative mt-4 max-w-xl text-slate-300">
            Configure policies, automate labels and refunds, reduce fraud, and turn more refund requests into exchanges.
          </p>
          <ul className="relative mt-6 space-y-2 text-sm text-slate-300">
            <li>Policy and eligibility rules</li>
            <li>Customer return portal and RMA management</li>
            <li>Real-time analytics and fraud scoring</li>
            <li>Email and SMS lifecycle notifications</li>
          </ul>
        </section>

        <section className="w-full rounded-3xl border border-slate-800 bg-slate-900/65 p-8 shadow-2xl">
          <h2 className="text-3xl font-bold text-white">Create account</h2>
          <p className="mt-1 text-slate-400">
            Already have an account?{" "}
            <Link href="/login" className="font-medium text-emerald-400 hover:underline">
              Sign in
            </Link>
          </p>
          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-300">Role</label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "seller" | "client")}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
              >
                <option value="seller">Seller</option>
                <option value="client">Client</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">Full name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            {role === "seller" ? (
              <div>
                <label className="block text-sm font-medium text-slate-300">Store name</label>
                <input
                  type="text"
                  value={merchantName}
                  onChange={(e) => setMerchantName(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  required
                />
              </div>
            ) : (
              <div>
                <label className="block text-sm font-medium text-slate-300">
                  Seller merchant email
                </label>
                <input
                  type="email"
                  value={merchantEmail}
                  onChange={(e) => setMerchantEmail(e.target.value)}
                  className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                  placeholder="demo-merchant@loopreturn.app"
                  required
                />
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-slate-300">Work email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="mt-1 block w-full rounded-xl border border-slate-700 bg-slate-950 px-3 py-2.5 text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-300">
                Password (min 8 characters)
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
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
              {loading ? "Creating account..." : "Create account"}
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
