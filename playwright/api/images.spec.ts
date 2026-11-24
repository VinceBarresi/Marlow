import { readFileSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { expect, test, type APIRequestContext } from "@playwright/test";

const alarmClockSku = "BED-10331";
const alarmClockImage = path.join(
  path.dirname(fileURLToPath(import.meta.url)),
  "../../fixtures/images/black-analog-alarm-clock.jpg",
);

test.describe.configure({ mode: "serial" });

let uploadedImageId = "";
let uploadedImageUrl = "";

async function login(request: APIRequestContext, email: string) {
  const response = await request.post("/api/login", {
    data: { email, password: "datalab" },
  });
  expect(response.status()).toBe(200);
}

async function productBySku(request: APIRequestContext, sku: string) {
  const response = await request.get(`/api/products/${encodeURIComponent(sku)}`);
  expect(response.status()).toBe(200);
  return (await response.json()).product as {
    sku: string;
    name: string;
    imageId?: string | null;
    imageUrl?: string | null;
  };
}

test.describe("product images API", () => {
  test("includes imageUrl on products and serves public image bytes", async ({
    request,
    playwright,
    baseURL,
  }) => {
    await login(request, "customer@marlow.test");
    // Use a SKU the upload/delete tests do not touch.
    const product = await productBySku(request, "BED-10332");
    expect(product.imageUrl).toMatch(/^\/api\/images\//);

    const anon = await playwright.request.newContext({ baseURL });
    const image = await anon.get(product.imageUrl!);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toMatch(/^image\//);
    expect((await image.body()).byteLength).toBeGreaterThan(0);
    await anon.dispose();
  });

  test("staff uploads the Black Analog Alarm Clock catalog JPEG", async ({ request }) => {
    await login(request, "staff@marlow.test");
    const buffer = readFileSync(alarmClockImage);
    expect(buffer.byteLength).toBeGreaterThan(10_000);

    const upload = await request.post(`/api/products/${encodeURIComponent(alarmClockSku)}/image`, {
      multipart: {
        file: {
          name: "black-analog-alarm-clock.jpg",
          mimeType: "image/jpeg",
          buffer,
        },
      },
    });
    expect(upload.status()).toBe(201);
    const body = await upload.json();
    expect(body.image).toMatchObject({
      sku: alarmClockSku,
      contentType: "image/jpeg",
      isPrimary: true,
    });
    expect(body.image.imageUrl).toMatch(/^\/api\/images\//);
    expect(body.image.byteSize).toBe(buffer.byteLength);

    uploadedImageId = body.image.id as string;
    uploadedImageUrl = body.image.imageUrl as string;

    const image = await request.get(uploadedImageUrl);
    expect(image.status()).toBe(200);
    expect(image.headers()["content-type"]).toMatch(/image\/jpeg/);
    expect((await image.body()).byteLength).toBe(buffer.byteLength);

    const product = await productBySku(request, alarmClockSku);
    expect(product.name).toBe("Black Analog Alarm Clock");
    expect(product.imageUrl).toBe(uploadedImageUrl);
  });

  test("staff removes the uploaded Black Analog Alarm Clock image", async ({ request }) => {
    expect(uploadedImageId).not.toEqual("");
    await login(request, "staff@marlow.test");

    const deleted = await request.delete(
      `/api/products/${encodeURIComponent(alarmClockSku)}/image/${encodeURIComponent(uploadedImageId)}`,
    );
    expect(deleted.status()).toBe(200);
    expect(await deleted.json()).toMatchObject({ id: uploadedImageId, deleted: true });

    const gone = await request.get(uploadedImageUrl);
    expect(gone.status()).toBe(404);

    const product = await productBySku(request, alarmClockSku);
    expect(product.imageId).toBeNull();
    expect(product.imageUrl).toBeNull();
  });

  test("rejects customer image uploads", async ({ request }) => {
    await login(request, "customer@marlow.test");
    const buffer = readFileSync(alarmClockImage);
    const upload = await request.post(`/api/products/${encodeURIComponent(alarmClockSku)}/image`, {
      multipart: {
        file: {
          name: "black-analog-alarm-clock.jpg",
          mimeType: "image/jpeg",
          buffer,
        },
      },
    });
    expect(upload.status()).toBe(403);
    expect(await upload.json()).toHaveProperty("error");
  });
});
