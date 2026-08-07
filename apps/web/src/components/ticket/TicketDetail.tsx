import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Comment } from "@task-board/schemas";
import { AttachmentsList } from "./AttachmentsList";

interface TicketDetailProps {
  ticketId: string;
  boardId: string;
  onClose: () => void;
}

export function TicketDetail({ ticketId, boardId, onClose }: TicketDetailProps) {
  const queryClient = useQueryClient();
  const [draft, setDraft] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [assignee, setAssignee] = useState("");
  const [editingAssignee, setEditingAssignee] = useState(false);

  const { data: comments, isLoading } = useQuery({
    queryKey: ["comments", ticketId],
    queryFn: () => api.listComments(ticketId),
  });

  const createMutation = useMutation({
    mutationFn: (body: string) => api.createComment(ticketId, body),
    onSuccess: () => {
      setDraft("");
      return queryClient.invalidateQueries({ queryKey: ["comments", ticketId] });
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: string }) => api.updateComment(id, body),
    onSuccess: () => {
      setEditingId(null);
      return queryClient.invalidateQueries({ queryKey: ["comments", ticketId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteComment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["comments", ticketId] }),
  });

  const assigneeMutation = useMutation({
    mutationFn: (assignee: string) => api.updateTicket(ticketId, { assignee }),
    onSuccess: () => {
      setEditingAssignee(false);
      return queryClient.invalidateQueries({ queryKey: ["board", boardId] });
    },
  });

  const handleCreate = () => {
    const body = draft.trim();
    if (!body) return;
    createMutation.mutate(body);
  };

  const handleSaveEdit = (id: string) => {
    const body = editBody.trim();
    if (!body) return;
    updateMutation.mutate({ id, body });
  };

  const handleSaveAssignee = () => {
    assigneeMutation.mutate(assignee.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="flex max-h-[90vh] w-full max-w-lg flex-col rounded-lg bg-white dark:bg-slate-800 p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-slate-200 dark:border-slate-700 pb-2">
          <h2 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Detalhes</h2>
          <button onClick={onClose} className="text-slate-500 dark:text-slate-400 hover:text-slate-700">
            ✕
          </button>
        </div>

        <div className="flex-1 overflow-y-auto pt-3">
          <section>
            <label className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">
              Responsável
            </label>
            {editingAssignee ? (
              <div className="mt-1 flex gap-2">
                <input
                  type="text"
                  value={assignee}
                  onChange={(e) => setAssignee(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleSaveAssignee();
                    if (e.key === "Escape") setEditingAssignee(false);
                  }}
                  autoFocus
                  placeholder="Digite o nome"
                  className="flex-1 rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
                />
                <button onClick={handleSaveAssignee} className="text-xs text-blue-600">
                  Salvar
                </button>
                <button onClick={() => setEditingAssignee(false)} className="text-xs text-slate-500 dark:text-slate-400">
                  Cancelar
                </button>
              </div>
            ) : (
              <p
                onClick={() => setEditingAssignee(true)}
                className="mt-1 cursor-pointer text-sm text-slate-700 dark:text-slate-300 hover:text-blue-600"
              >
                {assignee || "— clique para definir —"}
              </p>
            )}
          </section>

          <section className="mt-4">
            <h3 className="text-sm font-medium text-slate-700 dark:text-slate-300">Comentários</h3>
            {isLoading ? (
              <p className="py-2 text-sm text-slate-500 dark:text-slate-400">Carregando…</p>
            ) : (
              <ul className="mt-2 space-y-2">
                {comments?.map((comment) => (
                  <li key={comment.id} className="rounded border border-slate-200 dark:border-slate-700 p-2">
                    {editingId === comment.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editBody}
                          onChange={(e) => setEditBody(e.target.value)}
                          className="w-full rounded border border-slate-200 dark:border-slate-700 p-2 text-sm focus:border-blue-400 focus:outline-none"
                          rows={3}
                        />
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleSaveEdit(comment.id)}
                            className="rounded bg-blue-600 px-2 py-1 text-xs text-white"
                          >
                            Salvar
                          </button>
                          <button
                            onClick={() => setEditingId(null)}
                            className="text-xs text-slate-500 dark:text-slate-400"
                          >
                            Cancelar
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <p className="whitespace-pre-wrap text-sm text-slate-800 dark:text-slate-200">{comment.body}</p>
                        <div className="mt-1 flex items-center justify-between">
                          <span className="text-xs text-slate-400">
                            {new Date(comment.createdAt).toLocaleString("pt-BR")}
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingId(comment.id);
                                setEditBody(comment.body);
                              }}
                              className="text-xs text-blue-600 hover:underline"
                            >
                              Editar
                            </button>
                            <button
                              onClick={() => deleteMutation.mutate(comment.id)}
                              className="text-xs text-red-600 hover:underline"
                            >
                              Excluir
                            </button>
                          </div>
                        </div>
                      </>
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Adicionar comentário…"
                rows={2}
                className="w-full rounded-md border border-slate-200 dark:border-slate-700 p-2 text-sm focus:border-blue-400 focus:outline-none"
              />
              <div className="mt-2 flex justify-end">
                <button
                  onClick={handleCreate}
                  disabled={!draft.trim()}
                  className="rounded-md bg-blue-600 px-3 py-1.5 text-sm text-white disabled:opacity-50"
                >
                  Comentar
                </button>
              </div>
            </div>
          </section>

          <AttachmentsList ticketId={ticketId} />
        </div>
      </div>
    </div>
  );
}
