import { CreateCommentSchema } from "@task-board/schemas";
import type { Prisma, PrismaClient } from "@prisma/client";
import { NotFoundError } from "./boards.service";

export class CommentsService {
  constructor(private readonly prisma: PrismaClient) {}

  async listByTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError("ticket not found");

    return this.prisma.comment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(input: unknown) {
    const data = CreateCommentSchema.parse(input);

    const ticket = await this.prisma.ticket.findUnique({ where: { id: data.ticketId } });
    if (!ticket) throw new NotFoundError("ticket not found");

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const comment = await tx.comment.create({ data });

      await tx.auditLog.create({
        data: {
          ticketId: data.ticketId,
          event: "commented",
          metadata: { commentId: comment.id },
        },
      });

      return comment;
    });
  }

  async update(id: string, body: string) {
    if (!body.trim()) throw new Error("body cannot be empty");
    try {
      return await this.prisma.comment.update({ where: { id }, data: { body } });
    } catch {
      throw new NotFoundError("comment not found");
    }
  }

  async delete(id: string) {
    try {
      await this.prisma.comment.delete({ where: { id } });
    } catch {
      throw new NotFoundError("comment not found");
    }
  }
}
