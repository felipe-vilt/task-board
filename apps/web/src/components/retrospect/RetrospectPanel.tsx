import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { RetrospectData } from "../../types/retrospect";

interface RetrospectPanelProps {
  boardId: string;
}

const insightIcon: Record<string, string> = {
  warning: "⚠",
  info: "ℹ",
  success: "✓",
};

const insightColor: Record<string, string> = {
  warning: "border-amber-300 bg-amber-50 text-amber-800 dark:border-amber-700 dark:bg-amber-900/30 dark:text-amber-200",
  info: "border-blue-300 bg-blue-50 text-blue-800 dark:border-blue-700 dark:bg-blue-900/30 dark:text-blue-200",
  success: "border-green-300 bg-green-50 text-green-800 dark:border-green-700 dark:bg-green-900/30 dark:text-green-200",
};

export function RetrospectPanel({ boardId }: RetrospectPanelProps) {
  const [days, setDays] = useState(14);

  const { data, isLoading } = useQuery({
    queryKey: ["retrospect", boardId, days],
    queryFn: () => api.retrospect(boardId, days),
  });

  if (isLoading) return <p className="p-6 text-sm text-slate-500">Carregando retrospectiva…</p>;
  if (!data) return null;

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Retrospectiva
        </h3>
        <select
          value={days}
          onChange={(e) => setDays(Number(e.target.value))}
          className="rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
        >
          <option value={7}>Últimos 7 dias</option>
          <option value={14}>Últimos 14 dias</option>
          <option value={30}>Últimos 30 dias</option>
        </select>
      </div>

      <SummaryCards data={data} />
      <InsightsList insights={data.insights} />
      <TagMetricsTable metrics={data.tagMetrics} />
    </div>
  );
}

function SummaryCards({ data }: { data: RetrospectData }) {
  const cards = [
    { label: "Total de tickets", value: data.totalTickets, tone: "text-slate-700 dark:text-slate-200" },
    { label: "Criados no período", value: data.createdInPeriod, tone: "text-blue-700 dark:text-blue-300" },
    { label: "Concluídos no período", value: data.completedInPeriod, tone: "text-green-700 dark:text-green-300" },
    { label: "Impedidos no período", value: data.blockedInPeriod, tone: "text-red-700 dark:text-red-300" },
    {
      label: "Lead time médio",
      value: data.avgLeadTimeDays !== null ? `${data.avgLeadTimeDays}d` : "—",
      tone: "text-amber-700 dark:text-amber-300",
    },
  ];

  return (
    <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-5">
      {cards.map((card) => (
        <div
          key={card.label}
          className="rounded-lg border border-slate-200 bg-white p-3 dark:border-slate-700 dark:bg-slate-800"
        >
          <p className="text-xs text-slate-500 dark:text-slate-400">{card.label}</p>
          <p className={`text-xl font-semibold ${card.tone}`}>{card.value}</p>
        </div>
      ))}
    </div>
  );
}

function InsightsList({ insights }: { insights: RetrospectData["insights"] }) {
  if (insights.length === 0) return null;

  return (
    <div className="mb-4 space-y-2">
      <h4 className="text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
        Insights
      </h4>
      {insights.map((insight: RetrospectData["insights"][number], i: number) => (
        <div
          key={i}
          className={`flex items-start gap-2 rounded border p-2 text-sm ${insightColor[insight.type]}`}
        >
          <span>{insightIcon[insight.type]}</span>
          <span>{insight.message}</span>
        </div>
      ))}
    </div>
  );
}

function TagMetricsTable({ metrics }: { metrics: RetrospectData["tagMetrics"] }) {
  if (metrics.length === 0) return null;

  return (
    <div>
      <h4 className="mb-2 text-xs font-medium uppercase text-slate-500 dark:text-slate-400">
        Métricas por etiqueta
      </h4>
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-slate-200 text-left text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
            <th className="py-1">Etiqueta</th>
            <th className="py-1">Tickets</th>
            <th className="py-1">Lead time médio</th>
          </tr>
        </thead>
        <tbody>
          {metrics.map((m: RetrospectData["tagMetrics"][number]) => (
            <tr key={m.tagId} className="border-b border-slate-100 dark:border-slate-800">
              <td className="py-1">
                <span
                  className="rounded-full px-2 py-0.5 text-xs text-white"
                  style={{ backgroundColor: m.color }}
                >
                  {m.tagName}
                </span>
              </td>
              <td className="py-1 dark:text-slate-300">{m.count}</td>
              <td className="py-1 dark:text-slate-300">
                {m.avgLeadTimeDays !== null ? `${m.avgLeadTimeDays}d` : "—"}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
