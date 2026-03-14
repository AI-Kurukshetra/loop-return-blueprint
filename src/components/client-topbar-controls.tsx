"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { signOut } from "next-auth/react";

type Props = {
  email: string;
  name?: string | null;
};

type NotificationsPayload = {
  summary?: { total: number; sent: number };
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

export default function ClientTopbarControls({ email, name }: Props) {
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [payload, setPayload] = useState<NotificationsPayload | null>(null);

  useEffect(() => {
    function handleClick() {
      setProfileOpen(false);
      setNotifOpen(false);
    }
    if (profileOpen || notifOpen) {
      document.addEventListener("click", handleClick);
      return () => document.removeEventListener("click", handleClick);
    }
  }, [profileOpen, notifOpen]);

  useEffect(() => {
    fetch("/api/client/notifications")
      .then((r) => r.json())
      .then((data) => {
        setPayload({
          summary: data?.summary ?? { total: 0, sent: 0 },
          recent: Array.isArray(data?.recent) ? data.recent : [],
        });
      })
      .catch(() =>
        setPayload({ summary: { total: 0, sent: 0 }, recent: [] })
      );
  }, []);

  const displayName = name ?? email?.split("@")[0] ?? "Customer";

  return (
    <div className="relative flex items-center gap-2">
      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setNotifOpen(false); setProfileOpen((v) => !v); }}
        className="flex items-center gap-2 rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80"
      >
        <span className="flex h-8 w-8 items-center justify-center rounded-full bg-emerald-500/20 text-emerald-400">
          {displayName.charAt(0).toUpperCase()}
        </span>
        <span className="hidden font-medium sm:inline">{displayName}</span>
      </button>
      {profileOpen && (
        <div className="absolute right-0 top-12 z-30 w-56 rounded-xl border border-slate-700 bg-slate-950 p-3 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm font-semibold text-white">{displayName}</p>
          <p className="text-xs text-slate-400">{email}</p>
          <Link
            href="/client/profile"
            onClick={() => setProfileOpen(false)}
            className="mt-2 block rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-slate-800"
          >
            View Profile
          </Link>
        </div>
      )}

      <button
        type="button"
        onClick={(e) => { e.stopPropagation(); setProfileOpen(false); setNotifOpen((v) => !v); }}
        className="relative rounded-lg border border-slate-700 px-3 py-2 text-sm text-slate-200 hover:bg-slate-800/80"
      >
        <span className="flex items-center gap-1.5">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          Notifications
          {payload?.summary?.total ? (
            <span className="rounded-full bg-emerald-500/80 px-2 py-0.5 text-xs font-medium text-white">
              {payload.summary.total}
            </span>
          ) : null}
        </span>
      </button>
      {notifOpen && (
        <div className="absolute right-0 top-12 z-30 w-80 rounded-xl border border-slate-700 bg-slate-950 p-4 shadow-2xl" onClick={(e) => e.stopPropagation()}>
          <p className="text-sm font-semibold text-white">Notifications</p>
          <p className="mt-1 text-xs text-slate-400">
            {payload?.summary?.sent ?? 0} notifications received
          </p>
          <div className="mt-3 max-h-64 space-y-2 overflow-auto">
            {(payload?.recent ?? []).map((item) => (
              <div
                key={item.id}
                className="rounded-lg border border-slate-800 bg-slate-900/70 p-2.5 text-xs"
              >
                <p className="text-slate-200">
                  {item.eventType.replace(/_/g, " ")} via {item.channel}
                </p>
                <p className="mt-0.5 text-slate-500">
                  {item.return?.rmaNumber ?? "—"} · {item.status}
                </p>
              </div>
            ))}
            {(payload?.recent ?? []).length === 0 ? (
              <p className="py-4 text-center text-xs text-slate-500">No notifications yet.</p>
            ) : null}
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={() => signOut({ callbackUrl: "/login" })}
        className="rounded-lg border border-red-500/40 px-3 py-2 text-sm text-red-300 hover:bg-red-500/10"
      >
        Logout
      </button>
    </div>
  );
}
