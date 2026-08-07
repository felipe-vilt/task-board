import { expect, test } from "@playwright/test";
import { createBoard, getColumn, getTicket } from "./helpers";

test.describe("board creation", () => {
  test("creates a board and lands on kanban", async ({ page }) => {
    await createBoard(page, "Projeto Alpha");
    await expect(page.getByRole("heading", { name: "Backlog" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Executando" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Impedido" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Concluído" })).toBeVisible();
  });
});

test.describe("ticket inline creation", () => {
  test("adds a ticket to Backlog", async ({ page }) => {
    await createBoard(page, "Quadro Tickets");
    const backlog = getColumn(page, "Backlog");
    await backlog.getByPlaceholder("+ Adicionar ticket").fill("Primeira tarefa");
    await backlog.getByPlaceholder("+ Adicionar ticket").press("Enter");

    await expect(getTicket(page, "Primeira tarefa")).toBeVisible();
    await expect(getColumn(page, "Backlog").getByText("Primeira tarefa")).toBeVisible();
  });
});

test.describe("drag-and-drop between columns", () => {
  test("moves ticket from Backlog to Executando", async ({ page }) => {
    await createBoard(page, "Quadro DnD");

    const backlog = getColumn(page, "Backlog");
    await backlog.getByPlaceholder("+ Adicionar ticket").fill("Ticket móvel");
    await backlog.getByPlaceholder("+ Adicionar ticket").press("Enter");

    const ticket = getTicket(page, "Ticket móvel");
    const targetColumn = getColumn(page, "Executando");

    const ticketBox = await ticket.boundingBox();
    const targetBox = await targetColumn.boundingBox();
    if (!ticketBox || !targetBox) throw new Error("missing bounding boxes");

    await page.mouse.move(ticketBox.x + ticketBox.width / 2, ticketBox.y + ticketBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect(getColumn(page, "Executando").getByText("Ticket móvel")).toBeVisible();
    await expect(getColumn(page, "Backlog").getByText("Ticket móvel")).toHaveCount(0);
  });

  test("moves ticket to Concluído sets completedAt via API", async ({ page, request }) => {
    await createBoard(page, "Quadro Concluir");

    const backlog = getColumn(page, "Backlog");
    await backlog.getByPlaceholder("+ Adicionar ticket").fill("Fazer depois");
    await backlog.getByPlaceholder("+ Adicionar ticket").press("Enter");

    const ticket = getTicket(page, "Fazer depois");
    const doneColumn = getColumn(page, "Concluído");

    const ticketBox = await ticket.boundingBox();
    const targetBox = await doneColumn.boundingBox();
    if (!ticketBox || !targetBox) throw new Error("missing bounding boxes");

    await page.mouse.move(ticketBox.x + ticketBox.width / 2, ticketBox.y + ticketBox.height / 2);
    await page.mouse.down();
    await page.mouse.move(targetBox.x + targetBox.width / 2, targetBox.y + targetBox.height / 2, { steps: 10 });
    await page.mouse.up();

    await expect(getColumn(page, "Concluído").getByText("Fazer depois")).toBeVisible();

    const boards = await request.get("http://localhost:3001/boards");
    const boardsJson = await boards.json();
    const boardId = boardsJson[0].id;
    const detail = await request.get(`http://localhost:3001/boards/${boardId}`);
    const detailJson = await detail.json();
    const doneTickets = detailJson.columns.find((c: { name: string }) => c.name === "Concluído").tickets;
    expect(doneTickets[0].completedAt).not.toBeNull();
  });
});

test.describe("manual reordering", () => {
  test("reorders tickets within a column", async ({ page }) => {
    await createBoard(page, "Quadro Reordem");

    const backlog = getColumn(page, "Backlog");
    await backlog.getByPlaceholder("+ Adicionar ticket").fill("Ticket A");
    await backlog.getByPlaceholder("+ Adicionar ticket").press("Enter");
    await backlog.getByPlaceholder("+ Adicionar ticket").fill("Ticket B");
    await backlog.getByPlaceholder("+ Adicionar ticket").press("Enter");

    const ticketB = page.getByText("Ticket B");
    const ticketA = page.getByText("Ticket A");

    const boxB = await ticketB.boundingBox();
    const boxA = await ticketA.boundingBox();
    if (!boxB || !boxA) throw new Error("missing bounding boxes");

    await page.mouse.move(boxB.x + boxB.width / 2, boxB.y + boxB.height / 2);
    await page.mouse.down();
    await page.mouse.move(boxB.x + boxB.width / 2, boxA.y - 5, { steps: 10 });
    await page.mouse.up();

    const items = backlog.locator("h4");
    await expect(items.nth(0)).toHaveText("Ticket B");
    await expect(items.nth(1)).toHaveText("Ticket A");
  });
});
