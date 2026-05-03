import { randomUUID } from "node:crypto";
import { expect, test } from "@playwright/test";

test("workspace routes redirect signed-out users into login", async ({ page }) => {
  await page.goto("/workspace/upload");

  await expect(page).toHaveURL(/\/login\?next=%2Fworkspace%2Fupload$/);
  await expect(page.getByRole("heading", { name: "Return to the verification queue." })).toBeVisible();
});

test("home page loads and navbar shows login and sign up", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "TraceCheck AI" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Login" }).first()).toBeVisible();
  await expect(page.getByRole("link", { name: "Sign up" }).first()).toBeVisible();
});

test("sign up reaches workspace upload and accepts a text document", async ({ page }) => {
  const email = `qa-${randomUUID()}@example.com`;

  await page.goto("/signup?next=%2Fworkspace%2Fupload");

  await page.getByLabel("Full name").fill("QA Demo");
  await page.getByLabel("Email").fill(email);
  await page.getByLabel("Password", { exact: true }).fill("password123");
  await page.getByLabel("Confirm password").fill("password123");
  await page.getByRole("button", { name: "Sign up" }).click();

  await expect(page).toHaveURL(/\/workspace\/upload$/);
  await expect(page.getByText("Upload source documents")).toBeVisible();

  const uploadInput = page.locator("label.upload-card").first().locator("input[type='file']");
  await uploadInput.setInputFiles({
    name: "delivery-note.txt",
    mimeType: "text/plain",
    buffer: Buffer.from(
      "Material Name: Lactose Monohydrate\nSupplier: Acme Pharma\nBatch Number: BATCH-001\nExpiry Date: 2027-05-01\nQuantity: 25 kg",
    ),
  });

  await expect(page.locator("label.upload-card").first().getByText("delivery-note.txt")).toBeVisible();
  await page.getByRole("link", { name: "Continue to review" }).click();
  await expect(page).toHaveURL(/\/workspace\/review$/);
});
