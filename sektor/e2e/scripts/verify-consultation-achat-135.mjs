/**
 * Preuve SEKTOR-135 — devis consultation par import magique.
 * Run: node sektor/e2e/scripts/verify-consultation-achat-135.mjs
 *
 * Baseline vu rouge (22/08, objet 134 sans table devis / sans import) :
 *   POST /api/v1/consultations-achat/{id}/devis → 404
 *   GET  fiche : devisRecus reste 0, pas de lignes
 *   chrome : pas de nf-smart-import-trigger devis-consultation sur la fiche
 *
 * SEKTOR-281 : destinataireId requis ; statut consultation = PARTIELLE/COMPLETE
 * (plus DEVIS_RECU comme vérité unique). Trigger import par ligne destinataire.
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

function assertChromeFiche() {
  const here = dirname(fileURLToPath(import.meta.url));
  const web = join(here, '../../sources/web/app/achats/consultations');
  const detailTs = join(web, 'consultation-detail/consultation-detail.page.ts');
  const detailHtml = join(web, 'consultation-detail/consultation-detail.page.html');
  const handler = join(
    here,
    '../../sources/web/app/socle/shared/smart-import/handlers/devis-consultation-import.handler.ts',
  );
  const articleHandler = join(
    here,
    '../../sources/web/app/socle/shared/smart-import/handlers/article-import.handler.ts',
  );

  if (!existsSync(detailTs) || !existsSync(detailHtml)) {
    throw new Error('VU ROUGE chrome : fiche consultation absente (pas d’import)');
  }
  const html = readFileSync(detailHtml, 'utf8');
  const ts = readFileSync(detailTs, 'utf8');
  const src = `${html}\n${ts}`;
  if (!src.includes('nf-smart-import-trigger')) {
    throw new Error('VU ROUGE chrome : nf-smart-import-trigger absent de la fiche');
  }
  if (!src.includes('consultation-destinataire-import')) {
    throw new Error('VU ROUGE chrome : trigger import absent par ligne destinataire');
  }
  const importBlock = html.match(
    /<section[^>]*data-testid="consultation-achat-import"[\s\S]*?<\/section>/,
  );
  if (importBlock && /nf-smart-import-trigger/.test(importBlock[0])) {
    throw new Error('chrome : import magique orphelin encore sur le bloc global');
  }
  if (!existsSync(handler)) {
    throw new Error('VU ROUGE chrome : ExtractionDefinition devis-consultation absente');
  }
  const handlerSrc = readFileSync(handler, 'utf8');
  if (!handlerSrc.includes("key: 'devis-consultation'")) {
    throw new Error('chrome : key devis-consultation manquante');
  }
  if (handlerSrc.includes('ARTICLE_IMPORT_DEFINITION') || handlerSrc.includes('ArticlesApiService')) {
    throw new Error('chrome : import devis réutilise l’import articles catalogue');
  }
  if (/textarea[\s\S]*cle_stable\s*=\s*prix|cle_stable=prix/i.test(src)) {
    throw new Error('chrome : textarea cle_stable=prix sur la fiche (interdit)');
  }
  if (/<textarea/i.test(html)) {
    throw new Error('chrome : textarea sur la fiche (saisie manuelle prix interdite)');
  }
  const articleSrc = readFileSync(articleHandler, 'utf8');
  if (!articleSrc.includes("key: 'article'")) {
    throw new Error('chrome : handler articles catalogue disparu');
  }
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
  const h = headers(session);
  const suffix = Date.now().toString(36);

  assertChromeFiche();
  console.log('ok chrome fiche Import magique, pas textarea cle=prix');

  const partner = await json(
    await fetch(`${API_BASE}/api/v1/partners`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        code: `FRN135${suffix}`.slice(0, 30),
        raisonSociale: `Lafarge QA 135 ${suffix}`,
        roles: ['FOURNISSEUR'],
      }),
    }),
  );
  if (partner.status !== 201) throw new Error(`partner ${partner.status} ${partner.text}`);
  const contact = await json(
    await fetch(`${API_BASE}/api/v1/partner-contacts`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        partnerId: partner.body.id,
        nom: 'A. Benali',
        email: `achat-135-${suffix}@lafarge.example`,
      }),
    }),
  );
  if (contact.status !== 201 && contact.status !== 200) {
    throw new Error(`contact ${contact.status} ${contact.text}`);
  }

  const created = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fournisseurId: partner.body.id,
        clesStables: ['ciment-cpj-45'],
      }),
    }),
  );
  if (created.status !== 201) throw new Error(`create ${created.status} ${created.text}`);
  const id = created.body.id;
  if ((created.body.devisRecus ?? 0) !== 0) {
    throw new Error(`create : devisRecus ${created.body.devisRecus} (attendu 0)`);
  }

  const destRes = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${id}/destinataires`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ fournisseurId: partner.body.id }),
    }),
  );
  if (destRes.status !== 201) throw new Error(`destinataire ${destRes.status} ${destRes.text}`);
  const destId = (destRes.body.destinataires ?? [])[0]?.id;
  if (!destId) throw new Error(`destinataire id absent ${JSON.stringify(destRes.body)}`);

  const before = await json(await fetch(`${API_BASE}/api/v1/consultations-achat/${id}`, { headers: h }));
  if (!before.ok) throw new Error(`GET fiche ${before.status} ${before.text}`);
  if ((before.body.devisRecus ?? 0) !== 0) {
    throw new Error(`GET avant import : devisRecus ${before.body.devisRecus}`);
  }
  if (Array.isArray(before.body.devis) && before.body.devis.length > 0) {
    throw new Error('GET avant import : devis déjà présents');
  }

  const orphan = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${id}/devis`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        fichierNom: 'orphelin.pdf',
        lignes: [{ identite: 'ciment-cpj-45', libelle: 'Ciment', prixUnitaire: 1 }],
      }),
    }),
  );
  if (orphan.status === 404) {
    throw new Error('VU ROUGE import absent : POST /devis → 404');
  }
  if (orphan.status < 400 || orphan.status >= 500) {
    throw new Error(`POST devis sans destinataireId ${orphan.status} ${orphan.text} (attendu 4xx)`);
  }

  const empty = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${id}/devis`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({ destinataireId: destId, fichierNom: 'vide.pdf', lignes: [] }),
    }),
  );
  if (empty.status !== 400) {
    throw new Error(`POST devis vide ${empty.status} ${empty.text} (attendu 400)`);
  }

  const afterEmpty = await json(await fetch(`${API_BASE}/api/v1/consultations-achat/${id}`, { headers: h }));
  if ((afterEmpty.body.devisRecus ?? 0) !== 0 || afterEmpty.body.statut !== 'PREPARATION') {
    throw new Error(
      `fichier sans extraction a incrémenté : devisRecus=${afterEmpty.body.devisRecus} statut=${afterEmpty.body.statut}`,
    );
  }

  const imported = await json(
    await fetch(`${API_BASE}/api/v1/consultations-achat/${id}/devis`, {
      method: 'POST',
      headers: h,
      body: JSON.stringify({
        destinataireId: destId,
        fichierNom: 'devis-lafarge.pdf',
        lignes: [
          {
            identite: 'ciment-cpj-45',
            libelle: 'Ciment CPJ 45',
            quantite: 12,
            unite: 't',
            prixUnitaire: 1083.75,
          },
          {
            identite: 'sable-de-dune',
            libelle: 'Sable de dune',
            quantite: 8,
            unite: 'm3',
            prixUnitaire: 210,
          },
        ],
      }),
    }),
  );
  if (imported.status === 404) {
    throw new Error('VU ROUGE pas de lignes : POST /devis → 404');
  }
  if (imported.status !== 201) throw new Error(`POST devis ${imported.status} ${imported.text}`);
  if (imported.body.devisRecus !== 1) {
    throw new Error(`devisRecus après confirm ${imported.body.devisRecus}`);
  }
  if (imported.body.statut !== 'COMPLETE') {
    throw new Error(`statut ${imported.body.statut} (attendu COMPLETE, 1 destinataire)`);
  }
  const destStatut = (imported.body.destinataires ?? []).find((d) => d.id === destId)?.statut;
  if (destStatut !== 'DEVIS_RECU') {
    throw new Error(`destinataire statut ${destStatut}`);
  }
  const lignes = (imported.body.devis ?? []).flatMap((d) => d.lignes ?? []);
  if (lignes.length < 2) {
    throw new Error(`lignes persistées ${JSON.stringify(imported.body.devis)}`);
  }
  const ciment = lignes.find((l) => l.identite === 'ciment-cpj-45' || l.libelle?.includes('Ciment'));
  if (!ciment || Number(ciment.prixUnitaire) !== 1083.75 || Number(ciment.quantite) !== 12) {
    throw new Error(`ligne ciment ${JSON.stringify(ciment)}`);
  }

  const listed = await json(await fetch(`${API_BASE}/api/v1/consultations-achat`, { headers: h }));
  const row = listed.body?.find((r) => r.id === id);
  if (!row || row.devisRecus !== 1) {
    throw new Error(`liste devisRecus ${row?.devisRecus}`);
  }

  const front = await fetch(`${FRONT_BASE}/achats/consultations/${id}`, {
    headers: { Accept: 'text/html' },
  });
  if (!front.ok) {
    throw new Error(`front fiche /achats/consultations/:id ${front.status}`);
  }

  console.log('ok import confirmé', created.body.numero, '1 devis / 2 lignes, vide n’incrémente pas');
}

main().catch((e) => {
  console.error('FAIL', e.message || e);
  process.exit(1);
});
