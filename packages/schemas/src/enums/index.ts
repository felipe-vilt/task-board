import { z } from "zod";

export const PrioritySchema = z.enum(["low", "medium", "high", "urgent"]);
export type Priority = z.infer<typeof PrioritySchema>;

export const ColumnNameSchema = z.enum([
  "Backlog",
  "Executando",
  "Impedido",
  "Concluído",
]);
export type ColumnName = z.infer<typeof ColumnNameSchema>;

export const AuditEventSchema = z.enum([
  "created",
  "moved",
  "updated",
  "commented",
  "tagged",
]);
export type AuditEvent = z.infer<typeof AuditEventSchema>;
