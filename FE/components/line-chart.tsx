'use client';

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

const defaultData = [
  { date: 'Mon', requests: 120 },
  { date: 'Tue', requests: 180 },
  { date: 'Wed', requests: 150 },
  { date: 'Thu', requests: 220 },
  { date: 'Fri', requests: 280 },
  { date: 'Sat', requests: 190 },
  { date: 'Sun', requests: 240 },
];

export interface LineChartDataPoint {
  date: string;
  requests: number;
}

export default function LineChartComponent({
  data = defaultData,
}: {
  data?: LineChartDataPoint[];
}) {
  return (
    <div className="bg-card rounded-2xl border border-border/30 p-6">
      <h2 className="text-lg font-semibold text-foreground mb-6">Request Count Over Time</h2>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke="#ffffff10" />
          <XAxis
            dataKey="date"
            stroke="#888888"
            style={{ fontSize: '12px' }}
            tickFormatter={(value) => {
              if (typeof value !== 'string') return String(value);
              try {
                const d = new Date(value);
                if (!Number.isNaN(d.getTime())) return d.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' });
              } catch {
                // ignore
              }
              return value;
            }}
          />
          <YAxis stroke="#888888" style={{ fontSize: '12px' }} />
          <Tooltip
            contentStyle={{
              backgroundColor: '#1a1a1a',
              border: '1px solid #333333',
              borderRadius: '8px',
              color: '#ffffff',
            }}
            cursor={{ stroke: '#666666' }}
          />
          <Line
            type="monotone"
            dataKey="requests"
            stroke="#ffffff"
            dot={{ fill: '#ffffff', r: 4 }}
            activeDot={{ r: 6 }}
            strokeWidth={2}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
