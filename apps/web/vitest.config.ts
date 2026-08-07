import { defineConfig } from "vitest/config";
import path from "node:path";

export default defineConfig({
  resolve: {
    alias: {
      "@task-board/schemas": path.resolve(__dirname, "../../packages/schemas/src"),
    },
  },
  test: {
    include: ["src/**/*.{test,spec}.{ts,tsx}"],
  },
});
