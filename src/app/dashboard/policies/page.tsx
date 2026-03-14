"use client";

import { useCallback, useEffect, useState } from "react";

type PolicyRow = {
  id: string;
  name: string;
  description: string | null;
  returnWindowDays: number;
  conditions: {
    allowedConditions?: string[];
    excludedCategories?: string[];
    requireOriginalPackaging?: boolean;
  } | null;
  isDefault: boolean;
};

export default function PoliciesPage() {
  const [merchantId, setMerchantId] = useState("");
  const [policies, setPolicies] = useState<PolicyRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const [form, setForm] = useState({
    name: "",
    description: "",
    returnWindowDays: "30",
    allowedUnopened: true,
    allowedOpened: true,
    allowedDamaged: false,
    allowedDefective: false,
    excludedCategories: "",
    requireOriginalPackaging: false,
    isDefault: false,
  });

  const loadPolicies = useCallback(async (activeMerchantId?: string) => {
    const id = activeMerchantId ?? merchantId;
    if (!id) {
      return;
    }
    const response = await fetch(`/api/policies?merchantId=${id}`);
    const payload = await response.json();
    setPolicies(Array.isArray(payload) ? payload : []);
  }, [merchantId]);

  useEffect(() => {
    fetch("/api/auth/session")
      .then((r) => r.json())
      .then((session) => {
        const id = session?.user?.merchantId ?? "";
        setMerchantId(id);
        return loadPolicies(id);
      })
      .catch(() => setError("Unable to load policies"))
      .finally(() => setLoading(false));
  }, [loadPolicies]);

  async function createPolicy(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setMessage("");

    const allowedConditions = [
      form.allowedUnopened ? "unopened" : null,
      form.allowedOpened ? "opened" : null,
      form.allowedDamaged ? "damaged" : null,
      form.allowedDefective ? "defective" : null,
    ].filter(Boolean) as string[];

    if (allowedConditions.length === 0) {
      setError("Select at least one allowed condition.");
      return;
    }

    if (Number(form.returnWindowDays) <= 0) {
      setError("Return window must be greater than zero.");
      return;
    }

    const response = await fetch("/api/policies", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        merchantId,
        name: form.name.trim(),
        description: form.description.trim() || undefined,
        returnWindowDays: Number(form.returnWindowDays),
        allowedConditions,
        excludedCategories: form.excludedCategories
          .split(",")
          .map((x) => x.trim())
          .filter(Boolean),
        requireOriginalPackaging: form.requireOriginalPackaging,
        isDefault: form.isDefault,
      }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Unable to create policy");
      return;
    }

    setForm({
      name: "",
      description: "",
      returnWindowDays: "30",
      allowedUnopened: true,
      allowedOpened: true,
      allowedDamaged: false,
      allowedDefective: false,
      excludedCategories: "",
      requireOriginalPackaging: false,
      isDefault: false,
    });
    setMessage("Policy created successfully.");
    await loadPolicies();
  }

  async function setDefaultPolicy(policyId: string) {
    setError("");
    setMessage("");
    const response = await fetch(`/api/policies/${policyId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isDefault: true }),
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Unable to update policy");
      return;
    }
    setMessage("Default policy updated.");
    await loadPolicies();
  }

  async function deletePolicy(policyId: string) {
    if (!window.confirm("Delete this return policy?")) {
      return;
    }
    setError("");
    setMessage("");
    const response = await fetch(`/api/policies/${policyId}`, {
      method: "DELETE",
    });
    const payload = await response.json();
    if (!response.ok) {
      setError(payload?.error ?? "Unable to delete policy");
      return;
    }
    setMessage("Policy deleted.");
    await loadPolicies();
  }

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-bold text-white">Return Policies</h1>
        <p className="mt-1 text-slate-300">
          Define return windows, allowed conditions, packaging rules, and excluded categories.
        </p>
        {message ? <p className="mt-3 text-sm text-emerald-400">{message}</p> : null}
        {error ? <p className="mt-3 text-sm text-red-400">{error}</p> : null}
      </div>

      <form
        onSubmit={createPolicy}
        className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6"
      >
        <h2 className="text-lg font-semibold text-white">Create Return Policy</h2>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          <input
            value={form.name}
            onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="Policy name"
            required
          />
          <input
            type="number"
            min={1}
            max={365}
            value={form.returnWindowDays}
            onChange={(e) => setForm((s) => ({ ...s, returnWindowDays: e.target.value }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white"
            placeholder="Return window (days)"
            required
          />
          <input
            value={form.description}
            onChange={(e) => setForm((s) => ({ ...s, description: e.target.value }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2"
            placeholder="Description"
          />
          <input
            value={form.excludedCategories}
            onChange={(e) => setForm((s) => ({ ...s, excludedCategories: e.target.value }))}
            className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white md:col-span-2"
            placeholder="Excluded categories (comma separated)"
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
          <Check
            label="Allow unopened"
            checked={form.allowedUnopened}
            onChange={(checked) => setForm((s) => ({ ...s, allowedUnopened: checked }))}
          />
          <Check
            label="Allow opened"
            checked={form.allowedOpened}
            onChange={(checked) => setForm((s) => ({ ...s, allowedOpened: checked }))}
          />
          <Check
            label="Allow damaged"
            checked={form.allowedDamaged}
            onChange={(checked) => setForm((s) => ({ ...s, allowedDamaged: checked }))}
          />
          <Check
            label="Allow defective"
            checked={form.allowedDefective}
            onChange={(checked) => setForm((s) => ({ ...s, allowedDefective: checked }))}
          />
        </div>
        <div className="mt-4 grid gap-2 sm:grid-cols-2">
          <Check
            label="Require original packaging"
            checked={form.requireOriginalPackaging}
            onChange={(checked) =>
              setForm((s) => ({ ...s, requireOriginalPackaging: checked }))
            }
          />
          <Check
            label="Set as default policy"
            checked={form.isDefault}
            onChange={(checked) => setForm((s) => ({ ...s, isDefault: checked }))}
          />
        </div>
        <button
          type="submit"
          className="mt-5 rounded-lg bg-emerald-500 px-4 py-2 text-sm font-medium text-white hover:bg-emerald-600"
        >
          Save Policy
        </button>
      </form>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Policy Content Preview</h2>
        <div className="mt-4 rounded-lg border border-slate-800 bg-slate-950/70 p-4 text-sm text-slate-300">
          <p>
            Items can be returned within <span className="font-semibold text-white">30 days</span>{" "}
            from delivery with original invoice. Opened items are accepted if unused and complete.
          </p>
          <p className="mt-2">
            Damaged or defective items are eligible for replacement or full refund after inspection.
          </p>
          <p className="mt-2">
            Final-sale and hygiene products are excluded from return eligibility.
          </p>
        </div>
      </section>

      <section className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Saved Policies</h2>
        {loading ? <p className="mt-3 text-slate-400">Loading policies...</p> : null}
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2">Name</th>
                <th className="py-2">Window</th>
                <th className="py-2">Allowed Conditions</th>
                <th className="py-2">Default</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {policies.map((policy) => (
                <tr key={policy.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-2">
                    <p className="font-medium text-white">{policy.name}</p>
                    <p className="text-xs text-slate-400">{policy.description ?? "No description"}</p>
                  </td>
                  <td className="py-2">{policy.returnWindowDays} days</td>
                  <td className="py-2">
                    {(policy.conditions?.allowedConditions ?? ["unopened", "opened"]).join(", ")}
                  </td>
                  <td className="py-2">{policy.isDefault ? "Yes" : "No"}</td>
                  <td className="py-2">
                    <div className="flex gap-2">
                      {!policy.isDefault ? (
                        <button
                          type="button"
                          onClick={() => setDefaultPolicy(policy.id)}
                          className="rounded-md border border-slate-700 px-2 py-1 text-xs hover:bg-slate-800"
                        >
                          Make Default
                        </button>
                      ) : null}
                      <button
                        type="button"
                        onClick={() => deletePolicy(policy.id)}
                        className="rounded-md border border-red-500/40 px-2 py-1 text-xs text-red-300 hover:bg-red-500/10"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {policies.length === 0 && !loading ? (
                <tr>
                  <td colSpan={5} className="py-4 text-center text-slate-500">
                    No policies yet. Create your first return policy above.
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

function Check({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <label className="flex items-center gap-2 rounded-lg border border-slate-800 bg-slate-950/50 px-3 py-2 text-sm text-slate-300">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="h-4 w-4"
      />
      {label}
    </label>
  );
}
