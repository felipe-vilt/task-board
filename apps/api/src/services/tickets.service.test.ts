import { describe, expect, it } from "vitest";
import { MoveTicketSchema } from "@task-board/schemas";

describe("MoveTicketSchema", () => {
  it("aceita payload mínimo", () => {
    const parsed = MoveTicketSchema.parse({
      ticketId: "11111111-1111-1111-1111-111111111111",
      targetColumnId: "22222222-2222-2222-2222-222222222222",
    });
    expect(parsed.afterTicketId).toBeUndefined();
  });

  it("rejeita uuid inválido", () => {
    expect(() =>
      MoveTicketSchema.parse({ ticketId: "not-a-uuid", targetColumnId: "22222222-2222-2222-2222-222222222222" }),
    ).toThrow();
  });
});
