# 00 — Tableau de bord

> **Audit 2026-06-20** · tenant nafura · Siège · `erp-web:dev-20260620005515`

Route : `/dashboard`. Page d'accueil multi-persona avec widgets réorganisables.

## Vues par persona (onglets)

- [x] Bascule **Direction** : affiche les blocs stratégiques (CA, marge, alertes).
- [x] Bascule **Conducteur travaux** : affiche les blocs chantier/avancement.
- [x] Bascule **Comptabilité** : affiche les blocs financiers/facturation.
- [x] La bascule de persona conserve l'agencement propre à chaque vue.

## Personnalisation du layout

- [ ] **Glisser-déposer** un bloc pour réorganiser → position persistée.
- [ ] **Réinitialiser le layout** → revient à l'agencement par défaut.
- [x] Sélecteur de **société/tenant** (nafura · Siège) recharge les KPI du tenant.
- [x] Indicateur **Complétude** (ex. 90 %) reflète l'état de configuration.

## Bloc CHANTIERS

- [x] **En cours** : compteur = nb chantiers statut « En cours » (live: **5**).
- [x] **Avancement moyen** : moyenne pondérée budget sur **tous** les chantiers (**23 %** live · CH-2026-004 seul à 40 % + CH-2026-005 à 16,7 % diluent le KPI).
- [x] **Top 3 chantiers — surconsommation matière (stock)** : affiche `—` si pas de données.
- [x] **Lots à péremption < 30 j (stock)** : compteur (0 attendu).

## Bloc FINANCES & VENTES

- [x] **CA facturé HT (MAD)** : **528 000 MAD** (KPI ventes `caCumule` · `Promise.allSettled` évite 0 si un autre module KPI échoue · deploy `dev-20260620222605`).
- [x] **Factures en retard** : compteur des échéances dépassées (0 attendu).

## Bloc INDICATEURS & TENDANCES

- [x] **CA cumulé (M MAD) — N vs N-1** : graphe, message « Pas encore de données » si vide.
- [x] **Marge % — top 10 chantiers (30 j.)** : graphe.
- [x] **Top 5 chantiers en alerte** : graphe.
- [x] **Pyramide gravité (Bird HSE)** : graphe live (`GET /hse/kpis?from=…&to=…` · `presquAccidents: 1`) · fix init `liveCounts` avant `chartData` (`dev-20260620131616` — crash JS bloquait toute la section analytics).
- [x] Chaque graphe affiche un **état vide explicite** tant que l'activité ne génère pas d'indicateurs.

## Navigation transverse

- [x] **Recherche globale** (Ctrl+K) ouvre la palette pages/enregistrements/paramètres.
- [x] Cloche **notifications** : badge = alertes métier ERP ; panneau liste les mêmes alertes (approbations, factures retard, cautions, formations · deploy unifié).
- [x] Sélecteur **langue** (FR) : bascule i18n sans `[object Object]` ni clés brutes.
- [x] Palette Ctrl+K : « Mes **paramètres** » (i18n `core.topbar.mySettings` corrigé).

## Jeux de données

Aucune saisie : la page est en lecture seule (agrégats). Pour faire « vivre » les widgets :

1. Saisir un avancement sur **CH-2026-004 / L10** (40 %) → impacte le chantier seul ; KPI dashboard = **23 %** (pondéré 6 chantiers).
2. Émettre une facture depuis une situation valorisée → impacte *CA facturé HT*.
3. Créer un incident HSE → impacte *Pyramide gravité*.
4. Créer une alerte de stock (seuil mini) → impacte *Lots à péremption / surconsommation*.
