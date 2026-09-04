/**
 * File Session — sous-lots engagés par l'humain (Ready → Session).
 * État volatile du serveur, jamais sur disque.
 */
const committed = new Set();

export function sessionKey(project, lot, souslot = "") {
  return `${project}//${lot}//${souslot}`;
}

export function list() {
  return [...committed].sort();
}

export function has(key) {
  return committed.has(key);
}

export function add(key) {
  if (!key) throw new Error("key required");
  committed.add(key);
  return list();
}

export function remove(key) {
  if (!key) throw new Error("key required");
  committed.delete(key);
  return list();
}

/** Retire les sous-lots clos qui ne tournent plus. */
export function prune(readyRows, running = []) {
  const runningKeys = new Set(
    running.map((run) => sessionKey(run.project, run.lot, run.souslot))
  );
  const byKey = new Map(readyRows.map((row) => [row.key, row]));
  for (const key of committed) {
    const row = byKey.get(key);
    if (!row?.ouvert && !runningKeys.has(key)) committed.delete(key);
  }
  return list();
}
