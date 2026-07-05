import type { ReactNode } from "react";
import {
  Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip,
  BarChart, Bar, XAxis, YAxis,
} from "recharts";

export function Card({ title, right, children, className }: {
  title?: string;
  right?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`card ${className ?? ""}`}>
      {(title || right) && (
        <div className="card-head">
          {title && <h3>{title}</h3>}
          {right}
        </div>
      )}
      <div className="card-body">{children}</div>
    </section>
  );
}

export function StatCard({ label, value, unit, tone }: {
  label: string;
  value: string | number;
  unit?: string;
  tone?: "ok" | "warn" | "bad";
}) {
  return (
    <div className={`stat-card ${tone ?? ""}`}>
      <div className="stat-value">
        {value}
        {unit && <span className="stat-unit"> {unit}</span>}
      </div>
      <div className="stat-label">{label}</div>
    </div>
  );
}

export interface DonutDatum {
  name: string;
  value: number;
  color: string;
}

export function DonutCard({ data }: { data: DonutDatum[] }) {
  const total = data.reduce((s, d) => s + d.value, 0);
  if (total === 0) return <div className="donut-empty">—</div>;
  return (
    <ResponsiveContainer width="100%" height={210}>
      <PieChart>
        <Pie data={data} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75} paddingAngle={2}>
          {data.map((d) => (
            <Cell key={d.name} fill={d.color} />
          ))}
        </Pie>
        <Tooltip />
        <Legend layout="vertical" align="right" verticalAlign="middle" iconType="circle" />
      </PieChart>
    </ResponsiveContainer>
  );
}

export interface BarDatum {
  name: string;
  active: number;
  inactive: number;
}

export function StatusBarCard({ data, activeLabel, inactiveLabel }: {
  data: BarDatum[];
  activeLabel: string;
  inactiveLabel: string;
}) {
  return (
    <ResponsiveContainer width="100%" height={210}>
      <BarChart data={data} layout="vertical" margin={{ left: 20, right: 20, top: 10, bottom: 10 }}>
        <XAxis type="number" allowDecimals={false} tick={{ fontSize: 11 }} />
        <YAxis type="category" dataKey="name" tick={{ fontSize: 12 }} width={70} />
        <Tooltip />
        <Legend iconType="square" />
        <Bar dataKey="active" name={activeLabel} stackId="a" fill="#22c55e" />
        <Bar dataKey="inactive" name={inactiveLabel} stackId="a" fill="#dc2626" />
      </BarChart>
    </ResponsiveContainer>
  );
}
