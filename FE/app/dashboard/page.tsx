'use client';

import { useEffect, useState } from 'react';
import { BarChart3, AlertCircle, AlertTriangle, CheckCircle } from 'lucide-react';
import SummaryCard from '@/components/summary-card';
import LineChartComponent from '@/components/line-chart';
import PieChartComponent from '@/components/pie-chart';
import { fetchAnalytics, type AnalyticsResponse } from '@/lib/chat-api';

function formatNumber(n: number) {
  return n.toLocaleString();
}

export default function DashboardPage() {
  const [analytics, setAnalytics] = useState<AnalyticsResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        setLoading(true);
        setError(null);
        const data = await fetchAnalytics();
        if (!cancelled) setAnalytics(data);
      } catch (e) {
        if (!cancelled) setError(e instanceof Error ? e.message : 'Failed to load analytics');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const summaryStats = analytics
    ? [
        { title: 'Total Requests', value: formatNumber(analytics.total_requests), icon: <BarChart3 className="w-5 h-5" /> },
        { title: 'High Priority', value: formatNumber(analytics.high_priority), icon: <AlertCircle className="w-5 h-5" /> },
        { title: 'Medium Priority', value: formatNumber(analytics.medium_priority), icon: <AlertTriangle className="w-5 h-5" /> },
        { title: 'Low Priority', value: formatNumber(analytics.low_priority), icon: <CheckCircle className="w-5 h-5" /> },
      ]
    : [
        { title: 'Total Requests', value: '—', icon: <BarChart3 className="w-5 h-5" /> },
        { title: 'High Priority', value: '—', icon: <AlertCircle className="w-5 h-5" /> },
        { title: 'Medium Priority', value: '—', icon: <AlertTriangle className="w-5 h-5" /> },
        { title: 'Low Priority', value: '—', icon: <CheckCircle className="w-5 h-5" /> },
      ];

  // Line chart: backend can send { date, count } or { date, requests }
  const rawTimeSeries = analytics?.request_count_over_time;
  const lineChartData = Array.isArray(rawTimeSeries) && rawTimeSeries.length > 0
    ? rawTimeSeries.map((p: { date: string; count?: number; requests?: number }) => ({
        date: p.date,
        requests: p.count ?? p.requests ?? 0,
      }))
    : undefined;

  // Pie chart: use priority_distribution if non-empty, else build from high/medium/low counts
  const rawDistribution = analytics?.priority_distribution;
  const pieChartData =
    Array.isArray(rawDistribution) && rawDistribution.length > 0
      ? rawDistribution
      : analytics
        ? [
            { name: 'High', value: analytics.high_priority },
            { name: 'Medium', value: analytics.medium_priority },
            { name: 'Low', value: analytics.low_priority },
          ]
        : undefined;

  return (
    <div className="min-h-screen bg-background px-4 py-12 md:px-8">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold text-foreground mb-12">Dashboard</h1>

        {error && (
          <div className="mb-6 p-4 rounded-2xl border border-destructive/50 bg-destructive/10 text-destructive">
            {error}
          </div>
        )}

        {loading && (
          <p className="text-muted-foreground mb-6">Loading analytics…</p>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
          {summaryStats.map((stat, index) => (
            <SummaryCard key={index} {...stat} />
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <LineChartComponent data={lineChartData} />
          <PieChartComponent data={pieChartData} />
        </div>
      </div>
    </div>
  );
}