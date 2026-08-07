import { useToastStore } from "../store/toast";

const variantClass: Record<string, string> = {
  success: "bg-green-600",
  error: "bg-red-600",
  info: "bg-slate-800",
};

export function ToastContainer() {
  const { toasts, dismiss } = useToastStore();

  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm text-white shadow-lg ${variantClass[toast.variant] ?? variantClass.info}`}
        >
          <span>{toast.message}</span>
          <button
            onClick={() => dismiss(toast.id)}
            className="ml-2 opacity-70 hover:opacity-100"
          >
            ✕
          </button>
        </div>
      ))}
    </div>
  );
}
