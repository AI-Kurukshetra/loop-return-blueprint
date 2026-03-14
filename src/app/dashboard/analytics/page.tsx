"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

type ReturnsAnalytics = {
  totalReturns: number;
  approved: number;
  refunded: number;
  exchanges: number;
  returnRate: number;
  refundExchangeRatio: number;
  processingTimeHours: number;
  returnReasons: { reason: string; count: number }[];
  returnTrend: { date: string; count: number }[];
};

type FraudAnalytics = {
  fraudRate: number;
  highRiskCount: number;
  mediumRiskCount: number;
  avgRiskScore: number;
  scoreTimeline: { date: string; score: number; riskLevel: string }[];
};

const pieColors = ["#f97316", "#0ea5e9", "#10b981", "#a3a3a3", "#ef4444"];

export default function AnalyticsPage() {
  const [returnsData, setReturnsData] = useState<ReturnsAnalytics | null>(null);
  const [fraudData, setFraudData] = useState<FraudAnalytics | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    Promise.all([
      fetch("/api/analytics/returns?days=30").then((r) => r.json()),
      fetch("/api/analytics/fraud?days=30").then((r) => r.json()),
    ])
      .then(([returnsPayload, fraudPayload]) => {
        setReturnsData(returnsPayload);
        setFraudData(fraudPayload);
      })
      .finally(() => setLoading(false));
  }, []);

  const topReasons = useMemo(
    () => (returnsData?.returnReasons ?? []).slice(0, 5),
    [returnsData]
  );

  if (loading) {
    return <p className="text-slate-200">Loading analytics...</p>;
  }

  return (
    <div className="space-y-8">
      <div className="rounded-3xl border border-orange-500/30 bg-gradient-to-br from-orange-500/20 via-slate-900 to-cyan-950 p-8">
        <h1 className="text-3xl font-bold tracking-tight text-white">Analytics Command Center</h1>
        <p className="mt-2 text-slate-200">
          Return rate, reasons, refund vs exchange ratio, fraud signals, and processing speed.
        </p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <MetricCard title="Return Rate" value={`${(returnsData?.returnRate ?? 0).toFixed(1)}%`} />
        <MetricCard
          title="Refund vs Exchange"
          value={`${(returnsData?.refundExchangeRatio ?? 0).toFixed(2)}x`}
        />
        <MetricCard title="Fraud Rate" value={`${(fraudData?.fraudRate ?? 0).toFixed(1)}%`} />
        <MetricCard
          title="Processing Time"
          value={`${(returnsData?.processingTimeHours ?? 0).toFixed(1)}h`}
        />
        <MetricCard
          title="High Risk Returns"
          value={String(fraudData?.highRiskCount ?? 0)}
        />
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Returns Trend (30 days)">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={returnsData?.returnTrend ?? []}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Line type="monotone" dataKey="count" stroke="#f97316" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Return Reasons">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie data={topReasons} dataKey="count" nameKey="reason" outerRadius={110} label>
                {topReasons.map((entry, index) => (
                  <Cell key={entry.reason} fill={pieColors[index % pieColors.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      <div className="grid gap-6 xl:grid-cols-2">
        <ChartCard title="Fraud Risk Scores">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={fraudData?.scoreTimeline ?? []}>
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="date" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" domain={[0, 1]} />
              <Tooltip />
              <Line type="monotone" dataKey="score" stroke="#0ea5e9" strokeWidth={3} />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        <ChartCard title="Risk Bucket Distribution">
          <ResponsiveContainer width="100%" height={300}>
            <BarChart
              data={[
                { label: "High", value: fraudData?.highRiskCount ?? 0 },
                { label: "Medium", value: fraudData?.mediumRiskCount ?? 0 },
                {
                  label: "Avg Score",
                  value: Number((fraudData?.avgRiskScore ?? 0).toFixed(2)),
                },
              ]}
            >
              <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" />
              <XAxis dataKey="label" stroke="#94a3b8" />
              <YAxis stroke="#94a3b8" />
              <Tooltip />
              <Bar dataKey="value" fill="#10b981" radius={[8, 8, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>
    </div>
  );
}

function MetricCard({ title, value }: { title: string; value: string }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/80 p-5 shadow-[0_10px_30px_-20px_rgba(249,115,22,0.8)]">
      <p className="text-xs uppercase tracking-[0.18em] text-slate-400">{title}</p>
      <p className="mt-3 text-3xl font-semibold text-white">{value}</p>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2xl border border-slate-700/70 bg-slate-900/70 p-6">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <div className="mt-4">{children}</div>
    </div>
  );
}
