import cors from "@fastify/cors";
import multipart from "@fastify/multipart";
import Fastify from "fastify";
import { PrismaClient } from "@prisma/client";
import { BoardsService } from "./services/boards.service";
import { TicketsService } from "./services/tickets.service";
import { CommentsService } from "./services/comments.service";
import { AttachmentsService } from "./services/attachments.service";
import { ReportsService } from "./services/reports.service";
import { apiRoutes } from "./routes";

export async function buildServer(prisma = new PrismaClient()) {
  const app = Fastify({ logger: true });

  await app.register(cors, { origin: true });
  await app.register(multipart, {
    limits: { fileSize: Number(process.env.MAX_ATTACHMENT_BYTES ?? 25 * 1024 * 1024) },
  });

  const attachmentsDir = process.env.ATTACHMENTS_DIR ?? "./storage/attachments";

  const boards = new BoardsService(prisma);
  const tickets = new TicketsService(prisma);
  const comments = new CommentsService(prisma);
  const attachments = new AttachmentsService(prisma, {
    dir: attachmentsDir,
    maxBytes: Number(process.env.MAX_ATTACHMENT_BYTES ?? 25 * 1024 * 1024),
  });
  const reports = new ReportsService(prisma);

  await apiRoutes(app, { boards, tickets, comments, attachments, reports });

  return app;
}

const port = Number(process.env.API_PORT ?? 3001);

buildServer()
  .then((app) => app.listen({ port, host: "0.0.0.0" }))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
