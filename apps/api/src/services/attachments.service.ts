import { randomUUID } from "node:crypto";
import { createReadStream } from "node:fs";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { extname, join, resolve } from "node:path";
import { NotFoundError } from "./boards.service";
import type { PrismaClient } from "@prisma/client";

const ALLOWED_MIME = new Set([
  "image/png",
  "image/jpeg",
  "image/gif",
  "image/webp",
  "application/pdf",
  "text/plain",
  "text/markdown",
  "application/zip",
  "application/json",
]);

export class AttachmentsService {
  constructor(
    private readonly prisma: PrismaClient,
    private readonly config: { dir: string; maxBytes: number },
  ) {}

  async listByTicket(ticketId: string) {
    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError("ticket not found");

    return this.prisma.attachment.findMany({
      where: { ticketId },
      orderBy: { createdAt: "asc" },
    });
  }

  async create(ticketId: string, file: { filename: string; mime: string; content: Buffer }) {
    if (!ALLOWED_MIME.has(file.mime)) {
      throw new Error("unsupported file type");
    }
    if (file.content.byteLength > this.config.maxBytes) {
      throw new Error("file too large");
    }

    const ticket = await this.prisma.ticket.findUnique({ where: { id: ticketId } });
    if (!ticket) throw new NotFoundError("ticket not found");

    const id = randomUUID();
    const ext = extname(file.filename);
    const safeName = `${id}${ext}`;
    const relDir = join(ticketId);
    const absDir = resolve(this.config.dir, relDir);
    await mkdir(absDir, { recursive: true });

    const storageKey = join(relDir, safeName);
    await writeFile(resolve(this.config.dir, storageKey), file.content);

    return this.prisma.attachment.create({
      data: {
        id,
        ticketId,
        filename: file.filename,
        mimeType: file.mime,
        sizeBytes: file.content.byteLength,
        storageKey,
      },
    });
  }

  async getReadable(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundError("attachment not found");
    return { attachment, stream: createReadStream(resolve(this.config.dir, attachment.storageKey)) };
  }

  async delete(id: string) {
    const attachment = await this.prisma.attachment.findUnique({ where: { id } });
    if (!attachment) throw new NotFoundError("attachment not found");

    await unlink(resolve(this.config.dir, attachment.storageKey)).catch(() => {});
    await this.prisma.attachment.delete({ where: { id } });
  }
}
