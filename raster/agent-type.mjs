/**
 * Raster type ↔ agent_type mapping (immuable).
 * spec → spec · feature|bug|tech|physical → exec · qa → qa
 *
 * Pas de `kind` : lot et sous-lot sont des DOSSIERS, pas des tickets.
 * Tout fichier sous `tasks/` est une task.
 */

const WORK_TYPES = new Set([
  "spec",
  "feature",
  "bug",
  "tech",
  "physical",
  "qa",
]);

export function parseListField(raw) {
  if (!raw) return [];
  const inner = String(raw).replace(/^\[/, "").replace(/\]$/, "").trim();
  if (!inner) return [];
  return inner
    .split(",")
    .map((s) => s.trim().replace(/^["']|["']$/g, ""))
    .filter(Boolean);
}

export function inferWorkType(fm) {
  const ty = (fm.type || "").toLowerCase();
  if (WORK_TYPES.has(ty)) return ty;
  const tags = parseListField(fm.tags).map((t) => t.toLowerCase());
  for (const t of ["bug", "tech", "physical", "spec", "qa"]) {
    if (tags.includes(t)) return t;
  }
  return "feature";
}

export function expectedAgentType(type) {
  const t = (type || "").toLowerCase();
  if (t === "spec") return "spec";
  if (t === "qa") return "qa";
  if (t === "feature" || t === "bug" || t === "tech" || t === "physical") {
    return "exec";
  }
  return "";
}

export function resolveAgentType(type, given) {
  const expected = expectedAgentType(type);
  if (!expected) return "";
  const g = (given || "").toLowerCase().trim();
  if (!g) return expected;
  if (g !== expected) {
    throw new Error(
      `agent_type "${g}" incompatible with type "${type}" (expected ${expected})`
    );
  }
  return g;
}

export function skillForAgentType(agentType) {
  if (agentType === "spec") return "nafura-spec";
  if (agentType === "qa") return "nafura-qa";
  if (agentType === "orch") return "nafura-orch";
  if (agentType === "exec") return "nafura-exec";
  return "";
}
