/**
 * Raster file walker — tickets only.
 * A Raster project exists iff `<projet>/raster-src/lots` exists.
 * Scan : <projet>/raster-src/lots/** /tasks/*.md
 * Never scans docs or legacy ticket trees.
 */
import fs from "node:fs";
import path from "node:path";

/** Root dirs that are never peer projects. */
export const ROOT_SKIP = new Set([
  ".git",
  ".cursor",
  "node_modules",
  "shared",
  "docs",
  "build",
  "gradle",
  "tmp",
  "BDP",
  "cmd",
]);

export function walkTaskFiles(dir, out = [], includeArchive = false) {
  if (!fs.existsSync(dir)) return out;
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, ent.name);
    if (!ent.isDirectory()) continue;
    if (ent.name === "node_modules") continue;
    if (ent.name === "_archive" && !includeArchive) continue;
    if (ent.name === "tasks") {
      for (const f of fs.readdirSync(full)) {
        if (f.endsWith(".md")) out.push(path.join(full, f));
      }
    } else {
      walkTaskFiles(full, out, includeArchive);
    }
  }
  return out;
}

function rasterSrcLots(appRoot) {
  return path.join(appRoot, "raster-src", "lots");
}

export function projectLooksLikeRaster(appRoot) {
  return fs.existsSync(rasterSrcLots(appRoot));
}

function collectRasterSrc(appRoot, files, includeArchive) {
  walkTaskFiles(rasterSrcLots(appRoot), files, includeArchive);
}

/** Live tickets. Pass includeArchive for next-id (done files still occupy IDs). */
export function collectTaskFiles(repoRoot, { includeArchive = false } = {}) {
  const files = [];
  for (const ent of fs.readdirSync(repoRoot, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (ROOT_SKIP.has(ent.name) || ent.name.startsWith(".")) continue;
    const appRoot = path.join(repoRoot, ent.name);
    if (!projectLooksLikeRaster(appRoot)) continue;
    collectRasterSrc(appRoot, files, includeArchive);
  }
  return files;
}

export function projectFromPath(repoRoot, filePath) {
  const rel = path.relative(repoRoot, filePath).replace(/\\/g, "/");
  const peerRasterSrc = rel.match(/^([^/]+)\/raster-src\//);
  if (peerRasterSrc) return peerRasterSrc[1];
  return "misc";
}

/**
 * L'arbre est DANS le chemin — pas dans un champ `parent:`.
 *   <proj>/raster-src/lots/<lot>/[<sous-lot>/]tasks/<id>.md
 * Retourne { project, lot, souslot } — souslot vaut "" si la task est à plat.
 */
export function treeFromPath(repoRoot, filePath) {
  const rel = path.relative(repoRoot, filePath).replace(/\\/g, "/");
  const project = projectFromPath(repoRoot, filePath);
  const m = rel.match(/raster-src\/lots\/(.+)\/tasks\/[^/]+$/);
  if (!m) return { project, lot: "", souslot: "" };
  const segs = m[1].split("/").filter(Boolean);
  return {
    project,
    lot: segs[0] || "",
    souslot: segs.slice(1).join("/"),
  };
}

export function listRasterProjects(repoRoot) {
  const names = new Set();
  for (const ent of fs.readdirSync(repoRoot, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (ROOT_SKIP.has(ent.name) || ent.name.startsWith(".")) continue;
    if (projectLooksLikeRaster(path.join(repoRoot, ent.name))) {
      names.add(ent.name);
    }
  }
  return [...names].sort();
}
