import { z } from "zod";
import {
  BoardSchema,
  ColumnSchema,
  TicketSchema,
  TagSchema,
  CommentSchema,
  AttachmentSchema,
} from "@task-board/schemas";
import type { Board, Column, Ticket, Tag, Comment, Attachment } from "@task-board/schemas";
import type { CfdPoint, VelocityPoint, LeadTimePoint } from "../types/reports";
import type { AutomationRule } from "../types/automation";
import type { RetrospectData } from "../types/retrospect";

const API_URL = import.meta.env.VITE_API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { "Content-Type": "application/json" },
    ...init,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error ?? `request failed: ${res.status}`);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

export const api = {
  listBoards: () => request<Board[]>("/boards"),
  getBoard: (id: string) => request<BoardDetail>(`/boards/${id}`),
  createBoard: (input: { name: string; description?: string }) =>
    request<Board>("/boards", { method: "POST", body: JSON.stringify(input) }),

  createTicket: (input: {
    boardId: string;
    columnId: string;
    title: string;
    description?: string;
    priority?: string;
    assignee?: string;
    cliente?: string;
  }) => request<Ticket>(`/boards/${input.boardId}/tickets`, {
    method: "POST",
    body: JSON.stringify(input),
  }),

  updateTicket: (id: string, input: Record<string, unknown>) =>
    request<Ticket>(`/tickets/${id}`, { method: "PATCH", body: JSON.stringify(input) }),

  deleteTicket: (id: string) => request<void>(`/tickets/${id}`, { method: "DELETE" }),

  moveTicket: (input: { ticketId: string; targetColumnId: string; afterTicketId?: string }) =>
    request<Ticket>("/tickets/move", { method: "PATCH", body: JSON.stringify(input) }),

  createTag: (input: { boardId: string; name: string; color: string }) =>
    request<Tag>(`/boards/${input.boardId}/tags`, {
      method: "POST",
      body: JSON.stringify(input),
    }),

  tagTicket: (ticketId: string, tagId: string) =>
    request(`/tickets/${ticketId}/tags/${tagId}`, { method: "POST" }),

  untagTicket: (ticketId: string, tagId: string) =>
    request(`/tickets/${ticketId}/tags/${tagId}`, { method: "DELETE" }),

  listComments: (ticketId: string) => request<Comment[]>(`/tickets/${ticketId}/comments`),
  createComment: (ticketId: string, body: string) =>
    request<Comment>(`/tickets/${ticketId}/comments`, {
      method: "POST",
      body: JSON.stringify({ body }),
    }),
  updateComment: (id: string, body: string) =>
    request<Comment>(`/comments/${id}`, { method: "PATCH", body: JSON.stringify({ body }) }),
  deleteComment: (id: string) => request<void>(`/comments/${id}`, { method: "DELETE" }),

  listAttachments: (ticketId: string) =>
    request<Attachment[]>(`/tickets/${ticketId}/attachments`),
  uploadAttachment: (ticketId: string, file: File) => {
    const form = new FormData();
    form.append("file", file);
    return fetch(`${API_URL}/tickets/${ticketId}/attachments`, {
      method: "POST",
      body: form,
    }).then(async (res) => {
      if (!res.ok) throw new Error(`upload failed: ${res.status}`);
      return res.json() as Promise<Attachment>;
    });
  },
  downloadAttachmentUrl: (id: string) => `${API_URL}/attachments/${id}/download`,
  deleteAttachment: (id: string) => request<void>(`/attachments/${id}`, { method: "DELETE" }),

  cfd: (boardId: string) => request<CfdPoint[]>(`/boards/${boardId}/reports/cfd`),
  velocity: (boardId: string) => request<VelocityPoint[]>(`/boards/${boardId}/reports/velocity`),
  leadTime: (boardId: string) => request<LeadTimePoint[]>(`/boards/${boardId}/reports/leadtime`),

  listAutomations: (boardId: string) =>
    request<AutomationRule[]>(`/boards/${boardId}/automations`),
  createAutomation: (boardId: string, input: Record<string, unknown>) =>
    request<AutomationRule>(`/boards/${boardId}/automations`, {
      method: "POST",
      body: JSON.stringify(input),
    }),
  updateAutomation: (boardId: string, id: string, input: Record<string, unknown>) =>
    request<AutomationRule>(`/boards/${boardId}/automations/${id}`, {
      method: "PATCH",
      body: JSON.stringify(input),
    }),
  deleteAutomation: (boardId: string, id: string) =>
    request<void>(`/boards/${boardId}/automations/${id}`, { method: "DELETE" }),
  runDueDateAutomations: (boardId: string) =>
    request<{ triggered: number }>(`/boards/${boardId}/automations/run-due-date`, {
      method: "POST",
    }),
  retrospect: (boardId: string, days?: number) =>
    request<RetrospectData>(`/boards/${boardId}/reports/retrospect${days ? `?days=${days}` : ""}`),
};

const BoardDetailSchema = BoardSchema.extend({
  columns: ColumnSchema.extend({
    tickets: TicketSchema.extend({
      tags: z.array(z.object({ tag: TagSchema })),
    }).array(),
  }).array(),
  tags: TagSchema.array(),
});

export type BoardDetail = z.infer<typeof BoardDetailSchema>;
