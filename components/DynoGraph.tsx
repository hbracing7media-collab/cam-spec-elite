"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface RPMInterval {
  rpm: number;
  hp: number;
  torque: number;
}

interface DynoGraphProps {
  rpmIntervals: RPMInterval[];
  engineName?: string;
}

export function DynoGraph({ rpmIntervals, engineName }: DynoGraphProps) {
  if (!rpmIntervals || rpmIntervals.length === 0) {
    return <div style={{ color: "#94a3b8", fontSize: 12 }}>No RPM data available</div>;
  }

  // Sort by RPM for proper graphing
  const sortedData = [...rpmIntervals].sort((a, b) => a.rpm - b.rpm);

  return (
    <div style={{ width: "100%", height: 300, marginTop: 16 }}>
      <ResponsiveContainer width="100%" height="100%">
        <LineChart
          data={sortedData}
          margin={{ top: 5, right: 30, left: 0, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="rgba(100,116,139,0.2)" />
          <XAxis
            dataKey="rpm"
            stroke="#64748b"
            style={{ fontSize: 12 }}
            label={{ value: "RPM", position: "insideBottomRight", offset: -5 }}
          />
          <YAxis
            stroke="#64748b"
            style={{ fontSize: 12 }}
            label={{ value: "Power (HP) / Torque (lb-ft)", angle: -90, position: "insideLeft" }}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: "rgba(2,6,23,0.95)",
              border: "1px solid rgba(56,189,248,0.3)",
              borderRadius: 8,
            }}
            labelStyle={{ color: "#e2e8f0" }}
            formatter={(value: any) => {
              if (typeof value === "number") {
                return value.toFixed(0);
              }
              return value;
            }}
            labelFormatter={(label) => `${label} RPM`}
          />
          <Legend
            wrapperStyle={{ color: "#cbd5e1", paddingTop: 16 }}
            iconType="line"
          />
          <Line
            type="monotone"
            dataKey="hp"
            stroke="#22c55e"
            strokeWidth={2}
            dot={{ fill: "#22c55e", r: 4 }}
            activeDot={{ r: 6 }}
            name="Horsepower (HP)"
            isAnimationActive={true}
          />
          <Line
            type="monotone"
            dataKey="torque"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: "#f59e0b", r: 4 }}
            activeDot={{ r: 6 }}
            name="Torque (lb-ft)"
            isAnimationActive={true}
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
