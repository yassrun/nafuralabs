/**
 * Référentiel géographique marocain — 12 régions, 75 provinces /
 * préfectures, ~115 villes principales (découpage HCP 2015).
 *
 * Spécifique au Maroc au même titre que `@lib/validators` (ICE, RIB…) et
 * les atomes `ice-input` / `rib-input` / `phone-ma-input` : le design
 * system assume un ancrage marocain (cf. platform/web/lib/validators).
 */

export * from './regions-ma';
export * from './provinces-ma';
export * from './villes-ma';
export * from './geo-ma.helpers';
