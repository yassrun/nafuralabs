// Extend inventory FR/EN packs for perte/inventaire editors + receptions extras
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
      causeDetaillee: {
        DECOUPE: 'Chute découpe',
        CASSE: 'Casse',
        DETERIORATION: 'Détérioration',
        AUTRE: 'Autre',
      },
    },
    components: {
      linesEditor: {
        columns: {
          qtySortie: 'Qté sortie',
          qtyPerdue: 'Qté perdue',
          causeDetaillee: 'Cause détaillée',
          totalHT: 'Total HT',
          valeur: 'Valeur',
        },
        perte: {
          causeLabel: 'Cause',
          totalSortieHT: 'Total HT sortie',
          totalValeurPerdue: 'Total valeur perdue',
        },
        inventaire: {
          loadStockButton: 'Charger stock',
          emptyAfterLoad: 'Aucun stock à inventorier dans cet emplacement.',
          emptyInitial: 'Cliquez sur « Charger stock » pour démarrer l\u2019inventaire.',
          ecartLabel: 'Écart',
        },
      },
    },
  },
};

const enExt = {
  inventory: {
    enums: {
      causeDetaillee: {
        DECOUPE: 'Cutting offcut',
        CASSE: 'Breakage',
        DETERIORATION: 'Deterioration',
        AUTRE: 'Other',
      },
    },
    components: {
      linesEditor: {
        columns: {
          qtySortie: 'Issue qty',
          qtyPerdue: 'Lost qty',
          causeDetaillee: 'Detailed cause',
          totalHT: 'Total excl. tax',
          valeur: 'Value',
        },
        perte: {
          causeLabel: 'Cause',
          totalSortieHT: 'Total issue (excl. tax)',
          totalValeurPerdue: 'Total lost value',
        },
        inventaire: {
          loadStockButton: 'Load stock',
          emptyAfterLoad: 'No stock to count at this location.',
          emptyInitial: 'Click "Load stock" to start the count.',
          ecartLabel: 'Variance',
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
