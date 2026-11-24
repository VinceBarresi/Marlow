import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import pg from "pg";
import {
  extensionFor,
  newObjectId,
  objectRelativePath,
  placeholderSvg,
  removeObjectFile,
  writeObjectFile,
} from "./storage.js";

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL ?? "postgres://datalab:datalab@localhost:5432/datalab",
});

const here = path.dirname(fileURLToPath(import.meta.url));
const dataDir = process.env.IMAGES_DATA_DIR ?? path.join(here, "..", "data");
const repoRoot = path.join(here, "..", "..", "..");

const catalogPhotos: Array<{ sku: string; relativeFile: string; contentType: string }> = [
  {
    sku: "BED-10331",
    relativeFile: "fixtures/images/black-analog-alarm-clock.jpg",
    contentType: "image/jpeg",
  },
];

await mkdir(dataDir, { recursive: true });

const products = await pool.query<{ sku: string; name: string }>(
  `select p.sku, p.name
   from products p
   left join product_images i on i.sku = p.sku and i.is_primary
   where i.id is null
   order by p.sku`,
);

let created = 0;
for (const product of products.rows) {
  const id = newObjectId();
  const relativePath = objectRelativePath(id, "svg");
  const bytes = placeholderSvg(product.sku, product.name);
  await writeObjectFile(dataDir, relativePath, bytes);
  await pool.query(
    `insert into product_images (
       id, sku, content_type, relative_path, byte_size, is_primary
     ) values ($1, $2, 'image/svg+xml', $3, $4, true)`,
    [id, product.sku, relativePath, bytes.length],
  );
  created += 1;
}

console.log(`Seeded ${created} product image placeholder(s).`);

let catalog = 0;
for (const photo of catalogPhotos) {
  const product = await pool.query(`select sku from products where sku = $1`, [photo.sku]);
  if (!product.rows[0]) {
    console.warn(`Skip catalog photo; product ${photo.sku} not found.`);
    continue;
  }
  const absolute = path.join(repoRoot, photo.relativeFile);
  const bytes = await readFile(absolute);
  const id = newObjectId();
  const ext = extensionFor(photo.contentType, photo.relativeFile);
  const relativePath = objectRelativePath(id, ext);

  const client = await pool.connect();
  try {
    await client.query("begin");
    const previous = await client.query<{ id: string; relative_path: string }>(
      `select id, relative_path from product_images where sku = $1 and is_primary`,
      [photo.sku],
    );
    for (const row of previous.rows) {
      await client.query(`delete from product_images where id = $1`, [row.id]);
      await removeObjectFile(dataDir, row.relative_path);
    }
    await writeObjectFile(dataDir, relativePath, bytes);
    await client.query(
      `insert into product_images (
         id, sku, content_type, relative_path, byte_size, is_primary
       ) values ($1, $2, $3, $4, $5, true)`,
      [id, photo.sku, photo.contentType, relativePath, bytes.length],
    );
    await client.query("commit");
    catalog += 1;
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}

console.log(`Applied ${catalog} catalog product photo(s).`);
await pool.end();
