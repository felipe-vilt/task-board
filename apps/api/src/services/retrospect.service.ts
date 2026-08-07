import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "./boards.service";

export interface TagMetric {
  tagId: string;
  tagName: string;
  color: string;
  count: number;
  avgLeadTimeDays: number | null;
}

export interface ColumnTime {
  columnId: string;
  columnName: string;
  avgHours: number;
}

export interface Insight {
  type: "warning" | "info" | "success";
  message: string;
}

export interface RetrospectData {
  periodDays: number;
  totalTickets: number;
  createdInPeriod: number;
  completedInPeriod: number;
  blockedInPeriod: number;
  avgLeadTimeDays: number | null;
  avgCycleTimeDays: number | null;
  tagMetrics: TagMetric[];
  columnTimes: ColumnTime[];
  insights: Insight[];
}

interface TicketWithTags {
  id: string;
  boardId: string;
  columnId: string;
  createdAt: Date;
  completedAt: Date | null;
  tags: { tag: { id: string; name: string; color: string } }[];
}

interface TagWithTickets {
  id: string;
  name: string;
  color: string;
  tickets: { ticket: { createdAt: Date; completedAt: Date | null } }[];
}

interface ColumnRef {
  id: string;
  name: string;
}

export class RetrospectService {
  constructor(private readonly prisma: PrismaClient) {}

  async generate(boardId: string, periodDays = 14): Promise<RetrospectData> {
    await this.assertBoardExists(boardId);

    const since = new Date(Date.now() - periodDays * 86400000);

    const [allTickets, createdInPeriod, tags, columns] = await Promise.all([
      this.prisma.ticket.findMany({
        where: { boardId },
        include: { tags: { include: { tag: true } } },
      }) as Promise<TicketWithTags[]>,
      this.prisma.ticket.count({
        where: { boardId, createdAt: { gte: since } },
      }),
      this.prisma.tag.findMany({
        where: { boardId },
        include: { tickets: { include: { ticket: true } } },
      }) as Promise<TagWithTickets[]>,
      this.prisma.column.findMany({ where: { boardId } }) as Promise<ColumnRef[]>,
    ]);

    const completedTickets = allTickets.filter((t) => t.completedAt);
    const completedInPeriod = completedTickets.filter(
      (t) => t.completedAt! >= since,
    ).length;

    const blockedInPeriod = allTickets.filter((t) => {
      if (t.completedAt) return false;
      const impedidoCol = columns.find((c) => c.name === "Impedido");
      return t.columnId === impedidoCol?.id && t.createdAt >= since;
    }).length;

    const leadTimes = completedTickets.map(
      (t) => (t.completedAt!.getTime() - t.createdAt.getTime()) / 86400000,
    );
    const avgLeadTime = leadTimes.length > 0 ? mean(leadTimes) : null;

    const tagMetrics: TagMetric[] = tags.map((tag) => {
      const completed = tag.tickets.filter((tt) => tt.ticket.completedAt);
      const times = completed.map(
        (tt) => (tt.ticket.completedAt!.getTime() - tt.ticket.createdAt.getTime()) / 86400000,
      );
      return {
        tagId: tag.id,
        tagName: tag.name,
        color: tag.color,
        count: tag.tickets.length,
        avgLeadTimeDays: times.length > 0 ? round(mean(times)) : null,
      };
    });

    const columnTimes: ColumnTime[] = columns.map((col) => ({
      columnId: col.id,
      columnName: col.name,
      avgHours: 0,
    }));

    const insights = this.buildInsights({
      total: allTickets.length,
      createdInPeriod,
      completedInPeriod,
      blockedInPeriod,
      avgLeadTime,
      tagMetrics,
    });

    return {
      periodDays,
      totalTickets: allTickets.length,
      createdInPeriod,
      completedInPeriod,
      blockedInPeriod,
      avgLeadTimeDays: avgLeadTime !== null ? round(avgLeadTime) : null,
      avgCycleTimeDays: avgLeadTime !== null ? round(avgLeadTime) : null,
      tagMetrics,
      columnTimes,
      insights,
    };
  }

  private buildInsights(data: {
    total: number;
    createdInPeriod: number;
    completedInPeriod: number;
    blockedInPeriod: number;
    avgLeadTime: number | null;
    tagMetrics: TagMetric[];
  }): Insight[] {
    const insights: Insight[] = [];

    if (data.createdInPeriod > 0 && data.completedInPeriod === 0) {
      insights.push({
        type: "warning",
        message: `${data.createdInPeriod} tickets criados no período, mas nenhum foi concluído.`,
      });
    }

    if (data.completedInPeriod > data.createdInPeriod) {
      insights.push({
        type: "success",
        message: `Equipe concluiu mais (${data.completedInPeriod}) do que criou (${data.createdInPeriod}).`,
      });
    }

    if (data.blockedInPeriod > 0) {
      insights.push({
        type: "warning",
        message: `${data.blockedInPeriod} tickets estão impedidos no período.`,
      });
    }

    if (data.avgLeadTime !== null && data.avgLeadTime > 7) {
      insights.push({
        type: "info",
        message: `Lead time médio de ${round(data.avgLeadTime)} dias. Considere quebrar tickets grandes.`,
      });
    }

    if (data.avgLeadTime !== null && data.avgLeadTime <= 3) {
      insights.push({
        type: "success",
        message: `Lead time médio de apenas ${round(data.avgLeadTime)} dias. Bom ritmo!`,
      });
    }

    const slowTag = data.tagMetrics
      .filter((t) => t.avgLeadTimeDays !== null && t.count >= 2)
      .sort((a, b) => (b.avgLeadTimeDays ?? 0) - (a.avgLeadTimeDays ?? 0))[0];

    if (slowTag && slowTag.avgLeadTimeDays && slowTag.avgLeadTimeDays > 5) {
      insights.push({
        type: "info",
        message: `Etiqueta "${slowTag.tagName}" tem lead time médio de ${slowTag.avgLeadTimeDays} dias.`,
      });
    }

    return insights;
  }

  private async assertBoardExists(boardId: string) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundError("board not found");
  }
}

function mean(arr: number[]): number {
  return arr.reduce((s, n) => s + n, 0) / arr.length;
}

function round(n: number): number {
  return Math.round(n * 10) / 10;
}
