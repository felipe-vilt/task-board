import { useDroppable } from "@dnd-kit/core";
import { SortableContext, verticalListSortingStrategy } from "@dnd-kit/sortable";
import { useState } from "react";
import type { Column, Ticket } from "@task-board/schemas";
import { TicketCard } from "./TicketCard";

interface ColumnProps {
  column: Column;
  tickets: Ticket[];
  tagsByTicket: Record<string, { id: string; name: string; color: string }[]>;
  allTags?: { id: string; name: string; color: string }[];
  onAddTicket: (columnId: string, title: string, cliente?: string) => void;
  onTagTicket?: (ticketId: string, tagId: string) => void;
  onOpenComments?: (ticketId: string) => void;
}

export function KanbanColumn({ column, tickets, tagsByTicket, allTags = [], onAddTicket, onTagTicket, onOpenComments }: ColumnProps) {
  const { setNodeRef, isOver } = useDroppable({
    id: column.id,
    data: { type: "column", column },
  });

  const [draft, setDraft] = useState("");
  const [clientDraft, setClientDraft] = useState("");

  const handleAdd = () => {
    const title = draft.trim();
    if (!title) return;
    onAddTicket(column.id, title, clientDraft.trim() || undefined);
    setDraft("");
    setClientDraft("");
  };

  return (
    <div
      className={`flex w-72 shrink-0 flex-col rounded-lg border ${isOver ? "border-blue-400 bg-blue-50/50" : "border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900"} transition-colors`}
    >
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-3 py-2">
        <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-200">{column.name}</h3>
        <span className="rounded-full bg-slate-200 px-2 py-0.5 text-xs font-medium text-slate-600 dark:text-slate-400">
          {tickets.length}
        </span>
      </div>

      <SortableContext items={tickets.map((t) => t.id)} strategy={verticalListSortingStrategy}>
        <div
          ref={setNodeRef}
          className="flex min-h-[80px] flex-1 flex-col gap-2 overflow-y-auto p-2"
        >
          {tickets.length === 0 && (
            <p className="py-4 text-center text-xs text-slate-400 dark:text-slate-500">
              Arraste tickets aqui
            </p>
          )}
          {tickets.map((ticket) => (
            <TicketCard
              key={ticket.id}
              ticket={ticket}
              tags={tagsByTicket[ticket.id] ?? []}
              allTags={allTags}
              onTag={onTagTicket}
              onOpenComments={onOpenComments}
            />
          ))}
        </div>
      </SortableContext>

      <div className="border-t border-slate-200 dark:border-slate-700 p-2 space-y-1.5">
        <input
          type="text"
          value={clientDraft}
          onChange={(e) => setClientDraft(e.target.value)}
          placeholder="Cliente (opcional)"
          className="w-full rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
        />
        <input
          type="text"
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleAdd();
          }}
          placeholder="+ Adicionar ticket"
          className="w-full rounded border border-slate-200 dark:border-slate-700 px-2 py-1.5 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:border-blue-400 focus:outline-none"
        />
      </div>
    </div>
  );
}
