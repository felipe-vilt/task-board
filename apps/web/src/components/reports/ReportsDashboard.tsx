import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { useQuery } from "@tanstack/react-query";
import { api } from "../../api/client";

interface ReportsDashboardProps {
  boardId: string;
}

export function ReportsDashboard({ boardId }: ReportsDashboardProps) {
  const { data: cfd } = useQuery({
    queryKey: ["reports", "cfd", boardId],
    queryFn: () => api.cfd(boardId),
  });

  const { data: velocity } = useQuery({
    queryKey: ["reports", "velocity", boardId],
    queryFn: () => api.velocity(boardId),
  });

  const { data: leadTime } = useQuery({
    queryKey: ["reports", "leadtime", boardId],
    queryFn: () => api.leadTime(boardId),
  });

  return (
    <div className="space-y-6 p-4">
      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Diagrama Cumulativo de Fluxo (CFD)
        </h3>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          {cfd && cfd.length > 0 ? (
            <ResponsiveContainer width="100%" height={240}>
              <AreaChart data={cfd}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="date" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="concluido" stackId="1" stroke="#16a34a" fill="#16a34a" />
                <Area type="monotone" dataKey="impedido" stackId="1" stroke="#dc2626" fill="#dc2626" />
                <Area type="monotone" dataKey="executando" stackId="1" stroke="#2563eb" fill="#2563eb" />
                <Area type="monotone" dataKey="backlog" stackId="1" stroke="#94a3b8" fill="#94a3b8" />
              </AreaChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">Sem dados ainda.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Velocidade (concluídos/semana)
        </h3>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          {velocity && velocity.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={velocity}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} />
                <Tooltip />
                <Bar dataKey="count" fill="#2563eb" />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">Sem dados ainda.</p>
          )}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-semibold text-slate-700 dark:text-slate-300">
          Lead Time médio (dias/semana)
        </h3>
        <div className="rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 p-4">
          {leadTime && leadTime.length > 0 ? (
            <ResponsiveContainer width="100%" height={200}>
              <LineChart data={leadTime}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="week" tick={{ fontSize: 11 }} />
                <YAxis tick={{ fontSize: 11 }} unit=" d" />
                <Tooltip />
                <Line type="monotone" dataKey="averageDays" stroke="#f59e0b" strokeWidth={2} />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <p className="py-8 text-center text-sm text-slate-400">Sem dados ainda.</p>
          )}
        </div>
      </section>
    </div>
  );
}
