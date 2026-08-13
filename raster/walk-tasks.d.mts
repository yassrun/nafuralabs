export const ROOT_SKIP: Set<string>;
export function walkTaskFiles(
  dir: string,
  out?: string[],
  includeArchive?: boolean
): string[];
export function collectTaskFiles(
  repoRoot: string,
  opts?: { includeArchive?: boolean }
): string[];
export function projectFromPath(repoRoot: string, filePath: string): string;
export function listRasterProjects(repoRoot: string): string[];
