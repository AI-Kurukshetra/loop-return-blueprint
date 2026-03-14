"use client";

import { useEffect, useMemo, useState } from "react";
import { signOut } from "next-auth/react";

type Props = {
  merchantId: string;
  email: string;
  name?: string | null;
};

type NotificationsPayload = {
  summary?: {
    pendingReturns: number;
    failedComms: number;
  };
  recent?: Array<{
    id: string;
    eventType: string;
    channel: string;
    status: string;
    recipient: string;
    createdAt: string;
    return: { rmaNumber: string } | null;
  }>;
};

export default function DashboardTopbarControls({
  merchantId,
  email,
  name,
}: Props) {
  const [theme, setTheme] = useState<"midnight" | "ocean">(() => {
    if (typeof window === "undefined") {
      return "midnight";
    }
    return window.localStorage.getItem("loop_dashboard_theme") === "ocean"
      ? "ocean"
      : "midnight";
  });
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<NotificationsPayload | null>(null);

  useEffect(() => {
    document.documentElement.setAttribute("data-dashboard-theme", theme);
  }, [theme]);

  useEffect(() => {
    fetch(`/api/notifications?merchantId=${merchantId}`)
      .then((r) => r.json())
      .then((data) => {
        setPayload({
          summary: {
            pendingReturns: Number(data?.summary?.pendingReturns ?? 0),
            failedComms: Number(data?.summary?.failedComms ?? 0),
          },
          recent: Array.isArray(data?.recent) ? data.recent : [],
        });
      })
      .catch(() =>
        setPayload({
          summary: { pendingReturns: 0, failedComms: 0 },
          recent: [],
        })
      );
  }, [merchantId]);

  const unreadCount = useMemo(() => {
    if (!payload) {
      return 0;
    }
    const pending = payload.summary?.pendingReturns ?? 0;
    const failed = payload.summary?.failedComms ?? 0;
    return pending + failed;
  }, [payload]);

  function toggleTheme() {
    const next = theme === "midnight" ? "ocean" : "midnight";
    setTheme(next);
    window.localStorage.setItem("loop_dashboard_theme", next);
    document.documentElement.setAttribute("data-dashboard-theme", next);
  }

  return (
    <div className="relative flex items-center gap-3">
      <button
        type="button"
        onClick={toggleTheme}
        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
      >
        Theme: {theme}
      </button>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="rounded-lg border border-slate-700 px-3 py-1.5 text-xs text-slate-200 hover:bg-slate-800"
      >
        Notifications ({unreadCount})
      </button>
      <div className="rounded-lg border border-slate-700 bg-slate-900/70 px-3 py-1.5 text-xs text-slate-200">
        <p className="font-semibold">{name ?? "User"}</p>
        <p className="text-slate-400">{email}</p>
      </div>
      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg border border-red-500/40 px-3 py-1.5 text-xs text-red-300 hover:bg-red-500/10"
      >
        Logout
      </button>

      {open ? (
        <div className="absolute right-0 top-10 z-20 w-[26rem] rounded-xl border border-slate-700 bg-slate-950 p-4 shadow-2xl">
          <p className="text-sm font-semibold text-white">Notification Panel</p>
          <p className="mt-1 text-xs text-slate-400">
            Pending returns: {payload?.summary?.pendingReturns ?? 0} · Failed communications:{" "}
            {payload?.summary?.failedComms ?? 0}
          </p>
          <div className="mt-3 max-h-72 space-y-2 overflow-auto">
            {(payload?.recent ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-800 bg-slate-900/70 p-2 text-xs text-slate-200"
              >
                <p>
                  {item.eventType} via {item.channel} · {item.status}
                </p>
                <p className="text-slate-400">
                  {item.return?.rmaNumber ?? "No RMA"} · {item.recipient}
                </p>
              </div>
            ))}
            {(payload?.recent ?? []).length === 0 ? (
              <p className="text-xs text-slate-500">No notifications yet.</p>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
