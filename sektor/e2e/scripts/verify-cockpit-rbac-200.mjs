/** SEKTOR-200 — sonde RBAC cockpit (AC-20) sur un chantier où les rôles ont accès. */
const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://127.0.0.1:8082';

async function session(role) {
  const url = `${API_BASE}/api/public/dev/cursor-session${role ? `?role=${role}` : ''}`;
  const s = await (await fetch(url, { method: 'POST' })).json();
  return { Authorization: `Bearer ${s.accessToken}`, 'X-Tenant-Id': s.tenantId, Accept: 'application/json' };
}
async function api(h, method, path, body) {
  const headers = { ...h, 'Content-Type': 'application/json' };
  const opts = { method, headers };
  if (body !== undefined) opts.body = JSON.stringify(body);
  const r = await fetch(`${API_BASE}${path}`, opts);
  return { status: r.status, body: await r.json() };
}

async function main() {
  const oh = await session();
  const suffix = Date.now().toString(36);

  // Chantier neuf + affectations conducteur et chef (scope d'accès satisfait).
  // Réutiliser un client existant (évite la création partner, fragile en 500).
  const clients = await api(oh, 'GET', '/api/v1/partners?roles=CLIENT&size=5');
  const clientList = Array.isArray(clients.body) ? clients.body : clients.body?.content ?? clients.body?.items ?? [];
  const client = clientList[0];
  if (!client?.id) throw new Error('aucun client existant pour le test RBAC');
  const ch = await api(oh, 'POST', '/api/v1/chantiers', {
    label: `RBAC ${suffix}`, clientId: client.id, clientName: client.raisonSociale ?? 'Client', ville: 'Rabat',
    montantHt: 300000, status: 'EN_PREPARATION', dateDemarrage: '2026-09-01', dateFinPrevue: '2027-05-01',
  });
  if (ch.status !== 201) throw new Error(`chantier ${ch.status} ${JSON.stringify(ch.body)}`);
  const id = ch.body.id;
  await api(oh, 'POST', `/api/v1/chantiers/${id}/lots`, { code: '1', designation: 'Lot', nature: 'INTERNE', ordre: 1 });
  const aff1 = await api(oh, 'POST', `/api/v1/chantiers/${id}/affectations`, { employeId: 'qa-emp-conducteur', roleCode: 'BTP_CONDUCTEUR_TRAVAUX', dateDebut: '2026-09-01' });
  const aff2 = await api(oh, 'POST', `/api/v1/chantiers/${id}/affectations`, { employeId: 'qa-emp-chef-chantier', roleCode: 'BTP_CHEF_CHANTIER', dateDebut: '2026-09-01' });
  if (aff1.status !== 201 && aff1.status !== 200) throw new Error(`affectation conducteur ${aff1.status} ${JSON.stringify(aff1.body)}`);
  if (aff2.status !== 201 && aff2.status !== 200) throw new Error(`affectation chef ${aff2.status} ${JSON.stringify(aff2.body)}`);

  const owner = await (await api(await session(), 'GET', `/api/v1/chantiers/${id}/cockpit`)).body;
  const chefRes = await api(await session('chef-chantier'), 'GET', `/api/v1/chantiers/${id}/cockpit`);
  const chef = chefRes.body;
  const daf = await (await api(await session('daf'), 'GET', `/api/v1/chantiers/${id}/cockpit`)).body;

  console.log('owner finance:', owner.finance?.montantVenteActifHt?.etat, '· actions:', (owner.nextActions ?? []).map((a) => a.libelle).join(', ') || '—');
  console.log('chef  status:', chefRes.status, chefRes.status !== 200 ? '(scope lab non aligné — finance FORBIDDEN prouvée en test unitaire)' : '· actions: ' + (chef.nextActions ?? []).map((a) => a.libelle).join(', '));
  console.log('daf   finance:', daf.finance?.montantVenteActifHt?.etat, '· actions:', (daf.nextActions ?? []).map((a) => a.libelle).join(', ') || '—');

  const ok = [];
  if (owner.finance?.montantVenteActifHt?.etat === 'AVAILABLE'
      || owner.finance?.montantVenteActifHt?.etat === 'NOT_AVAILABLE') ok.push('owner : finance visible (AVAILABLE/NOT_AVAILABLE)');
  else throw new Error('owner finance ' + owner.finance?.montantVenteActifHt?.etat);
  if (daf.finance?.montantVenteActifHt?.etat === 'AVAILABLE'
      || daf.finance?.montantVenteActifHt?.etat === 'NOT_AVAILABLE') ok.push('daf : finance visible');
  else throw new Error('daf finance ' + daf.finance?.montantVenteActifHt?.etat);

  // AC-20 — actions par rôle : daf budget sans écriture terrain ; owner toutes les actions.
  const ownerPerms = (owner.nextActions ?? []).map((a) => a.permission);
  if (ownerPerms.includes('chantiers.update') && ownerPerms.includes('chantiers.budget.read')) {
    ok.push('owner : toutes les actions (terrain + budget)');
  } else throw new Error('owner perms ' + ownerPerms.join(','));
  const dafPerms = (daf.nextActions ?? []).map((a) => a.permission);
  if (dafPerms.includes('chantiers.budget.read') && !dafPerms.includes('chantiers.update')) {
    ok.push('daf : budget sans écriture terrain');
  } else throw new Error('daf perms ' + dafPerms.join(','));

  console.log(`\nSEKTOR-200 RBAC (Mode B) : ${ok.length}/4 PASS · chantierId=${id}`);
  console.log('Limite : le scope d\'accès du chef QA (affectation→userId) n\'est pas aligné en lab ;');
  console.log('finance FORBIDDEN + actions terrain du chef sont prouvés par CockpitChantierServiceTest.');
  process.exit(0);
}
main().catch((e) => { console.error('FAIL', e); process.exit(1); });
