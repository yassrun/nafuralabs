/**
 * Intégrations & connecteurs externes.
 *
 * Adapters stables prêts à brancher (mode MOCK pour démo / dev).
 * Templates / catalogues métier → fournis par le produit via tokens DI
 * (`PRODUCT_WHATSAPP_TEMPLATES`, etc.).
 */

export * from './integration.types';
export * from './audit.port';
export * from './whatsapp.adapter';
