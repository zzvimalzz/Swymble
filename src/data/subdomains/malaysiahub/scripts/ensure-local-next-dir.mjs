/**
 * Keeps Next.js build output out of OneDrive.
 *
 * This repo lives inside a OneDrive-synced folder. OneDrive locks and
 * partially syncs files in `.next` while Next writes them, which corrupts
 * dev manifests — the observed "Unexpected end of JSON input" and
 * "Could not find … in React Client Manifest" failures. Junctions are
 * reparse points, which OneDrive does not follow, so pointing `.next` at a
 * folder under %LOCALAPPDATA% removes the whole failure class.
 *
 * Two junctions are maintained:
 *   <project>/.next            -> %LOCALAPPDATA%/malaysiahub-build/<key>/.next
 *   …/<key>/node_modules       -> <project>/node_modules
 * The second exists because Node resolves requires from a module's REAL
 * path — build chunks inside the relocated .next must still find
 * node_modules by walking up.
 *
 * Runs automatically via predev/prebuild hooks. No-op outside Windows or
 * when the project isn't under a OneDrive path. Junction creation needs no
 * elevation (unlike symlinks).
 */
import { createHash } from "node:crypto";
import { existsSync, lstatSync, mkdirSync, readlinkSync, rmSync, symlinkSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const projectRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const nextDir = path.join(projectRoot, ".next");

if (process.platform !== "win32" || !/onedrive/i.test(projectRoot)) {
  process.exit(0);
}

const key = createHash("sha1").update(projectRoot.toLowerCase()).digest("hex").slice(0, 10);
const buildRoot = path.join(
  process.env.LOCALAPPDATA ?? path.join(os.homedir(), "AppData", "Local"),
  "malaysiahub-build",
  key,
);
const target = path.join(buildRoot, ".next");

function isLink(p) {
  return existsSync(p) && lstatSync(p).isSymbolicLink();
}

// Junction targets come back with a \\?\ prefix on Windows; normalise so a
// stale link (e.g. a pre-rename build dir) is detected and relinked.
function normalize(p) {
  return path.resolve(p.replace(/^\\\\\?\\/, "")).toLowerCase();
}

function linkTarget(p) {
  try {
    return isLink(p) ? readlinkSync(p) : null;
  } catch {
    return null;
  }
}

try {
  const current = linkTarget(nextDir);
  const isCorrect = current !== null && normalize(current) === normalize(target);
  if (!isCorrect) {
    // Not a link, or a link to the wrong place (project renamed/moved) — the
    // old cache is stale and would break module resolution. Relink fresh.
    if (existsSync(nextDir) || isLink(nextDir)) {
      rmSync(nextDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
    }
    mkdirSync(target, { recursive: true });
    symlinkSync(target, nextDir, "junction");
    console.log(`.next -> ${target} (kept outside OneDrive)`);
  }

  const siblingModules = path.join(buildRoot, "node_modules");
  if (!isLink(siblingModules)) {
    mkdirSync(buildRoot, { recursive: true });
    if (existsSync(siblingModules)) rmSync(siblingModules, { recursive: true, force: true });
    symlinkSync(path.join(projectRoot, "node_modules"), siblingModules, "junction");
  }
} catch (error) {
  // Never block a build over this — worst case Next writes in place.
  console.warn(
    `warning: could not redirect .next outside OneDrive (${error.message}); ` +
      "builds may hit OneDrive file locking.",
  );
}
