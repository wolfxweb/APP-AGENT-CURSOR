import { expect, test } from "@playwright/test";

type Task = {
  id: string;
  title: string;
  is_completed: boolean;
  created_at: string;
  updated_at: string;
};

test("fluxo completo: criar, concluir, reabrir, editar e excluir", async ({ page }) => {
  const now = new Date().toISOString();
  let counter = 1;
  let tasks: Task[] = [];

  await page.route("**/api/tasks", async (route) => {
    const request = route.request();
    const method = request.method();

    if (method === "GET") {
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(tasks),
      });
      return;
    }

    if (method === "POST") {
      const payload = (request.postDataJSON() ?? {}) as { title?: string };
      const created: Task = {
        id: `task-${counter++}`,
        title: (payload.title ?? "").trim(),
        is_completed: false,
        created_at: now,
        updated_at: now,
      };
      tasks = [created, ...tasks];
      await route.fulfill({
        status: 201,
        contentType: "application/json",
        body: JSON.stringify(created),
      });
      return;
    }

    await route.fallback();
  });

  await page.route("**/api/tasks/*", async (route) => {
    const request = route.request();
    const method = request.method();
    const url = new URL(request.url());
    const taskId = url.pathname.split("/").pop() ?? "";
    const index = tasks.findIndex((task) => task.id === taskId);

    if (index < 0) {
      await route.fulfill({
        status: 404,
        contentType: "application/json",
        body: JSON.stringify({ detail: "Tarefa nao encontrada" }),
      });
      return;
    }

    if (method === "PATCH") {
      const payload = (request.postDataJSON() ?? {}) as {
        title?: string;
        is_completed?: boolean;
      };
      const updated: Task = {
        ...tasks[index],
        title: payload.title?.trim() ?? tasks[index].title,
        is_completed: payload.is_completed ?? tasks[index].is_completed,
        updated_at: new Date().toISOString(),
      };
      tasks[index] = updated;
      await route.fulfill({
        status: 200,
        contentType: "application/json",
        body: JSON.stringify(updated),
      });
      return;
    }

    if (method === "DELETE") {
      tasks = tasks.filter((task) => task.id !== taskId);
      await route.fulfill({ status: 204, body: "" });
      return;
    }

    await route.fallback();
  });

  await page.goto("/");

  await expect(page.getByText("Nenhuma tarefa cadastrada.")).toBeVisible();

  await page.getByLabel("Nova tarefa").fill("Comprar cafe");
  await page.getByRole("button", { name: "Criar" }).click();
  await expect(page.getByText("Comprar cafe")).toBeVisible();

  await page.getByRole("button", { name: "Concluir" }).click();
  await expect(page.getByRole("button", { name: "Reabrir" })).toBeVisible();

  await page.getByRole("button", { name: "Reabrir" }).click();
  await expect(page.getByRole("button", { name: "Concluir" })).toBeVisible();

  await page.getByRole("button", { name: "Editar" }).click();
  await page.getByLabel("Editar titulo").fill("Comprar cafe em graos");
  await page.getByRole("button", { name: "Salvar" }).click();
  await expect(page.getByText("Comprar cafe em graos")).toBeVisible();

  await page.getByRole("button", { name: "Excluir" }).click();
  await expect(page.getByText("Nenhuma tarefa cadastrada.")).toBeVisible();
});
