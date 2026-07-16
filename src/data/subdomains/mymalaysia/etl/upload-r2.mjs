/**
 * Mirrors published artifacts to Cloudflare R2 (bucket: mymalaysia-data).
 *
 * Run by the ETL workflow when the repo variable ENABLE_R2_UPLOAD is true
 * (requires CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID with R2 write).
 * Keys mirror the public/ layout so NEXT_PUBLIC_DATA_BASE_URL can point at
 * either the site origin or the R2 custom domain interchangeably.
 */
import { execFileSync } from "node:child_process";
import { readdirSync, statSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const BUCKET = "mymalaysia-data";
const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const publicDir = path.join(repoRoot, "public");

function* walk(dir) {
  for (const entry of readdirSync(dir)) {
    const full = path.join(dir, entry);
    if (statSync(full).isDirectory()) yield* walk(full);
    else yield full;
  }
}

const roots = ["data", "maps"]
  .map((d) => path.join(publicDir, d))
  .filter((d) => {
    try {
      return statSync(d).isDirectory();
    } catch {
      return false;
    }
  });

let count = 0;
for (const root of roots) {
  for (const file of walk(root)) {
    const key = path.relative(publicDir, file).split(path.sep).join("/");
    console.log(`uploading ${key}`);
    execFileSync(
      "npx",
      ["wrangler", "r2", "object", "put", `${BUCKET}/${key}`, "--file", file, "--remote"],
      { stdio: "inherit", shell: process.platform === "win32" },
    );
    count += 1;
  }
}
console.log(`uploaded ${count} objects to r2://${BUCKET}`);
