import { expect, type Page } from "@playwright/test";

export async function createBoard(page: Page, name: string) {
  await page.goto("/");
  await page.getByPlaceholder("Nome do novo quadro").fill(name);
  await page.getByRole("button", { name: "Criar quadro" }).click();
  await expect(page.getByText(name)).toBeVisible();
}

export async function openFirstBoard(page: Page) {
  await page.goto("/");
  await page.getByRole("button", { name: /^[^←]/ }).first().click();
  await expect(page.getByText("Task Board").first()).toBeVisible();
}

export function getColumn(page: Page, name: string) {
  return page.getByRole("heading", { name }).locator("..").locator("..");
}

export function getTicket(page: Page, title: string) {
  return page.getByText(title, exact: false);
}
