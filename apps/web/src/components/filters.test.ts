import { beforeEach, describe, expect, it } from "vitest";
import { filterTickets } from "./filters";
import { useFilterStore } from "../store/ui";
import type { Ticket } from "@task-board/schemas";

const base: Omit<Ticket, "title"> = {
  id: "t1",
  boardId: "b1",
  columnId: "c1",
  description: null,
  priority: "medium",
  assignee: null,
  dueDate: null,
  position: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
  completedAt: null,
};

function makeTicket(overrides: Partial<Ticket> & { tags?: { id: string }[] }): Ticket & { tags: { id: string }[] } {
  return { ...base, title: "default", tags: [], ...overrides } as never;
}

describe("filterTickets", () => {
  beforeEach(() => {
    useFilterStore.getState().reset();
  });

  it("returns all when no filters", () => {
    const tickets = [makeTicket({ id: "a" }), makeTicket({ id: "b" })];
    expect(filterTickets(tickets)).toHaveLength(2);
  });

  it("filters by search in title", () => {
    useFilterStore.getState().setSearch("urgente");
    const tickets = [
      makeTicket({ id: "a", title: "Tarefa urgente" }),
      makeTicket({ id: "b", title: "Outra coisa" }),
    ];
    const result = filterTickets(tickets);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("a");
  });

  it("filters by search in description", () => {
    useFilterStore.getState().setSearch("alpha");
    const tickets = [
      makeTicket({ id: "a", title: "A", description: "project alpha" }),
      makeTicket({ id: "b", title: "B", description: "project beta" }),
    ];
    const result = filterTickets(tickets);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("a");
  });

  it("filters by priority", () => {
    useFilterStore.getState().setPriority("high");
    const tickets = [
      makeTicket({ id: "a", priority: "high" }),
      makeTicket({ id: "b", priority: "low" }),
    ];
    const result = filterTickets(tickets);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("a");
  });

  it("filters by tags with AND logic", () => {
    useFilterStore.getState().toggleTag("tag1");
    useFilterStore.getState().toggleTag("tag2");
    const tickets = [
      makeTicket({ id: "a", tags: [{ id: "tag1" }, { id: "tag2" }] }),
      makeTicket({ id: "b", tags: [{ id: "tag1" }] }),
    ];
    const result = filterTickets(tickets);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("a");
  });

  it("filters overdue tickets", () => {
    useFilterStore.getState().toggleOverdue();
    const yesterday = new Date(Date.now() - 86400000);
    const tomorrow = new Date(Date.now() + 86400000);
    const tickets = [
      makeTicket({ id: "a", dueDate: yesterday, completedAt: null }),
      makeTicket({ id: "b", dueDate: tomorrow, completedAt: null }),
      makeTicket({ id: "c", dueDate: yesterday, completedAt: new Date() }),
    ];
    const result = filterTickets(tickets);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("a");
  });

  it("combines search + priority", () => {
    useFilterStore.getState().setSearch("bug");
    useFilterStore.getState().setPriority("urgent");
    const tickets = [
      makeTicket({ id: "a", title: "bug no login", priority: "urgent" }),
      makeTicket({ id: "b", title: "bug no login", priority: "low" }),
      makeTicket({ id: "c", title: "feature nova", priority: "urgent" }),
    ];
    const result = filterTickets(tickets);
    expect(result).toHaveLength(1);
    expect(result[0]?.id).toBe("a");
  });
});
