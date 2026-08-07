import { MoveTicketSchema } from "@task-board/schemas";
import type { Prisma, PrismaClient } from "@prisma/client";

export class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export class TicketsService {
  constructor(private readonly prisma: PrismaClient) {}

  async move(input: unknown) {
    const data = MoveTicketSchema.parse(input);

    const ticket = await this.prisma.ticket.findUnique({
      where: { id: data.ticketId },
      include: { column: true },
    });
    if (!ticket) throw new ConflictError("ticket not found");

    const targetColumn = await this.prisma.column.findUnique({
      where: { id: data.targetColumnId },
    });
    if (!targetColumn) throw new ConflictError("target column not found");

    const position = await this.resolvePosition(data.targetColumnId, data.afterTicketId);

    const isCompleting = targetColumn.name === "Concluído";
    const isLeavingComplete = ticket.column.name === "Concluído";

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const updated = await tx.ticket.update({
        where: { id: data.ticketId },
        data: {
          columnId: data.targetColumnId,
          position,
          completedAt: isCompleting ? new Date() : isLeavingComplete ? null : undefined,
        },
      });

      await tx.auditLog.create({
        data: {
          ticketId: updated.id,
          event: "moved",
          fromColumn: ticket.columnId,
          toColumn: updated.columnId,
          metadata: {},
        },
      });

      return updated;
    });
  }

  private async resolvePosition(
    columnId: string,
    afterTicketId: string | null | undefined,
  ): Promise<number> {
    if (!afterTicketId) {
      const last = await this.prisma.ticket.findFirst({
        where: { columnId },
        orderBy: { position: "desc" },
      });
      return last ? last.position + 1 : 0;
    }

    const after = await this.prisma.ticket.findUnique({ where: { id: afterTicketId } });
    if (!after || after.columnId !== columnId) {
      throw new ConflictError("after ticket not in target column");
    }

    const next = await this.prisma.ticket.findFirst({
      where: { columnId, position: { gt: after.position } },
      orderBy: { position: "asc" },
    });

    return next ? (after.position + next.position) / 2 : after.position + 1;
  }
}
