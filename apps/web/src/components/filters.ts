import { useFilterStore } from "../store/ui";
import type { Ticket } from "@task-board/schemas";

export function filterTickets(
  tickets: (Ticket & { tags?: { id: string }[] })[],
): (Ticket & { tags?: { id: string }[] })[] {
  const { search, tagIds, priority, overdueOnly } = useFilterStore.getState();

  return tickets.filter((ticket) => {
    if (search) {
      const q = search.toLowerCase();
      const matchesTitle = ticket.title.toLowerCase().includes(q);
      const matchesDesc = ticket.description?.toLowerCase().includes(q) ?? false;
      if (!matchesTitle && !matchesDesc) return false;
    }

    if (priority && ticket.priority !== priority) return false;

    if (tagIds.length > 0) {
      const ticketTagIds = ticket.tags?.map((t) => t.id) ?? [];
      const hasAll = tagIds.every((id) => ticketTagIds.includes(id));
      if (!hasAll) return false;
    }

    if (overdueOnly) {
      if (!ticket.dueDate) return false;
      if (ticket.completedAt) return false;
      if (new Date(ticket.dueDate) >= new Date()) return false;
    }

    return true;
  });
}
