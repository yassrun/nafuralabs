/**
 * Validateurs purs partagés — appartiennent à la PLATEFORME.
 *
 * Remontés depuis `applications/erp/shared/validators/` : les atomes du design system
 * (`ice-input`, `rib-input`) les importaient via `@applications/*`, ce qui faisait
 * dépendre le design system du code métier de l'ERP. Voir
 * `products/sektor-btp/docs/epics/front-ownership/`.
 *
 * Ces validateurs sont spécifiques au Maroc (ICE, RIB, CNSS, IF, patente…), au même titre
 * que les atomes qui les consomment (`ice-input`, `rib-input`, `phone-ma-input`). Le design
 * system assume donc aujourd'hui un ancrage marocain. C'est cohérent avec le périmètre
 * produit (cf. lot 10 de l'epic étude de prix : « Maroc uniquement, sans verrou de
 * schéma ») — à revisiter le jour où un produit non marocain apparaît, ce qui sera une
 * modification de code, pas une migration.
 */
export * from './ma-validators';
