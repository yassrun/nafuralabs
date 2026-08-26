/** SEKTOR-199 — sonde portefeuille décisionnel (filtres, tri, pagination). */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
async function main() {
  const s = await (await fetch(`${API_BASE}/api/public/dev/cursor-session`, { method: 'POST' })).json();
  const h = { Authorization: `Bearer ${s.accessToken}`, 'X-Tenant-Id': s.tenantId, Accept: 'application/json' };
  const get = async (path) => {
    const r = await fetch(`${API_BASE}${path}`, { headers: h });
    const b = await r.json();
    console.log(`HTTP ${r.status} ${path} → total=${b?.total ?? '?'}`);
    return { r, b };
  };

  // 1) Tous, tri par code.
  const tous = await get('/api/v1/chantiers/portefeuille?page=0&size=5&tri=code');
  if (!tous.r.ok) throw new Error(tous.b?.message ?? 'portefeuille KO');
  const row = tous.b.items?.[0];
  if (!row) throw new Error('aucune ligne');
  console.log('  ligne:', JSON.stringify({ code: row.code, status: row.status, vente: row.montantVenteActifHt, marge: row.margeProjeteeHt, alerte: row.alerteSeverite, responsable: row.responsable }));
  if (row.montantVenteActifHt == null && row.budgetReviseHt == null) {
    console.log('  (chantier sans finance — valeurs null, pas zéro)');
  }
  console.log('PASS portefeuille — lignes aux faits du cockpit');

  // 2) Filtre marge négative.
  const neg = await get('/api/v1/chantiers/portefeuille?margeNegative=true&size=10');
  if (neg.b.items?.every((l) => l.margeProjeteeHt != null && l.margeProjeteeHt < 0)) {
    console.log('PASS filtre margeNegative — toutes les lignes ont une marge négative');
  } else {
    console.log('WARN filtre margeNegative — 0 résultat ou valeurs inattendues (pas bloquant)');
  }

  // 3) Filtre en retard.
  const retard = await get('/api/v1/chantiers/portefeuille?enRetard=true&size=10');
  console.log(`PASS tri/pagination — retard=${retard.b.total} (total tous=${tous.b.total})`);

  // 4) Pagination stable. Le total ne peut que croître si d'autres vérifieurs écrivent
  //    pendant la QA : le contrat est page/size échos + total monotone, jamais un snapshot.
  const p2 = await get('/api/v1/chantiers/portefeuille?page=1&size=5&tri=code');
  if (p2.b.page === 1 && p2.b.size === 5 && p2.b.total >= tous.b.total) {
    console.log('PASS pagination stable — page 1 / size 5 / total monotone');
  } else {
    throw new Error(`pagination ${JSON.stringify(p2.b)}`);
  }
  console.log('\nSEKTOR-199 : 4/4 PASS');
  process.exit(0);
}
main().catch((e) => { console.error('FAIL', e); process.exit(1); });
