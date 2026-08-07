import type { FastifyInstance } from "fastify";
import { BoardsService, NotFoundError } from "../services/boards.service";
import { ConflictError, TicketsService } from "../services/tickets.service";
import { CommentsService } from "../services/comments.service";
import { AttachmentsService } from "../services/attachments.service";
import { ReportsService } from "../services/reports.service";
import { AutomationService } from "../services/automation.service";

export async function apiRoutes(
  app: FastifyInstance,
  deps: {
    boards: BoardsService;
    tickets: TicketsService;
    comments: CommentsService;
    attachments: AttachmentsService;
    reports: ReportsService;
    automation: AutomationService;
  },
): Promise<void> {
  app.get("/health", async () => ({ status: "ok" }));

  app.get("/boards", async () => deps.boards.list());

  app.post("/boards", async (request, reply) => {
    const board = await deps.boards.create(request.body);
    return reply.code(201).send(board);
  });

  app.get("/boards/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await deps.boards.getFull(id);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.post("/boards/:boardId/tickets", async (request, reply) => {
    const { boardId } = request.params as { boardId: string };
    try {
      const ticket = await deps.boards.createTicket({ ...(request.body as object), boardId });
      return reply.code(201).send(ticket);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.patch("/tickets/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      return await deps.boards.updateTicket(id, request.body);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.delete("/tickets/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await deps.boards.deleteTicket(id);
      return reply.code(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.patch("/tickets/move", async (request, reply) => {
    try {
      return await deps.tickets.move(request.body);
    } catch (err) {
      if (err instanceof ConflictError) return reply.code(409).send({ error: err.message });
      throw err;
    }
  });

  app.post("/boards/:boardId/tags", async (request, reply) => {
    const { boardId } = request.params as { boardId: string };
    try {
      const tag = await deps.boards.createTag({ ...(request.body as object), boardId });
      return reply.code(201).send(tag);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.post("/tickets/:ticketId/tags/:tagId", async (request, reply) => {
    const { ticketId, tagId } = request.params as { ticketId: string; tagId: string };
    try {
      return await deps.boards.tagTicket(ticketId, tagId);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.delete("/tickets/:ticketId/tags/:tagId", async (request, reply) => {
    const { ticketId, tagId } = request.params as { ticketId: string; tagId: string };
    try {
      return await deps.boards.untagTicket(ticketId, tagId);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.get("/tickets/:ticketId/comments", async (request, reply) => {
    const { ticketId } = request.params as { ticketId: string };
    try {
      return await deps.comments.listByTicket(ticketId);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.post("/tickets/:ticketId/comments", async (request, reply) => {
    const { ticketId } = request.params as { ticketId: string };
    try {
      const comment = await deps.comments.create({ ...(request.body as object), ticketId });
      return reply.code(201).send(comment);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.patch("/comments/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    const { body } = request.body as { body: string };
    try {
      return await deps.comments.update(id, body);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.delete("/comments/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await deps.comments.delete(id);
      return reply.code(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.get("/tickets/:ticketId/attachments", async (request, reply) => {
    const { ticketId } = request.params as { ticketId: string };
    try {
      return await deps.attachments.listByTicket(ticketId);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.post("/tickets/:ticketId/attachments", async (request, reply) => {
    const { ticketId } = request.params as { ticketId: string };
    try {
      const file = await request.file();
      if (!file) return reply.code(400).send({ error: "no file uploaded" });

      const chunks: Buffer[] = [];
      for await (const chunk of file.file) {
        chunks.push(chunk as Buffer);
      }
      if (file.file.truncated) {
        return reply.code(413).send({ error: "file too large" });
      }

      const attachment = await deps.attachments.create(ticketId, {
        filename: file.filename,
        mime: file.mimetype,
        content: Buffer.concat(chunks),
      });
      return reply.code(201).send(attachment);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.get("/attachments/:id/download", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      const { attachment, stream } = await deps.attachments.getReadable(id);
      reply.header("Content-Disposition", `attachment; filename="${attachment.filename}"`);
      reply.type(attachment.mimeType);
      return reply.send(stream);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.delete("/attachments/:id", async (request, reply) => {
    const { id } = request.params as { id: string };
    try {
      await deps.attachments.delete(id);
      return reply.code(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.get("/boards/:boardId/reports/cfd", async (request, reply) => {
    const { boardId } = request.params as { boardId: string };
    try {
      return await deps.reports.cfd(boardId);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.get("/boards/:boardId/reports/velocity", async (request, reply) => {
    const { boardId } = request.params as { boardId: string };
    try {
      return await deps.reports.velocity(boardId);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.get("/boards/:boardId/reports/leadtime", async (request, reply) => {
    const { boardId } = request.params as { boardId: string };
    try {
      return await deps.reports.leadTime(boardId);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.get("/boards/:boardId/automations", async (request, reply) => {
    const { boardId } = request.params as { boardId: string };
    try {
      return await deps.automation.list(boardId);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.post("/boards/:boardId/automations", async (request, reply) => {
    const { boardId } = request.params as { boardId: string };
    try {
      const rule = await deps.automation.create(boardId, request.body as never);
      return reply.code(201).send(rule);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.patch("/boards/:boardId/automations/:id", async (request, reply) => {
    const { boardId, id } = request.params as { boardId: string; id: string };
    try {
      return await deps.automation.update(id, boardId, request.body as never);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.delete("/boards/:boardId/automations/:id", async (request, reply) => {
    const { boardId, id } = request.params as { boardId: string; id: string };
    try {
      await deps.automation.delete(id, boardId);
      return reply.code(204).send();
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });

  app.post("/boards/:boardId/automations/run-due-date", async (request, reply) => {
    const { boardId } = request.params as { boardId: string };
    try {
      const result = await deps.automation.runDueDateRules(boardId);
      return reply.send(result);
    } catch (err) {
      if (err instanceof NotFoundError) return reply.code(404).send({ error: err.message });
      throw err;
    }
  });
}
