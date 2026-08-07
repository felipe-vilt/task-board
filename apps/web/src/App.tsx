import { useQuery } from "@tanstack/react-query";
import { useState } from "react";
import { api } from "./api/client";
import { useFilterStore } from "./store/ui";
import { ThemeToggle } from "./components/ThemeToggle";
import { Board } from "./components/Board";

export function App() {
  const { activeBoardId, setActiveBoardId } = useFilterStore();
  const [newBoardName, setNewBoardName] = useState("");

  const { data: boards, isLoading } = useQuery({
    queryKey: ["boards"],
    queryFn: api.listBoards,
  });

  if (activeBoardId) {
    return (
      <div>
        <header className="flex items-center gap-4 border-b border-slate-200 px-4 py-3 dark:border-slate-700">
          <button
            onClick={() => setActiveBoardId(null)}
            className="text-sm text-blue-600 hover:underline dark:text-blue-400"
          >
            ← Voltar
          </button>
          <h1 className="text-lg font-semibold text-slate-900 dark:text-slate-100">Task Board</h1>
          <div className="ml-auto">
            <ThemeToggle />
          </div>
        </header>
        <Board boardId={activeBoardId} />
      </div>
    );
  }

  return (
      <main className="mx-auto max-w-2xl p-8">
      <h1 className="text-2xl font-semibold text-slate-900 dark:text-slate-100">Task Board</h1>
      <p className="mt-2 text-slate-600 dark:text-slate-400">Selecione um quadro ou crie um novo.</p>

      <div className="mt-6">
        <input
          type="text"
          value={newBoardName}
          onChange={(e) => setNewBoardName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && newBoardName.trim()) {
              api.createBoard({ name: newBoardName.trim() }).then((b) => {
                setNewBoardName("");
                setActiveBoardId(b.id);
              });
            }
          }}
          placeholder="Nome do novo quadro"
          className="w-full rounded-md border border-slate-200 px-3 py-2 text-sm focus:border-blue-400 focus:outline-none"
        />
        <button
          onClick={() => {
            if (!newBoardName.trim()) return;
            api.createBoard({ name: newBoardName.trim() }).then((b) => {
              setNewBoardName("");
              setActiveBoardId(b.id);
            });
          }}
          className="mt-2 rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700"
        >
          Criar quadro
        </button>
      </div>

      {isLoading ? (
        <p className="mt-6 text-slate-500">Carregando…</p>
      ) : (
        <ul className="mt-6 divide-y divide-slate-200 rounded-md border border-slate-200">
          {boards?.map((board) => (
            <li key={board.id}>
              <button
                onClick={() => setActiveBoardId(board.id)}
                className="block w-full px-4 py-3 text-left text-sm text-slate-800 hover:bg-slate-50"
              >
                {board.name}
              </button>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
