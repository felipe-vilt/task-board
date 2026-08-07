import { describe, expect, it } from "vitest";
import { CreateTicketSchema } from "./entities";
import { PrioritySchema } from "./enums";

describe("PrioritySchema", () => {
  it("aceita valores válidos", () => {
    expect(PrioritySchema.parse("low")).toBe("low");
    expect(PrioritySchema.parse("urgent")).toBe("urgent");
  });

  it("rejeita valor inválido", () => {
    expect(() => PrioritySchema.parse("critical")).toThrow();
  });
});

describe("CreateTicketSchema", () => {
  const valid = {
    boardId: "11111111-1111-1111-1111-111111111111",
    columnId: "22222222-2222-2222-2222-222222222222",
    title: "Implementar drag-and-drop",
  };

  it("aplica defaults para campos opcionais", () => {
    const parsed = CreateTicketSchema.parse(valid);
    expect(parsed.priority).toBe("medium");
    expect(parsed.description).toBeUndefined();
  });

  it("exige title não vazio", () => {
    expect(() => CreateTicketSchema.parse({ ...valid, title: "" })).toThrow();
  });
});
