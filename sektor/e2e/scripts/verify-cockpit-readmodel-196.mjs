/** Sonde cockpit SEKTOR-196 — vérifie l'endpoint sur un chantier existant. */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';
const chantierId = process.argv[2] ?? '96567fa1-ceaa-4e31-a9ce-99612400ee88';

async function main() {
  const res = await fetch(`${API_BASE}/api/public/dev/cursor-session`, { method: 'POST' });
  const s = await res.json();
  const h = { Authorization: `Bearer ${s.accessToken}`, 'X-Tenant-Id': s.tenantId, Accept: 'application/json' };
  const r = await fetch(`${API_BASE}/api/v1/chantiers/${chantierId}/cockpit`, { headers: h });
  const body = await r.json();
  console.log(`HTTP ${r.status}`);
  if (!r.ok) {
    console.log(JSON.stringify(body, null, 2));
    process.exit(1);
  }
  console.log(JSON.stringify({
    identity: body.identity,
    schedule: body.schedule,
    finance: body.finance,
    progress: { avancementPercent: body.progress?.avancementPercent, fluxMois: body.progress?.fluxMois },
    preparation: body.preparation?.map((p) => ({ code: p.code, etat: p.etat })),
    alerts: body.alerts?.map((a) => ({ code: a.code, severite: a.severite })),
    nextActions: body.nextActions?.map((a) => ({ priorite: a.priorite, libelle: a.libelle })),
    activityFeed: body.activityFeed?.length ?? 0,
  }, null, 2));
}

main().catch((e) => { console.error('FAIL', e); process.exit(1); });
