/**
 * Re-export public — `app/applications/erp/shared/data/`.
 *
 * Centralise les référentiels marocains réutilisables (banques, régions,
 * jours fériés) pour les Tasks 13 (admin) et 17 (spécificités MA).
 */
export * from './banques-ma';
export * from './jours-feries-ma';
// Référentiel géographique (régions / provinces / villes) — désormais
// porté par la plateforme, réexporté ici pour préserver le point d'import.
export * from '@platform/lib/referentiels/geo-ma';
