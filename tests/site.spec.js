// End to end tests for CampusKey. Runs on desktop and several Android viewports.
const { test, expect } = require("@playwright/test");

test.beforeEach(async ({ page }) => {
  const errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => { if (m.type() === "error") errors.push(m.text()); });
  page.errors = errors;
  await page.goto("/");
});

test.afterEach(async ({ page }) => {
  expect(page.errors, "no console or page errors").toEqual([]);
});

test("loads with offers, stats and categories", async ({ page }) => {
  await expect(page).toHaveTitle(/CampusKey/);
  await expect(page.locator("h1")).toBeVisible();
  const cards = page.locator(".card");
  expect(await cards.count()).toBeGreaterThan(40);
  await expect(page.locator("#stats .stat")).toHaveCount(3);
  expect(await page.locator(".chip").count()).toBeGreaterThan(4);
  await expect(page.locator("#result-count")).toContainText("offers");
});

test("search filters results and clears", async ({ page }) => {
  await page.fill("#search", "github");
  await expect(page.locator(".card").first()).toContainText(/GitHub/i);
  const n = await page.locator(".card").count();
  expect(n).toBeGreaterThan(0);
  await page.fill("#search", "zzzz-no-such-offer");
  await expect(page.locator("#empty")).toBeVisible();
  await page.click("#reset");
  await expect(page.locator("#empty")).toBeHidden();
  await expect(page.locator("#search")).toHaveValue("");
});

test("category chip filters to one category", async ({ page }) => {
  const chip = page.locator(".chip").nth(1);
  const cat = await chip.getAttribute("data-cat");
  await chip.click();
  await expect(chip).toHaveAttribute("aria-pressed", "true");
  const tags = page.locator(".card .tags .tag:first-child");
  const count = await tags.count();
  expect(count).toBeGreaterThan(0);
  for (let i = 0; i < count; i++) await expect(tags.nth(i)).toHaveText(cat);
});

test("proof filter narrows the list", async ({ page }) => {
  const all = await page.locator(".card").count();
  await page.selectOption("#proof", "email");
  const email = await page.locator(".card").count();
  await page.selectOption("#proof", "id");
  const id = await page.locator(".card").count();
  expect(email).toBeGreaterThan(0);
  expect(id).toBeGreaterThan(0);
  expect(email).toBeLessThanOrEqual(all);
  expect(id).toBeLessThanOrEqual(all);
});

test("sort by name orders alphabetically", async ({ page }) => {
  await page.selectOption("#sort", "name");
  const names = await page.locator(".card h3").allTextContents();
  const copy = [...names].sort((a, b) => a.localeCompare(b));
  expect(names).toEqual(copy);
});

test("detail sheet opens, shows steps and closes", async ({ page }) => {
  await page.locator("[data-open]").first().click();
  const dlg = page.locator("#detail");
  await expect(dlg).toBeVisible();
  await expect(dlg.locator(".detail-section ol li").first()).toBeVisible();
  await expect(dlg.locator("text=Sources checked")).toBeVisible();
  expect(page.url()).toContain("#");
  await page.click("#detail-close");
  await expect(dlg).toBeHidden();
});

test("back button closes the sheet (Android behavior)", async ({ page }) => {
  await page.locator("[data-open]").first().click();
  await expect(page.locator("#detail")).toBeVisible();
  await page.goBack();
  await expect(page.locator("#detail")).toBeHidden();
});

test("deep link opens a specific offer", async ({ page }) => {
  const id = await page.locator(".card").first().getAttribute("data-id");
  await page.goto("/#" + id);
  await expect(page.locator("#detail")).toBeVisible();
});

test("escape key closes the sheet", async ({ page, isMobile }) => {
  test.skip(isMobile, "keyboard only");
  await page.locator("[data-open]").first().click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#detail")).toBeHidden();
});

test("no horizontal overflow and tap targets are large enough", async ({ page }) => {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow).toBeLessThanOrEqual(0);
  const small = await page.evaluate(() =>
    [...document.querySelectorAll(".card .btn, .chip, #search, select")]
      .map((el) => el.getBoundingClientRect())
      .filter((r) => r.width > 0 && r.height < 40).length
  );
  expect(small).toBe(0);
});

test("official links are safe external https links", async ({ page }) => {
  const hrefs = await page.locator(".card a.btn").evaluateAll((els) =>
    els.map((a) => ({ href: a.href, rel: a.rel, target: a.target }))
  );
  for (const h of hrefs) {
    expect(h.href).toMatch(/^https:\/\//);
    expect(h.rel).toContain("noopener");
    expect(h.target).toBe("_blank");
  }
});

test("page text has no emojis or en or em dashes", async ({ page }) => {
  await page.locator("[data-open]").first().click();
  const text = await page.evaluate(() => document.body.innerText);
  expect(text).not.toMatch(/[–—]/);
  expect(text).not.toMatch(/[\u{1F000}-\u{1FAFF}\u{2600}-\u{27BF}]/u);
});

test("screenshot", async ({ page }, info) => {
  await page.screenshot({ path: `screenshots/${info.project.name}.png`, fullPage: false });
  await page.locator("[data-open]").first().click();
  await page.waitForTimeout(200);
  await page.screenshot({ path: `screenshots/${info.project.name}-detail.png` });
});
