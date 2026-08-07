import { CreateBoardSchema, CreateTicketSchema, UpdateTicketSchema, CreateTagSchema } from "@task-board/schemas";
import type { PrismaClient, Prisma } from "@prisma/client";

export class NotFoundError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "NotFoundError";
  }
}

export class BoardsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getById(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: { orderBy: { position: "asc" } },
        tags: { orderBy: { name: "asc" } },
      },
    });
    if (!board) throw new NotFoundError("board not found");
    return board;
  }

  async getFull(id: string) {
    const board = await this.prisma.board.findUnique({
      where: { id },
      include: {
        columns: {
          orderBy: { position: "asc" },
          include: {
            tickets: {
              orderBy: { position: "asc" },
              include: { tags: { include: { tag: true } } },
            },
          },
        },
        tags: { orderBy: { name: "asc" } },
      },
    });
    if (!board) throw new NotFoundError("board not found");
    return board;
  }

  list() {
    return this.prisma.board.findMany({
      orderBy: { createdAt: "asc" },
      include: { columns: { orderBy: { position: "asc" } } },
    });
  }

  async create(input: unknown) {
    const data = CreateBoardSchema.parse(input);
    const slug = `${data.name
      .toLowerCase()
      .normalize("NFKD")
      .replace(/[^\w\s-]/g, "")
      .trim()
      .replace(/[-\s]+/g, "-")}-${Date.now().toString(36)}`;

    return this.prisma.board.create({
      data: {
        name: data.name,
        description: data.description,
        slug,
        columns: {
          create: [
            { name: "Backlog", position: 0, isSystem: true },
            { name: "Executando", position: 1, isSystem: true },
            { name: "Impedido", position: 2, isSystem: true },
            { name: "Concluído", position: 3, isSystem: true },
          ],
        },
      },
      include: { columns: { orderBy: { position: "asc" } } },
    });
  }

  async createTicket(input: unknown) {
    const data = CreateTicketSchema.parse(input);

    const column = await this.prisma.column.findUnique({ where: { id: data.columnId } });
    if (!column || column.boardId !== data.boardId) {
      throw new NotFoundError("column not found in board");
    }

    const last = await this.prisma.ticket.findFirst({
      where: { columnId: data.columnId },
      orderBy: { position: "desc" },
    });

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const ticket = await tx.ticket.create({
        data: {
          boardId: data.boardId,
          columnId: data.columnId,
          title: data.title,
          description: data.description ?? null,
          priority: data.priority ?? "medium",
          assignee: data.assignee ?? null,
          dueDate: data.dueDate ?? null,
          position: last ? last.position + 1 : 0,
        },
      });

      await tx.auditLog.create({
        data: { ticketId: ticket.id, event: "created", toColumn: data.columnId, metadata: {} },
      });

      return ticket;
    });
  }

  async updateTicket(id: string, input: unknown) {
    const data = UpdateTicketSchema.parse(input);

    try {
      return await this.prisma.ticket.update({
        where: { id },
        data: {
          title: data.title,
          description: data.description,
          priority: data.priority,
          assignee: data.assignee,
          dueDate: data.dueDate,
        },
      });
    } catch {
      throw new NotFoundError("ticket not found");
    }
  }

  async deleteTicket(id: string) {
    try {
      await this.prisma.ticket.delete({ where: { id } });
    } catch {
      throw new NotFoundError("ticket not found");
    }
  }

  async createTag(input: unknown) {
    const data = CreateTagSchema.parse(input);
    const board = await this.prisma.board.findUnique({ where: { id: data.boardId } });
    if (!board) throw new NotFoundError("board not found");

    return this.prisma.tag.create({ data });
  }

  async tagTicket(ticketId: string, tagId: string) {
    const [ticket, tag] = await Promise.all([
      this.prisma.ticket.findUnique({ where: { id: ticketId } }),
      this.prisma.tag.findUnique({ where: { id: tagId } }),
    ]);
    if (!ticket || !tag || tag.boardId !== ticket.boardId) {
      throw new NotFoundError("ticket or tag not found");
    }

    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { tags: { connect: { id: tagId } } },
    });
  }

  async untagTicket(ticketId: string, tagId: string) {
    return this.prisma.ticket.update({
      where: { id: ticketId },
      data: { tags: { disconnect: { id: tagId } } },
    });
  }
}
