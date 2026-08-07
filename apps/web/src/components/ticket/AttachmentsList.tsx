import { useRef, useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api } from "../../api/client";
import type { Attachment } from "@task-board/schemas";

interface AttachmentsListProps {
  ticketId: string;
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

export function AttachmentsList({ ticketId }: AttachmentsListProps) {
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const { data: attachments } = useQuery({
    queryKey: ["attachments", ticketId],
    queryFn: () => api.listAttachments(ticketId),
  });

  const uploadMutation = useMutation({
    mutationFn: (file: File) => api.uploadAttachment(ticketId, file),
    onMutate: () => setBusy(true),
    onSettled: () => {
      setBusy(false);
      return queryClient.invalidateQueries({ queryKey: ["attachments", ticketId] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAttachment(id),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["attachments", ticketId] }),
  });

  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadMutation.mutate(file);
    e.target.value = "";
  };

  return (
    <div className="mt-3 border-t border-slate-200 dark:border-slate-700 pt-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium text-slate-700 dark:text-slate-300">Anexos</h4>
        <button
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="rounded border border-slate-200 dark:border-slate-700 px-2 py-1 text-xs text-slate-600 dark:text-slate-400 hover:bg-slate-50 disabled:opacity-50"
        >
          {busy ? "Enviando…" : "+ Adicionar"}
        </button>
        <input
          ref={fileRef}
          type="file"
          onChange={handleUpload}
          className="hidden"
        />
      </div>

      {attachments && attachments.length > 0 && (
        <ul className="mt-2 space-y-1">
          {attachments.map((att) => (
            <li
              key={att.id}
              className="flex items-center justify-between rounded border border-slate-100 px-2 py-1"
            >
              <a
                href={api.downloadAttachmentUrl(att.id)}
                target="_blank"
                rel="noreferrer"
                className="text-xs text-blue-600 hover:underline truncate"
                title={att.filename}
              >
                {att.filename} ({formatBytes(att.sizeBytes)})
              </a>
              <button
                onClick={() => deleteMutation.mutate(att.id)}
                className="ml-2 text-xs text-red-500 hover:underline"
              >
                ✕
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
