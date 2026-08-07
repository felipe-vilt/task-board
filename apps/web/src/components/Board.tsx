import {
  DndContext,
  DragOverlay,
  PointerSensor,
  KeyboardSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragStartEvent,
} from "@dnd-kit/core";
import { sortableKeyboardCoordinates } from "@dnd-kit/sortable";
import { useMemo, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type BoardDetail } from "../api/client";
import { useFilterStore } from "../store/ui";
import { KanbanColumn } from "./Column";
import { TicketCard } from "./TicketCard";
import { FilterBar } from "./FilterBar";
import { filterTickets } from "./filters";
import { TicketDetail } from "./ticket/TicketDetail";
import { ReportsDashboard } from "./reports/ReportsDashboard";
import { AutomationPanel } from "./automation/AutomationPanel";
import { useKeyboardShortcuts } from "../hooks/useKeyboardShortcuts";
import { useToastStore } from "../store/toast";
import type { Ticket } from "@task-board/schemas";

type ViewMode = "kanban" | "reports" | "automation";

export function Board({ boardId }: { boardId: string }) {
  const { data, isLoading, error } = useQuery({
    queryKey: ["board", boardId],
    queryFn: () => api.getBoard(boardId),
  });

  const queryClient = useQueryClient();
  const [activeTicket, setActiveTicket] = useState<Ticket | null>(null);
  const [selectedTicketId, setSelectedTicketId] = useState<string | null>(null);
  const [view, setView] = useState<ViewMode>("kanban");
  const showToast = useToastStore((s) => s.show);

  const moveMutation = useMutation({
    mutationFn: api.moveTicket,
    onSuccess: () => {
      showToast("Ticket movido", "success");
      return queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    onError: () => showToast("Erro ao mover ticket", "error"),
  });

  const addTicketMutation = useMutation({
    mutationFn: api.createTicket,
    onSuccess: () => {
      showToast("Ticket criado", "success");
      return queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
    onError: () => showToast("Erro ao criar ticket", "error"),
  });

  const tagMutation = useMutation({
    mutationFn: ({ ticketId, tagId }: { ticketId: string; tagId: string }) =>
      api.tagTicket(ticketId, tagId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", boardId] }),
  });

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  useKeyboardShortcuts([
    { key: "?", ctrl: true, handler: () => showToast("Atalhos: N = novo ticket | ? = ajuda", "info") },
  ]);

  const allTags = useMemo(() => (data ? data.tags.map((t) => ({ ...t })) : []), [data]);

  const tagsByTicket = useMemo(() => {
    const map: Record<string, { id: string; name: string; color: string }[]> = {};
    if (!data) return map;
    for (const col of data.columns) {
      for (const ticket of col.tickets) {
        map[ticket.id] = ticket.tags.map((t) => ({
          id: t.tag.id,
          name: t.tag.name,
          color: t.tag.color,
        }));
      }
    }
    return map;
  }, [data]);

  const filteredColumns = useMemo(() => {
    if (!data) return [];
    return data.columns.map((col) => ({
      ...col,
      tickets: filterTickets(
        col.tickets.map((t) => ({
          ...t,
          tags: t.tags.map((tt) => ({ id: tt.tag.id })),
        })),
      ),
    }));
  }, [data]);

  if (isLoading) return <p className="p-8 text-slate-500 dark:text-slate-400">Carregando…</p>;
  if (error) return <p className="p-8 text-red-600">Erro ao carregar board.</p>;
  if (!data) return null;

  const handleDragStart = (event: DragStartEvent) => {
    const ticket = data.columns
      .flatMap((c) => c.tickets)
      .find((t) => t.id === event.active.id);
    setActiveTicket(ticket ?? null);
  };

  const handleDragEnd = (event: DragEndEvent) => {
    setActiveTicket(null);
    const { active, over } = event;
    if (!over) return;

    const activeTicketId = String(active.id);
    const overId = String(over.id);

    const overColumn = data.columns.find((c) => c.id === overId);
    if (overColumn) {
      const sourceColumn = data.columns.find((c) => c.tickets.some((t) => t.id === activeTicketId));
      if (sourceColumn?.id === overColumn.id) return;
      moveMutation.mutate({ ticketId: activeTicketId, targetColumnId: overColumn.id });
      return;
    }

    const overTicket = data.columns.flatMap((c) => c.tickets).find((t) => t.id === overId);
    if (overTicket) {
      const sourceColumn = data.columns.find((c) => c.tickets.some((t) => t.id === activeTicketId));
      if (sourceColumn?.id === overTicket.columnId && activeTicketId === overId) return;
      moveMutation.mutate({
        ticketId: activeTicketId,
        targetColumnId: overTicket.columnId,
        afterTicketId: overId,
      });
    }
  };

  return (
    <>
      <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 px-4 py-2">
        <FilterBar boardId={boardId} tags={allTags} />
        <div className="flex gap-1">
          <button
            onClick={() => setView("kanban")}
            className={`rounded px-3 py-1 text-sm ${view === "kanban" ? "bg-blue-600 text-white" : "text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800"}`}
          >
            Kanban
          </button>
          <button
            onClick={() => setView("reports")}
            className={`rounded px-3 py-1 text-sm ${view === "reports" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}
          >
            Relatórios
          </button>
          <button
            onClick={() => setView("automation")}
            className={`rounded px-3 py-1 text-sm ${view === "automation" ? "bg-blue-600 text-white" : "text-slate-600 hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-800"}`}
          >
            Automações
          </button>
        </div>
      </div>

      {view === "automation" ? (
        <AutomationPanel boardId={boardId} board={data} />
      ) : view === "reports" ? (
        <ReportsDashboard boardId={boardId} />
      ) : (
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="flex gap-4 overflow-x-auto p-4">
          {filteredColumns.map((column) => (
            <KanbanColumn
              key={column.id}
              column={column}
              tickets={column.tickets}
              tagsByTicket={tagsByTicket}
              allTags={allTags}
              onAddTicket={(columnId, title) =>
                addTicketMutation.mutate({ boardId, columnId, title })
              }
              onTagTicket={(ticketId, tagId) => tagMutation.mutate({ ticketId, tagId })}
              onOpenComments={setSelectedTicketId}
            />
          ))}
        </div>
        <DragOverlay>
          {activeTicket ? (
            <TicketCard ticket={activeTicket} tags={tagsByTicket[activeTicket.id] ?? []} />
          ) : null}
        </DragOverlay>
      </DndContext>
      )}
      {selectedTicketId && (
        <TicketDetail
          ticketId={selectedTicketId}
          boardId={boardId}
          onClose={() => setSelectedTicketId(null)}
        />
      )}
    </>
  );
}
