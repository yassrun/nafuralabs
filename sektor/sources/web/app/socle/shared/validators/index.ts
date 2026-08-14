/**
 * Validateurs Maroc (M-MA-01) — ré-export.
 *
 * L'implémentation vit désormais dans `@platform/lib/validators` (plateforme) : les atomes du
 * design system en dépendaient via `@app/*`, dépendance inversée qui rendait le
 * design system tributaire du code métier de l'ERP.
 *
 * Ce ré-export est conservé pour que les appelants applicatifs restent inchangés.
 */
export * from '@platform/lib/validators';
