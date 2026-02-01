'use client';

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';

const COLORS = ['#f5f5f5', '#a0a0a0', '#555555'];

export interface PieChartDataPoint {
  name: string;
  value: number;
}

const defaultData: (PieChartDataPoint & { color: string })[] = [
  { name: 'High', value: 324, color: COLORS[0] },
  { name: 'Medium', value: 612, color: COLORS[1] },
  { name: 'Low', value: 311, color: COLORS[2] },
];

export default function PieChartComponent({
  data,
}: {
  data?: PieChartDataPoint[];
}) {
  const chartData = data
    ? data.map((d, i) => ({ ...d, color: COLORS[i % COLORS.length] }))
    : defaultData;

  return (
    <div className="bg-card rounded-2xl border border-border/30 p-6">
      <h2 className="text-lg font-semibold text-foreground mb-6">Priority Distribution</h2>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, value }) => `${name}: ${value}`}
            outerRadius={100}
            fill="#8884d8"
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: '#9a9a9a',
              border: '1px solid #e0e0e0',
              borderRadius: '8px',
              color: '#1a1a1a',
            }}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}