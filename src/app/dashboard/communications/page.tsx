"use client";

import { useEffect, useState } from "react";

type CommunicationLog = {
  id: string;
  channel: string;
  eventType: string;
  recipient: string;
  provider: string;
  status: string;
  error: string | null;
  createdAt: string;
  return: { rmaNumber: string } | null;
};

export default function CommunicationsPage() {
  const [logs, setLogs] = useState<CommunicationLog[]>([]);

  useEffect(() => {
    fetch("/api/communications/logs")
      .then((r) => r.json())
      .then((data) => setLogs(Array.isArray(data) ? data : []))
      .catch(() => setLogs([]));
  }, []);

  return (
    <div className="space-y-8">
      <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
        <h1 className="text-2xl font-bold text-white">Customer Communications</h1>
        <p className="mt-1 text-slate-300">
          Event-driven updates for return approved, label created, and refund processed.
        </p>
      </div>

      <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
        <h2 className="text-lg font-semibold text-white">Delivery log</h2>
        <div className="mt-4 overflow-auto">
          <table className="min-w-full text-sm">
            <thead>
              <tr className="text-left text-slate-400">
                <th className="py-2">Event</th>
                <th className="py-2">Channel</th>
                <th className="py-2">Recipient</th>
                <th className="py-2">RMA</th>
                <th className="py-2">Provider</th>
                <th className="py-2">Status</th>
                <th className="py-2">Created</th>
              </tr>
            </thead>
            <tbody>
              {logs.map((log) => (
                <tr key={log.id} className="border-t border-slate-800 text-slate-200">
                  <td className="py-2">{log.eventType}</td>
                  <td className="py-2 uppercase">{log.channel}</td>
                  <td className="py-2">{log.recipient}</td>
                  <td className="py-2">{log.return?.rmaNumber ?? "—"}</td>
                  <td className="py-2">{log.provider}</td>
                  <td className="py-2">{log.status}</td>
                  <td className="py-2">{new Date(log.createdAt).toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
