import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { api, type BoardDetail } from "../../api/client";
import { useToastStore } from "../../store/toast";
import type { AutomationRule } from "../../types/automation";

interface AutomationPanelProps {
  boardId: string;
  board: BoardDetail;
}

type Draft = {
  name: string;
  trigger: string;
  conditionField: string;
  conditionOp: string;
  conditionValue: string;
  action: string;
  actionParams: string;
  enabled: boolean;
};

const emptyDraft: Draft = {
  name: "",
  trigger: "ticket_created",
  conditionField: "assignee",
  conditionOp: "is_not_empty",
  conditionValue: "",
  action: "move_to_column",
  actionParams: "",
  enabled: true,
};

export function AutomationPanel({ boardId, board }: AutomationPanelProps) {
  const queryClient = useQueryClient();
  const showToast = useToastStore((s) => s.show);
  const [draft, setDraft] = useState<Draft>(emptyDraft);
  const [editingId, setEditingId] = useState<string | null>(null);

  const { data: rules } = useQuery({
    queryKey: ["automations", boardId],
    queryFn: () => api.listAutomations(boardId),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.createAutomation(boardId, {
        name: draft.name,
        trigger: draft.trigger,
        conditionField: draft.conditionField,
        conditionOp: draft.conditionOp,
        conditionValue: draft.conditionValue || null,
        action: draft.action,
        actionParams: draft.actionParams,
        enabled: draft.enabled,
      }),
    onSuccess: () => {
      setDraft(emptyDraft);
      showToast("Regra criada", "success");
      return queryClient.invalidateQueries({ queryKey: ["automations", boardId] });
    },
    onError: () => showToast("Erro ao criar regra", "error"),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.deleteAutomation(boardId, id),
    onSuccess: () => {
      showToast("Regra removida", "success");
      return queryClient.invalidateQueries({ queryKey: ["automations", boardId] });
    },
  });

  const toggleMutation = useMutation({
    mutationFn: (rule: AutomationRule) =>
      api.updateAutomation(boardId, rule.id, { enabled: !rule.enabled }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["automations", boardId] }),
  });

  const runDueDateMutation = useMutation({
    mutationFn: () => api.runDueDateAutomations(boardId),
    onSuccess: (result: { triggered: number }) => {
      showToast(`Automação executada: ${result.triggered} regras disparadas`, "info");
    },
  });

  const getActionParams = (action: string): string => {
    if (action === "move_to_column") {
      const column = board.columns[0];
      return JSON.stringify({ columnId: column?.id ?? "", completedAt: "false" });
    }
    if (action === "add_tag") {
      const tag = board.tags[0];
      return JSON.stringify({ tagId: tag?.id ?? "" });
    }
    return JSON.stringify({ field: "priority", value: "high" });
  };

  const updateDraft = (patch: Partial<Draft>) => setDraft((prev) => ({ ...prev, ...patch }));
  const handleConditionOp = (e: React.ChangeEvent<HTMLSelectElement>) =>
    updateDraft({ conditionOp: e.target.value });

  const handleSubmit = () => {
    if (!draft.name.trim()) return;
    createMutation.mutate();
  };

  return (
    <div className="p-4">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Automações
        </h3>
        <button
          onClick={() => runDueDateMutation.mutate()}
          disabled={runDueDateMutation.isPending}
          className="rounded border border-slate-200 px-2 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 disabled:opacity-50"
        >
          {runDueDateMutation.isPending ? "Executando…" : "Rodar verificação de prazo"}
        </button>
      </div>

      <div className="space-y-2">
        {rules?.map((rule) => (
          <div
            key={rule.id}
            className={`flex items-center justify-between rounded border p-2 text-sm ${
              rule.enabled
                ? "border-slate-200 dark:border-slate-700"
                : "border-slate-100 opacity-60 dark:border-slate-800"
            }`}
          >
            <div>
              <p className="font-medium text-slate-800 dark:text-slate-200">{rule.name}</p>
              <p className="text-xs text-slate-500">
                Quando <strong>{rule.trigger}</strong> — {rule.conditionField}{" "}
                {rule.conditionOp}
                {rule.conditionValue ? ` "${rule.conditionValue}"` : ""} →{" "}
                {rule.action}
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleMutation.mutate(rule as AutomationRule)}
                className={`rounded px-2 py-0.5 text-xs ${
                  rule.enabled
                    ? "bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300"
                    : "bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400"
                }`}
              >
                {rule.enabled ? "Ativa" : "Inativa"}
              </button>
              <button
                onClick={() => deleteMutation.mutate(rule.id)}
                className="text-xs text-red-500 hover:underline"
              >
                Excluir
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-4 rounded border border-slate-200 dark:border-slate-700 p-3">
        <h4 className="mb-2 text-xs font-medium uppercase text-slate-500">
          Nova regra
        </h4>
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Nome da regra"
            value={draft.name}
            onChange={(e) => setDraft({ ...draft, name: e.target.value })}
            className="w-full rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
          />
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.trigger}
              onChange={(e) => setDraft({ ...draft, trigger: e.target.value })}
              className="rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="ticket_created">Ticket criado</option>
              <option value="field_changed">Campo alterado</option>
              <option value="due_date_passed">Prazo vencido</option>
            </select>
            <select
              value={draft.conditionField}
              onChange={(e) => setDraft({ ...draft, conditionField: e.target.value })}
              className="rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="assignee">Responsável</option>
              <option value="priority">Prioridade</option>
              <option value="due_date">Prazo</option>
              <option value="column_id">Coluna</option>
            </select>
            <select
              value={draft.conditionOp}
              onChange={handleConditionOp}
              className="rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="equals">é igual a</option>
              <option value="not_equals">não é igual a</option>
              <option value="is_empty">está vazio</option>
              <option value="is_not_empty">não está vazio</option>
              <option value="contains">contém</option>
            </select>
            <input
              type="text"
              placeholder="Valor (se aplicável)"
              value={draft.conditionValue}
              onChange={(e) => setDraft({ ...draft, conditionValue: e.target.value })}
              className="rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            />
          </div>
          <div className="grid grid-cols-2 gap-2">
            <select
              value={draft.action}
              onChange={(e) =>
                setDraft({ ...draft, action: e.target.value, actionParams: getActionParams(e.target.value) })
              }
              className="rounded border border-slate-200 px-2 py-1 text-sm dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200"
            >
              <option value="move_to_column">Mover para coluna</option>
              <option value="set_field">Definir campo</option>
              <option value="add_tag">Adicionar etiqueta</option>
            </select>
            <button
              onClick={handleSubmit}
              disabled={!draft.name.trim()}
              className="rounded bg-blue-600 py-1 text-sm text-white disabled:opacity-50"
            >
              Adicionar
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
