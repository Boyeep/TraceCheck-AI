import { expect, test } from "@playwright/test";

test("home page loads and navigates into the workspace", async ({ page }) => {
  await page.goto("/");

  await expect(page.getByRole("heading", { name: "TraceCheck AI" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Open workspace" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Open workspace" }).first().click();
  await expect(page).toHaveURL(/\/workspace\/upload$/);
  await expect(page.getByText("Upload source documents")).toBeVisible();
});

test("workspace upload flow accepts a text document", async ({ page }) => {
  await page.goto("/workspace/upload");

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
