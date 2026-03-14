"use client";

import { useState } from "react";

export default function SellerShopifyConnect() {
  const [shopifyDomain, setShopifyDomain] = useState("");
  const [shopifyAccessToken, setShopifyAccessToken] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setMessage("");
    setError("");

    const response = await fetch("/api/seller/shopify/connect", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopifyDomain, shopifyAccessToken }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Unable to connect Shopify.");
      return;
    }

    setMessage(`Connected successfully: ${payload.shopifyDomain}`);
    setShopifyAccessToken("");
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-8 max-w-2xl rounded-xl border border-slate-700 bg-slate-900/70 p-6"
    >
      <h2 className="text-xl font-semibold text-white">Connect Shopify</h2>
      <p className="mt-1 text-sm text-slate-400">Use format: `store-name.myshopify.com`</p>
      {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
      {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      <div className="mt-4 grid gap-3">
        <input
          value={shopifyDomain}
          onChange={(e) => setShopifyDomain(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          placeholder="store-name.myshopify.com"
          required
        />
        <input
          value={shopifyAccessToken}
          onChange={(e) => setShopifyAccessToken(e.target.value)}
          className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-white"
          placeholder="Shopify access token"
          required
        />
      </div>
      <button className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 font-medium text-white hover:bg-emerald-600">
        Connect
      </button>
    </form>
  );
}
