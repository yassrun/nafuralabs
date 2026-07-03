/**
 * Intégrations & connecteurs externes (Round 2 — Task 16, M-INT-01..09).
 *
 * Adapters stables prêts à brancher en prod (mode MOCK pour démo / dev).
 *  - DGI SIMPL-IS (TVA mensuelle, M-INT-01)
 *  - CNSS DAMANCOM (BAP mensuel, M-INT-02)
 *  - CNSS DAT (déclaration AT, M-INT-03)
 *  - Banques MA (AWB, BMCE, CIH, BP, M-INT-04)
 *  - e-facture DGI (M-INT-05)
 *  - OMPIC (autocomplete tiers ICE, M-INT-07)
 *  - WhatsApp Business (notifications, M-INT-09)
 *
 * Indices BTP01..xx (M-INT-06) → `@applications/erp/integrations/services/indices-btp-import.service`.
 */

export * from './integration.types';
export * from './dgi-simpl-is.adapter';
export * from './cnss-damancom.adapter';
export * from './cnss-dat.adapter';
export * from './efacture-dgi.adapter';
export * from './ompic.adapter';
export * from './whatsapp.adapter';
export * from './banques';
