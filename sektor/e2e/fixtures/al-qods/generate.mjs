/**
 * Génère les documents Al Qods (PDF extractibles, CSV, JSON attendus).
 * Run: node sektor/e2e/fixtures/al-qods/generate.mjs
 *
 * Les PDF sont du texte Helvetica / WinAnsi : Extraire et l'import magique
 * peuvent les lire. Les JSON `expected/` sont le gold de confirmation
 * (POST /consultations-achat/{id}/devis et formulaire réception BL).
 */
import { copyFileSync, existsSync, mkdirSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = dirname(fileURLToPath(import.meta.url));
const PHOTO_DIRS = [
  join(ROOT, 'photos'),
  'C:/Users/yassiveco/.cursor/projects/c-Users-yassiveco-Desktop-Nafura-Platform-nafuralabs/assets',
];

function pdfEscape(s) {
  return String(s)
    .replace(/\\/g, '\\\\')
    .replace(/\(/g, '\\(')
    .replace(/\)/g, '\\)')
    .replace(/é/g, '\\351')
    .replace(/è/g, '\\350')
    .replace(/ê/g, '\\352')
    .replace(/ë/g, '\\353')
    .replace(/à/g, '\\340')
    .replace(/â/g, '\\342')
    .replace(/ä/g, '\\344')
    .replace(/ù/g, '\\371')
    .replace(/û/g, '\\373')
    .replace(/ü/g, '\\374')
    .replace(/ô/g, '\\364')
    .replace(/ö/g, '\\366')
    .replace(/î/g, '\\356')
    .replace(/ï/g, '\\357')
    .replace(/ç/g, '\\347')
    .replace(/É/g, '\\311')
    .replace(/È/g, '\\310')
    .replace(/À/g, '\\300')
    .replace(/Â/g, '\\302')
    .replace(/Ç/g, '\\307')
    .replace(/œ/g, 'oe')
    .replace(/Œ/g, 'OE')
    .replace(/—/g, '-')
    .replace(/–/g, '-')
    .replace(/’/g, "'")
    .replace(/‘/g, "'")
    .replace(/«/g, '"')
    .replace(/»/g, '"')
    .replace(/°/g, '\\260')
    .replace(/²/g, '\\262')
    .replace(/³/g, '\\263')
    .replace(/€/g, 'MAD');
}

function buildPdf(lines, { fontSize = 10 } = {}) {
  const pageW = 595;
  const pageH = 842;
  const marginX = 48;
  const marginTop = 50;
  const marginBot = 48;
  const leading = fontSize + 4;
  const pages = [];
  let ops = [];
  let y = pageH - marginTop;
  let firstOnPage = true;

  const flush = () => {
    ops.push('ET');
    pages.push(ops.join('\n'));
    ops = [];
    y = pageH - marginTop;
    firstOnPage = true;
  };

  ops.push('BT');
  ops.push(`/F1 ${fontSize} Tf`);
  ops.push(`${marginX} ${y} Td`);

  for (const raw of lines) {
    const text = pdfEscape(raw);
    if (y - leading < marginBot) {
      flush();
      ops.push('BT');
      ops.push(`/F1 ${fontSize} Tf`);
      ops.push(`${marginX} ${y} Td`);
    }
    if (firstOnPage) {
      ops.push(`(${text}) Tj`);
      firstOnPage = false;
    } else {
      ops.push(`0 ${-leading} Td (${text}) Tj`);
      y -= leading;
    }
  }
  flush();

  const objs = [];
  const add = (body) => {
    objs.push(body);
    return objs.length;
  };

  const fontId = add('<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>');
  const contentIds = pages.map((stream) =>
    add(`<< /Length ${Buffer.byteLength(stream, 'latin1')} >>\nstream\n${stream}\nendstream`),
  );
  const pageIds = contentIds.map((contentId) =>
    add(
      `<< /Type /Page /Parent PAGES /MediaBox [0 0 ${pageW} ${pageH}] /Contents ${contentId} 0 R /Resources << /Font << /F1 ${fontId} 0 R >> >> >>`,
    ),
  );
  const pagesId = add(`<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(' ')}] /Count ${pageIds.length} >>`);
  const catalogId = add(`<< /Type /Catalog /Pages ${pagesId} 0 R >>`);

  const bodies = objs.map((body) => body.replaceAll('PAGES', `${pagesId} 0 R`));
  let out = '%PDF-1.4\n';
  const offsets = [0];
  for (let i = 0; i < bodies.length; i++) {
    offsets.push(Buffer.byteLength(out, 'latin1'));
    out += `${i + 1} 0 obj\n${bodies[i]}\nendobj\n`;
  }
  const xrefAt = Buffer.byteLength(out, 'latin1');
  out += `xref\n0 ${bodies.length + 1}\n`;
  out += '0000000000 65535 f \n';
  for (let i = 1; i <= bodies.length; i++) {
    out += `${String(offsets[i]).padStart(10, '0')} 00000 n \n`;
  }
  out += `trailer << /Size ${bodies.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefAt}\n%%EOF\n`;
  return Buffer.from(out, 'latin1');
}

function write(rel, content) {
  const path = join(ROOT, rel);
  mkdirSync(dirname(path), { recursive: true });
  writeFileSync(path, content);
  return rel;
}

function writeJson(rel, obj) {
  return write(rel, `${JSON.stringify(obj, null, 2)}\n`);
}

const BDP_CSV = `Spreadsheet file: al-qods-bdp.csv

1 TERRASSEMENT
1\tTerrassement general\tfft\t1,00

2 GROS OEUVRE
2.1\tBeton B25 fondations\tm3\t180,00
2.2\tAcier HA\tt\t25,00
2.3\tCoffrage\tm2\t850,00

3 ETANCHEITE
3\tEtancheite toiture\tm2\t420,00
`;

const IM01 = {
  cas: 'IM-01',
  fichierNom: 'IM-01-devis-lafarge-ciment.pdf',
  fournisseur: 'Ciments Lafarge Maroc',
  clesStables: ['ciment-cpj-45'],
  attendu: {
    devisRecusDelta: 1,
    statut: 'DEVIS_RECU',
    lignes: [
      {
        identite: 'ciment-cpj-45',
        libelle: 'Ciment CPJ 45',
        quantite: 40,
        unite: 't',
        prixUnitaire: 1083.75,
      },
      {
        identite: 'sable-0-5',
        libelle: 'Sable 0/5',
        quantite: 80,
        unite: 'm3',
        prixUnitaire: 95,
      },
    ],
  },
};

const IM02 = {
  cas: 'IM-02',
  fichierNom: 'IM-02-devis-holcim-ciment.pdf',
  fournisseur: 'Holcim Maroc',
  clesStables: ['ciment-cpj-45'],
  attendu: {
    devisRecusDelta: 1,
    composantCiment: 'CONSULTE',
    lignes: [
      {
        identite: 'ciment-cpj-45',
        libelle: 'Ciment CPJ 45',
        quantite: 40,
        unite: 't',
        prixUnitaire: 1050,
      },
    ],
  },
};

const IM03 = {
  cas: 'IM-03',
  fichierNom: 'IM-03-devis-vide.pdf',
  fournisseur: 'Ciments Lafarge Maroc',
  clesStables: ['ciment-cpj-45'],
  attendu: {
    postStatus: 400,
    devisRecusDelta: 0,
    statutInchange: 'DEMANDE',
    lignes: [],
  },
};

const IM04 = {
  cas: 'IM-04',
  fichierNom: 'IM-04-devis-hors-panier-peinture.pdf',
  fournisseur: 'Holcim Maroc',
  clesStables: ['ciment-cpj-45'],
  note: 'PARTIAL : ciment matché, peinture hors panier DPU — ne pas créer un article catalogue.',
  attendu: {
    importPolicy: 'PARTIAL',
    lignes: [
      {
        identite: 'ciment-cpj-45',
        libelle: 'Ciment CPJ 45',
        quantite: 40,
        unite: 't',
        prixUnitaire: 1065,
      },
      {
        identite: 'peinture-ext',
        libelle: 'Peinture facade acrylique',
        quantite: 120,
        unite: 'kg',
        prixUnitaire: 42,
      },
    ],
    horsPanier: ['peinture-ext'],
  },
};

const IM05 = {
  cas: 'IM-05',
  fichierNom: 'IM-05-devis-sonasid-acier.pdf',
  fournisseur: 'Sonasid',
  clesStables: ['acier-ha'],
  attendu: {
    devisRecusDelta: 1,
    lignes: [
      {
        identite: 'acier-ha',
        libelle: 'Acier HA Fe E500',
        quantite: 25,
        unite: 't',
        prixUnitaire: 9800,
      },
    ],
  },
};

const BL01 = {
  cas: 'BL-01',
  fichierNom: 'BL-01-lafarge-ciment-40t.pdf',
  kind: 'happy',
  attenduExtraction: {
    blReference: '44012',
    date: '2026-09-12',
    issuer: 'Ciments Lafarge Maroc',
    sender: {
      name: 'Ciments Lafarge Maroc',
      address: 'Usine Bouskoura, Casablanca',
    },
    receiver: {
      name: 'STE Al Binaa',
      address: 'Chantier Groupe scolaire Al Qods, Rabat',
    },
    items: [
      {
        itemReference: 'ciment-cpj-45',
        itemDesignation: 'Ciment CPJ 45',
        quantity: 40,
        uom: 't',
        unitPrice: 1083.75,
        totalPrice: 43350,
      },
    ],
  },
  attenduMetier: {
    noeud: '2.1',
    bcQte: 40,
    recu: 40,
    resteALivrer: 0,
    destination: 'DIRECT_CHANTIER',
  },
};

const BL02 = {
  cas: 'BL-02',
  fichierNom: 'BL-02-acier-partiel-12t.pdf',
  kind: 'partiel',
  attenduExtraction: {
    blReference: '55101',
    date: '2026-10-05',
    issuer: 'Sonasid',
    sender: { name: 'Sonasid', address: 'Jorf Lasfar' },
    receiver: {
      name: 'STE Al Binaa',
      address: 'Chantier Groupe scolaire Al Qods, Rabat',
    },
    items: [
      {
        itemReference: 'acier-ha',
        itemDesignation: 'Acier HA Fe E500',
        quantity: 12,
        uom: 't',
      },
    ],
  },
  attenduMetier: {
    noeud: '2.2',
    bcQte: 25,
    recu: 12,
    resteALivrer: 13,
    avancementAcierInterdit: 25,
  },
};

const BL03 = {
  cas: 'BL-03',
  fichierNom: 'BL-03-acier-ecart-30t.pdf',
  kind: 'ecart',
  attenduExtraction: {
    blReference: '55102',
    date: '2026-10-06',
    issuer: 'Sonasid',
    sender: { name: 'Sonasid', address: 'Jorf Lasfar' },
    receiver: {
      name: 'STE Al Binaa',
      address: 'Chantier Groupe scolaire Al Qods, Rabat',
    },
    items: [
      {
        itemReference: 'acier-ha',
        itemDesignation: 'Acier HA Fe E500',
        quantity: 30,
        uom: 't',
      },
    ],
  },
  attenduMetier: {
    noeud: '2.2',
    bcQte: 25,
    recuPropose: 30,
    outcome: 'REFUS_OU_ECART_TRACE',
    interdit: 'OK silencieux',
  },
};

const BL04 = {
  cas: 'BL-04',
  fichierNom: 'BL-04-mauvais-chantier.pdf',
  kind: 'mauvais-chantier',
  attenduExtraction: {
    blReference: '99001',
    date: '2026-09-12',
    issuer: 'Ciments Lafarge Maroc',
    sender: { name: 'Ciments Lafarge Maroc', address: 'Usine Bouskoura' },
    receiver: {
      name: 'STE Al Binaa',
      address: 'Chantier Lycee Ibn Sina, Kenitra',
    },
    items: [
      {
        itemReference: 'ciment-cpj-45',
        itemDesignation: 'Ciment CPJ 45',
        quantity: 10,
        uom: 't',
      },
    ],
  },
  attenduMetier: {
    outcome: 'REFUS',
    raison: 'destinataire != Al Qods',
  },
};

const DA01 = {
  cas: 'DA-01',
  role: 'conducteur',
  notes: 'articleId résolu au runtime (catalogue Item ciment-cpj-45). noeudId obligatoire pour 2.1.',
  payload: {
    chantierCode: 'RESOLVE',
    noeudCode: '2.1',
    dateBesoin: '2026-09-10',
    lignes: [
      {
        articleCode: 'ciment-cpj-45',
        articleName: 'Ciment CPJ 45',
        quantite: 40,
        uomCode: 't',
        prixEstimeHt: 1083.75,
      },
    ],
  },
};

const DA02 = {
  cas: 'DA-02',
  role: 'conducteur',
  payload: {
    chantierCode: 'RESOLVE',
    noeudCode: '2.2',
    dateBesoin: '2026-10-01',
    lignes: [
      {
        articleCode: 'acier-ha',
        articleName: 'Acier HA Fe E500',
        quantite: 25,
        uomCode: 't',
        prixEstimeHt: 9800,
      },
    ],
  },
};

const DA03 = {
  cas: 'DA-03',
  role: 'conducteur',
  notes: 'Besoin chantier générique (base vie) — noeudId absent, autorisé, hors attachement.',
  payload: {
    chantierCode: 'RESOLVE',
    noeudCode: null,
    dateBesoin: '2026-09-02',
    lignes: [
      {
        articleCode: 'cloture-chantier',
        articleName: 'Cloture provisoire chantier',
        quantite: 80,
        uomCode: 'ml',
        prixEstimeHt: 45,
      },
    ],
  },
};

function tableDevis({ numero, fournisseur, date, objet, lignes }) {
  return [
    `DEVIS FOURNISSEUR ${numero}`,
    `Fournisseur: ${fournisseur}`,
    `Date: ${date}`,
    `Objet: ${objet}`,
    `Destinataire: STE Al Binaa - Etude Groupe scolaire Al Qods`,
    '',
    'Ref                Designation                         Qte     Unite      PU HT',
    '--------------------------------------------------------------------------------',
    ...lignes.map(
      (l) =>
        `${String(l.identite).padEnd(18)} ${String(l.libelle).padEnd(34)} ${String(l.quantite).padStart(6)}  ${String(l.unite).padEnd(8)}  ${l.prixUnitaire}`,
    ),
    '--------------------------------------------------------------------------------',
    'Prix en MAD hors TVA. Validite 30 jours.',
    '',
  ];
}

function tableBl(bl) {
  const e = bl.attenduExtraction;
  const itemLines = e.items.map(
    (i) =>
      `${String(i.itemReference).padEnd(18)} ${String(i.itemDesignation).padEnd(28)} ${String(i.quantity).padStart(6)}  ${i.uom}`,
  );
  return [
    'BON DE LIVRAISON',
    `BL N° ${e.blReference}`,
    `Date: ${e.date}`,
    `Emetteur: ${e.issuer}`,
    `Expediteur: ${e.sender.name} - ${e.sender.address}`,
    `Destinataire: ${e.receiver.name}`,
    `Adresse livraison: ${e.receiver.address}`,
    '',
    'Ref                Designation                   Qte     Unite',
    '--------------------------------------------------------------',
    ...itemLines,
    '--------------------------------------------------------------',
    'Livraison directe chantier - pas de magasin.',
    'Cachet chauffeur / visa chef de chantier.',
    '',
  ];
}

const written = [];

written.push(write('bdp/al-qods-bdp.csv', BDP_CSV));
written.push(
  write(
    'bdp/al-qods-bdp.pdf',
    buildPdf([
      'BORDEREAU DES PRIX - BDP / BPU',
      'Marche: Gros oeuvre - Groupe scolaire Al Qods, Rabat',
      'MOA: Commune. MOE: BET Atlas. STE: Al Binaa.',
      '',
      'Code    Designation                         Unite     Qte',
      '----------------------------------------------------------',
      '1       Terrassement general                 fft         1',
      '2.1     Beton B25 fondations                 m3        180',
      '2.2     Acier HA                             t          25',
      '2.3     Coffrage                             m2        850',
      '3       Etancheite toiture                   m2        420',
      '----------------------------------------------------------',
      'Lot 1: forfait non decompose, execution interne.',
      'Lots 2.3 et 3: sous-traitance, pas de DPU matiere.',
      '',
    ]),
  ),
);

written.push(
  write(
    'cps/al-qods-cps.pdf',
    buildPdf([
      'CAHIER DES PRESCRIPTIONS SPECIALES',
      'Groupe scolaire Al Qods - Lot Gros oeuvre',
      'MOA Commune / MOE BET Atlas / STE Al Binaa',
      '',
      'Article 1 - Objet',
      'Le present lot comprend le gros oeuvre du groupe scolaire Al Qods a Rabat:',
      'terrassement, beton B25 fondations, acier HA, coffrage, etancheite toiture.',
      '',
      'Article 2 - Quantites contractuelles',
      'Terrassement: 1 fft. Beton B25: 180 m3. Acier HA: 25 t.',
      'Coffrage: 850 m2. Etancheite: 420 m2.',
      '',
      'Article 3 - Beton',
      'Beton pret a l emploi B25. Ciment CPJ 45. Granulats conformes NM 10.1.008.',
      'Coulage sur PV de reception des ferraillages. Photos de coulage au dossier.',
      '',
      'Article 4 - Acier',
      'Aciers HA Fe E500. Certificats de coulee exiges a la livraison.',
      '',
      'Article 5 - Sous-traitance',
      'Coffrage et etancheite peuvent etre sous-traites. Le titulaire reste responsable.',
      '',
      'Article 6 - Delais',
      'Ordre de service a notification. Duree d execution: 8 mois.',
      '',
      'Article 7 - Situations',
      'Attachement mensuel signe MOE. Pas de ligne d installation de chantier.',
      '',
    ]),
  ),
);

written.push(
  write(
    'consultations/IM-01-devis-lafarge-ciment.pdf',
    buildPdf(
      tableDevis({
        numero: 'LF-2026-441',
        fournisseur: 'Ciments Lafarge Maroc',
        date: '2026-08-20',
        objet: 'Consultation ciment-cpj-45 - Al Qods',
        lignes: IM01.attendu.lignes,
      }),
    ),
  ),
);
written.push(
  write(
    'consultations/IM-02-devis-holcim-ciment.pdf',
    buildPdf(
      tableDevis({
        numero: 'HC-2026-118',
        fournisseur: 'Holcim Maroc',
        date: '2026-08-22',
        objet: 'Consultation ciment-cpj-45 - Al Qods',
        lignes: IM02.attendu.lignes,
      }),
    ),
  ),
);
written.push(
  write(
    'consultations/IM-03-devis-vide.pdf',
    buildPdf([
      'SCAN ILLISIBLE',
      'Page blanche / fax brule / tampon encre trop dense.',
      'Aucun tableau. Aucune quantite. Aucun prix.',
      'Ce fichier ne doit PAS creer un devis consultation.',
      '',
    ]),
  ),
);
written.push(
  write(
    'consultations/IM-04-devis-hors-panier-peinture.pdf',
    buildPdf(
      tableDevis({
        numero: 'HC-2026-119',
        fournisseur: 'Holcim Maroc',
        date: '2026-08-22',
        objet: 'Offre elargie - Al Qods (contient une ligne hors panier)',
        lignes: IM04.attendu.lignes,
      }),
    ),
  ),
);
written.push(
  write(
    'consultations/IM-05-devis-sonasid-acier.pdf',
    buildPdf(
      tableDevis({
        numero: 'SO-2026-77',
        fournisseur: 'Sonasid',
        date: '2026-08-21',
        objet: 'Consultation acier-ha - Al Qods',
        lignes: IM05.attendu.lignes,
      }),
    ),
  ),
);

for (const spec of [IM01, IM02, IM03, IM04, IM05]) {
  written.push(writeJson(`consultations/expected/${spec.cas}.json`, spec));
}

for (const bl of [BL01, BL02, BL03, BL04]) {
  written.push(write(`bl/${bl.fichierNom}`, buildPdf(tableBl(bl))));
  written.push(writeJson(`bl/expected/${bl.cas}.json`, bl));
}

written.push(writeJson('da/DA-01-ciment-noeud-2-1.json', DA01));
written.push(writeJson('da/DA-02-acier-noeud-2-2.json', DA02));
written.push(writeJson('da/DA-03-base-vie-sans-noeud.json', DA03));

written.push(
  write(
    'st/BPU-coffrage-2-3.pdf',
    buildPdf([
      'BORDEREAU DE PRIX UNITAIRES - SOUS-TRAITANT COFFRAGE',
      'Contrat ST - Poste 2.3 Coffrage - Al Qods',
      'STE Al Binaa / Sous-traitant: Coffrage Atlas SARL',
      '',
      'Code    Designation                         Unite     Qte      PU HT',
      '2.3     Fourniture et pose coffrage          m2        850      95,00',
      '',
      'Montant HT: 80 750,00 MAD. Retention de garantie 10 %.',
      'Le contrat porte le noeud 2.3, pas une activite de planning.',
      '',
    ]),
  ),
);
written.push(
  write(
    'st/BPU-etancheite-3.pdf',
    buildPdf([
      'BORDEREAU DE PRIX UNITAIRES - SOUS-TRAITANT ETANCHEITE',
      'Contrat ST - Poste 3 Etancheite toiture - Al Qods',
      'STE Al Binaa / Sous-traitant: Etan Plus',
      '',
      'Code    Designation                         Unite     Qte      PU HT',
      '3       Etancheite bicouche toiture          m2        420     180,00',
      '',
      'Montant HT: 75 600,00 MAD. Retention 10 %.',
      'Mois 1: 0 m2 faits. La situation client n invente pas ce lot.',
      '',
    ]),
  ),
);

written.push(
  write(
    'docs/OS-ALQODS-001.pdf',
    buildPdf([
      'ORDRE DE SERVICE N° OS-ALQODS-001',
      'Marche / Devis: Groupe scolaire Al Qods - Gros oeuvre',
      'MOA: Commune. MOE: BET Atlas. Titulaire: STE Al Binaa.',
      '',
      'Date d effet: 2026-09-01',
      'Le titulaire est autorise a commencer les travaux a compter de cette date.',
      'Conducteur: affecte. Chef de chantier: affecte.',
      '',
      'Visa MOE / Visa MOA',
      '',
    ]),
  ),
);
written.push(
  write(
    'docs/PV-coulage-2-1.pdf',
    buildPdf([
      'PV DE COULAGE - POSTE 2.1 BETON B25 FONDATIONS',
      'Chantier: Groupe scolaire Al Qods, Rabat',
      'Date: 2026-09-12',
      '',
      'Quantite coulee ce jour: 40 m3 (cumul poste: 40 / 180).',
      'Slump conforme. Temperature beton 24 C. Pas d anomalie.',
      'Photos jointes: coulage-fondations.png',
      'Visa chef de chantier / visa conducteur',
      '',
    ]),
  ),
);

const photoSources = [
  ['al-qods-coulage-fondations.png', 'photos/coulage-fondations.png'],
  ['al-qods-bl-photo-terrain-ciment.png', 'photos/bl-photo-terrain-ciment.png'],
  ['al-qods-livraison-acier-partielle.png', 'photos/livraison-acier-partielle.png'],
];
mkdirSync(join(ROOT, 'photos'), { recursive: true });
for (const [srcName, dest] of photoSources) {
  const destAbs = join(ROOT, dest);
  if (existsSync(destAbs)) {
    written.push(dest);
    continue;
  }
  const src = PHOTO_DIRS.map((d) => join(d, srcName)).find((p) => existsSync(p));
  if (src && src !== destAbs) {
    copyFileSync(src, destAbs);
    written.push(dest);
  }
}

written.push(
  writeJson('bl/expected/BL-05-photo-terrain.json', {
    cas: 'BL-05',
    fichierNom: 'photos/bl-photo-terrain-ciment.png',
    kind: 'photo-terrain',
    notes:
      "Photo generee : OCR peut lire 'BL N 44012' et 40 t. Gold canonique = BL-01 PDF. Si Extraire rate la photo, le cas PDF reste valable.",
    attenduExtraction: {
      blReference: '44012',
      date: null,
      issuer: 'Ciments Lafarge Maroc',
      sender: { name: 'Ciments Lafarge Maroc' },
      receiver: { name: 'STE Al Binaa' },
      items: [
        {
          itemReference: null,
          itemDesignation: 'Ciment CPJ 45',
          quantity: 40,
          uom: 't',
        },
      ],
    },
    attenduMetier: BL01.attenduMetier,
  }),
);

const manifest = {
  scenario: 'Groupe scolaire Al Qods',
  ste: 'STE Al Binaa',
  generatedBy: 'sektor/e2e/fixtures/al-qods/generate.mjs',
  files: written,
  cas: {
    bdp: 'bdp/al-qods-bdp.csv + bdp/al-qods-bdp.pdf',
    cps: 'cps/al-qods-cps.pdf',
    importMagique: ['IM-01', 'IM-02', 'IM-03', 'IM-04', 'IM-05'],
    bl: ['BL-01', 'BL-02', 'BL-03', 'BL-04', 'BL-05'],
    da: ['DA-01', 'DA-02', 'DA-03'],
  },
};
written.push(writeJson('MANIFEST.json', manifest));

console.log(`ok ${written.length} fichiers dans ${ROOT}`);
for (const f of written) console.log(' -', f);
