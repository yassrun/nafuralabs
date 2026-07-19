/**
 * Validateurs Maroc (M-MA-01) — ré-export.
 *
 * L'implémentation vit désormais dans `@lib/validators` (plateforme) : les atomes du
 * design system en dépendaient via `@applications/*`, dépendance inversée qui rendait le
 * design system tributaire du code métier de l'ERP.
 *
 * Ce ré-export est conservé pour que les appelants applicatifs restent inchangés.
 */
export * from '@lib/validators';
