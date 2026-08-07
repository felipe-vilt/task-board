import type { PrismaClient } from "@prisma/client";
import { NotFoundError } from "./boards.service";

interface AutomationInput {
  name: string;
  trigger: string;
  conditionField: string;
  conditionOp: string;
  conditionValue?: string | null;
  action: string;
  actionParams: string;
  enabled?: boolean;
}

export class AutomationService {
  constructor(private readonly prisma: PrismaClient) {}

  async list(boardId: string) {
    return this.prisma.automationRule.findMany({
      where: { boardId },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(boardId: string, input: AutomationInput) {
    const board = await this.prisma.board.findUnique({ where: { id: boardId } });
    if (!board) throw new NotFoundError("board not found");

    return this.prisma.automationRule.create({
      data: { ...input, boardId },
    });
  }

  async update(id: string, boardId: string, input: Partial<AutomationInput>) {
    const existing = await this.prisma.automationRule.findUnique({ where: { id } });
    if (!existing || existing.boardId !== boardId) throw new NotFoundError("rule not found");

    return this.prisma.automationRule.update({
      where: { id },
      data: input,
    });
  }

  async delete(id: string, boardId: string) {
    const existing = await this.prisma.automationRule.findUnique({ where: { id } });
    if (!existing || existing.boardId !== boardId) throw new NotFoundError("rule not found");

    await this.prisma.automationRule.delete({ where: { id } });
  }

  async runDueDateRules(boardId: string) {
    const rules = await this.prisma.automationRule.findMany({
      where: { boardId, enabled: true, trigger: "due_date_passed" },
      include: { board: { include: { columns: true } } },
    });

    const now = new Date();
    const tickets = await this.prisma.ticket.findMany({
      where: { boardId, dueDate: { lt: now }, completedAt: null },
    });

    let triggered = 0;
    for (const ticket of tickets) {
      for (const rule of rules) {
        if (this.matchesCondition(ticket, rule)) {
          await this.executeAction(ticket, rule);
          triggered++;
        }
      }
    }

    return { triggered };
  }

  async runForTicket(ticketId: string, trigger: "ticket_created" | "field_changed") {
    const ticket = await this.prisma.ticket.findUnique({
      where: { id: ticketId },
      include: { board: { include: { columns: true, tags: true, automationRules: true } } },
    });
    if (!ticket) return { triggered: 0 };

    const rules = ticket.board.automationRules.filter(
      (r: { enabled: boolean; trigger: string }) => r.enabled && r.trigger === trigger,
    );

    let triggered = 0;
    for (const rule of rules) {
      if (this.matchesCondition(ticket, rule)) {
        await this.executeAction(ticket, rule);
        triggered++;
      }
    }

    return { triggered };
  }

  private matchesCondition(
    ticket: Record<string, unknown>,
    rule: { conditionField: string; conditionOp: string; conditionValue: string | null },
  ): boolean {
    const value = ticket[rule.conditionField];
    const target = rule.conditionValue;

    switch (rule.conditionOp) {
      case "equals":
        return value === target;
      case "not_equals":
        return value !== target;
      case "is_empty":
        return value === null || value === undefined || value === "";
      case "is_not_empty":
        return value !== null && value !== undefined && value !== "";
      case "contains":
        return String(value).includes(String(target));
      default:
        return false;
    }
  }

  private async executeAction(
    ticket: { id: string; boardId: string },
    rule: { action: string; actionParams: string },
  ) {
    const params = JSON.parse(rule.actionParams) as Record<string, string>;

    switch (rule.action) {
      case "move_to_column": {
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: {
            columnId: params.columnId,
            completedAt: params.completedAt === "true" ? new Date() : undefined,
          },
        });
        break;
      }
      case "set_field": {
        const update: Record<string, unknown> = {};
        update[String(params.field)] = params.value;
        await (this.prisma.ticket.update as (args: { where: { id: string }; data: Record<string, unknown> }) => Promise<unknown>)({
          where: { id: ticket.id },
          data: update,
        });
        break;
      }
      case "add_tag": {
        await this.prisma.ticket.update({
          where: { id: ticket.id },
          data: { tags: { connect: { id: params.tagId } } },
        });
        break;
      }
    }

    await this.prisma.auditLog.create({
      data: {
        ticketId: ticket.id,
        event: "updated",
        metadata: { automation: rule.action, params },
      },
    });
  }
}
