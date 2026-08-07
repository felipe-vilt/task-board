import { describe, expect, it } from "vitest";
import { CreateCommentSchema, CreateTicketSchema } from "@task-board/schemas";

describe("CreateCommentSchema", () => {
  it("requires non-empty body", () => {
    expect(() =>
      CreateCommentSchema.parse({
        ticketId: "11111111-1111-1111-1111-111111111111",
        body: "",
      }),
    ).toThrow();
  });

  it("accepts valid input", () => {
    const parsed = CreateCommentSchema.parse({
      ticketId: "11111111-1111-1111-1111-111111111111",
      body: "Comentário de teste",
    });
    expect(parsed.body).toBe("Comentário de teste");
  });

  it("rejects missing ticketId", () => {
    expect(() => CreateCommentSchema.parse({ body: "oi" })).toThrow();
  });
});

describe("CreateTicketSchema", () => {
  const valid = {
    boardId: "11111111-1111-1111-1111-111111111111",
    columnId: "22222222-2222-2222-2222-222222222222",
    title: "Título",
  };

  it("defaults priority to medium", () => {
    expect(CreateTicketSchema.parse(valid).priority).toBe("medium");
  });

  it("accepts dueDate string", () => {
    const parsed = CreateTicketSchema.parse({ ...valid, dueDate: "2026-12-31" });
    expect(parsed.dueDate).toBeInstanceOf(Date);
  });

  it("accepts assignee", () => {
    const parsed = CreateTicketSchema.parse({ ...valid, assignee: "felipe" });
    expect(parsed.assignee).toBe("felipe");
  });
});
