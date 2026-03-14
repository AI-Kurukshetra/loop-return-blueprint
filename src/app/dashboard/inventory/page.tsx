"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

type ProductRow = {
  id: string;
  name: string;
  sku: string | null;
  price: number;
  merchantId: string;
  warehouseStock: Array<{ id: string; quantity: number; location: string | null }>;
};

type InventoryPayload = {
  updates: Array<{
    id: string;
    type: string;
    quantity: number;
    reason: string | null;
    createdAt: string;
    product: { name: string; sku: string | null } | null;
    return: { rmaNumber: string } | null;
  }>;
  stock: Array<{
    id: string;
    sku: string;
    quantity: number;
    location: string | null;
    updatedAt: string;
    product: { name: string; sku: string | null } | null;
  }>;
};

export default function InventoryPage() {
  const [merchantId, setMerchantId] = useState("");
  const [products, setProducts] = useState<ProductRow[]>([]);
  const [data, setData] = useState<InventoryPayload>({ updates: [], stock: [] });
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [newProduct, setNewProduct] = useState({ name: "", sku: "", price: "" });
  const [inventoryForm, setInventoryForm] = useState({
    productId: "",
    type: "restock",
    quantity: "",
    reason: "",
    location: "main",
  });

  const loadAll = useCallback(async (activeMerchantId?: string) => {
    const effectiveMerchantId = activeMerchantId ?? merchantId;
    const [inventoryRes, productsRes] = await Promise.all([
      fetch(
        effectiveMerchantId
          ? `/api/inventory/updates?merchantId=${effectiveMerchantId}`
          : "/api/inventory/updates"
      ).then((r) => r.json()),
      fetch(
        effectiveMerchantId ? `/api/products?merchantId=${effectiveMerchantId}` : "/api/products"
      ).then((r) => r.json()),
    ]);

    setData({
      updates: Array.isArray(inventoryRes?.updates) ? inventoryRes.updates : [],
      stock: Array.isArray(inventoryRes?.stock) ? inventoryRes.stock : [],
    });
    setProducts(Array.isArray(productsRes) ? productsRes : []);
  }, [merchantId]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        const id = session?.user?.merchantId ?? "";
        setMerchantId(id);
        return loadAll(id);
      })
      .catch(() => {
        setError("Unable to load merchant context.");
      });
  }, [loadAll]);

  const productOptions = useMemo(
    () => products.map((p) => ({ id: p.id, label: `${p.name} (${p.sku ?? "NO-SKU"})` })),
    [products]
  );

  async function createProduct(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!merchantId) {
      setError("Missing merchant context.");
      return;
    }

    if (newProduct.name.includes("-")) {
      setError("Product name must not contain '-'.");
      return;
    }
    if (Number(newProduct.price) < 0) {
      setError("Price cannot be negative.");
      return;
    }

    const response = await fetch("/api/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId,
        name: newProduct.name.trim(),
        sku: newProduct.sku.trim(),
        price: Number(newProduct.price),
      }),
    });

    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Failed to create product");
      return;
    }

    setNewProduct({ name: "", sku: "", price: "" });
    setMessage("Product created successfully.");
    await loadAll();
  }

  async function updateProduct(product: ProductRow) {
    const nextName = window.prompt("Update product name", product.name) ?? product.name;
    const nextPriceRaw =
      window.prompt("Update price", Number(product.price).toFixed(2)) ??
      Number(product.price).toFixed(2);

    if (nextName.includes("-")) {
      setError("Product name must not contain '-'.");
      return;
    }
    if (Number(nextPriceRaw) < 0) {
      setError("Price cannot be negative.");
      return;
    }

    const response = await fetch(`/api/products/${product.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: nextName.trim(),
        price: Number(nextPriceRaw),
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Failed to update product");
      return;
    }
    setMessage("Product updated successfully.");
    await loadAll();
  }

  async function deleteProduct(product: ProductRow) {
    if (!window.confirm(`Delete "${product.name}"?`)) {
      return;
    }
    const response = await fetch(`/api/products/${product.id}`, {
      method: "DELETE",
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Failed to delete product");
      return;
    }
    setMessage("Product deleted successfully.");
    await loadAll();
  }

  async function addInventoryUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    if (!merchantId || !inventoryForm.productId) {
      setError("Please choose a product.");
      return;
    }
    if (Number(inventoryForm.quantity) <= 0) {
      setError("Quantity must be greater than zero.");
      return;
    }

    const product = products.find((p) => p.id === inventoryForm.productId);
    const response = await fetch("/api/inventory/updates", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId,
        productId: inventoryForm.productId,
        sku: product?.sku ?? undefined,
        quantity: Number(inventoryForm.quantity),
        type: inventoryForm.type,
        reason: inventoryForm.reason.trim() || undefined,
        location: inventoryForm.location.trim() || "main",
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Failed to update inventory");
      return;
    }

    setInventoryForm({
      productId: "",
      type: "restock",
      quantity: "",
      reason: "",
      location: "main",
    });
    setMessage("Inventory updated successfully.");
    await loadAll();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-bold text-white">Inventory Management</h1>
        <p className="mt-1 text-slate-300">
          Manage products and inventory operations with live validations and operational logs.
        </p>
        {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </div>

      <section className="grid gap-6 lg:grid-cols-2">
        <form
          onSubmit={createProduct}
          className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6"
        >
          <h2 className="text-lg font-semibold text-white">Create Product</h2>
          <p className="mt-1 text-sm text-slate-400">
            Rules: price cannot be negative and product name cannot include &quot;-&quot;.
          </p>
          <div className="mt-4 grid gap-3">
            <input
              value={newProduct.name}
              onChange={(e) => setNewProduct((s) => ({ ...s, name: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="Product name"
              required
            />
            <input
              value={newProduct.sku}
              onChange={(e) => setNewProduct((s) => ({ ...s, sku: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="SKU"
              required
            />
            <input
              type="number"
              min={0}
              step="0.01"
              value={newProduct.price}
              onChange={(e) => setNewProduct((s) => ({ ...s, price: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="Price"
              required
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
          >
            Add Product
          </button>
        </form>

        <form
          onSubmit={addInventoryUpdate}
          className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6"
        >
          <h2 className="text-lg font-semibold text-white">Create Inventory Operation</h2>
          <p className="mt-1 text-sm text-slate-400">
            Apply restock, damage, or liquidation updates as real inventory operations.
          </p>
          <div className="mt-4 grid gap-3">
            <select
              value={inventoryForm.productId}
              onChange={(e) => setInventoryForm((s) => ({ ...s, productId: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              required
            >
              <option value="">Select product</option>
              {productOptions.map((item) => (
                <option key={item.id} value={item.id}>
                  {item.label}
                </option>
              ))}
            </select>
            <select
              value={inventoryForm.type}
              onChange={(e) => setInventoryForm((s) => ({ ...s, type: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            >
              <option value="restock">Restock</option>
              <option value="damage">Damage</option>
              <option value="liquidate">Liquidate</option>
            </select>
            <input
              type="number"
              min={1}
              step="1"
              value={inventoryForm.quantity}
              onChange={(e) => setInventoryForm((s) => ({ ...s, quantity: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="Quantity"
              required
            />
            <input
              value={inventoryForm.location}
              onChange={(e) => setInventoryForm((s) => ({ ...s, location: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="Location"
            />
            <input
              value={inventoryForm.reason}
              onChange={(e) => setInventoryForm((s) => ({ ...s, reason: e.target.value }))}
              className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
              placeholder="Reason"
            />
          </div>
          <button
            type="submit"
            className="mt-4 rounded-lg bg-cyan-500 px-4 py-2 text-sm font-medium text-white hover:bg-cyan-600"
          >
            Save Operation
          </button>
        </form>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Products (CRUD)</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2">Name</th>
                <th className="py-2">SKU</th>
                <th className="py-2">Price</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((row) => (
                <tr key={row.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-2">{row.name}</td>
                  <td className="py-2">{row.sku ?? "—"}</td>
                  <td className="py-2">${Number(row.price).toFixed(2)}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => updateProduct(row)}
                        className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                      >
                        Edit
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteProduct(row)}
                        className="rounded-md border border-red-600/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Warehouse Stock</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2">Product</th>
                <th className="py-2">SKU</th>
                <th className="py-2">Location</th>
                <th className="py-2">Quantity</th>
                <th className="py-2">Updated</th>
              </tr>
            </thead>
            <tbody>
              {data.stock.map((row) => (
                <tr key={row.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-2">{row.product?.name ?? "Unknown"}</td>
                  <td className="py-2">{row.sku}</td>
                  <td className="py-2">{row.location ?? "main"}</td>
                  <td className="py-2">{row.quantity}</td>
                  <td className="py-2">{new Date(row.updatedAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Inventory Activity</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2">Operation</th>
                <th className="py-2">Product</th>
                <th className="py-2">Quantity</th>
                <th className="py-2">RMA</th>
                <th className="py-2">Reason</th>
                <th className="py-2">Date</th>
              </tr>
            </thead>
            <tbody>
              {data.updates.map((row) => (
                <tr key={row.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-2 capitalize">{row.type}</td>
                  <td className="py-2">{row.product?.name ?? "Unknown"}</td>
                  <td className="py-2">{row.quantity}</td>
                  <td className="py-2">{row.return?.rmaNumber ?? "—"}</td>
                  <td className="py-2">{row.reason ?? "—"}</td>
                  <td className="py-2">{new Date(row.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
