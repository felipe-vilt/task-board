import { useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { Ticket } from "@task-board/schemas";

interface Tag {
  id: string;
  name: string;
  color: string;
}

interface TicketCardProps {
  ticket: Ticket;
  tags: Tag[];
  allTags?: Tag[];
  onTag?: (ticketId: string, tagId: string) => void;
  onOpenComments?: (ticketId: string) => void;
}

const priorityBadge: Record<string, string> = {
  low: "bg-slate-100 text-slate-700",
  medium: "bg-blue-100 text-blue-700",
  high: "bg-amber-100 text-amber-700",
  urgent: "bg-red-100 text-red-700",
};

export function TicketCard({ ticket, tags, allTags = [], onTag, onOpenComments }: TicketCardProps) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: ticket.id,
    data: { type: "ticket", columnId: ticket.columnId, ticket },
  });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const isOverdue =
    ticket.dueDate &&
    !ticket.completedAt &&
    new Date(ticket.dueDate) < new Date();

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className={`group cursor-grab rounded-md border bg-white p-3 shadow-sm transition hover:shadow-md active:cursor-grabbing dark:bg-slate-800 dark:border-slate-700 ${
        isOverdue
          ? "border-red-300 ring-1 ring-red-200 dark:border-red-500 dark:ring-red-900"
          : "border-slate-200 hover:border-slate-300 dark:border-slate-700 dark:hover:border-slate-600"
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <h4 className="text-sm font-medium text-slate-900">{ticket.title}</h4>
        <span
          className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide ${priorityBadge[ticket.priority] ?? priorityBadge.medium}`}
        >
          {ticket.priority}
        </span>
      </div>

      {tags.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-1">
          {tags.map((tag) => (
            <span
              key={tag.id}
              className="rounded-full px-2 py-0.5 text-[10px] font-medium text-white"
              style={{ backgroundColor: tag.color }}
            >
              {tag.name}
            </span>
          ))}
        </div>
      )}

      {ticket.assignee && (
        <p className="mt-2 text-xs text-slate-500">@{ticket.assignee}</p>
      )}

      {ticket.dueDate && (
        <p className={`mt-1 text-xs ${isOverdue ? "font-medium text-red-600" : "text-slate-500"}`}>
          {isOverdue && "⚠ "}
          {new Date(ticket.dueDate).toLocaleDateString("pt-BR")}
        </p>
      )}

      {(onOpenComments || (onTag && allTags.length > 0)) && (
        <div className="mt-2 flex items-center gap-2">
          {onTag && allTags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {allTags
                .filter((t) => !tags.some((existing) => existing.id === t.id))
                .slice(0, 3)
                .map((tag) => (
                  <button
                    key={tag.id}
                    onClick={() => onTag(ticket.id, tag.id)}
                    className="rounded-full px-1.5 py-0.5 text-[10px] text-white opacity-50 hover:opacity-100"
                    style={{ backgroundColor: tag.color }}
                    title={`Adicionar ${tag.name}`}
                  >
                    +{tag.name}
                  </button>
                ))}
            </div>
          )}
          {onOpenComments && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onOpenComments(ticket.id);
              }}
              className="ml-auto text-xs text-blue-600 hover:underline"
            >
              Detalhes
            </button>
          )}
        </div>
      )}
    </div>
  );
}
