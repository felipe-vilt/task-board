import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "./boards.service";

export interface CfdPoint {
  date: string;
  backlog: number;
  executando: number;
  impedido: number;
  concluido: number;
}

export interface VelocityPoint {
  week: string;
  count: number;
}

export interface LeadTimePoint {
  week: string;
  averageDays: number;
}

export class ReportsService {
  constructor(private readonly prisma: PrismaClient) {}

  private async assertBoardExists(boardId: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundError("board not found");
  }

  async cfd(boardId: string): Promise<CfdPoint[]> {
    await this.assertBoardExists(boardId);

    const board = await this.prisma.board.findUnique({
      where: { id: boardId },
      include: { columns: true },
    });
    if (!board) return [];

    const columnNameById = new Map(board.columns.map((c: { id: string; name: string }) => [c.id, c.name]));

    const [logs, createdTickets] = await Promise.all([
      this.prisma.auditLog.findMany({
        where: { ticket: { boardId } },
        orderBy: { createdAt: "asc" },
        select: { ticketId: true, event: true, toColumn: true, createdAt: true },
      }),
      this.prisma.ticket.findMany({
        where: { boardId },
        select: { id: true, createdAt: true },
      }),
    ]);

    if (logs.length === 0 && createdTickets.length === 0) return [];

    const dates = new Set<string>();
    for (const log of logs) dates.add(isoDate(log.createdAt));
    for (const t of createdTickets) dates.add(isoDate(t.createdAt));
    const sortedDates = [...dates].sort();

    const state = new Map<string, string>();
    let logPtr = 0;

    const points: CfdPoint[] = [];
    for (const date of sortedDates) {
      const dayEnd = new Date(`${date}T23:59:59.999Z`);

      for (const t of createdTickets) {
        if (t.createdAt <= dayEnd && !state.has(t.id)) {
          const backlogCol = board.columns.find((c: { name: string }) => c.name === "Backlog");
          if (backlogCol) state.set(t.id, backlogCol.id);
        }
      }

      while (logPtr < logs.length && logs[logPtr].createdAt <= dayEnd) {
        const log = logs[logPtr];
        if (log.event === "moved" && log.toColumn) {
          state.set(log.ticketId, log.toColumn);
        }
        logPtr++;
      }

      const counts = { backlog: 0, executando: 0, impedido: 0, concluido: 0 };
      for (const colId of state.values()) {
        const name = columnNameById.get(colId);
        if (name === "Backlog") counts.backlog++;
        else if (name === "Executando") counts.executando++;
        else if (name === "Impedido") counts.impedido++;
        else if (name === "Concluído") counts.concluido++;
      }

      points.push({ date, ...counts });
    }

    return points;
  }

  async velocity(boardId: string): Promise<VelocityPoint[]> {
    await this.assertBoardExists(boardId);

    const tickets = await this.prisma.ticket.findMany({
      where: { boardId, completedAt: { not: null } },
      select: { completedAt: true },
    });

    const byWeek = new Map<string, number>();
    for (const t of tickets) {
      if (!t.completedAt) continue;
      const week = getIsoWeek(t.completedAt);
      byWeek.set(week, (byWeek.get(week) ?? 0) + 1);
    }

    return [...byWeek.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, count]) => ({ week, count }));
  }

  async leadTime(boardId: string): Promise<LeadTimePoint[]> {
    await this.assertBoardExists(boardId);

    const tickets = await this.prisma.ticket.findMany({
      where: { boardId, completedAt: { not: null } },
      select: { createdAt: true, completedAt: true },
    });

    const byWeek = new Map<string, number[]>();
    for (const t of tickets) {
      if (!t.completedAt) continue;
      const days = (t.completedAt.getTime() - t.createdAt.getTime()) / (1000 * 60 * 60 * 24);
      const week = getIsoWeek(t.completedAt);
      const arr = byWeek.get(week) ?? [];
      arr.push(days);
      byWeek.set(week, arr);
    }

    return [...byWeek.entries()]
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([week, days]) => ({
        week,
        averageDays: Math.round((days.reduce((s, d) => s + d, 0) / days.length) * 10) / 10,
      }));
  }
}

function isoDate(d: Date): string {
  return d.toISOString().slice(0, 10);
}

function getIsoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}
