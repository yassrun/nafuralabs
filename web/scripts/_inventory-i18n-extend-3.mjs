/* eslint-disable */
import { readFileSync, writeFileSync } from 'node:fs';
import path from 'node:path';

const ROOT = path.resolve('public/assets/i18n/applications/erp/inventory');
const FR = path.join(ROOT, 'fr.json');
const EN = path.join(ROOT, 'en.json');

function deepMerge(target, source) {
  if (typeof target !== 'object' || target === null) return source;
  if (typeof source !== 'object' || source === null) return target;
  if (Array.isArray(source)) return source;
  for (const k of Object.keys(source)) {
    if (k in target && typeof target[k] === 'object' && !Array.isArray(target[k])) {
      target[k] = deepMerge(target[k], source[k]);
    } else {
      target[k] = source[k];
    }
  }
  return target;
}

const fr = JSON.parse(readFileSync(FR, 'utf8'));
const en = JSON.parse(readFileSync(EN, 'utf8'));

deepMerge(fr.inventory, {
  suivi: {
    alertes: {
      actions: {
        createReception: 'Créer réception',
        editThreshold: 'Modifier seuil',
      },
      dialog: {
        title: 'Modifier le seuil minimum',
        newThresholdLabel: 'Nouveau seuil minimum',
        cancel: 'Annuler',
        save: 'Enregistrer',
      },
      toasts: {
        thresholdUpdated: 'Seuil mis à jour',
      },
    },
    valorisation: {
      filters: {
        method: 'Méthode',
        famille: 'Famille',
        famillePlaceholder: 'Toutes',
        period: 'Période',
        all: 'Tous',
      },
      noData: 'Aucune donnée disponible',
      currency: 'MAD',
    },
    etatStock: {
      noData: 'Aucune donnée disponible pour les filtres sélectionnés.',
      currency: 'MAD',
      lookups: {
        allDepots: 'Tous',
      },
    },
  },
});

deepMerge(en.inventory, {
  suivi: {
    alertes: {
      actions: {
        createReception: 'Create receipt',
        editThreshold: 'Edit threshold',
      },
      dialog: {
        title: 'Edit minimum threshold',
        newThresholdLabel: 'New minimum threshold',
        cancel: 'Cancel',
        save: 'Save',
      },
      toasts: {
        thresholdUpdated: 'Threshold updated',
      },
    },
    valorisation: {
      filters: {
        method: 'Method',
        famille: 'Family',
        famillePlaceholder: 'All',
        period: 'Period',
        all: 'All',
      },
      noData: 'No data available',
      currency: 'MAD',
    },
    etatStock: {
      noData: 'No data available for the selected filters.',
      currency: 'MAD',
      lookups: {
        allDepots: 'All',
      },
    },
  },
});

writeFileSync(FR, JSON.stringify(fr, null, 2) + '\n');
writeFileSync(EN, JSON.stringify(en, null, 2) + '\n');
console.log('OK');
