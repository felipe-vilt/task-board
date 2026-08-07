import { z } from "zod";
import { AuditEventSchema, ColumnNameSchema, PrioritySchema } from "../enums";

const Uuid = z.string().uuid();

export const BoardSchema = z.object({
  id: Uuid,
  name: z.string().min(1).max(120),
  slug: z.string().min(1).max(120),
  description: z.string().max(500).nullable(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
});
export type Board = z.infer<typeof BoardSchema>;

export const CreateBoardSchema = BoardSchema.pick({ name: true }).extend({
  description: BoardSchema.shape.description.optional(),
});
export type CreateBoard = z.infer<typeof CreateBoardSchema>;

export const ColumnSchema = z.object({
  id: Uuid,
  boardId: Uuid,
  name: ColumnNameSchema,
  position: z.number().int().nonnegative(),
  wLimit: z.number().int().positive().nullable(),
  isSystem: z.boolean(),
  createdAt: z.coerce.date(),
});
export type Column = z.infer<typeof ColumnSchema>;

export const CreateColumnSchema = z.object({
  boardId: Uuid,
  name: z.string().min(1).max(80),
  wLimit: z.number().int().positive().nullable().optional(),
});
export type CreateColumn = z.infer<typeof CreateColumnSchema>;

export const TicketSchema = z.object({
  id: Uuid,
  boardId: Uuid,
  columnId: Uuid,
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).nullable(),
  priority: PrioritySchema,
  assignee: z.string().max(80).nullable(),
  cliente: z.string().max(120).nullable(),
  dueDate: z.coerce.date().nullable(),
  position: z.number(),
  createdAt: z.coerce.date(),
  updatedAt: z.coerce.date(),
  completedAt: z.coerce.date().nullable(),
});
export type Ticket = z.infer<typeof TicketSchema>;

export const CreateTicketSchema = z.object({
  boardId: Uuid,
  columnId: Uuid,
  title: z.string().min(1).max(200),
  description: z.string().max(10_000).nullable().optional(),
  priority: PrioritySchema.optional().default("medium"),
  assignee: z.string().max(80).nullable().optional(),
  cliente: z.string().max(120).nullable().optional(),
  dueDate: z.coerce.date().nullable().optional(),
});
export type CreateTicket = z.infer<typeof CreateTicketSchema>;

export const UpdateTicketSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  description: z.string().max(10_000).nullish(),
  priority: PrioritySchema.optional(),
  assignee: z.string().max(80).nullish(),
  cliente: z.string().max(120).nullish(),
  dueDate: z.coerce.date().nullish(),
});
export type UpdateTicket = z.infer<typeof UpdateTicketSchema>;

export const MoveTicketSchema = z.object({
  ticketId: Uuid,
  targetColumnId: Uuid,
  afterTicketId: Uuid.nullish(),
});
export type MoveTicket = z.infer<typeof MoveTicketSchema>;

export const TagSchema = z.object({
  id: Uuid,
  boardId: Uuid,
  name: z.string().min(1).max(40),
  color: z.string().regex(/^#[0-9a-f]{6}$/i),
});
export type Tag = z.infer<typeof TagSchema>;

export const CreateTagSchema = TagSchema.pick({ boardId: true, name: true, color: true });
export type CreateTag = z.infer<typeof CreateTagSchema>;

export const CommentSchema = z.object({
  id: Uuid,
  ticketId: Uuid,
  body: z.string().min(1).max(5000),
  createdAt: z.coerce.date(),
});
export type Comment = z.infer<typeof CommentSchema>;

export const CreateCommentSchema = CommentSchema.pick({ ticketId: true, body: true });
export type CreateComment = z.infer<typeof CreateCommentSchema>;

export const AttachmentSchema = z.object({
  id: Uuid,
  ticketId: Uuid,
  filename: z.string().min(1).max(255),
  mimeType: z.string().min(1).max(120),
  sizeBytes: z.number().int().positive(),
  createdAt: z.coerce.date(),
});
export type Attachment = z.infer<typeof AttachmentSchema>;

export const AuditLogSchema = z.object({
  id: Uuid,
  ticketId: Uuid,
  event: AuditEventSchema,
  fromColumn: Uuid.nullable(),
  toColumn: Uuid.nullable(),
  metadata: z.record(z.unknown()),
  createdAt: z.coerce.date(),
});
export type AuditLog = z.infer<typeof AuditLogSchema>;

export const TransitionSchema = z.object({
  fromColumnId: Uuid,
  toColumnId: Uuid,
  requireReason: z.boolean(),
  requireConfirmation: z.boolean(),
});
export type Transition = z.infer<typeof TransitionSchema>;
