/**
 * Raster file walker — tickets only.
 * A Raster project exists iff `<projet>/raster-src/lots` exists.
 * Scan : <projet>/raster-src/lots/** /tasks/*.md
 * Never scans pact/, docs/specs, or <projet>/raster/lots.
 */
import fs from "node:fs";
import path from "node:path";

/** Root dirs that are never peer projects. */
export const ROOT_SKIP = new Set([
  ".git",
  ".cursor",
  "node_modules",
  "products",
  "platform",
  "infra",
  "toolchain",
  "shared",
  "docs",
  "secrets",
  "build",
  "gradle",
  "tmp",
  "tools",
  "BDP",
  "cmd",
  "marketing",
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
  const products = path.join(repoRoot, "products");
  if (fs.existsSync(products)) {
    for (const app of fs.readdirSync(products, { withFileTypes: true })) {
      if (!app.isDirectory()) continue;
      const appRoot = path.join(products, app.name);
      if (!projectLooksLikeRaster(appRoot)) continue;
      collectRasterSrc(appRoot, files, includeArchive);
    }
  }
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
  const underProducts = rel.match(/^products\/([^/]+)\/raster-src\//);
  if (underProducts) return underProducts[1];
  const peerRasterSrc = rel.match(/^([^/]+)\/raster-src\//);
  if (peerRasterSrc) return peerRasterSrc[1];
  return "misc";
}

export function listRasterProjects(repoRoot) {
  const names = new Set();
  const products = path.join(repoRoot, "products");
  if (fs.existsSync(products)) {
    for (const app of fs.readdirSync(products, { withFileTypes: true })) {
      if (!app.isDirectory()) continue;
      if (projectLooksLikeRaster(path.join(products, app.name))) {
        names.add(app.name);
      }
    }
  }
  for (const ent of fs.readdirSync(repoRoot, { withFileTypes: true })) {
    if (!ent.isDirectory()) continue;
    if (ROOT_SKIP.has(ent.name) || ent.name.startsWith(".")) continue;
    if (projectLooksLikeRaster(path.join(repoRoot, ent.name))) {
      names.add(ent.name);
    }
  }
  return [...names].sort();
}
