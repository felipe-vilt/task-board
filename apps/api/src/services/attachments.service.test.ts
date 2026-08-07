import { describe, expect, it } from "vitest";
import { AttachmentSchema } from "@task-board/schemas";

describe("AttachmentSchema", () => {
  const valid = {
    id: "11111111-1111-1111-1111-111111111111",
    ticketId: "22222222-2222-2222-2222-222222222222",
    filename: "relatorio.pdf",
    mimeType: "application/pdf",
    sizeBytes: 2048,
    createdAt: "2026-01-15T10:30:00.000Z",
  };

  it("parses valid attachment", () => {
    const parsed = AttachmentSchema.parse(valid);
    expect(parsed.filename).toBe("relatorio.pdf");
    expect(parsed.sizeBytes).toBe(2048);
  });

  it("rejects missing filename", () => {
    expect(() => AttachmentSchema.parse({ ...valid, filename: "" })).toThrow();
  });

  it("rejects invalid uuid", () => {
    expect(() => AttachmentSchema.parse({ ...valid, id: "nope" })).toThrow();
  });

  it("accepts metadata JSON shape", () => {
    expect(() => AttachmentSchema.parse(valid)).not.toThrow();
  });
});
