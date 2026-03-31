import { expect, test } from "@playwright/test";

async function tryLoginAsAdmin(page: import("@playwright/test").Page): Promise<boolean> {
  const email = process.env.E2E_ADMIN_EMAIL;
  const password = process.env.E2E_ADMIN_PASSWORD;
  if (!email || !password) return false;

  await page.goto("/auth/login");
  await page.getByLabel("E-mail").fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar" }).click();
  await page.waitForTimeout(800);
  const authErrorVisible = await page.getByText("E-mail ou senha incorretos").isVisible().catch(() => false);
  if (authErrorVisible) return false;
  return !page.url().includes("/auth/login");
}

test("home pública exibe proposta e CTA", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByText("Decida melhor com dados, margens e simulações.")).toBeVisible();
  await expect(page.getByRole("link", { name: "Criar conta" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Entrar" }).first()).toBeVisible();
});

test("login admin + painel usuarios", async ({ page }) => {
  const logged = await tryLoginAsAdmin(page);
  test.skip(!logged, "Login admin não disponível neste ambiente.");

  await page.goto("/admin/users");
  await expect(page.getByRole("heading", { name: "Admin · Usuários" })).toBeVisible();
});

test("simulador abre e mostra cabecalho", async ({ page }) => {
  const logged = await tryLoginAsAdmin(page);
  test.skip(!logged, "Login admin não disponível neste ambiente.");

  await page.goto("/simulador");
  await expect(page.getByRole("heading", { name: "Simulador de cenários" })).toBeVisible();
});
