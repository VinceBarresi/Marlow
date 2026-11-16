import { unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

export const resumeDir = fileURLToPath(new URL("../uploads/resumes/", import.meta.url));

export async function deleteResumeFiles(names: string[]) {
  await Promise.all(
    names.map(async (name) => {
      const safe = path.basename(name);
      if (!safe || safe === "." || safe === "..") return;
      await unlink(path.join(resumeDir, safe)).catch(() => undefined);
    }),
  );
}
