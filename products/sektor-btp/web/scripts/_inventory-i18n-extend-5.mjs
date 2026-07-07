// Extend inventory FR/EN packs with namespaces needed for Sub-C2 (shared components + lines-editors)
import { readFileSync, writeFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, '../public/assets/i18n/applications/erp/inventory');

function deepMerge(target, source) {
  for (const k of Object.keys(source)) {
    if (source[k] && typeof source[k] === 'object' && !Array.isArray(source[k])) {
      target[k] = deepMerge(target[k] || {}, source[k]);
    } else {
      target[k] = source[k];
    }
  }
  return target;
}

const frExt = {
  inventory: {
    enums: {
      etatArticle: {
        BON: 'Bon état',
        ABIME: 'Abîmé',
        INUTILISABLE: 'Inutilisable',
      },
      motifPerteType: {
        CASSE: 'Casse',
        VOL: 'Vol',
        DEGRADATION: 'Dégradation',
        CHUTE_OBLIGATOIRE: 'Chute obligatoire',
        FIN_LOT: 'Fin de lot',
        AUTRE: 'Autre',
      },
    },
    components: {
      linesEditor: {
        etatArticle: 'État article',
        etatLabel: 'État',
        motifLabel: 'Motif',
        loadStock: 'Charger stock',
        retour: {
          motifLabel: 'Motif retour',
          emptyMessage: 'Aucune ligne — cliquez sur « Ligne » pour ajouter un retour.',
        },
        perte: {
          motifLabel: 'Motif',
          emptyMessage: 'Aucune ligne — cliquez sur « Ligne » pour déclarer une perte.',
        },
        inventaire: {
          loadStock: 'Charger stock',
          emptyMessage: 'Aucune ligne — cliquez sur « Charger stock » pour démarrer l\u2019inventaire.',
        },
        transfert: {
          sourceStockLabel: 'Dispo source',
          emptyMessage: 'Aucune ligne à transférer — cliquez sur « Ligne ».',
        },
        reception: {
          articleLabel: 'Article',
          emptyMessage: 'Aucune ligne — cliquez sur « Ligne » pour ajouter un article',
        },
      },
    },
  },
};

const enExt = {
  inventory: {
    enums: {
      etatArticle: {
        BON: 'Good condition',
        ABIME: 'Damaged',
        INUTILISABLE: 'Unusable',
      },
      motifPerteType: {
        CASSE: 'Breakage',
        VOL: 'Theft',
        DEGRADATION: 'Degradation',
        CHUTE_OBLIGATOIRE: 'Required offcut',
        FIN_LOT: 'End of lot',
        AUTRE: 'Other',
      },
    },
    components: {
      linesEditor: {
        etatArticle: 'Article condition',
        etatLabel: 'Condition',
        motifLabel: 'Reason',
        loadStock: 'Load stock',
        retour: {
          motifLabel: 'Return reason',
          emptyMessage: 'No line — click "Line" to add a return.',
        },
        perte: {
          motifLabel: 'Reason',
          emptyMessage: 'No line — click "Line" to record a loss.',
        },
        inventaire: {
          loadStock: 'Load stock',
          emptyMessage: 'No line — click "Load stock" to start the count.',
        },
        transfert: {
          sourceStockLabel: 'Source available',
          emptyMessage: 'No line to transfer — click "Line".',
        },
        reception: {
          articleLabel: 'Article',
          emptyMessage: 'No line — click "Line" to add an article',
        },
      },
    },
  },
};

const frPath = resolve(root, 'fr.json');
const enPath = resolve(root, 'en.json');

const fr = JSON.parse(readFileSync(frPath, 'utf8'));
const en = JSON.parse(readFileSync(enPath, 'utf8'));

deepMerge(fr, frExt);
deepMerge(en, enExt);

writeFileSync(frPath, JSON.stringify(fr, null, 2) + '\n', 'utf8');
writeFileSync(enPath, JSON.stringify(en, null, 2) + '\n', 'utf8');

console.log('OK');
