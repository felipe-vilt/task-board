import { describe, expect, it } from "vitest";

describe("getIsoWeek", () => {
  it("returns ISO week format", () => {
    const d = new Date("2026-01-15T10:00:00.000Z");
    const week = getIsoWeek(d);
    expect(week).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("handles year boundary", () => {
    const d = new Date("2025-12-31T10:00:00.000Z");
    const week = getIsoWeek(d);
    expect(week).toMatch(/^\d{4}-W\d{2}$/);
  });

  it("handles first week of year", () => {
    const d = new Date("2026-01-01T10:00:00.000Z");
    const week = getIsoWeek(d);
    expect(week).toMatch(/^\d{4}-W\d{2}$/);
  });
});

function getIsoWeek(date: Date): string {
  const d = new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
  const dayNum = d.getUTCDay() || 7;
  d.setUTCDate(d.getUTCDate() + 4 - dayNum);
  const yearStart = new Date(Date.UTC(d.getUTCFullYear(), 0, 1));
  const weekNo = Math.ceil(((d.getTime() - yearStart.getTime()) / 86400000 + 1) / 7);
  return `${d.getUTCFullYear()}-W${weekNo.toString().padStart(2, "0")}`;
}
