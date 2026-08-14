/**
 * Adaptateurs d'intégration réglementaire marocaine — appartiennent à SEKTOR.
 *
 * Remontés depuis `platform/core/integrations/` : CNSS (Damancom, DAT), DGI (Simpl-IS,
 * e-facture), OMPIC et les portails bancaires sont du métier réglementaire marocain, et
 * n'avaient donc pas leur place dans une plateforme générique — règle 5 d'`AGENTS.md`.
 * Leur dépendance à `ErpAuditService` disparaît du même coup : ils sont désormais du même
 * côté que lui.
 *
 * Reste dans la plateforme : `whatsapp.adapter` (réellement transverse) et le contrat
 * `integration.types`.
 */
export * from './cnss-damancom.adapter';
export * from './cnss-dat.adapter';
export * from './dgi-simpl-is.adapter';
export * from './efacture-dgi.adapter';
export * from './ompic.adapter';
export * from './banques';
