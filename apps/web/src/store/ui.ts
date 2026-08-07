import { create } from "zustand";

type Priority = "low" | "medium" | "high" | "urgent";

interface FilterState {
  activeBoardId: string | null;
  setActiveBoardId: (id: string | null) => void;

  search: string;
  setSearch: (s: string) => void;

  tagIds: string[];
  toggleTag: (id: string) => void;
  clearTags: () => void;

  priority: Priority | null;
  setPriority: (p: Priority | null) => void;

  assignee: string;
  setAssignee: (a: string) => void;

  overdueOnly: boolean;
  toggleOverdue: () => void;

  reset: () => void;
}

const empty = {
  search: "",
  tagIds: [] as string[],
  priority: null as Priority | null,
  assignee: "",
  overdueOnly: false,
};

export const useFilterStore = create<FilterState>((set) => ({
  ...empty,
  activeBoardId: null,
  setActiveBoardId: (id) => set({ activeBoardId: id }),
  setSearch: (search) => set({ search }),
  toggleTag: (id) =>
    set((s) => ({
      tagIds: s.tagIds.includes(id) ? s.tagIds.filter((t) => t !== id) : [...s.tagIds, id],
    })),
  clearTags: () => set({ tagIds: [] }),
  setPriority: (priority) => set({ priority }),
  setAssignee: (assignee) => set({ assignee }),
  toggleOverdue: () => set((s) => ({ overdueOnly: !s.overdueOnly })),
  reset: () => set(empty),
}));
