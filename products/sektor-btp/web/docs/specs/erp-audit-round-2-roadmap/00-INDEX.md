# ERP Audit Roadmap **Round 2** — Tasks for Agents

> **Source de vérité :** audit fonctionnel **Round 2** daté **2026-05-13** (`docs/specs/ROUNDéAUDIT/AUDIT_round_2`).
> **Périmètre :** ERP BTP Maroc (`web/app/applications/erp/`) — 13 modules sidebar.
> **Hypothèse de départ :** **Round 1 implémenté à ~68 %** (cf. `docs/specs/erp-audit-roadmap/00-INDEX.md`). Round 2 = **enrichissement métier + couverture concurrence MA** (Sage, Batigest, Odoo BTP, SAP B1, ERPGEC, Cogilog).
> **Objectif :** finaliser le produit pour **mise en production B2B** sous **6 sprints** (12 semaines). Chaque tâche `M-XX` est self-contained et reprend la nomenclature de l'audit.

---

## Comment lire ce dossier

1. **Lire `00-PRIORITIES.md`** : sprints suggérés et ordre d'attaque pour les 6 prochaines semaines.
2. **Choisir un fichier de tâche** (`01-*.md` à `17-*.md`) — un fichier par section de l'audit.
3. Chaque fichier suit le format :
   - `## Findings traités` — refs `M-XX` de l'audit Round 2 + statut
   - `## Goal` — l'objectif métier
   - `## Context to read first` — paths à lire avant de coder
   - `## Tasks` — liste numérotée, chaque tâche a fichiers à modifier + acceptance criteria
   - `## Testing` — tests e2e/unit à ajouter
   - `## Dependencies` — autres tâches qui doivent être finies avant
4. **Marquer la case `[x]`** dans le tableau ci-dessous quand la tâche est mergée.
5. **Mettre à jour `00-PROGRESS.md`** (statut + colonne évidence + date).
6. Pour chaque tâche complexe, scinder via `TodoWrite`.

---

## Mapping M-XX → fichier de tâche

### Module §01 Dashboard
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-DASH-01 Personnalisation widgets | P1 | [01-dashboard.md](01-dashboard.md) |
| [ ] | M-DASH-02 Graphes & tendances | P1 | [01-dashboard.md](01-dashboard.md) |
| [ ] | M-DASH-03 Drill-down KPI | P1 | [01-dashboard.md](01-dashboard.md) |
| [ ] | M-DASH-04 Alertes temps réel | P2 | [01-dashboard.md](01-dashboard.md) |
| [ ] | M-DASH-05 Filtres multi-axes | P2 | [01-dashboard.md](01-dashboard.md) |
| [ ] | M-DASH-06 Export PDF dashboard | P2 | [01-dashboard.md](01-dashboard.md) |
| [ ] | M-DASH-07 Widgets HSE & RH | P3 | [01-dashboard.md](01-dashboard.md) |
| [ ] | M-DASH-08 Mode TV | P3 | [01-dashboard.md](01-dashboard.md) |

### Module §02 Chantiers
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-CHA-01 Détail chantier accessible | **P0** | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-02 Wizard création chantier | **P0** | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-03 Onglets fiche chantier | P1 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-04 Équipe chantier | P1 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-05 Carte interactive | P1 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-06 e-signature MOE/MOA attachement | P1 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-07 Photos chantier géolocalisées | P1 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-08 Plans BIM/DWG/PDF visionneuse | P1 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-09 Registre des risques | P1 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-10 Exports MS-Project/Primavera | P1 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-11 Avancements mobile (offline) | P1 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-12 Métrés As-built | P2 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-13 Météo automatique | P2 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-14 Réceptions provisoire/définitive | P2 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-15 Budget drill engagements | P2 | [02-chantiers.md](02-chantiers.md) |
| [ ] | M-CHA-16 Calendrier équipes Outlook/Google | P3 | [02-chantiers.md](02-chantiers.md) |

### Module §03 Achats & Sous-traitance
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-ACH-01 Réceptions 3-way matching | **P0** | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-02 Comparatif fournisseurs / scoring AO | **P0** | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-03 Fournisseur 360° | P1 | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-04 Workflow DA→AO→BC→Réception→Facture | P1 | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-05 Catalogue articles fournisseurs | P1 | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-06 Portail fournisseur | P1 | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-07 Attestations légales auto | P1 | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-08 Sous-traitance Art. 187 CGI | P1 | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-09 BC catalogue / contrat cadre | P1 | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-10 Cadre normatif marchés publics | P2 | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-11 Tableau de bord achats | P2 | [03-achats.md](03-achats.md) |
| [ ] | M-ACH-12 IA suggestion achats | P3 | [03-achats.md](03-achats.md) |

### Module §04 Stock & Logistique
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-STK-01 Scanner mobile (QR/code-barres) | P1 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-02 Réservation stock chantier | P1 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-03 Magasin chantier digital | P1 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-04 Liaison conso ↔ budget | P1 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-05 Étiquetage lot/emplacement | P1 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-06 Multi-emplacements par dépôt | P1 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-07 Date péremption / lot | P1 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-08 Demande de transfert workflow | P2 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-09 CMP / FIFO réel | P2 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-10 ABC analysis Pareto | P2 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-11 Suggestion réappro auto | P2 | [04-stock.md](04-stock.md) |
| [ ] | M-STK-12 Carte dépôts + tournée | P3 | [04-stock.md](04-stock.md) |

### Module §05 Matériel & Équipements
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-MAT-01 Maintenance préventive/corrective GMAO | **P0** | [05-materiel.md](05-materiel.md) |
| [ ] | M-MAT-02 Carburant & consommables | **P0** | [05-materiel.md](05-materiel.md) |
| [ ] | M-MAT-03 Fiche engin 360° | P1 | [05-materiel.md](05-materiel.md) |
| [ ] | M-MAT-04 Locations externes vrais flux | P1 | [05-materiel.md](05-materiel.md) |
| [ ] | M-MAT-05 Réservation/planning matériel | P1 | [05-materiel.md](05-materiel.md) |
| [ ] | M-MAT-06 Pointage matériel chantier | P1 | [05-materiel.md](05-materiel.md) |
| [ ] | M-MAT-07 Contrôles réglementaires (VGP) | P1 | [05-materiel.md](05-materiel.md) |
| [ ] | M-MAT-08 GPS / télémétrie | P2 | [05-materiel.md](05-materiel.md) |
| [ ] | M-MAT-09 Habilitations CACES | P2 | [05-materiel.md](05-materiel.md) |
| [ ] | M-MAT-10 TCO par engin | P2 | [05-materiel.md](05-materiel.md) |
| [ ] | M-MAT-11 Maintenance prédictive IA | P3 | [05-materiel.md](05-materiel.md) |

### Module §06 Études & Soumissions
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-ETU-01 DPU (déboursé sec) bibliothèque prix | **P0** | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-02 Métré → DPGF → Devis auto | **P0** | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-03 Soumission AO client | P1 | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-04 Courbe en S prévisionnelle | P1 | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-05 Bibliothèque prix avancée | P1 | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-06 Mémoire technique auto | P1 | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-07 Variantes de chiffrage | P1 | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-08 Import BPU client | P1 | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-09 Bibliothèque qualifs MA | P2 | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-10 Bordereaux officiels MA | P2 | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-11 Comparatif AO reçus | P2 | [06-etudes.md](06-etudes.md) |
| [ ] | M-ETU-12 IA mémoire technique | P3 | [06-etudes.md](06-etudes.md) |

### Module §07 Marchés BTP
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-MAR-01 Avenants workflow complet | P1 | [07-marches.md](07-marches.md) |
| [ ] | M-MAR-02 DGD (Décompte Général Définitif) | P1 | [07-marches.md](07-marches.md) |
| [ ] | M-MAR-03 Caution alerte expiration + workflow | P1 | [07-marches.md](07-marches.md) |
| [ ] | M-MAR-04 OS (Ordre de Service) | P1 | [07-marches.md](07-marches.md) |
| [ ] | M-MAR-05 Situations auto depuis avancements | P1 | [07-marches.md](07-marches.md) |
| [ ] | M-MAR-06 Avances / acomptes / amortissement | P1 | [07-marches.md](07-marches.md) |
| [ ] | M-MAR-07 Sous-traitance déclarative Art. 187 | P2 | [07-marches.md](07-marches.md) |
| [ ] | M-MAR-08 Réception provisoire/définitive | P2 | [07-marches.md](07-marches.md) |
| [ ] | M-MAR-09 Indices BTP01..BTPxx auto | P2 | [07-marches.md](07-marches.md) |
| [ ] | M-MAR-10 Litige / réclamation MOA | P3 | [07-marches.md](07-marches.md) |

### Module §08 Finance & Trésorerie
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-FIN-01 Lettrage facture ↔ règlement | P1 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-02 Recouvrement / relances | P1 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-03 Effets de commerce (LCR/LCN) | P1 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-04 Multi-banques (XML virements) | P1 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-05 Rapprochement OFX/CSV | P1 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-06 e-facture DGI 2026-2027 | P1 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-07 Retenue à la source 5 % marchés publics | P1 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-08 Régime auto-entrepreneur fournisseurs | P1 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-09 Caisses chantier (avances chef) | P1 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-10 Analytique multi-axes | P2 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-11 Budget trésorerie glissant 12 mois | P2 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-12 Clôture périodique + report | P2 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-13 Liasse fiscale (Bilan/CPC/ESG) | P2 | [08-finance.md](08-finance.md) |
| [ ] | M-FIN-14 Connecteur Open Banking | P3 | [08-finance.md](08-finance.md) |

### Module §09 Ressources Humaines
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-RH-01 Pointage mobile chantier offline | **P0** | [09-rh.md](09-rh.md) |
| [ ] | M-RH-02 Contrats auto + signature | P1 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-03 Heures supplémentaires (HS25/50/100) | P1 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-04 Frais de déplacement | P1 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-05 Carrière / formations / habilitations | P1 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-06 Sécurité paie + signature | P1 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-07 Paie intérim | P1 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-08 Congés compteur + validation | P1 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-09 Accidents du travail CNSS DAT | P1 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-10 Maladies & arrêts IJSS | P1 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-11 Self-service employé | P2 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-12 Formation TFP 1,6 % OFPPT | P2 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-13 Médecine du travail | P2 | [09-rh.md](09-rh.md) |
| [ ] | M-RH-14 Engagement / pulse surveys | P3 | [09-rh.md](09-rh.md) |

### Module §10 Qualité & HSE — **MODULE ABSENT**
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-HSE-01 Registre incidents/accidents | **P0** | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-02 Non-conformités + CAPA | **P0** | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-03 PPSPS par chantier | **P0** | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-04 PHS générique société | **P0** | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-05 Causerie 1/4 h sécurité | P1 | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-06 Audits HSE checklists | P1 | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-07 EPI dotation + renouvellement | P1 | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-08 FDS / Risques chimiques | P1 | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-09 Plans évacuation + exercices | P1 | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-10 KPIs HSE (TF1/TF2/TG) | P1 | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-11 Déclarations CNSS DAT + CNAOPS | P1 | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-12 Audits ISO 9001/45001 | P2 | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-13 Risques environnementaux | P2 | [10-hse.md](10-hse.md) |
| [ ] | M-HSE-14 PV levée réserves QHSE | P2 | [10-hse.md](10-hse.md) |

### Module §11 Pilotage & Analyses
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-PIL-01 Brancher données analytics 5 vues | **P0** | [11-pilotage.md](11-pilotage.md) |
| [ ] | M-PIL-02 Indicateurs de marge multi-axes | P1 | [11-pilotage.md](11-pilotage.md) |
| [ ] | M-PIL-03 OPEX vs CAPEX | P1 | [11-pilotage.md](11-pilotage.md) |
| [ ] | M-PIL-04 Reporting groupe multi-société | P1 | [11-pilotage.md](11-pilotage.md) |
| [ ] | M-PIL-05 Cash-flow dynamique (vs linéaire) | P1 | [11-pilotage.md](11-pilotage.md) |
| [ ] | M-PIL-06 What-if simulator | P1 | [11-pilotage.md](11-pilotage.md) |
| [ ] | M-PIL-07 Exports CAC (FEC, CGNC) | P2 | [11-pilotage.md](11-pilotage.md) |
| [ ] | M-PIL-08 Benchmark sectoriel anonymisé | P2 | [11-pilotage.md](11-pilotage.md) |
| [ ] | M-PIL-09 Alertes IA proactives | P3 | [11-pilotage.md](11-pilotage.md) |

### Module §12 Approbations
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-APR-01 Engine workflow générique | **P0** | [12-approbations.md](12-approbations.md) |
| [ ] | M-APR-02 Approbations multi-types | **P0** | [12-approbations.md](12-approbations.md) |
| [ ] | M-APR-03 Inbox approbateur + audit log | **P0** | [12-approbations.md](12-approbations.md) |
| [ ] | M-APR-04 Délégation absence | P1 | [12-approbations.md](12-approbations.md) |
| [ ] | M-APR-05 Notifications / escalade SLA | P1 | [12-approbations.md](12-approbations.md) |
| [ ] | M-APR-06 Matrice pouvoirs configurable | P1 | [12-approbations.md](12-approbations.md) |
| [ ] | M-APR-07 Approbation mobile 1-clic | P1 | [12-approbations.md](12-approbations.md) |
| [ ] | M-APR-08 Audit trail hash & timestamping | P2 | [12-approbations.md](12-approbations.md) |

### Module §13 Administration — **MODULE ABSENT**
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-ADM-01 Utilisateurs & Rôles RBAC | **P0** | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-02 SSO Entra/Google + 2FA | **P0** | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-03 Sociétés / Entités juridiques | **P0** | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-04 Paramètres société (ICE/IF/RC...) | **P0** | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-05 Référentiels (clients/MOA/banques) | **P0** | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-06 Audit log global recherchable | P1 | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-07 Templates documents WYSIWYG | P1 | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-08 Numérotation séquentielle | P1 | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-09 Paramètres fiscaux (TVA, RAS, timbres) | P1 | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-10 Mappings comptables auto | P1 | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-11 Gestion abonnements / licences | P1 | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-12 Sauvegarde & restauration | P1 | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-13 API publique + webhooks | P2 | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-14 Import / migration Sage/Batigest | P2 | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-15 i18n locales (FR/AR/EN + hijri) | P2 | [13-admin.md](13-admin.md) |
| [ ] | M-ADM-16 Thème / white-label | P3 | [13-admin.md](13-admin.md) |

### Module §14 Features transversales
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-TRA-01 Command palette `Ctrl+K` fonctionnelle | **P0** | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-02 Drill-down clic-ligne universel | **P0** | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-03 Workflow approbation transversal | **P0** | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-04 Exports CSV/XLSX/PDF universels | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-05 Impression PDF templates | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-06 Filtres avancés / vues sauvegardées | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-07 Recherche full-text + OCR | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-08 Notifications applicatives | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-09 Bilingue FR / AR (RTL) + EN | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-10 Mode sombre | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-11 États vides / loading / erreur unifiés | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-12 Feedback toasts CRUD | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-13 Aide contextuelle métier | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-14 Tour produit / Onboarding | P1 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-15 Historique / restauration versions | P2 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-16 Commentaires + @mentions | P2 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-17 Pièces jointes universelles | P2 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-18 Activity feed timeline | P2 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-19 Bulk actions listings | P3 | [14-transverse.md](14-transverse.md) |
| [ ] | M-TRA-20 Saved searches → automation | P3 | [14-transverse.md](14-transverse.md) |

### Module §15 Mobile / Terrain
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-MOB-01 App mobile / PWA terrain | **P0** | [15-mobile.md](15-mobile.md) |
| [ ] | M-MOB-02 Mode offline (IndexedDB/SQLite) | **P0** | [15-mobile.md](15-mobile.md) |
| [ ] | M-MOB-03 Géolocalisation / géofencing | P1 | [15-mobile.md](15-mobile.md) |
| [ ] | M-MOB-04 Capture photo native + géotag | P1 | [15-mobile.md](15-mobile.md) |
| [ ] | M-MOB-05 Scanner QR / code-barres | P1 | [15-mobile.md](15-mobile.md) |
| [ ] | M-MOB-06 Signature digitale canvas | P1 | [15-mobile.md](15-mobile.md) |
| [ ] | M-MOB-07 Notifications push FCM/APNs | P2 | [15-mobile.md](15-mobile.md) |
| [ ] | M-MOB-08 Mode basse bande passante | P2 | [15-mobile.md](15-mobile.md) |

### Module §16 Intégrations & Connecteurs
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-INT-01 DGI SIMPL-IS XML mensuel | **P0** | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-02 CNSS DAMANCOM XML mensuel | **P0** | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-03 CNSS DAT déclaration AT | P1 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-04 API banques MA (AWB/BMCE/CIH/BP) | P1 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-05 e-facture DGI 2026-2027 | P1 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-06 Indices BTP01..xx ANP/HCP CSV | P1 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-07 OMPIC API ICE/IF/RC | P1 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-08 Bureaux qualifications MA | P1 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-09 WhatsApp Business API | P1 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-10 Drive / OneDrive / Dropbox | P2 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-11 Outlook / Gmail / Calendar | P2 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-12 MS Project / Primavera P6 | P2 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-13 Bentley / AutoCAD / Revit (BIM) | P2 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-14 Météo DMN | P2 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-15 PowerBI / Looker / Tableau | P3 | [16-integrations.md](16-integrations.md) |
| [ ] | M-INT-16 Migration Sage 100/1000 (FEC) | P3 | [16-integrations.md](16-integrations.md) |

### Module §17 Spécificités Maroc
| ✓ | M-XX | Sévérité | Fichier |
|---|------|----------|---------|
| [ ] | M-MA-01 ICE/IF/RC/Patente/RIB/CNSS/AMO partout | **P0** | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-02 Retenue à la source 5 % marchés publics | **P0** | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-03 Timbre fiscal espèces > 100 MAD | **P0** | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-04 TVA 20/14/10 % paramétrable | P1 | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-05 Régime TPCC | P1 | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-06 CIMR cadres | P1 | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-07 OPPCM dépôt soumissions | P1 | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-08 CCAG-T terminologie alignée | P1 | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-09 Calendrier hijri + jours fériés MA | P1 | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-10 Code marchés publics MA (décret 2-22-431) | P2 | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-11 Référentiel banques + SWIFT | P2 | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-12 Régions / Provinces / Communes | P2 | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-13 Multi-devises (EUR/USD fournisseurs) | P2 | [17-maroc.md](17-maroc.md) |
| [ ] | M-MA-14 Calendrier prière chantier | P3 | [17-maroc.md](17-maroc.md) |

> **Légende** : `[x]` = résolu · `[~]` = partiel · `[ ]` = à faire
> **Compteur initial Round 2** : 0 ✅ / 0 🟡 / **151 ❌** à traiter

---

## Dépendances entre tâches (graph d'attaque)

```
13-admin (sociétés/RBAC/SSO/référentiels) ─┬─► 14-transverse (drill universel + Ctrl+K)
                                            ├─► 12-approbations (engine multi-types)
                                            └─► tous les modules métier (multi-tenant)

02-chantiers (fiche/wizard) ──► 03-achats (3-way matching) ──► 04-stock (magasin chantier)
                                                              ──► 05-materiel (GMAO)
                                                              ──► 07-marches (DGD/situations auto)

06-etudes (DPU/DPGF) ─► 02-chantiers ─► 07-marches ─► 08-finance (e-facture/RAS/lettrage)

09-rh (HS/CNSS DAT) ──► 10-hse (Module absent) ──► 11-pilotage (HSE KPIs)
                                                ─► 16-integrations (DAMANCOM/SIMPL-IS API)

15-mobile (PWA terrain) ─► chantiers/avancements/photos/HSE/pointage

17-maroc (ICE/RAS/TVA) ─► transverse à 03 / 07 / 08 / 09 / 13
```

**Règle** : `13-admin` + `12-approbations` + `14-transverse` posent la **plomberie produit** — à traiter en priorité avec `02-chantiers` (fiche détail bloque démo). Le reste s'enchaîne par modules métier.

---

## Trouvailles techniques (état codebase Round 2)

Pendant l'audit Round 2, ces causes-racines/régressions ont été identifiées :

| Cause-racine | Impact | Tâche |
|---|---|---|
| `chantier-detail.page.ts` accessible mais retourne « Chantier introuvable » sur drill-down | Bloque démo client | M-CHA-01 |
| Lignes tableaux non cliquables (« Mes chantiers » et tout listing) | UX cassée | M-TRA-02 |
| Codes chantiers `CH-2025-XXX` (situations/ST) vs `CH-2026-XXX` (planning/chantiers) mélangés dans budget | Cohérence data | M-CHA-15 |
| Sidebar : duplication **Marchés BTP** / **Marchés & Facturation** | Confusion UX | M-MAR-01 (consolidation) |
| Routes `/qualite` et `/admin` → **404** | Vente B2B bloquée | M-HSE-01, M-ADM-01 |
| Routes `/pilotage-analyses/*` → stubs KPIs à 0 (rentabilité, financier, stock, achats, RH) | Pilotage non vendable | M-PIL-01 |
| Routes `/materiel/maintenance` et `/materiel/carburant` redirigent vers `/parc` | GMAO absente | M-MAT-01, M-MAT-02 |
| Route `/materiel/locations` = stub « vue provisoire » | Module incomplet | M-MAT-04 |
| Page `/approvals` = vide, pas d'engine workflow visible | Gouvernance absente | M-APR-01 |
| Cash-flow projection linéaire constante (+658.148 MAD × 10 mois) | KPI mensonger | M-PIL-05 |
| Marges budget chantier affichent `3.250 %` (calcul bugué) | Bug calcul | M-CHA-15 |
| `Ctrl+K` toujours non opérationnel | Navigation lente | M-TRA-01 |
| Toggle langue inopérant | i18n incomplète | M-TRA-09 |
| Notifications panel : labels en anglais (« No notifications », « View All ») | Mauvaise UX | M-TRA-08 |

---

## État actuel (snapshot 2026-05-13)

Voir [00-PRIORITIES.md](00-PRIORITIES.md) pour la planification sprint par sprint.
Voir [00-PROGRESS.md](00-PROGRESS.md) pour le détail tâche par tâche.

— Audit folder créé pour : **finalisation Nafura ERP BTP MA**, audit Round 2 du `2026-05-13`.

---

## 📊 Tableau de progression initiale (mis à jour 2026-05-13)

| Spec | ✅ FAIT | 🟡 PARTIEL | ❌ MANQUANT | Avancement |
|---|---|---|---|---|
| [01-dashboard](01-dashboard.md) | 0 | 0 | 8 | 🔴 0% |
| [02-chantiers](02-chantiers.md) | 0 | 0 | 16 | 🔴 0% |
| [03-achats](03-achats.md) | 0 | 0 | 12 | 🔴 0% |
| [04-stock](04-stock.md) | 0 | 0 | 12 | 🔴 0% |
| [05-materiel](05-materiel.md) | 0 | 0 | 11 | 🔴 0% |
| [06-etudes](06-etudes.md) | 0 | 0 | 12 | 🔴 0% |
| [07-marches](07-marches.md) | 0 | 0 | 10 | 🔴 0% |
| [08-finance](08-finance.md) | 0 | 0 | 14 | 🔴 0% |
| [09-rh](09-rh.md) | 0 | 0 | 14 | 🔴 0% |
| [10-hse](10-hse.md) | 0 | 0 | 14 | 🔴 0% |
| [11-pilotage](11-pilotage.md) | 0 | 0 | 9 | 🔴 0% |
| [12-approbations](12-approbations.md) | 0 | 0 | 8 | 🔴 0% |
| [13-admin](13-admin.md) | 0 | 0 | 16 | 🔴 0% |
| [14-transverse](14-transverse.md) | 0 | 0 | 20 | 🔴 0% |
| [15-mobile](15-mobile.md) | 0 | 0 | 8 | 🔴 0% |
| [16-integrations](16-integrations.md) | 0 | 0 | 16 | 🔴 0% |
| [17-maroc](17-maroc.md) | 0 | 0 | 14 | 🔴 0% |
| **TOTAL** | **0** | **0** | **214** | **0%** |

🟢 ≥80% · 🟡 40–79% · 🔴 <40%

> ⚠️ **Note** : Round 1 est à ~68 % côté `erp-audit-roadmap`. Beaucoup d'items Round 2 reprennent et **enrichissent** des écrans qui existent déjà — vérifier l'évidence dans `docs/specs/erp-audit-roadmap/00-PROGRESS.md` avant de considérer une tâche "ex-nihilo".
