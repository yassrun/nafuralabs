/**
 * Preuve SEKTOR-132 — Extraire pose un code article tenant.
 * Run: node sektor/e2e/scripts/verify-article-code-extraire-132.mjs
 *
 * Baseline vu rouge avant correctif : POST extraire-creer → GET item.code null.
 */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

function blank(v) {
  return v == null || String(v).trim() === '';
}

async function main() {
  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = await sessionRes.json();
  if (!session?.accessToken || !session?.tenantId) {
    console.log('SKIP cursor-session unavailable');
    process.exit(0);
  }
  const h = {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  const suffix = Date.now().toString(36);
  const designation = `Peinture Extraire 132 ${suffix}`;

  const created = await json(
    await fetch(`${API_BASE}/api/v1/items/extraire-creer`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        designation,
        nature: 'MATIERE',
        uniteCode: 'L',
      }),
    }),
  );
  if (created.status !== 201) {
    throw new Error(`extraire-creer ${created.status} ${created.text}`);
  }
  const itemId = created.body.itemId;
  const cleStable = created.body.cleStable;

  const item = await json(await fetch(`${API_BASE}/api/v1/items/${itemId}`, { headers: h }));
  if (!item.ok) throw new Error(`GET item ${item.status} ${item.text}`);

  if (blank(item.body.code)) {
    throw new Error(
      `VU ROUGE extraire-creer sans code tenant (cle_stable=${cleStable} code=${item.body.code})`,
    );
  }
  if (String(item.body.code).length > 20) {
    throw new Error(`code trop long pour le formulaire Articles: ${item.body.code}`);
  }

  const list = await json(await fetch(`${API_BASE}/api/v1/items?page=0&size=100`, { headers: h }));
  const rows = Array.isArray(list.body) ? list.body : list.body?.content ?? list.body?.items ?? [];
  const blanks = (Array.isArray(rows) ? rows : []).filter((r) => blank(r.code));
  if (blanks.length) {
    throw new Error(
      `liste Articles : ${blanks.length} ligne(s) sans code (${blanks
        .slice(0, 5)
        .map((r) => r.name || r.cleStable)
        .join(', ')})`,
    );
  }

  console.log(
    `PASS SEKTOR-132 — extraire-creer code=${item.body.code} cle_stable=${cleStable} liste sans vide`,
  );
}

main().catch((err) => {
  console.error(err.message || err);
  process.exit(1);
});
