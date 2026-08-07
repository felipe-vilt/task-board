import { useState } from "react";
import { useFilterStore } from "../store/ui";
import { api } from "../api/client";
import { useMutation, useQueryClient } from "@tanstack/react-query";

interface FilterBarProps {
  boardId: string;
  tags: { id: string; name: string; color: string }[];
}

export function FilterBar({ boardId, tags }: FilterBarProps) {
  const {
    search,
    setSearch,
    tagIds,
    toggleTag,
    priority,
    setPriority,
    overdueOnly,
    toggleOverdue,
    reset,
  } = useFilterStore();

  const queryClient = useQueryClient();
  const createTagMutation = useMutation({
    mutationFn: api.createTag,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["board", boardId] }),
  });

  const [showNewTag, setShowNewTag] = useState(false);
  const [newTagName, setNewTagName] = useState("");
  const [newTagColor, setNewTagColor] = useState("#3b82f6");

  const handleCreateTag = () => {
    const name = newTagName.trim();
    if (!name) return;
    createTagMutation.mutate({ boardId, name, color: newTagColor });
    setNewTagName("");
    setShowNewTag(false);
  };

  return (
    <div className="space-y-3 border-b border-slate-200 dark:border-slate-700 px-4 py-3">
      <div className="flex flex-wrap items-center gap-2">
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Buscar tickets..."
          className="w-48 rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-sm focus:border-blue-400 focus:outline-none"
        />

        <select
          value={priority ?? ""}
          onChange={(e) => setPriority(e.target.value as never)}
          className="rounded-md border border-slate-200 dark:border-slate-700 px-2 py-1 text-sm"
        >
          <option value="">Prioridade</option>
          <option value="low">Baixa</option>
          <option value="medium">Média</option>
          <option value="high">Alta</option>
          <option value="urgent">Urgente</option>
        </select>

        <label className="flex items-center gap-1 text-sm text-slate-600 dark:text-slate-400">
          <input type="checkbox" checked={overdueOnly} onChange={toggleOverdue} />
          Vencidos
        </label>

        {(search || tagIds.length > 0 || priority || overdueOnly) && (
          <button
            onClick={reset}
            className="text-xs text-blue-600 hover:underline"
          >
            Limpar
          </button>
        )}
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {tags.map((tag) => (
          <button
            key={tag.id}
            onClick={() => toggleTag(tag.id)}
            className={`rounded-full px-2 py-0.5 text-xs font-medium transition ${
              tagIds.includes(tag.id)
                ? "text-white shadow"
                : "text-white/80 opacity-60 hover:opacity-100"
            }`}
            style={{ backgroundColor: tag.color }}
          >
            {tag.name}
          </button>
        ))}

        {showNewTag ? (
          <div className="flex items-center gap-1">
            <input
              type="color"
              value={newTagColor}
              onChange={(e) => setNewTagColor(e.target.value)}
              className="h-6 w-6 cursor-pointer rounded border-0"
            />
            <input
              type="text"
              value={newTagName}
              onChange={(e) => setNewTagName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleCreateTag();
                if (e.key === "Escape") setShowNewTag(false);
              }}
              placeholder="Nome"
              autoFocus
              className="w-24 rounded border border-slate-200 dark:border-slate-700 px-1 py-0.5 text-xs"
            />
            <button onClick={handleCreateTag} className="text-xs text-blue-600">
              OK
            </button>
          </div>
        ) : (
          <button
            onClick={() => setShowNewTag(true)}
            className="rounded-full border border-dashed border-slate-300 px-2 py-0.5 text-xs text-slate-500 dark:text-slate-400 hover:border-slate-400"
          >
            + etiqueta
          </button>
        )}
      </div>
    </div>
  );
}
