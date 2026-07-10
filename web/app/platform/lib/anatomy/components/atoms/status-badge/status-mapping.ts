import type { BadgeVariant } from '../../../types';

export interface StatusDef {
  label: string;
  variant: BadgeVariant;
  icon?: string;
  tooltip: string;
}

export type StatusMap = Record<string, StatusDef>;

export const STATUS_MAPPING: Record<string, StatusMap> = {
  CHANTIER: {
    PROSPECT:           { label: 'Prospect',         variant: 'default',  tooltip: 'Avant signature marché' },
    EN_COURS:           { label: 'En cours',          variant: 'success',  tooltip: 'Travaux en cours' },
    SUSPENDU:           { label: 'Suspendu',          variant: 'warning',  tooltip: 'Travaux temporairement arrêtés' },
    TERMINE:            { label: 'Terminé',           variant: 'info',     tooltip: 'Travaux terminés' },
    RECEPTIONNE:        { label: 'Réceptionné',       variant: 'success',  tooltip: 'Réception définitive prononcée' },
    CLOTURE:            { label: 'Clôturé',           variant: 'default',  tooltip: 'DGD signé, dossier clos' },
    ANNULE:             { label: 'Annulé',            variant: 'danger',   tooltip: 'Marché résilié' },
  },
  BC: {
    BROUILLON:          { label: 'Brouillon',         variant: 'default',  tooltip: 'BC en saisie, non envoyé' },
    EN_APPROBATION:     { label: 'À valider',         variant: 'warning',  tooltip: 'En attente de validation hiérarchique' },
    APPROUVE:           { label: 'Approuvé',          variant: 'info',     tooltip: 'Validé, prêt à être envoyé' },
    ENVOYE:             { label: 'Envoyé',            variant: 'info',     tooltip: 'Transmis au fournisseur' },
    PARTIELLEMENT_LIVRE:{ label: 'Part. livré',       variant: 'warning',  tooltip: 'Réception partielle' },
    LIVRE:              { label: 'Livré',             variant: 'success',  tooltip: 'Totalement réceptionné' },
    FACTURE:            { label: 'Facturé',           variant: 'success',  tooltip: 'Facture fournisseur reçue' },
    PAYE:               { label: 'Payé',              variant: 'success',  tooltip: 'Règlement effectué' },
    ANNULE:             { label: 'Annulé',            variant: 'danger',   tooltip: 'BC annulé' },
  },
  MARCHE: {
    BROUILLON:          { label: 'Brouillon',         variant: 'default',  tooltip: 'Marché en cours de rédaction' },
    SIGNE:              { label: 'Signé',             variant: 'info',     tooltip: 'Marché signé par les deux parties' },
    EN_EXECUTION:       { label: 'En exécution',      variant: 'success',  tooltip: 'Travaux en cours' },
    RECEPTION_PROVISOIRE: { label: 'Récep. prov.',   variant: 'info',     tooltip: 'Réception provisoire prononcée' },
    RECEPTION_DEFINITIVE: { label: 'Récep. déf.',    variant: 'success',  tooltip: 'Réception définitive' },
    CLOTURE:            { label: 'Clôturé',           variant: 'default',  tooltip: 'DGD signé' },
    RESILIE:            { label: 'Résilié',           variant: 'danger',   tooltip: 'Marché résilié' },
  },
  FACTURE: {
    BROUILLON:          { label: 'Brouillon',         variant: 'default',  tooltip: 'Facture non émise' },
    EMISE:              { label: 'Émise',             variant: 'info',     tooltip: 'Facture émise' },
    ENVOYEE_MOA:        { label: 'Envoyée MOA',       variant: 'info',     tooltip: 'Transmise au maître d\'ouvrage' },
    ACCEPTEE:           { label: 'Acceptée',          variant: 'success',  tooltip: 'Acceptée par le client' },
    PAYEE_PARTIEL:      { label: 'Part. payée',       variant: 'warning',  tooltip: 'Paiement partiel reçu' },
    PAYEE:              { label: 'Payée',             variant: 'success',  tooltip: 'Règlement total reçu' },
    CONTESTEE:          { label: 'Contestée',         variant: 'danger',   tooltip: 'Client a contesté la facture' },
    EN_RETARD:          { label: 'En retard',         variant: 'danger',   tooltip: 'Échéance dépassée' },
  },
  SITUATION: {
    BROUILLON:          { label: 'Brouillon',         variant: 'default',  tooltip: 'Situation non soumise' },
    SOUMISE:            { label: 'Soumise',           variant: 'info',     tooltip: 'Soumise au MOA' },
    VALIDEE_MOA:        { label: 'Validée MOA',       variant: 'success',  tooltip: 'Validée par le maître d\'ouvrage' },
    FACTUREE:           { label: 'Facturée',          variant: 'success',  tooltip: 'Facture émise sur cette situation' },
    PAYEE:              { label: 'Payée',             variant: 'success',  tooltip: 'Règlement reçu' },
    REJETEE:            { label: 'Rejetée',           variant: 'danger',   tooltip: 'Rejetée par le MOA' },
  },
  AVENANT: {
    BROUILLON:          { label: 'Brouillon',         variant: 'default',  tooltip: 'En cours de rédaction' },
    PROPOSE:            { label: 'Proposé',           variant: 'warning',  tooltip: 'Soumis au MOA pour acceptation' },
    SIGNE:              { label: 'Signé',             variant: 'success',  tooltip: 'Avenant signé' },
    REJETE:             { label: 'Rejeté',            variant: 'danger',   tooltip: 'Avenant refusé par le MOA' },
  },
  CAUTION: {
    EMISE:              { label: 'Émise',             variant: 'info',     tooltip: 'Caution émise par la banque' },
    ACTIVE:             { label: 'Active',            variant: 'success',  tooltip: 'Caution en vigueur' },
    LEVEE:              { label: 'Levée',             variant: 'default',  tooltip: 'Caution libérée' },
    EXPIRE:             { label: 'Expirée',           variant: 'danger',   tooltip: 'Date de validité dépassée' },
    JOUE:               { label: 'Jouée',             variant: 'danger',   tooltip: 'Caution appelée par le MOA' },
  },
  CONTRAT_ST: {
    BROUILLON:          { label: 'Brouillon',         variant: 'default',  tooltip: 'Contrat en cours de rédaction' },
    SIGNE:              { label: 'Signé',             variant: 'info',     tooltip: 'Contrat signé' },
    EN_COURS:           { label: 'En cours',          variant: 'success',  tooltip: 'Travaux sous-traités en cours' },
    TERMINE:            { label: 'Terminé',           variant: 'success',  tooltip: 'Travaux terminés' },
    RESILIE:            { label: 'Résilié',           variant: 'danger',   tooltip: 'Contrat résilié' },
  },
  DA: {
    BROUILLON:          { label: 'Brouillon',         variant: 'default',  tooltip: 'Demande non soumise' },
    SOUMISE:            { label: 'Soumise',           variant: 'info',     tooltip: 'En attente de validation' },
    APPROUVEE:          { label: 'Approuvée',         variant: 'success',  tooltip: 'Validée, en attente BC' },
    EN_COMMANDE:        { label: 'En commande',       variant: 'success',  tooltip: 'BC émis' },
    CLOTUREE:           { label: 'Clôturée',          variant: 'default',  tooltip: 'Réceptionnée et cloturée' },
    REJETEE:            { label: 'Rejetée',           variant: 'danger',   tooltip: 'Demande refusée' },
    ANNULEE:            { label: 'Annulée',           variant: 'danger',   tooltip: 'Demande annulée' },
  },
  CONGE: {
    DEMANDE:            { label: 'Demandé',           variant: 'info',     tooltip: 'En attente d\'approbation' },
    APPROUVE:           { label: 'Approuvé',          variant: 'success',  tooltip: 'Congé validé' },
    REFUSE:             { label: 'Refusé',            variant: 'danger',   tooltip: 'Congé non accordé' },
    ANNULE:             { label: 'Annulé',            variant: 'default',  tooltip: 'Congé annulé' },
  },
  PAIE: {
    BROUILLON:          { label: 'Brouillon',         variant: 'default',  tooltip: 'Fiche en saisie' },
    VALIDEE:            { label: 'Validée',           variant: 'info',     tooltip: 'Vérifiée et validée' },
    PAYEE:              { label: 'Payée',             variant: 'success',  tooltip: 'Virement effectué' },
    ANNULEE:            { label: 'Annulée',           variant: 'danger',   tooltip: 'Fiche annulée' },
  },
  APPROBATION: {
    EN_ATTENTE:         { label: 'En attente',        variant: 'warning',  tooltip: 'En attente de décision' },
    APPROUVE:           { label: 'Approuvé',          variant: 'success',  tooltip: 'Approuvé' },
    REJETE:             { label: 'Rejeté',            variant: 'danger',   tooltip: 'Rejeté' },
    EXPIRE:             { label: 'Expiré',            variant: 'default',  tooltip: 'SLA dépassé' },
  },
};

export function resolveStatus(entityType: string, status: string): StatusDef {
  return STATUS_MAPPING[entityType]?.[status] ?? {
    label: status,
    variant: 'default' as BadgeVariant,
    tooltip: status,
  };
}
