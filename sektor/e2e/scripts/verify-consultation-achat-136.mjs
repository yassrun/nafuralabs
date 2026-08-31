/**
 * Preuve SEKTOR-136 — popup consultation depuis la décompo.
 * Run: node sektor/e2e/scripts/verify-consultation-achat-136.mjs
 *
 * Baseline vu rouge (22/08, panneau page Coût) :
 *   dossier-detail.page.html contient encore app-consultation-etude-panel
 *   overlay consultation-decompo-dialog absent
 *   PATCH /api/v1/consultations-achat/{id}/panier → 404
 */
import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const API_BASE = process.env.NAFURA_QA_API_BASE ?? 'http://localhost:8082';
const FRONT_BASE = process.env.NAFURA_QA_FRONT_BASE ?? 'http://127.0.0.1:4200';

async function json(res) {
  const text = await res.text();
  try {
    return { status: res.status, ok: res.ok, body: JSON.parse(text), text };
  } catch {
    return { status: res.status, ok: res.ok, body: null, text };
  }
}

function headers(session) {
  return {
    Authorization: `Bearer ${session.accessToken}`,
    'X-Tenant-Id': session.tenantId,
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };
}

function assertChromeOverlay() {
  const here = dirname(fileURLToPath(import.meta.url));
  const web = join(here, '../../sources/web/app');
  const pageHtml = join(web, 'etudes/dossiers/dossier-detail/dossier-detail.page.html');
  const pageTs = join(web, 'etudes/dossiers/dossier-detail/dossier-detail.page.ts');
  const pageScss = join(web, 'etudes/dossiers/dossier-detail/dossier-detail.page.scss');
  const workspaceHtml = join(
    web,
    'etudes/dossiers/components/decomposition-workspace/decomposition-workspace.component.html',
  );
  const workspaceTs = join(
    web,
    'etudes/dossiers/components/decomposition-workspace/decomposition-workspace.component.ts',
  );
  const dialogDir = join(web, 'etudes/dossiers/components/consultation-decompo-dialog');
  const dialogTs = join(dialogDir, 'consultation-decompo-dialog.component.ts');
  const panelAction = join(
    web,
    'etudes/dossiers/components/poste-decomposition-panel/poste-decomposition-panel.component.html',
  );

  const html = readFileSync(pageHtml, 'utf8');
  const ts = readFileSync(pageTs, 'utf8');
  const scss = existsSync(pageScss) ? readFileSync(pageScss, 'utf8') : '';
  if (html.includes('app-consultation-etude-panel')) {
    throw new Error('VU ROUGE page Coût : app-consultation-etude-panel encore dans dossier-detail');
  }
  if (ts.includes('ConsultationEtudePanelComponent')) {
    throw new Error('VU ROUGE page Coût : ConsultationEtudePanelComponent encore importé');
  }
  if (scss.includes('app-consultation-etude-panel')) {
    throw new Error('VU ROUGE page Coût : style panneau encore dans dossier-detail.page.scss');
  }

  if (!existsSync(dialogTs)) {
    throw new Error('VU ROUGE overlay : consultation-decompo-dialog absent');
  }
  const dialogSrc = readFileSync(dialogTs, 'utf8');
  if (!/nf-select/.test(dialogSrc) || !/lookupKey="fournisseurs"/.test(dialogSrc)) {
    throw new Error('VU ROUGE overlay : combobox fournisseur (lookup Achats) absent');
  }
  if (/<select[\s\S]{0,240}name="fournisseurId"/.test(dialogSrc) || /pageSize:\s*200/.test(dialogSrc)) {
    throw new Error('VU ROUGE overlay : encore dump <select> fournisseur');
  }
  if (!/creerConsultation/i.test(dialogSrc)) {
    throw new Error('VU ROUGE overlay : action Créer une consultation absente');
  }
  if (!/ajouterArticleCourant/.test(dialogSrc)) {
    throw new Error('VU ROUGE overlay : action Ajouter article courant absente');
  }
  if (/type="text"[\s\S]{0,80}fournisseurId|UUID collé|coller un UUID/i.test(dialogSrc)) {
    throw new Error('overlay : saisie UUID fournisseur (interdit)');
  }

  const workspace = `${readFileSync(workspaceHtml, 'utf8')}\n${readFileSync(workspaceTs, 'utf8')}`;
  if (!/ouvrirConsultation|consultation-decompo|Créer une consultation/i.test(workspace)) {
    throw new Error('VU ROUGE arbre : pas de geste overlay depuis la décompo');
  }

  const panelHtml = readFileSync(panelAction, 'utf8');
  if (!/Ajouter à une consultation/i.test(panelHtml)) {
    throw new Error('VU ROUGE composant : action Ajouter à une consultation absente');
  }
}

async function main() {
  assertChromeOverlay();
  console.log('ok chrome : page Coût sans panneau, overlay + Ajouter à');

  const sessionRes = await fetch(`${API_BASE}/api/public/dev/cursor-session`, {
    method: 'POST',
    headers: { Accept: 'application/json' },
  });
  const session = await sessionRes.json();
  if (!session?.accessToken || !session?.tenantId) {
    console.log('SKIP cursor-session unavailable');
    process.exit(0);
  }
  const h = headers(session);
  const suffix = Date.now().toString(36);

  let ingenieurs = [];
  const ingRes = await fetch(`${API_BASE}/api/v1/etudes/ingenieurs`, { headers: h });
  if (ingRes.ok) ingenieurs = await ingRes.json();
  const chargeEtudeUserId = ingenieurs[0]?.userId ?? session.userId;

  const dossier = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dossiers`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        objet: `QA 136 popup ${suffix}`,
        chargeEtudeUserId,
        clientNom: 'MOA QA 136',
      }),
    }),
  );
  if (dossier.status !== 201) throw new Error(`dossier ${dossier.status} ${dossier.text}`);
  const dossierId = dossier.body.id;

  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRN136${suffix}`.slice(0, 30),
        raisonSociale: `Lafarge QA 136 ${suffix}`,
        roles: ['FOURNISSEUR'],
      }),
    }),
  );
  if (partner.status !== 201) throw new Error(`partner ${partner.status} ${partner.text}`);

  const created = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fournisseurId: partner.body.id,
        dossierEtudeId: dossierId,
        clesStables: ['ciment-cpj-45', 'ciment-cpj-45', 'ciment-cpj-45', 'sable-de-dune'],
      }),
    }),
  );
  if (created.status !== 201) throw new Error(`create liée ${created.status} ${created.text}`);
  if (created.body.dossierEtudeId !== dossierId) {
    throw new Error(`attendue liée ${dossierId}, reçu ${created.body.dossierEtudeId}`);
  }
  const cles = created.body.clesStables ?? [];
  if (cles.filter((c) => c === 'ciment-cpj-45').length !== 1) {
    throw new Error(`ciment 3 postes ≠ 1 ligne panier : ${JSON.stringify(cles)}`);
  }
  if (!cles.includes('sable-de-dune')) {
    throw new Error(`panier ${JSON.stringify(cles)}`);
  }
  console.log('ok create liée depuis l’arbre', created.body.numero, 'ciment une fois');

  const hors = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fournisseurId: partner.body.id,
        clesStables: ['peinture'],
      }),
    }),
  );
  if (hors.status !== 201) throw new Error(`create hors ${hors.status} ${hors.text}`);

  const patched = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${hors.body.id}/panier`, {
      method: 'PATCH',
      headers: h,
      body: JSON.stringify({
        clesStables: ['ciment-cpj-45', 'ciment-cpj-45', 'peinture'],
        dossierEtudeId: dossierId,
      }),
    }),
  );
  if (patched.status === 404) {
    throw new Error('VU ROUGE PATCH panier absent : PATCH …/panier → 404');
  }
  if (!patched.ok) throw new Error(`PATCH panier ${patched.status} ${patched.text}`);
  const panier = patched.body.clesStables ?? [];
  if (panier.filter((c) => c === 'ciment-cpj-45').length !== 1) {
    throw new Error(`PATCH ciment dupliqué : ${JSON.stringify(panier)}`);
  }
  if (!panier.includes('peinture') || !panier.includes('ciment-cpj-45')) {
    throw new Error(`PATCH merge ${JSON.stringify(panier)}`);
  }
  if (patched.body.dossierEtudeId !== dossierId) {
    throw new Error(`PATCH n’a pas lié l’étude : ${patched.body.dossierEtudeId}`);
  }
  console.log('ok PATCH panier merge + lien étude', patched.body.numero);

  const front = await fetch(`${FRONT_BASE}/etudes/dossiers/${dossierId}`, {
    headers: { Accept: 'text/html' },
  });
  if (!front.ok) {
    throw new Error(`front dossier ${front.status}`);
  }

  console.log('ok 136 page Coût sans panneau, overlay, consultation liée');
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
