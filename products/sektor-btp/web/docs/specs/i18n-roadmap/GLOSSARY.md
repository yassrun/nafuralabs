# 📖 Glossaire terminologique BTP Maroc — FR ↔ EN

> Référence **non négociable** pour toutes les traductions du chantier i18n Nafura.
> **Toute clé EN générée doit respecter ce glossaire.** En cas de terme absent, l'ajouter dans la même PR.
>
> Légende statut :
> - ✅ Validé (utiliser tel quel)
> - 🟡 Provisoire (à valider par utilisateur lors de la première revue)
> - 🔴 Conservé en français/code (ne pas traduire)
>
> Conventions générales :
> - Pas de double espace, pas de point final dans les libellés courts.
> - Genre/nombre français entre parenthèses : « Validé(e) » → toujours `Validated` côté EN.
> - Acronymes MA conservés tels quels en suffixe parenthésé (`(MOA)`, `(DGD)`, `(RAS)`, `(CGI)`…).
> - Les statuts UI sont au passé/adjectivés en EN (`Issued`, `Approved`, `Cancelled`), pas à l'infinitif.
> - Toute traduction divergente doit être justifiée dans la PR et discutée avec l'utilisateur.

---

## 1. Entités métier BTP

| FR | EN | Statut | Notes |
|---|---|---|---|
| Maître d'Ouvrage (MOA) | Project Owner (MOA) | ✅ | Acronyme MOA conservé |
| Maître d'Œuvre (MOE) | Project Manager (MOE) | ✅ | Acronyme MOE conservé |
| Bureau d'études (BET) | Engineering office (BET) | ✅ | |
| Entreprise générale | General contractor | ✅ | |
| Sous-traitant | Subcontractor | ✅ | |
| Société | Company | ✅ | **Jamais** "Society" |
| Groupe | Group | ✅ | Holding / structure multi-sociétés |
| Filiale | Subsidiary | ✅ | |
| Établissement | Establishment | 🟡 | (sens : agence/succursale d'une société) |
| Siège | Head office | ✅ | |
| Agence | Branch | ✅ | |
| Base chantier | Site base | 🟡 | Code interne `CHANTIER_BASE` |
| Chantier | Site / Construction site | ✅ | « Site » court, « Construction site » si ambigu |
| Prospect | Prospect | ✅ | Statut amont du chantier |
| Lot | Work package | 🟡 | Contexte BTP français |
| Phase | Phase | ✅ | |
| Avancement | Progress | ✅ | |
| Réception provisoire | Provisional acceptance | ✅ | |
| Réception définitive | Final acceptance | ✅ | |
| Procès-verbal de réception (PV) | Acceptance report (PV) | 🟡 | PV conservé |
| Réceptionné(e) | Accepted | ✅ | (sens : réception travaux validée) |
| Bâtiment | Building | ✅ | Type chantier `BATIMENT` |
| Travaux publics (TP) | Public works (TP) | ✅ | |
| VRD (voirie, réseaux divers) | VRD (roadworks & utilities) | 🟡 | VRD conservé |
| Gros œuvre (GO) | Structural works (GO) | ✅ | GO conservé |
| Second œuvre | Finishing works | ✅ | |
| TCE (tous corps d'état) | All trades (TCE) | 🟡 | TCE conservé |
| Réhabilitation | Renovation | ✅ | |
| Mission | Mission / Assignment | ✅ | |
| Ouvrage | Work item | 🟡 | (sens : élément constructif au métré) |

## 2. Marchés (publics & privés)

| FR | EN | Statut | Notes |
|---|---|---|---|
| Marché public | Public contract | ✅ | **Jamais** "Public market" |
| Marché privé | Private contract | ✅ | |
| Marché privé grand compte | Key account private contract | 🟡 | |
| Particulier | Individual / Retail customer | 🟡 | (sens : client personne physique) |
| Appel d'offres | Tender / Call for tenders | 🟡 | |
| Appel d'offres client | Customer tender | ✅ | Module Études |
| Cahier des charges | Specifications | ✅ | |
| CCAP | Special administrative clauses (CCAP) | 🟡 | Acronyme conservé |
| CCTP | Special technical clauses (CCTP) | 🟡 | Acronyme conservé |
| Bordereau de prix unitaires (BPU) | Schedule of unit prices (BPU) | ✅ | BPU conservé |
| Prix global forfaitaire | Lump sum price | ✅ | Type marché `FORFAIT` |
| Régie | Time & materials | ✅ | Type marché `REGIE` |
| Mixte | Mixed | ✅ | Type marché `MIXTE` |
| Décompte général définitif (DGD) | Final settlement statement (DGD) | ✅ | DGD conservé |
| Ordre de service (OS) | Service order (OS) | ✅ | OS conservé |
| OS de commencement | Notice to proceed (OS) | ✅ | |
| OS d'arrêt | Stop order (OS) | ✅ | |
| OS de reprise | Resume order (OS) | ✅ | |
| Avenant | Amendment | ✅ | |
| Travaux supplémentaires | Additional works | ✅ | |
| Prolongation de délai | Time extension | ✅ | |
| Caution bancaire | Bank guarantee | ✅ | |
| Caution provisoire | Bid bond | ✅ | |
| Caution définitive | Performance bond | ✅ | |
| Caution de bonne exécution | Performance bond | ✅ | |
| Caution de retenue de garantie | Retention bond | ✅ | |
| Caution de restitution d'avance | Advance payment bond | ✅ | |
| Retenue de garantie (RG) | Retention guarantee (RG) | ✅ | RG conservé |
| Avance forfaitaire | Lump sum advance | ✅ | |
| Avance de démarrage | Start-up advance | ✅ | (marchés publics MA) |
| Situation de travaux | Work progress invoice | 🟡 | |
| Attachement | Site work statement | 🟡 | |
| Décompte | Statement | ✅ | |
| Pénalité de retard | Late delivery penalty | ✅ | |
| Délai d'exécution | Execution period | ✅ | |
| Banque émettrice | Issuing bank | ✅ | |
| Levée (caution) | Release (guarantee) | ✅ | Statut caution `LEVEE` |
| Caution jouée | Called guarantee | 🟡 | Statut caution `JOUE` |
| Résilié | Terminated | ✅ | Statut marché/contrat |
| Notifié | Notified | ✅ | Statut DGD/OS |
| Contesté | Contested | ✅ | Statut DGD/facture |
| Soumis MOA | Submitted to MOA | ✅ | |
| Envoyé MOA | Sent to MOA | ✅ | |
| Validé MOA | Approved by MOA | ✅ | |
| Réceptionné (OS) | Acknowledged | ✅ | Statut OS `RECEPTIONNE` |
| Clos | Closed | ✅ | Statut OS `CLOS` |
| Échu | Expired | ✅ | Statut contrat `ECHU` |
| Formule de révision K | Price revision formula (K) | 🟡 | Formule indicielle MA |

## 3. Achats & Logistique

| FR | EN | Statut | Notes |
|---|---|---|---|
| Bon de commande (BC) | Purchase order (PO) | ✅ | |
| Bon de livraison (BL) | Delivery note (DN) | ✅ | |
| Bon de réception (BR) | Goods receipt | ✅ | |
| Bon de commande client (BCC) | Customer order (CO) | 🟡 | Ventes — pendant du BC achat |
| Demande d'achat (DA) | Purchase request (PR) | ✅ | |
| Appel d'offres fournisseur | Supplier tender | ✅ | Module Achats |
| Accusé de réception (AR) | Acknowledgement of receipt (AR) | 🟡 | AR conservé |
| Contrat (achat) | Contract | ✅ | |
| Contrat-cadre | Framework contract | ✅ | |
| Contrat de sous-traitance | Subcontracting contract | ✅ | |
| 3-way matching | Three-way matching | ✅ | |
| Rapprochement BL/BC/Facture | PO/GR/Invoice matching | 🟡 | |
| Fournisseur | Supplier | ✅ | |
| Référencement fournisseur | Supplier referencing | ✅ | |
| Fournisseur préféré | Preferred supplier | ✅ | |
| Fournisseur non-résident | Non-resident supplier | ✅ | (impact RAS Maroc) |
| Délai de réapprovisionnement | Lead time | ✅ | Champ `delaiReapproJours` |
| Réapprovisionnement | Replenishment | ✅ | |
| Partiellement livré | Partially delivered | ✅ | Statut `PARTIELLEMENT_LIVRE` |
| Livré | Delivered | ✅ | |
| Facturé | Invoiced | ✅ | |
| Convertie (DA) | Converted | ✅ | DA convertie en BC |
| Soumise (DA) | Submitted | ✅ | |
| Approuvée | Approved | ✅ | |
| Rejetée | Rejected | ✅ | |
| AR reçu | AR received | 🟡 | Statut BC `ACCUSE_RECEPTION` |

## 4. Ventes & Facturation

| FR | EN | Statut | Notes |
|---|---|---|---|
| Devis | Quote / Quotation | ✅ | « Quote » par défaut |
| Offre commerciale | Commercial proposal | ✅ | |
| Facture | Invoice | ✅ | |
| Facture client | Customer invoice | ✅ | |
| Facture fournisseur | Supplier invoice | ✅ | |
| Numéro fournisseur (facture) | Supplier reference (invoice) | ✅ | |
| Numéro interne (facture) | Internal number (invoice) | ✅ | |
| Avoir | Credit note | ✅ | |
| Avoirisée | Credited | 🟡 | Statut facture `AVOIRISEE` |
| Imputé (avoir) | Applied | ✅ | Statut avoir `IMPUTE` |
| Remboursé | Refunded | ✅ | Statut avoir `REMBOURSE` |
| Encaissement | Receipt | ✅ | (sens : règlement reçu) |
| Décaissement | Payment | ✅ | (sens : règlement émis) |
| Règlement | Settlement | ✅ | |
| Acompte | Down payment | ✅ | |
| Acompte (situation) | Interim payment | 🟡 | Sous-type facture `ACOMPTE` |
| Avance | Advance | ✅ | |
| Décompte définitif | Final statement | ✅ | Sous-type facture `DECOMPTE_DEFINITIF` |
| Échéance | Due date | ✅ | |
| Date d'échéance | Due date | ✅ | |
| Date d'émission | Issue date | ✅ | |
| Relance | Reminder | ✅ | |
| Reste à régler | Remaining balance | ✅ | |
| Partiellement payée | Partially paid | ✅ | Statut `PARTIELLEMENT_PAYEE` |
| Part. payée | Part. paid | ✅ | Forme courte UI |
| Payée | Paid | ✅ | |
| Émise | Issued | ✅ | |
| En litige | Disputed | ✅ | Statut facture |
| Annulée | Cancelled | ✅ | |
| Négociation | Negotiation | ✅ | Statut devis |
| Perdu | Lost | ✅ | Statut devis/AO |
| Expiré | Expired | ✅ | |
| Infructueux | Unsuccessful | ✅ | Statut AO `INFRUCTUEUX` |
| Attribué | Awarded | ✅ | Statut AO `ATTRIBUE` |
| Soumis | Submitted | ✅ | Statut AO `SOUMIS` |
| En préparation | In preparation | ✅ | Statut AO `EN_PREPARATION` |
| À étudier | To review | 🟡 | Statut AO `A_ETUDIER` |
| Publiée | Published | ✅ | |
| Clôturée | Closed | ✅ | |
| Diverse (facture) | Miscellaneous | ✅ | Sous-type facture `DIVERSE` |
| Conditions de paiement | Payment terms | ✅ | |
| Délai simple | Simple delay | ✅ | Type `DELAI_SIMPLE` |
| Fin de mois | End of month | ✅ | Type `FIN_DE_MOIS` |
| Échéances multiples | Multiple due dates | ✅ | Type `ECHEANCES_MULTIPLES` |
| Immédiat | Immediate | ✅ | Type `IMMEDIAT` |

## 5. Finance & Comptabilité

| FR | EN | Statut | Notes |
|---|---|---|---|
| Plan comptable | Chart of accounts | ✅ | |
| CGNC | CGNC (Morocco GAAP) | ✅ | Acronyme conservé |
| Journal comptable | Accounting journal | ✅ | |
| Écriture | Journal entry | ✅ | |
| Ligne d'écriture | Journal line | ✅ | |
| Pièce comptable | Accounting voucher | ✅ | |
| Opération diverse (OD) | Miscellaneous operation (OD) | ✅ | OD conservé |
| Journal des achats | Purchase journal | ✅ | |
| Journal des ventes | Sales journal | ✅ | |
| Journal de banque | Bank journal | ✅ | |
| Journal de caisse | Cash journal | ✅ | |
| Journal des opérations diverses | Miscellaneous journal | ✅ | Code `OPERATIONS_DIVERSES` |
| Journal des à-nouveaux | Opening balances journal | ✅ | Code `NOUVEAUX` |
| Lettrage | Reconciliation | 🟡 | |
| Rapprochement bancaire | Bank reconciliation | ✅ | |
| Grand livre | General ledger | ✅ | |
| Balance | Trial balance | ✅ | |
| Balance âgée | Aged trial balance | ✅ | |
| Compte général | General account | ✅ | |
| Compte auxiliaire | Auxiliary account | ✅ | |
| Compte de tiers | Third-party account | ✅ | |
| Compte de trésorerie | Cash account | ✅ | |
| Classe (comptable) | Class | ✅ | Classe 1..7 plan comptable |
| Charges | Expenses | ✅ | Classe 6 |
| Produits (comptables) | Income | ✅ | Classe 7 |
| Actif | Assets | ✅ | |
| Passif | Liabilities | ✅ | |
| Capitaux propres | Equity | ✅ | |
| Dettes du passif circulant | Current liabilities | ✅ | |
| Trésorerie | Cash / Treasury | ✅ | Classe 5 |
| Solde | Balance | ✅ | |
| Débit | Debit | ✅ | |
| Crédit | Credit | ✅ | |
| Contrepartie | Counter-entry | ✅ | |
| Contrepartie par défaut | Default counter-entry | ✅ | |
| Exercice comptable | Fiscal year | ✅ | |
| Période comptable | Accounting period | ✅ | |
| Clôturée (écriture) | Closed | ✅ | Statut écriture `CLOTUREE` |
| Validée (écriture) | Validated | ✅ | Statut écriture `VALIDEE` |
| Mappings comptables | Accounting mappings | ✅ | (génération auto OD) |
| Cycle de déclaration | Reporting cycle | ✅ | |
| Compte financier | Financial account | ✅ | |
| Virement interne | Internal transfer | ✅ | |
| Mouvement (bancaire) | Bank movement | ✅ | |
| Mode de paiement | Payment method | ✅ | |
| Virement | Bank transfer | ✅ | |
| Chèque | Cheque | ✅ | |
| Espèces | Cash | ✅ | |
| Effet de commerce | Commercial paper | 🟡 | |

## 6. Fiscalité Maroc

| FR | EN | Statut | Notes |
|---|---|---|---|
| TVA | VAT | ✅ | |
| Autoliquidation TVA | VAT reverse charge | ✅ | |
| Retenue à la source (RAS) | Withholding tax (RAS) | ✅ | RAS conservé |
| Retenue à la source non-résident | Non-resident withholding tax | ✅ | |
| Timbre fiscal | Stamp duty | ✅ | |
| Exonération | Exemption | ✅ | |
| Motif d'exonération | Exemption reason | ✅ | |
| Régime débit | Debit regime | ✅ | |
| Régime encaissement | Cash basis regime | ✅ | |
| Cycle de déclaration | Reporting cycle | ✅ | |
| Code Général des Impôts (CGI) | General Tax Code (CGI) | ✅ | CGI conservé |
| Direction Générale des Impôts (DGI) | General Directorate of Taxes (DGI) | ✅ | DGI conservé |
| Taux de TVA | VAT rate | ✅ | (20 / 14 / 10 / 7 %) |
| Périmètre (exonération) | Scope | ✅ | `LIVRAISON` / `PRESTATION` / etc. |
| Livraison de biens | Goods delivery | ✅ | Périmètre `LIVRAISON` |
| Prestation de services | Services rendering | ✅ | |

## 7. Codes administratifs Maroc — 🔴 NE PAS TRADUIRE

| Code | Signification | Notes |
|---|---|---|
| ICE | Identifiant Commun de l'Entreprise | Conservé tel quel |
| IF | Identifiant Fiscal | Conservé tel quel |
| RC | Registre du Commerce | Conservé tel quel |
| RIB | Relevé d'Identité Bancaire | Conservé tel quel |
| CNSS | Caisse Nationale de Sécurité Sociale | Conservé tel quel |
| AMO | Assurance Maladie Obligatoire | Conservé tel quel |
| Patente | Patente (taxe professionnelle) | Conservé tel quel |
| CNAEM | Casier Numérique des Activités Économiques au Maroc | Conservé tel quel |
| OFPPT | Office de la Formation Professionnelle | Conservé tel quel |
| OMPIC | Office Marocain de la Propriété Industrielle | Conservé tel quel |
| DAMANCOM | Portail DAMANCOM | Conservé tel quel |
| SIMPL | Service des Impôts en Ligne | Conservé tel quel |
| BAM | Bank Al-Maghrib | Banque centrale MA — conservé |
| SWIFT | SWIFT / BIC | Code interbancaire — conservé |
| BPU | Bordereau de Prix Unitaires | Acronyme métier — conservé en EN |
| DGD | Décompte Général Définitif | Acronyme métier — conservé en EN |
| OS | Ordre de Service | Acronyme métier — conservé en EN |
| RG | Retenue de Garantie | Acronyme métier — conservé en EN |
| RAS | Retenue À la Source | Acronyme fiscal — conservé en EN |
| CGI | Code Général des Impôts | Conservé tel quel |
| DGI | Direction Générale des Impôts | Conservé tel quel |
| CGNC | Code Général de Normalisation Comptable | Conservé tel quel |
| MOA | Maître d'Ouvrage | Acronyme conservé |
| MOE | Maître d'Œuvre | Acronyme conservé |
| BET | Bureau d'Études Techniques | Acronyme conservé |
| TF | Taux de Fréquence (HSE) | Conservé pour éviter ambiguïté `FR` |
| TG | Taux de Gravité (HSE) | Conservé |
| EPI | Équipements de Protection Individuelle | Acronyme international |
| AT | Accident du Travail | Conservé tel quel |
| MP | Maladie Professionnelle | Conservé tel quel |
| MAD | Dirham marocain (devise) | Code ISO 4217 — conservé |
| DH | Dirham (forme abrégée) | Conservé |
| GMAO | Gestion de Maintenance Assistée par Ordinateur | Acronyme conservé |
| DUER | Document Unique d'Évaluation des Risques | Conservé tel quel |
| PPSPS | Plan Particulier de Sécurité et Protection de la Santé | Conservé tel quel |

## 8. RH & Paie

| FR | EN | Statut | Notes |
|---|---|---|---|
| Bulletin de paie | Payslip | ✅ | |
| Salaire brut | Gross salary | ✅ | |
| Salaire net | Net salary | ✅ | |
| Congé payé | Paid leave | ✅ | |
| Absence | Absence | ✅ | |
| Charges patronales | Employer contributions | ✅ | |
| Charges salariales | Employee contributions | ✅ | |
| Employé | Employee | ✅ | |
| Effectif | Headcount | ✅ | |
| Pointage | Time tracking | ✅ | Module RH |
| Saisie de pointage | Time entry | ✅ | |
| Validation de pointage | Time approval | ✅ | |
| Présent | Present | ✅ | Mode pointage `PRESENT` |
| Absent | Absent | ✅ | Mode pointage `ABSENT` |
| Congé | Leave | ✅ | Mode pointage `CONGE` |
| Maladie | Sick leave | ✅ | Mode pointage `MALADIE` |
| Formation | Training | ✅ | |
| Embauche | Hiring | ✅ | Type visite médicale `EMBAUCHE` |
| Périodique | Periodic | ✅ | |
| Reprise | Return to work | ✅ | Type visite médicale `REPRISE` |
| Visite médicale | Medical check-up | ✅ | |
| Aptitude | Fitness | ✅ | |
| Apte | Fit | ✅ | Statut `APTE` |
| Inapte | Unfit | ✅ | Statut `INAPTE` |
| Apte avec restriction | Fit with restriction | ✅ | Statut `AVEC_RESTRICTION` |
| Médecin du travail | Occupational physician | ✅ | |
| Restrictions | Restrictions | ✅ | |
| Prochaine échéance | Next due date | ✅ | |
| Géofence (pointage) | Geofence | 🟡 | (pointage géolocalisé) |
| Signature (pointage) | Signature | ✅ | |
| Photo (pointage) | Photo | ✅ | |

## 9. HSE (Hygiène, Sécurité, Environnement)

| FR | EN | Statut | Notes |
|---|---|---|---|
| HSE | HSE | ✅ | Acronyme international |
| Accident du travail (AT) | Workplace accident (AT) | ✅ | |
| AT travail | Workplace AT | ✅ | Type incident `AT_TRAVAIL` |
| AT trajet | Commute AT | ✅ | Type incident `AT_TRAJET` |
| Presque accident | Near-miss | ✅ | Type incident `PRESQUE_ACCIDENT` |
| Dommage matériel | Material damage | ✅ | Type incident `DOMMAGE_MATERIEL` |
| Maladie professionnelle (MP) | Occupational disease (MP) | ✅ | |
| Incident | Incident | ✅ | |
| Investigation | Investigation | ✅ | Statut incident `EN_INVESTIGATION` |
| Déclaré (incident) | Reported | ✅ | Statut incident `DECLARE` |
| Non-conformité (NC) | Non-conformity (NC) | ✅ | |
| Ouverte (NC) | Open | ✅ | Statut NC `OUVERTE` |
| Vérifiée (NC) | Verified | ✅ | Statut NC `VERIFIEE` |
| Sécurité | Safety | ✅ | Type NC `SECURITE` |
| Qualité | Quality | ✅ | Type NC `QUALITE` |
| Environnement | Environment | ✅ | Type NC `ENVIRONNEMENT` |
| Réglementaire | Regulatory | ✅ | Type NC `REGLEMENTAIRE` |
| Plan de prévention | Prevention plan | ✅ | |
| DUER (Document Unique d'Évaluation des Risques) | Single risk assessment document (DUER) | 🟡 | DUER conservé |
| PPSPS | Specific health & safety protection plan (PPSPS) | 🟡 | PPSPS conservé |
| Inspection (HSE) | Inspection | ✅ | |
| Formation (HSE) | Training | ✅ | |
| Audit | Audit | ✅ | |
| Taux de fréquence (TF) | Frequency rate (TF) | ✅ | TF conservé pour éviter conflit avec FR (langue) |
| Taux de gravité (TG) | Severity rate (TG) | ✅ | |
| Matrice des risques | Risk matrix | ✅ | DUER |
| Échelle (risque) | Scale | ✅ | |
| Gravité | Severity | ✅ | |
| Fréquence | Frequency | ✅ | |
| Probabilité | Probability | ✅ | |
| Coordonnateur SPS | Health & Safety coordinator | ✅ | PPSPS |
| Équipement de protection individuelle (EPI) | Personal protective equipment (PPE) | ✅ | EPI conservé en interne |
| Casque chantier | Safety helmet | ✅ | EPI catégorie `TETE` |
| Chaussures sécurité | Safety shoes | ✅ | EPI catégorie `PIEDS` |
| Gants | Gloves | ✅ | EPI catégorie `MAINS` |
| Combinaison / gilet | Coverall / vest | ✅ | EPI catégorie `CORPS` |
| Harnais anti-chute | Fall-arrest harness | ✅ | EPI catégorie `CHUTE` |
| Masque / ARI | Mask / breathing apparatus | ✅ | EPI catégorie `RESPIRATION` |
| Casque anti-bruit | Hearing protection | ✅ | EPI catégorie `AUDITION` |
| Lunettes anti-éclaboussures | Safety glasses | ✅ | EPI catégorie `YEUX` |
| Norme CE | CE standard | ✅ | EN361, EN20345, etc. |
| À renouveler | To renew | ✅ | Statut EPI `A_RENOUVELER` |
| Expiré | Expired | ✅ | Statut EPI `EXPIRE` |
| Perdu / manquant | Lost / missing | ✅ | Statut EPI `PERDU` |
| Vérification (EPI) | Inspection (PPE) | ✅ | |
| Dernière vérification | Last inspection | ✅ | |
| Prochaine vérification | Next inspection | ✅ | |
| Attribution (EPI) | Assignment | ✅ | Volet EPI `attribution` |
| Référence (EPI) | Catalogue reference | ✅ | Volet EPI `reference` |
| En révision | Under revision | ✅ | Statut DUER/PPSPS `REVISION` |
| Applicatif | In effect | 🟡 | Statut PPSPS `APPLICATIF` |
| Archivé | Archived | ✅ | |

## 10. Actions UI courantes

| FR | EN | Statut |
|---|---|---|
| Enregistrer | Save | ✅ |
| Annuler | Cancel | ✅ |
| Supprimer | Delete | ✅ |
| Modifier | Edit | ✅ |
| Créer | Create | ✅ |
| Ajouter | Add | ✅ |
| Retirer | Remove | ✅ |
| Valider | Validate | ✅ |
| Émettre | Issue | ✅ |
| Envoyer | Send | ✅ |
| Renvoyer | Resend | ✅ |
| Imprimer | Print | ✅ |
| Exporter | Export | ✅ |
| Importer | Import | ✅ |
| Télécharger | Download | ✅ |
| Téléverser | Upload | ✅ |
| Joindre | Attach | ✅ |
| Rechercher | Search | ✅ |
| Filtrer | Filter | ✅ |
| Retirer le filtre | Remove filter | ✅ |
| Trier | Sort | ✅ |
| Réinitialiser | Reset | ✅ |
| Restaurer | Restore | ✅ |
| Confirmer | Confirm | ✅ |
| Voir détail | View details | ✅ |
| Précédent | Previous | ✅ |
| Suivant | Next | ✅ |
| Page d'accueil | Home | ✅ |
| Approuver | Approve | ✅ |
| Rejeter | Reject | ✅ |
| Soumettre | Submit | ✅ |
| Soumettre pour approbation | Submit for approval | ✅ |
| Resoumettre | Resubmit | ✅ |
| Exécuter | Execute | ✅ |
| Exécuter maintenant | Run now | ✅ |
| Activer | Activate | ✅ |
| Désactiver | Deactivate | ✅ |
| Réactiver | Reactivate | ✅ |
| Révoquer | Revoke | ✅ |
| Générer | Generate | ✅ |
| Dupliquer | Duplicate | ✅ |
| Copier | Copy | ✅ |
| Coller | Paste | ✅ |
| Tout sélectionner | Select all | ✅ |
| Effacer | Clear | ✅ |
| Appliquer | Apply | ✅ |
| Fermer | Close | ✅ |
| Ouvrir | Open | ✅ |
| Retour | Back | ✅ |
| Suspendre | Suspend | ✅ |
| Continuer | Continue | ✅ |
| Démarrer | Start | ✅ |
| Arrêter | Stop | ✅ |
| Reprendre | Resume | ✅ |
| Marquer comme lu(e) | Mark as read | ✅ |
| Tout marquer comme lu | Mark all as read | ✅ |
| Voir tout | View all | ✅ |
| Charger plus | Load more | ✅ |
| Nouveau | New | ✅ |
| Tester | Test | ✅ |
| Tout | All | ✅ |
| Aucun | None | ✅ |

## 11. Statuts génériques (`enum.<entity>.status.*`)

| FR | EN | Statut |
|---|---|---|
| Brouillon | Draft | ✅ |
| Émis(e) | Issued | ✅ |
| Validé(e) | Validated | ✅ |
| Approuvé(e) | Approved | ✅ |
| Rejeté(e) | Rejected | ✅ |
| Annulé(e) | Cancelled | ✅ |
| En cours | In progress | ✅ |
| Terminé(e) | Completed | ✅ |
| Payé(e) | Paid | ✅ |
| Partiellement payé(e) | Partially paid | ✅ |
| En litige | Disputed | ✅ |
| Clôturé(e) | Closed | ✅ |
| Suspendu(e) | Suspended | ✅ |
| Archivé(e) | Archived | ✅ |
| Signé(e) | Signed | ✅ |
| Proposé(e) | Proposed | ✅ |
| Réceptionné(e) | Acknowledged / Accepted | ✅ |
| Contesté(e) | Contested | ✅ |
| Résilié(e) | Terminated | ✅ |
| Notifié(e) | Notified | ✅ |
| Reçu(e) | Received | ✅ |
| Envoyé(e) | Sent | ✅ |
| Soumis(e) | Submitted | ✅ |
| Attribué(e) | Awarded | ✅ |
| Publiée | Published | ✅ |
| Infructueux(se) | Unsuccessful | ✅ |
| Échu(e) | Expired | ✅ |
| Active | Active | ✅ |
| Actif/Active | Active | ✅ |
| Inactif/Inactive | Inactive | ✅ |
| Invité(e) | Invited | ✅ |
| Révoquée | Revoked | ✅ |
| Planifiée | Planned / Scheduled | ✅ |
| En attente | Pending | ✅ |
| En attente d'approbation | Pending approval | ✅ |
| Acceptée | Accepted | ✅ |
| Refusée | Refused | ✅ |
| Convertie | Converted | ✅ |
| Succès | Success | ✅ |
| Échec | Failure | ✅ |
| Échoué(e) | Failed | ✅ |
| Exécutée | Executed | ✅ |
| En investigation | Under investigation | ✅ |

---

## 12. Inventaire / Stock

| FR | EN | Statut | Notes |
|---|---|---|---|
| Article | Article / Item | ✅ | « Item » préféré en EN |
| Catalogue articles | Item catalogue | ✅ | |
| Référence (article) | Item reference / SKU | ✅ | |
| Code article | Item code | ✅ | |
| Désignation | Designation | ✅ | (libellé long article) |
| Famille (article) | Item family | ✅ | |
| Type d'article | Item type | ✅ | |
| Catégorie d'article | Item category | ✅ | |
| Matériau | Material | ✅ | Type article `MATERIAU` |
| Consommable | Consumable | ✅ | Type article `CONSOMMABLE` |
| Engin | Machinery | ✅ | Type article `ENGIN` |
| Outillage | Tooling | ✅ | Type article `OUTILLAGE` |
| Matériel | Equipment | ✅ | Module inventaire |
| Matériel disponible | Available equipment | ✅ | Statut `DISPONIBLE` |
| Matériel affecté | Assigned equipment | ✅ | Statut `AFFECTE` |
| En maintenance | Under maintenance | ✅ | Statut `MAINTENANCE` |
| Hors service | Out of service | ✅ | Statut `HORS_SERVICE` |
| Périssable | Perishable | ✅ | (champ `isPerissable`) |
| Sérialisé | Serialized | ✅ | (champ `isSerialise`) |
| Numéro de série | Serial number | ✅ | |
| Code-barres | Barcode | ✅ | |
| Unité de mesure (UoM) | Unit of measure (UoM) | ✅ | UoM conservé |
| Catégorie d'UoM | UoM category | ✅ | |
| UoM secondaire | Secondary UoM | ✅ | |
| Facteur de conversion | Conversion factor | ✅ | |
| Stock minimum | Minimum stock | ✅ | |
| Stock maximum | Maximum stock | ✅ | |
| Stock total | Total stock | ✅ | |
| Stock disponible | Available stock | ✅ | |
| Réservation stock | Stock reservation | ✅ | |
| Lot (stock) | Lot / Batch | ✅ | (sens : lot de stock, ne pas confondre avec « lot » marché) |
| Numéro de lot | Lot number | ✅ | |
| Emplacement | Location | ✅ | (entrepôt, dépôt, etc.) |
| Dépôt | Warehouse | ✅ | Type location `DEPOT` |
| Entrepôt | Storage warehouse | ✅ | Type location `ENTREPOT` |
| Transit | In transit | ✅ | Type location `TRANSIT` |
| Virtuel | Virtual | ✅ | Type location `VIRTUEL` |
| Mouvement de stock | Stock movement | ✅ | |
| Réception (stock) | Goods receipt | ✅ | Type mouvement `RECEPTION` |
| Transfert | Transfer | ✅ | Type mouvement `TRANSFERT` |
| Transfert interne | Internal transfer | ✅ | |
| Retour | Return | ✅ | Type mouvement `RETOUR` |
| Retour chantier | Site return | ✅ | |
| Retour fournisseur | Supplier return | ✅ | |
| Inventaire | Stock take / Inventory count | ✅ | Type mouvement `INVENTAIRE` |
| Inventaire périodique | Periodic stock take | ✅ | |
| Contrôle ponctuel | Spot check | ✅ | |
| Perte / Chute | Loss / Scrap | ✅ | Type mouvement `PERTE` |
| Chute (découpe) | Off-cut | 🟡 | (sens : chute de découpe matériau) |
| Casse | Breakage | ✅ | Motif perte `CASSE` |
| Sortie | Issue / Withdrawal | ✅ | Type mouvement `SORTIE` |
| Motif (mouvement) | Reason | ✅ | |
| Valorisation | Valuation | ✅ | |
| Méthode de valorisation | Costing method | ✅ | |
| FIFO | FIFO | ✅ | Acronyme conservé |
| LIFO | LIFO | ✅ | Acronyme conservé |
| CMUP / PMP | Weighted average cost (WAC) | ✅ | CMUP/PMP conservés en interne |
| AVCO | AVCO | ✅ | Acronyme conservé (`average cost`) |
| STD (coût standard) | Standard cost (STD) | ✅ | |
| Prix unitaire | Unit price | ✅ | |
| Prix d'achat dernier | Last purchase price | ✅ | |
| État du stock | Stock status | ✅ | |
| Solde stock | Stock balance | ✅ | |
| Suivi stock | Stock tracking | ✅ | |
| Besoin chantier | Site requirement | ✅ | Motif transfert `CHANTIER` |
| Poste budget | Budget item | ✅ | Champ `posteBudgetId` |
| Rubrique budget | Budget heading | ✅ | |

## 13. Chantiers — Termes métier

| FR | EN | Statut | Notes |
|---|---|---|---|
| Suivi chantier | Site monitoring | ✅ | |
| Journal de chantier | Site diary | ✅ | |
| Rapport journalier | Daily report | ✅ | |
| Visite MOA | MOA visit | ✅ | Type journal `VISITE_MOA` |
| Visite de chantier | Site visit | ✅ | |
| Réunion de chantier | Site meeting | ✅ | Type journal `REUNION` |
| Intempérie | Weather event / Bad weather | ✅ | Type journal `INTEMPERIE` |
| Météo | Weather | ✅ | |
| Livraison | Delivery | ✅ | |
| Constat | Observation report | ✅ | Type journal `CONSTAT` |
| Attachement | Site work statement | 🟡 | (Cf. section 2 — pendant marché côté terrain) |
| Signé MOE | Signed by MOE | ✅ | Statut attachement `SIGNE_MOE` |
| Contresigné MOA | Countersigned by MOA | ✅ | Statut attachement `CONTRESIGNE_MOA` |
| Phase chantier | Site phase | ✅ | |
| Planifié | Planned | ✅ | Statut phase `PLANIFIE` |
| En retard | Overdue / Behind schedule | ✅ | Statut phase `EN_RETARD` |
| Jalon | Milestone | ✅ | |
| Planning | Planning | ✅ | |
| Tâche | Task | ✅ | |
| Sous-traitance | Subcontracting | ✅ | |
| Contrat de sous-traitance | Subcontracting contract | ✅ | |
| Documents chantier | Site documents | ✅ | |
| Plan | Plan | ✅ | Type document `PLAN` |
| Photo | Photo | ✅ | Type document `PHOTO` |
| PV de réception | Acceptance report | ✅ | Type document `PV_RECEPTION` |
| Budget chantier | Site budget | ✅ | |
| Consommation chantier | Site consumption | ✅ | |
| Avancement (chantier) | Site progress | ✅ | |
| Avancement % | Progress % | ✅ | |
| Cumul facturé | Total invoiced | ✅ | |
| Cumul encaissé | Total received | ✅ | |
| Reste à facturer | Remaining to invoice | ✅ | |

## 14. Études / Métré / DPGF

| FR | EN | Statut | Notes |
|---|---|---|---|
| Études | Pre-construction studies | ✅ | Module ERP |
| Métré | Quantity take-off | ✅ | |
| Sous-détail | Cost breakdown | ✅ | (sous-détail de prix) |
| Sous-détail de prix | Unit price cost breakdown | ✅ | |
| DPGF | Detailed price breakdown (DPGF) | 🟡 | DPGF conservé |
| Bordereau de prix unitaires | Schedule of unit prices | ✅ | |
| Série de prix | Price series | ✅ | |
| Prix unitaire | Unit price | ✅ | |
| Déboursé | Direct cost | 🟡 | |
| Déboursé sec | Net direct cost | 🟡 | |
| Frais de chantier | Site overhead | ✅ | |
| Frais généraux | General overhead | ✅ | |
| Coefficient de vente | Mark-up coefficient | 🟡 | |
| Marge brute | Gross margin | ✅ | |
| Métré quantitatif | Bill of quantities | ✅ | |
| Quantité | Quantity | ✅ | |
| Quantité estimée | Estimated quantity | ✅ | |
| Avant-métré | Pre-measurement | 🟡 | |
| Avant-projet | Preliminary design | 🟡 | |
| Devis estimatif | Estimative quotation | ✅ | |
| Devis quantitatif | Quantitative bill | ✅ | |
| Chiffrage | Costing | ✅ | |
| Indice (révision) | Index | ✅ | (révision de prix) |
| Indice de base | Base index | ✅ | |
| Coefficient | Coefficient | ✅ | |
| Terme fixe (K) | Fixed term (K) | 🟡 | Formule K |
| Terme variable (K) | Variable term (K) | 🟡 | Formule K |

## 15. Approbations / Workflow

| FR | EN | Statut | Notes |
|---|---|---|---|
| Approbation | Approval | ✅ | |
| Workflow | Workflow | ✅ | Anglicisme accepté |
| Workflow d'approbation | Approval workflow | ✅ | |
| Modèle de workflow | Workflow template | ✅ | |
| Étape (workflow) | Step | ✅ | |
| Approbateur | Approver | ✅ | |
| Rôle approbateur | Approver role | ✅ | |
| Délégation | Delegation | 🟡 | |
| Escalade | Escalation | ✅ | |
| Rôle d'escalade | Escalation role | ✅ | |
| Délai d'escalade | Escalation timeout | ✅ | |
| Niveau d'approbation | Approval level | ✅ | |
| Condition (workflow) | Condition | ✅ | |
| Décision | Decision | ✅ | |
| Décidé le | Decided on | ✅ | |
| Demandé par | Requested by | ✅ | |
| Demandé le | Requested on | ✅ | |
| Commentaire (approbation) | Comment | ✅ | |
| Historique d'approbation | Approval history | ✅ | |
| Demandes en attente | Pending requests | ✅ | |
| Soumettre pour approbation | Submit for approval | ✅ | |
| Resoumettre | Resubmit | ✅ | |
| Instance de workflow | Workflow instance | ✅ | |
| Modèle actif | Active template | ✅ | |
| Modèle inactif | Inactive template | ✅ | |

## 16. Tableau de bord / KPIs

| FR | EN | Statut | Notes |
|---|---|---|---|
| Tableau de bord | Dashboard | ✅ | |
| Indicateur | Indicator / KPI | ✅ | |
| Vue d'ensemble | Overview | ✅ | |
| Chiffre d'affaires (CA) | Revenue (CA) | ✅ | |
| Marge brute | Gross margin | ✅ | |
| Marge nette | Net margin | ✅ | |
| Marge brute consolidée | Consolidated gross margin | ✅ | |
| EBITDA | EBITDA | ✅ | Acronyme international |
| EBE (Excédent Brut d'Exploitation) | Gross operating surplus (EBE) | 🟡 | EBE conservé |
| CAF (Capacité d'AutoFinancement) | Cash flow from operations (CAF) | 🟡 | CAF conservé |
| BFR (Besoin en Fonds de Roulement) | Working capital requirement (BFR) | ✅ | BFR conservé |
| BFR net groupe | Group net working capital | ✅ | |
| Trésorerie nette | Net cash | ✅ | |
| Solde cash-flow | Cash-flow balance | ✅ | |
| Cash-flow | Cash flow | ✅ | |
| Rentabilité | Profitability | ✅ | |
| Ratio | Ratio | ✅ | |
| Taux | Rate | ✅ | |
| Écart | Variance / Gap | ✅ | |
| Tendance | Trend | ✅ | |
| Dépenses par catégorie | Expenses by category | ✅ | |
| Activité récente | Recent activity | ✅ | |
| Factures récentes | Recent invoices | ✅ | |
| En retard | Overdue | ✅ | |
| What-if (scénarios) | What-if (scenarios) | ✅ | |
| Scénario actuel | Current scenario | ✅ | |
| Scénario simulé | Simulated scenario | ✅ | |
| YTD (Year-To-Date) | YTD | ✅ | Acronyme conservé |
| Encours | Outstanding | ✅ | |
| Pilotage | Steering / Pilotage | 🟡 | |

## 17. Erreurs / Validations

| FR | EN | Statut | Notes |
|---|---|---|---|
| Erreur | Error | ✅ | |
| Avertissement | Warning | ✅ | |
| Champ requis | Required field | ✅ | |
| Ce champ est obligatoire. | This field is required. | ✅ | |
| Format invalide | Invalid format | ✅ | |
| Valeur invalide | Invalid value | ✅ | |
| Valeur trop grande | Value too large | ✅ | |
| Valeur trop petite | Value too small | ✅ | |
| Hors limite | Out of range | ✅ | |
| Doublon | Duplicate | ✅ | |
| Déjà existant | Already exists | ✅ | |
| Introuvable | Not found | ✅ | |
| Non autorisé | Not allowed | ✅ | |
| Action irréversible | This action is irreversible | ✅ | |
| Échec de l'enregistrement | Save failed | ✅ | |
| Échec de la suppression | Delete failed | ✅ | |
| Échec de la mise à jour | Update failed | ✅ | |
| Échec de l'envoi | Send failed | ✅ | |
| Échec du chargement | Load failed | ✅ | |
| Échec de l'export | Export failed | ✅ | |
| Veuillez corriger les erreurs suivantes | Please correct the following errors | ✅ | |
| Êtes-vous sûr ? | Are you sure? | ✅ | |
| Voulez-vous vraiment | Do you really want to | ✅ | |
| Email invalide | Invalid email | ✅ | |
| Email déjà invité | Email already invited | ✅ | |
| Mot de passe trop court | Password too short | ✅ | |
| Les mots de passe ne correspondent pas | Passwords do not match | ✅ | |
| Au moins un destinataire est requis | At least one recipient is required | ✅ | |
| Longueur maximale dépassée | Maximum length exceeded | ✅ | |
| Caractères maximum | maximum characters | ✅ | (fragment : « 500 caractères maximum ») |
| Sélectionnez | Select | ✅ | |
| Veuillez sélectionner | Please select | ✅ | |
| Aucune donnée | No data | ✅ | |
| Aucun résultat | No results | ✅ | |
| Aucun élément | No items | ✅ | |
| Aucune ligne | No rows | ✅ | |
| Aucune entrée | No entries | ✅ | |
| Vide | Empty | ✅ | |
| Vous êtes à jour ! | You are up to date! | ✅ | |
| Bientôt disponible | Coming soon | ✅ | |
| Indisponible | Unavailable | ✅ | |

## 18. Périodes / Calendrier

| FR | EN | Statut | Notes |
|---|---|---|---|
| Date | Date | ✅ | |
| Heure | Time | ✅ | |
| Horodatage | Timestamp | ✅ | |
| Du | From | ✅ | (filtre de date) |
| Au | To | ✅ | (filtre de date) |
| Date de début | Start date | ✅ | |
| Date de fin | End date | ✅ | |
| Date de création | Creation date | ✅ | |
| Date de mise à jour | Update date | ✅ | |
| Date d'émission | Issue date | ✅ | |
| Date d'échéance | Due date | ✅ | |
| Date de signature | Signature date | ✅ | |
| Date de versement | Payment date | ✅ | |
| Date de validité jusqu'à | Valid until | ✅ | |
| Date de levée | Release date | ✅ | |
| Date d'expiration | Expiry date | ✅ | |
| Date d'attribution | Assignment date | ✅ | |
| Date de notification | Notification date | ✅ | |
| Date de soumission | Submission date | ✅ | |
| Jour | Day | ✅ | |
| Jour ouvré | Working day | ✅ | |
| Jour férié | Public holiday | ✅ | |
| Semaine | Week | ✅ | |
| Semaine ISO | ISO week | ✅ | |
| Mois | Month | ✅ | |
| Trimestre | Quarter | ✅ | |
| Semestre | Half-year | ✅ | |
| Année | Year | ✅ | |
| Exercice fiscal | Fiscal year | ✅ | |
| Période | Period | ✅ | |
| Calendrier | Calendar | ✅ | |
| Calendrier hijri | Hijri calendar | ✅ | (toggle MA optionnel) |
| Fuseau horaire | Time zone | ✅ | |
| Quotidien | Daily | ✅ | |
| Hebdomadaire | Weekly | ✅ | |
| Mensuel | Monthly | ✅ | |
| Annuel | Yearly | ✅ | |
| Aujourd'hui | Today | ✅ | |
| Hier | Yesterday | ✅ | |
| Demain | Tomorrow | ✅ | |
| Il y a {{count}} s | {{count}} s ago | ✅ | |
| Il y a {{count}} min | {{count}} min ago | ✅ | |
| Il y a {{count}} h | {{count}} h ago | ✅ | |
| Il y a {{count}} j | {{count}} d ago | ✅ | |
| Jamais | Never | ✅ | Politique reset / dernière exécution |
| 24 heures | 24 hours | ✅ | |
| 7 jours | 7 days | ✅ | |
| 30 jours | 30 days | ✅ | |
| 90 jours | 90 days | ✅ | |
| 1 an | 1 year | ✅ | |
| Date personnalisée | Custom date | ✅ | |
| Format de date | Date format | ✅ | |
| Format des nombres | Number format | ✅ | |
| Aperçu | Preview | ✅ | |

## 19. Documents

| FR | EN | Statut | Notes |
|---|---|---|---|
| Document | Document | ✅ | |
| Pièce jointe | Attachment | ✅ | |
| Pièces jointes | Attachments | ✅ | |
| PDF | PDF | ✅ | |
| Modèle (document) | Template | ✅ | |
| Modèle d'impression | Print template | ✅ | |
| Modèle d'e-mail | Email template | ✅ | |
| Modèle système | System template | ✅ | |
| Modèle personnalisé | Custom template | ✅ | |
| Modèle (lecture seule) | Read-only template | ✅ | |
| Type d'entité | Entity type | ✅ | |
| Variables (modèle) | Variables | ✅ | |
| Format de page | Paper size | ✅ | |
| Orientation | Orientation | ✅ | |
| Marges | Margins | ✅ | |
| Aperçu temps réel | Live preview | ✅ | |
| Aperçu du corps | Body preview | ✅ | |
| Corps HTML | HTML body | ✅ | |
| Corps texte | Text body | ✅ | |
| Objet (e-mail) | Subject | ✅ | |
| Télécharger HTML | Download HTML | ✅ | |
| Ouvrir dans le navigateur | Open in browser | ✅ | |
| Joindre un PDF | Attach PDF | ✅ | |
| Glissez des fichiers ici | Drag files here | ✅ | |
| Téléverser des fichiers | Upload files | ✅ | |
| Téléverser | Upload | ✅ | |
| Taille maximale | Maximum size | ✅ | |
| Type de fichier non autorisé | File type not allowed | ✅ | |
| Le fichier dépasse la taille maximale | File exceeds maximum size | ✅ | |
| Fichier téléversé | File uploaded | ✅ | |
| Fichier supprimé | File deleted | ✅ | |
| Génération du document... | Generating document... | ✅ | |
| Archivage | Archiving | ✅ | |
| Archiver | Archive | ✅ | |
| Numéro | Number | ✅ | (numéro de document) |
| Préfixe | Prefix | ✅ | |
| Suffixe | Suffix | ✅ | |
| Séquence de numérotation | Numbering sequence | ✅ | |
| Numéro actuel | Current number | ✅ | |
| Numéro de départ | Starting number | ✅ | |
| Incrément | Increment | ✅ | |
| Longueur de remplissage | Pad length | ✅ | |
| Format d'année | Year format | ✅ | |
| Politique de réinitialisation | Reset policy | ✅ | |
| Réinitialisation mensuelle | Monthly reset | ✅ | |
| Réinitialisation annuelle | Yearly reset | ✅ | |
| Jamais (réinitialisation) | Never reset | ✅ | |

## 20. Notifications / Communication

| FR | EN | Statut | Notes |
|---|---|---|---|
| Notification | Notification | ✅ | |
| Notifications | Notifications | ✅ | |
| Centre de notifications | Notification center | ✅ | |
| Cloche (notifications) | Bell | ✅ | UI element |
| Alerte | Alert | ✅ | |
| Rappel | Reminder | ✅ | |
| Message | Message | ✅ | |
| E-mail | Email | ✅ | |
| Envoyer par e-mail | Send by email | ✅ | |
| Notifications par e-mail | Email notifications | ✅ | |
| Notifications dans l'application | In-app notifications | ✅ | |
| SMS | SMS | ✅ | |
| Résumé | Digest | ✅ | |
| Fréquence du résumé | Digest frequency | ✅ | |
| Lue | Read | ✅ | |
| Non lue | Unread | ✅ | |
| Marquer comme lue | Mark as read | ✅ | |
| Tout marquer comme lu | Mark all as read | ✅ | |
| Nettoyer les lues | Clear read | ✅ | |
| Mention | Mention | ✅ | |
| Affectation | Assignment | ✅ | |
| Source (notification) | Source | ✅ | |
| Système (notification) | System | ✅ | |
| Notifications de workflow | Workflow notifications | ✅ | |
| Notifications d'affectation | Assignment notifications | ✅ | |
| Notifications de mentions | Mention notifications | ✅ | |
| Webhook | Webhook | ✅ | |
| Événement | Event | ✅ | |
| Événements sortants | Outbound events | ✅ | |
| Livraison (webhook) | Delivery | ✅ | |
| Tentative | Attempt | ✅ | |
| Réponse | Response | ✅ | |
| Payload | Payload | ✅ | Anglicisme conservé |
| Test (webhook) | Test | ✅ | |
| Test envoyé avec succès | Test sent successfully | ✅ | |
| Secret | Secret | ✅ | |
| Générer un secret | Generate secret | ✅ | |

---

## 21. Cognates FR/EN whitelistés (validateur de parité — Phase 5.3 / Wave E2)

> Cette section recense les **mots dont l'orthographe FR = EN exacte** et que
> le validateur `web/scripts/check-i18n-parity.mjs` n'a donc pas vocation à
> signaler comme `Identical FR/EN suspect`. La liste est tenue à jour dans la
> constante `COGNATE_WHITELIST` (~150 entrées) + le set étendu
> `MULTIWORD_TECH_TOKENS` (~400 entrées, vocabulaire schéma Java-derived
> utilisé uniquement à l'intérieur de libellés multi-mots — ex. `Item Id`,
> `Cost Center Id`, `Stock Balances`).
>
> **Règle de contribution** : un nouveau cognate n'est admis que si son
> orthographe FR est **strictement** identique à l'EN (mêmes lettres, mêmes
> accents). Les mots dont la traduction FR diffère (`Cities`/`Villes`,
> `Companies`/`Sociétés`, `Currencies`/`Devises`, `Bénéficiaire`/`Beneficiary`)
> restent volontairement hors whitelist et doivent être traduits.
>
> Pour ajouter un mot : éditer `web/scripts/check-i18n-parity.mjs`
> (`COGNATE_WHITELIST` pour un standalone, `MULTIWORD_TECH_TOKENS` pour un
> token n'apparaissant qu'en multi-mots) puis vérifier `npm run i18n:check`
> et `node --test scripts/check-i18n-parity.spec.mjs`.

### 21.1 Cognates standalone — `COGNATE_WHITELIST` (extrait représentatif)

| Cognate | FR | EN | Notes |
|---|---|---|---|
| Action / Actions | action(s) | action(s) | ✅ |
| Address(es) | addresses | addresses | 🟡 stub Java leak (FR strict : adresse(s)) |
| Amount(s) | amount(s) | amount(s) | 🟡 stub Java (FR strict : montant) |
| Article(s) | article(s) | article(s) | ✅ |
| Audit | audit | audit | ✅ |
| Calculation | calculation | calculation | ✅ |
| Client(s) | client(s) | client(s) | ✅ |
| Code | code | code | ✅ |
| Commission(s) | commission(s) | commission(s) | ✅ |
| Configuration | configuration | configuration | ✅ |
| Contact(s) | contact(s) | contact(s) | ✅ |
| Date | date | date | ✅ |
| Description | description | description | ✅ |
| Destination | destination | destination | ✅ |
| Dimensions | dimensions | dimensions | ✅ |
| Document(s) | document(s) | document(s) | ✅ |
| Email | email | email | ✅ (loanword) |
| Filter / Filters | filter(s) | filter(s) | ✅ |
| Format | format | format | ✅ |
| General | general | general | 🟡 stub (FR strict : général) |
| Group(s) | group(s) | group(s) | ✅ |
| Hierarchy | hierarchy | hierarchy | ✅ |
| Identification | identification | identification | ✅ |
| Incident(s) | incident(s) | incident(s) | ✅ |
| Information | information | information | ✅ |
| Inspection(s) | inspection(s) | inspection(s) | ✅ |
| Intervention | intervention | intervention | ✅ |
| Item(s) | item(s) | item(s) | 🟡 stub Java leak (FR strict : article) |
| Journal | journal | journal | ✅ |
| Justification | justification | justification | ✅ |
| Latitude / Longitude | latitude / longitude | latitude / longitude | ✅ |
| Logo | logo | logo | ✅ |
| Maintenance | maintenance | maintenance | ✅ |
| Mention | mention | mention | ✅ |
| Migration | migration | migration | ✅ |
| Mission | mission | mission | ✅ |
| Mode(s) | mode(s) | mode(s) | ✅ |
| Module(s) | module(s) | module(s) | ✅ |
| Mutation | mutation | mutation | ✅ |
| Name | name | name | 🟡 stub (FR strict : nom) |
| Nature | nature | nature | ✅ |
| Note(s) | note(s) | note(s) | ✅ |
| Notification(s) | notification(s) | notification(s) | ✅ |
| Operation(s) | operation(s) | operation(s) | 🟡 stub (FR strict : opération) |
| Page | page | page | ✅ |
| Partner(s) | partner(s) | partner(s) | 🟡 stub Java leak (FR strict : partenaire) |
| Patente | patente | patente | ✅ MA tax acronym |
| Pause | pause | pause | ✅ |
| Permission(s) | permission(s) | permission(s) | ✅ |
| Personnel | personnel | personnel | ✅ |
| Phase(s) | phase(s) | phase(s) | ✅ |
| Phone | phone | phone | ✅ (loanword) |
| Photo(s) | photo(s) | photo(s) | ✅ |
| Pipeline | pipeline | pipeline | ✅ (loanword) |
| Plan(s) | plan(s) | plan(s) | ✅ |
| Position(s) | position(s) | position(s) | ✅ |
| Promotion | promotion | promotion | ✅ |
| Prospect | prospect | prospect | ✅ |
| Public | public | public | ✅ |
| Quantity | quantity | quantity | 🟡 stub (FR strict : quantité) |
| Rate(s) | rate(s) | rate(s) | 🟡 stub (FR strict : taux) |
| Reason | reason | reason | 🟡 stub (FR strict : raison) |
| Reference | reference | reference | 🟡 stub (FR strict : référence) |
| Region(s) | region(s) | region(s) | 🟡 stub (FR strict : région) |
| Reset | reset | reset | ✅ (loanword) |
| Restaurant | restaurant | restaurant | ✅ |
| Role(s) | role(s) | role(s) | ✅ |
| Sale(s) | sale(s) | sale(s) | 🟡 stub (FR strict : vente) |
| Secret | secret | secret | ✅ |
| Section(s) | section(s) | section(s) | ✅ |
| Segment | segment | segment | ✅ |
| Service | service | service | ✅ |
| Signature(s) | signature(s) | signature(s) | ✅ |
| Site(s) | site(s) | site(s) | ✅ |
| Solution | solution | solution | ✅ |
| Source | source | source | ✅ |
| Standard | standard | standard | ✅ |
| Status | status | status | 🟡 stub (FR strict : statut) |
| Stock | stock | stock | ✅ |
| Suspect | suspect | suspect | ✅ |
| Tab(s) | tab(s) | tab(s) | ✅ |
| Tag(s) | tag(s) | tag(s) | ✅ (loanword) |
| Title | title | title | 🟡 stub (FR strict : titre) |
| Total | total | total | ✅ |
| Tracking | tracking | tracking | ✅ (loanword) |
| Transaction(s) | transaction(s) | transaction(s) | ✅ |
| Transfer | transfer | transfer | 🟡 stub (FR strict : transfert) |
| Type(s) | type(s) | type(s) | ✅ |
| Urgent | urgent | urgent | ✅ |
| Validation | validation | validation | ✅ |
| Value(s) | value(s) | value(s) | 🟡 stub (FR strict : valeur) |
| Vendor(s) | vendor(s) | vendor(s) | 🟡 stub (FR strict : fournisseur) |
| Version | version | version | ✅ |
| Vision | vision | vision | ✅ |
| Webhook(s) | webhook(s) | webhook(s) | ✅ (loanword) |
| Workflow(s) | workflow(s) | workflow(s) | ✅ (loanword) |
| Zone(s) | zone(s) | zone(s) | ✅ |

> Légende statut : ✅ = vrai cognate strict (orthographe FR=EN exacte) ;
> 🟡 = cognate « pragmatique » — la traduction FR canonique diffère (accent
> ou mot différent), mais on tolère ces valeurs identiques quand elles
> apparaissent sous forme de libellés Java-derived stubés (typiquement les
> packs `domains/**`, `features/**` chargés en couche placeholder Phase 0.4).
> Cette tolérance évite ~2 000 faux positifs et garde les warnings du
> validateur sous le seuil opérationnel (≤ 400 cas réels à acter).

### 21.2 Cognates explicitement EXCLUS

| Mot anglais | Traduction FR correcte | Pourquoi exclu |
|---|---|---|
| Cities | Villes | mot FR différent |
| Companies | Sociétés | mot FR différent |
| Currencies | Devises | mot FR différent |
| Country / Countries | Pays | mot FR différent |
| Society | Société | accent FR |
| Market | Marché | accent FR |
| Beneficiary | Bénéficiaire | accent FR + suffixe |
| Bank / Banking | Banque | accent FR + suffixe |
| Method | Méthode | accent FR |
| Category | Catégorie | accent FR |
| Days | Jours | mot FR différent |
| Terms | Termes | dérivé mais usage figé EN |
| Difference | Différence | accent FR |
| Reference (singulier français) | Référence | accent FR |

Si un mot exclu apparaît identique FR/EN dans un pack, c'est **un vrai cas à
traduire** — pas un faux positif. Le validateur le signalera correctement.

### 21.3 Vocabulaire multi-mots PascalCase — `MULTIWORD_TECH_TOKENS`

Le set `MULTIWORD_TECH_TOKENS` (~400 entrées) est utilisé **uniquement** pour
valider les libellés composés générés à partir d'entités Java
(`Item Id`, `Cost Center Id`, `Stock Balances`, `Inventory Tx Lines`,
`Effective Date`, `Approved By`, `Period Start`, `Fiscal Years`,
`Exchange Rates`, `Payment Terms`, `Business Units`, `Item Categories`,
`Tax Code Id`, `Run Number`, `Transfer Number`…). Catégories couvertes :

- **8 patterns techniques** explicitement listés dans le brief E2 :
  `Id`, `Date`, `Number`, `Type`, `Code`, `Status`, `Total`, `Amount`.
- **Suffixes FK / colonnes d'audit Java** : `name`, `count`, `by`, `at`,
  `from`, `to`, `effective`, `created`, `updated`, `posted`, `approved`,
  `rejected`, `submitted`, etc.
- **Vocabulaire domaine ERP** : `currency`, `customer`, `vendor`,
  `employee`, `manager`, `partner`, `warehouse`, `cost`, `center`, `tax`,
  `transfer`, `line`, `inventory`, `tx`, `txes`, `balances`, `fiscal`,
  `period`, `business`, `unit`, `category`, etc.
- **Modules / domaines Java** : `domain`, `core`, `hr`, `ap`, `ar`, `crm`,
  `erp`, `finance`, `logistics`, `procurement`, `purchasing`, `payroll`,
  `inventory`, `invoicing`, etc.
- **Adjectifs / participes passés** : `approved`, `rejected`, `submitted`,
  `completed`, `cancelled`, `archived`, `received`, `shipped`, `paid`,
  `pending`, `verified`, etc.

Un token de `MULTIWORD_TECH_TOKENS` n'est **PAS** whitelisté en standalone :
`Currency` seul reste détecté comme suspect (à traduire en « Devise »),
mais `Currency Id` est tolérée parce que chaque token est reconnu comme
Java-derived. Cette double granularité maintient la rigueur du validateur
sur les mots métier isolés tout en absorbant les ~2 000 stubs Java générés.

### 21.4 Java entity stubs Round 2 — `STUB_JAVA_TOKEN_WHITELIST` (Wave E3)

> Wave E3 a introduit un **3ᵉ set** de tokens utilisé **uniquement** pour
> absorber les ~200 stubs Java standalone (`Cities`, `Currencies`,
> `Departments`, `Disposition Codes`, `Stock Balances`…) restant **après**
> traduction des vrais cas dans `applications/erp/*`, `core` et `features/*`.
>
> **Différence avec `COGNATE_WHITELIST`** : ces tokens ne sont **pas** des
> cognates FR/EN identiques (`Cities` ≠ `Villes`, `Departments` ≠
> `Départements`, `Currency` ≠ `Devise`). Ils sont tolérés uniquement parce
> qu'ils apparaissent **exclusivement** dans les packs scaffoldés
> `domains/core/*` et `domains/erp/*` — packs non rendus directement par
> l'UI Round 1 (catalogue de features pré-câblé pour Round 2).
>
> **Différence avec `MULTIWORD_TECH_TOKENS`** : `STUB_JAVA_TOKEN_WHITELIST`
> est consulté à la fois en standalone (`isStandaloneTokenWhitelisted`) et
> en multi-mots (`matchesTokenSets`), alors que `MULTIWORD_TECH_TOKENS`
> n'est consulté qu'en multi-mots.
>
> **Round 2 (backend i18n migration)** : ces packs JSON seront régénérés
> end-to-end depuis les bundles backend `messages_fr.properties` /
> `messages_en.properties` (Java ResourceBundle), et
> `STUB_JAVA_TOKEN_WHITELIST` sera retiré.

| Catégorie | Exemples (extrait) |
|---|---|
| Navigation titles | `Cities`, `Countries`, `Currencies`, `Locations`, `Departments`, `Employees`, `Territories`, `Geography`, `Banks` |
| Entity field names | `Difference`, `Probability`, `Stage`, `Tier`, `Tracking`, `Channel`, `Method`, `Category`, `Days`, `Terms`, `Behavior` |
| Domain enums | `Disposition`, `Disposition Codes`, `Designations`, `Separations`, `Onboardings`, `Enrollments`, `Goals`, `Grievances` |
| Long-tail entities | `Multiplier`, `Provider`, `Rating`, `Tenure`, `Aisle`, `Algorithm`, `Bin`, `Rack`, `Shelf`, `Strategy`, `Beneficiary`, `Capacity`, `Heading`, `Height`, `Length`, `Subheading`, `Width`, `Carriers`, `Drivers`, `Routes`, `Shipments` |
| Module roots | `Accounting`, `Crm`, `Directory`, `Hr`, `Invoicing`, `Logistics`, `Payroll`, `Procurement`, `Purchasing` |

Liste complète : voir `STUB_JAVA_TOKEN_WHITELIST` dans
`web/scripts/check-i18n-parity.mjs` (~150 entrées).

**Règle de contribution** : un nouveau token n'est ajouté à
`STUB_JAVA_TOKEN_WHITELIST` que si une recherche de ses occurrences confirme
qu'il apparaît **uniquement** dans les packs `domains/**`. Toute occurrence
hors `domains/**` doit faire l'objet d'une vraie traduction FR.

---

> Glossaire vivant. Toute traduction divergente doit être justifiée dans la PR et discutée avec l'utilisateur.
