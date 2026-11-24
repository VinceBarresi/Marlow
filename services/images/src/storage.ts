import { createHash, randomBytes } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import path from "node:path";

export function newObjectId() {
  return randomBytes(12).toString("hex");
}

export function objectRelativePath(id: string, ext: string) {
  const shard = id.slice(0, 2);
  return path.posix.join("objects", shard, `${id}.${ext}`);
}

export function absolutePath(dataDir: string, relativePath: string) {
  return path.join(dataDir, ...relativePath.split("/"));
}

export async function writeObjectFile(dataDir: string, relativePath: string, bytes: Buffer) {
  const full = absolutePath(dataDir, relativePath);
  await mkdir(path.dirname(full), { recursive: true });
  await writeFile(full, bytes);
}

export async function removeObjectFile(dataDir: string, relativePath: string) {
  await unlink(absolutePath(dataDir, relativePath)).catch(() => undefined);
}

export function extensionFor(contentType: string, filename?: string) {
  if (contentType === "image/svg+xml") return "svg";
  if (contentType === "image/png") return "png";
  if (contentType === "image/webp") return "webp";
  if (contentType === "image/gif") return "gif";
  if (contentType === "image/jpeg" || contentType === "image/jpg") return "jpg";
  const fromName = filename ? path.extname(filename).replace(".", "").toLowerCase() : "";
  if (fromName === "jpeg") return "jpg";
  if (["png", "jpg", "webp", "gif", "svg"].includes(fromName)) return fromName;
  return "bin";
}

export function placeholderSvg(sku: string, name: string) {
  const hash = createHash("sha256").update(sku).digest();
  const hue = hash[0]! % 360;
  const sat = 35 + (hash[1]! % 30);
  const light = 45 + (hash[2]! % 20);
  const label = (name || sku).slice(0, 28).replace(/[<>&"]/g, "");
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="640" height="480" viewBox="0 0 640 480">
  <rect width="640" height="480" fill="hsl(${hue} ${sat}% ${light}%)"/>
  <rect x="24" y="24" width="592" height="432" rx="16" fill="rgba(255,255,255,0.12)"/>
  <text x="320" y="230" text-anchor="middle" font-family="Georgia, serif" font-size="28" fill="#fff">${label}</text>
  <text x="320" y="270" text-anchor="middle" font-family="ui-monospace, monospace" font-size="16" fill="rgba(255,255,255,0.85)">${sku}</text>
</svg>`,
    "utf8",
  );
}
