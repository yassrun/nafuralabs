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

// Root-level `inventory.valorisation.*` to satisfy the existing ValorisationPage
// template that references those keys directly (kept as-is for backwards-compat;
// `inventory.suivi.valorisation.*` remains the canonical namespace for new code).
deepMerge(fr.inventory, {
  valorisation: {
    title: 'Valorisation stock',
    subtitle: 'Évolution & ventilation par famille et emplacement',
    date: 'Date de valorisation',
    costingMethod: 'Méthode',
    byFamille: 'Par famille',
    byLocation: 'Par emplacement',
    noData: 'Aucune donnée disponible',
    famille: 'Famille',
    articleCount: 'Articles',
    totalQty: 'Qté totale',
    totalValue: 'Valeur totale (MAD)',
    percent: '% du total',
    location: 'Emplacement',
    type: 'Type',
    value: 'Valeur (MAD)',
    kpi: {
      totalValue: 'Valeur totale stock',
      depotValue: 'Valeur en dépôt',
      chantierValue: 'Valeur en chantier',
      monthlyVariation: 'Variation mensuelle',
    },
  },
});

deepMerge(en.inventory, {
  valorisation: {
    title: 'Stock valuation',
    subtitle: 'Trend & breakdown by family and location',
    date: 'Valuation date',
    costingMethod: 'Method',
    byFamille: 'By family',
    byLocation: 'By location',
    noData: 'No data available',
    famille: 'Family',
    articleCount: 'Items',
    totalQty: 'Total qty',
    totalValue: 'Total value (MAD)',
    percent: '% of total',
    location: 'Location',
    type: 'Type',
    value: 'Value (MAD)',
    kpi: {
      totalValue: 'Total stock value',
      depotValue: 'Warehouse value',
      chantierValue: 'Site value',
      monthlyVariation: 'Monthly change',
    },
  },
});

writeFileSync(FR, JSON.stringify(fr, null, 2) + '\n');
writeFileSync(EN, JSON.stringify(en, null, 2) + '\n');
console.log('OK');
