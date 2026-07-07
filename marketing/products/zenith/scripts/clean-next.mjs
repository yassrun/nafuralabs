import { rmSync } from "fs";
import { join } from "path";
import { fileURLToPath } from "url";

const root = join(fileURLToPath(new URL("..", import.meta.url)));

for (const dir of [".next", "out"]) {
  try {
    rmSync(join(root, dir), { recursive: true, force: true });
    console.log(`Removed ${dir}/`);
  } catch {
    /* already gone */
  }
}
