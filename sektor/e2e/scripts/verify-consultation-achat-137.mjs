/**
 * Preuve SEKTOR-137 — flag CONSULTÉ après N devis extraits liés.
 * Run: node sektor/e2e/scripts/verify-consultation-achat-137.mjs
 *
 * Baseline vu rouge (22/08, checkbox identifier à la main / pas de CONSULTÉ auto) :
 *   import magique lié → DPU reste TARIF tant que POST …/consultation/identifier
 *   hors étude → aucun flag (attendu, déjà vrai)
 *   gate min N compte encore consultations_etudes / PDF orphelin
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

function assertChromeFlagAuto() {
  const here = dirname(fileURLToPath(import.meta.url));
  const web = join(here, '../../sources/web/app');
  const flag = join(
    here,
    '../../sources/backend/etudes/src/main/java/ma/nafura/etudes/service/ConsultationAchatFlagService.java',
  );
  const dialogTs = join(
    web,
    'etudes/dossiers/components/consultation-decompo-dialog/consultation-decompo-dialog.component.ts',
  );
  const pageHtml = join(web, 'etudes/dossiers/dossier-detail/dossier-detail.page.html');
  const panelHtml = join(
    web,
    'etudes/dossiers/components/consultation-etude-panel/consultation-etude-panel.component.html',
  );

  if (!existsSync(flag)) {
    throw new Error('VU ROUGE : pas de flag automatique (checkbox identifier reste le chemin)');
  }
  const flagSrc = readFileSync(flag, 'utf8');
  if (!flagSrc.includes('appliquerPrixConsulte') || !flagSrc.includes('consultationMinimum')) {
    throw new Error('VU ROUGE flag : CONSULTÉ / min N absents du service');
  }

  if (existsSync(pageHtml) && readFileSync(pageHtml, 'utf8').includes('app-consultation-etude-panel')) {
    throw new Error('chrome : checkbox identifier encore sur la page Coût');
  }
  if (existsSync(dialogTs)) {
    const dialogSrc = readFileSync(dialogTs, 'utf8');
    if (/identifierConsultation|Identifier les|cocher.*identit/i.test(dialogSrc)) {
      throw new Error('chrome : overlay demande encore identifier à la main');
    }
  }
  if (existsSync(panelHtml) && /type="checkbox"/.test(readFileSync(panelHtml, 'utf8'))) {
    // Panneau legacy encore dans le dépôt : ce n'est plus le chemin (retiré de la page).
  }
}

function gate4Bloque(gates) {
  const g = (gates ?? []).find((x) => x.etape === 4);
  return Boolean(g && g.bloquant && (g.problemes ?? []).length > 0);
}

async function createItem(h, name, cleStable) {
  const created = await json(
    await fetch(`${API_BASE}/api/v1/items`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ name, nature: 'MATIERE', isActive: true, cleStable }),
    }),
  );
  if (created.status !== 201) throw new Error(`item ${name} ${created.status} ${created.text}`);
  return created.body.id;
}

async function addNoeud(h, dpgfId, body) {
  const res = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpgf/${dpgfId}/noeuds`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify(body),
    }),
  );
  if (res.status !== 201) throw new Error(`noeud ${body.code} ${res.status} ${res.text}`);
  return res.body.id;
}

async function createDpu(h, noeudId, itemId, libelle, prix, unite) {
  const dpu = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpu`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ dpgfNoeudId: noeudId }),
    }),
  );
  if (dpu.status !== 201) throw new Error(`dpu ${libelle} ${dpu.status} ${dpu.text}`);
  const composant = await json(
    await fetch(`${API_BASE}/api/v1/etudes/dpu/${dpu.body.id}/composants`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        type: 'MATIERE',
        referenceType: 'ITEM',
        itemId,
        libelle,
        rendement: 1,
        unite,
        prixUnitaire: prix,
        sourcePrix: 'TARIF',
        prixLibelleSource: 'tarif-qa-137',
      }),
    }),
  );
  if (composant.status !== 201) throw new Error(`composant ${libelle} ${composant.status} ${composant.text}`);
  return dpu.body.id;
}

async function dpuComps(h, dpuId) {
  const res = await json(await fetch(`${API_BASE}/api/v1/etudes/dpu/${dpuId}/composants`, { headers: h }));
  if (!res.ok) throw new Error(`GET dpu ${dpuId} ${res.status} ${res.text}`);
  return res.body ?? [];
}

async function importDevis(h, consultationId, lignes) {
  return json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${consultationId}/devis`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fichierNom: 'devis-137.pdf', lignes }),
    }),
  );
}

async function main() {
  assertChromeFlagAuto();
  console.log('ok chrome : flag auto, pas de checkbox identifier sur Coût / overlay');

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
  const cleCiment = `ciment-cpj-45-${suffix}`;
  const clePeinture = `peinture-acrylique-${suffix}`;

  let ingenieurs = [];
  const ingRes = await fetch(`${API_BASE}/api/v1/etudes/ingenieurs`, { headers: h });
  if (ingRes.ok) ingenieurs = await ingRes.json();
  const chargeEtudeUserId = ingenieurs[0]?.userId ?? session.userId;

  const prev = await json(await fetch(`${API_BASE}/api/v1/etudes/parametres/consultation`, { headers: h }));
  const prevMode = prev.body?.mode ?? 'OPTIONNELLE';
  const prevMin = prev.body?.minimum ?? 1;

  try {
    const putN1 = await json(
      await fetch(`${API_BASE}/api/v1/etudes/parametres/consultation`, {
        method: 'PUT',
        headers: h,
        body: JSON.stringify({ mode: 'OBLIGATOIRE', minimum: 1 }),
      }),
    );
    if (!putN1.ok) throw new Error(`PUT parametres ${putN1.status} ${putN1.text}`);

    const cimentItemId = await createItem(h, `Ciment CPJ 45 ${suffix}`, cleCiment);
    const peintureItemId = await createItem(h, `Peinture ${suffix}`, clePeinture);

    const dossier = await json(
      await fetch(`${API_BASE}/api/v1/etudes/dossiers`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          objet: `QA 137 flag ${suffix}`,
          chargeEtudeUserId,
          clientNom: 'MOA QA 137',
        }),
      }),
    );
    if (dossier.status !== 201) throw new Error(`dossier ${dossier.status} ${dossier.text}`);
    const dossierId = dossier.body.id;

    const bordereau = await json(
      await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/documents/init-bordereau-manuel`, {
        method: 'POST',
        headers: h,
      }),
    );
    if (!bordereau.ok) throw new Error(`bordereau ${bordereau.status} ${bordereau.text}`);
    const dpgfId = bordereau.body.dpgfId;

    const lotId = await addNoeud(h, dpgfId, { type: 'LOT', code: '01', libelle: 'GO' });
    const slId = await addNoeud(h, dpgfId, {
      type: 'SOUS_LOT',
      parentId: lotId,
      code: '01.01',
      libelle: 'Béton',
    });
    const a1 = await addNoeud(h, dpgfId, {
      type: 'ARTICLE',
      parentId: slId,
      code: '01.01.01',
      libelle: 'Poste 1',
      quantite: 10,
      unite: 'm3',
      origineCout: 'DECOMPOSE',
    });
    const a2 = await addNoeud(h, dpgfId, {
      type: 'ARTICLE',
      parentId: slId,
      code: '01.01.02',
      libelle: 'Poste 2',
      quantite: 5,
      unite: 'm3',
      origineCout: 'DECOMPOSE',
    });
    const a3 = await addNoeud(h, dpgfId, {
      type: 'ARTICLE',
      parentId: slId,
      code: '01.01.03',
      libelle: 'Poste 3',
      quantite: 8,
      unite: 'm3',
      origineCout: 'DECOMPOSE',
    });
    const aP = await addNoeud(h, dpgfId, {
      type: 'ARTICLE',
      parentId: slId,
      code: '01.01.04',
      libelle: 'Peinture',
      quantite: 20,
      unite: 'm2',
      origineCout: 'DECOMPOSE',
    });

    const dpuC1 = await createDpu(h, a1, cimentItemId, 'Ciment', 100, 'T');
    const dpuC2 = await createDpu(h, a2, cimentItemId, 'Ciment', 100, 'T');
    const dpuC3 = await createDpu(h, a3, cimentItemId, 'Ciment', 100, 'T');
    const dpuP = await createDpu(h, aP, peintureItemId, 'Peinture', 40, 'L');

    const partner = await json(
      await fetch(`${API_BASE}/api/v1/partners`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          code: `FRN137${suffix}`.slice(0, 30),
          raisonSociale: `Lafarge QA 137 ${suffix}`,
          roles: ['FOURNISSEUR'],
        }),
      }),
    );
    if (partner.status !== 201) throw new Error(`partner ${partner.status} ${partner.text}`);

    const hors = await json(
      await fetch(`${API_BASE}/api/v1/consultations-achat`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          fournisseurId: partner.body.id,
          clesStables: [cleCiment],
        }),
      }),
    );
    if (hors.status !== 201) throw new Error(`hors ${hors.status} ${hors.text}`);
    if (hors.body.dossierEtudeId != null) throw new Error('attendue hors étude');

    const horsImport = await importDevis(h, hors.body.id, [
      { identite: cleCiment, libelle: 'Ciment CPJ 45', quantite: 12, unite: 't', prixUnitaire: 1083.75 },
    ]);
    if (horsImport.status !== 201) throw new Error(`import hors ${horsImport.status} ${horsImport.text}`);

    for (const dpuId of [dpuC1, dpuC2, dpuC3]) {
      const comps = await dpuComps(h, dpuId);
      if (comps.some((c) => c.itemId === cimentItemId && c.sourcePrix === 'CONSULTE')) {
        throw new Error('hors étude a flagué le DPU (interdit)');
      }
      if (!comps.some((c) => c.itemId === cimentItemId && c.sourcePrix === 'TARIF')) {
        throw new Error(`hors étude : ciment plus TARIF ${JSON.stringify(comps)}`);
      }
    }
    console.log('ok hors étude : pas de flag DPU');

    const orphan = await json(
      await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({ partenaireIds: [partner.body.id] }),
      }),
    );
    if (orphan.status === 201) {
      await json(
        await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/consultation/devis`, {
          method: 'POST',
          headers: h,
          body: JSON.stringify({ partenaireId: partner.body.id }),
        }),
      );
    }

    const gatesHors = await json(await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/gates`, { headers: h }));
    if (!gatesHors.ok) throw new Error(`gates hors ${gatesHors.status} ${gatesHors.text}`);
    if (!gate4Bloque(gatesHors.body)) {
      throw new Error('VU ROUGE gate : devis hors étude / PDF orphelin a compté pour min N');
    }
    console.log('ok gate : hors étude + orphelin ne comptent pas');

    const liee = await json(
      await fetch(`${API_BASE}/api/v1/consultations-achat`, {
        method: 'POST',
        headers: h,
        body: JSON.stringify({
          fournisseurId: partner.body.id,
          dossierEtudeId: dossierId,
          clesStables: [cleCiment, cleCiment, cleCiment, clePeinture],
        }),
      }),
    );
    if (liee.status !== 201) throw new Error(`liée ${liee.status} ${liee.text}`);

    const imported = await importDevis(h, liee.body.id, [
      { identite: cleCiment, libelle: 'Ciment CPJ 45', quantite: 12, unite: 't', prixUnitaire: 1083.75 },
    ]);
    if (imported.status !== 201) throw new Error(`import liée ${imported.status} ${imported.text}`);

    // Pas de POST identifier — c'est le vu rouge d'avant.
    for (const dpuId of [dpuC1, dpuC2, dpuC3]) {
      const comps = await dpuComps(h, dpuId);
      const hit = comps.find((c) => c.itemId === cimentItemId);
      if (!hit || hit.sourcePrix !== 'CONSULTE') {
        throw new Error(
          `VU ROUGE identifier à la main : ciment poste ${dpuId} sourcePrix=${hit?.sourcePrix} (attendu CONSULTE sans identifier)`,
        );
      }
      if (Number(hit.prixUnitaire) !== 1083.75) {
        throw new Error(`PU ciment ${hit.prixUnitaire} (attendu 1083.75)`);
      }
    }
    const peintureComps = await dpuComps(h, dpuP);
    const peint = peintureComps.find((c) => c.itemId === peintureItemId);
    if (peint?.sourcePrix === 'CONSULTE') {
      throw new Error('peinture non extraite flaguée');
    }
    if (peint?.sourcePrix !== 'TARIF') {
      throw new Error(`peinture sourcePrix=${peint?.sourcePrix} (attendu TARIF)`);
    }
    console.log('ok liée N=1 : ciment CONSULTÉ ×3, peinture tarif, sans identifier');

    const gatesLiee = await json(await fetch(`${API_BASE}/api/v1/etudes/dossiers/${dossierId}/gates`, { headers: h }));
    if (!gatesLiee.ok) throw new Error(`gates liée ${gatesLiee.status} ${gatesLiee.text}`);
    if (gate4Bloque(gatesLiee.body)) {
      throw new Error('gate : import extrait lié n’a pas levé le min N');
    }
    console.log('ok gate : 1 devis importé extrait lié compte');

    const front = await fetch(`${FRONT_BASE}/etudes/dossiers/${dossierId}`, {
      headers: { Accept: 'text/html' },
    });
    if (!front.ok) throw new Error(`front dossier ${front.status}`);

    console.log('ok 137 flag CONSULTÉ auto, hors étude silencieux, gate liées only');
  } finally {
    await fetch(`${API_BASE}/api/v1/etudes/parametres/consultation`, {
      method: 'PUT',
      headers: h,
      body: JSON.stringify({ mode: prevMode, minimum: prevMin }),
    });
  }
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
