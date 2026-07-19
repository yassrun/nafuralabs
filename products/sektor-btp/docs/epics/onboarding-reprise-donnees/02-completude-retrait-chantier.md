# Lot 2 — Complétude et retrait du chantier

**Objectif** : refléter la nouvelle cible dans le score d'onboarding, sans léser les tenants déjà
en service.
**Dépend de** : lot 1.

---

## T2.1 — Repondération

`OnboardingCompletenessService` construit aujourd'hui sept sections pondérées :

| Section | Avant | Après |
|---|---|---|
| `identity` — identité société | 15 | 15 |
| `preset` — configuration initiale | 25 | 25 |
| `chart` — plan comptable | 15 | 15 |
| `numbering` — numérotation | 10 | 10 |
| `articles` — articles BTP | 10 | 10 |
| ~~`chantier` — premier chantier~~ | 15 | **supprimée** |
| **`referentiel` — référentiel repris** | — | **15** |
| `team` — équipe invitée | 10 | 10 |
| | **100** | **100** |

`referentiel` est satisfaite dès qu'**au moins un** des trois jeux — clients, fournisseurs,
employés — contient une ligne.

> **Pourquoi un seul suffit** : le score mesure la prise en main, pas l'exhaustivité. Une société
> de gros œuvre sans fichier fournisseurs exploitable ne doit pas rester bloquée à 85 %
> indéfiniment. Exiger les trois transformerait un indicateur en reproche.

`articles` reste distincte : elle existait déjà et couvre le catalogue, pas les tiers.

## T2.2 — Les tenants déjà onboardés

C'est le point à ne pas rater : la section `chantier` disparaît alors que des tenants l'ont
validée.

| Situation du tenant | Comportement attendu |
|---|---|
| A créé un chantier, pas de référentiel | **Ne doit pas régresser.** `referentiel` est considérée acquise |
| A créé un chantier **et** du référentiel | Inchangé |
| Onboarding jamais terminé | Reprend le nouveau parcours |

**Règle** : la suppression d'une section ne doit jamais faire *baisser* un score déjà atteint. Un
utilisateur qui voit sa complétude tomber de 100 % à 85 % sans avoir rien fait perd confiance dans
l'indicateur — et un indicateur en qui on ne croit pas ne sert plus à rien.

Implémentation attendue : au calcul, si le tenant a une trace d'onboarding antérieure à la bascule
et une section `chantier` satisfaite, créditer `referentiel`. Pas de migration de données —
c'est une règle de lecture, pas une réécriture d'historique.

## T2.3 — Le chantier d'onboarding déjà créé

Les chantiers créés par l'ancien parcours restent en base. **Ne rien supprimer** : on ne distingue
pas de façon fiable un chantier fictif d'un vrai premier chantier, et détruire de la donnée
client sur une heuristique est hors de question.

Question **O3** : faut-il les signaler à l'utilisateur (« ce chantier a été créé pendant votre
inscription — voulez-vous le supprimer ? ») ou les laisser sans rien dire ? À trancher avec le
métier.

## T2.4 — Nettoyage

- Retirer `OnboardingChantierPage` et sa route
- **Vérifier avant suppression** si `ChantierCreatePage.onboardingMode` a d'autres appelants ;
  s'il n'en a plus, le retirer aussi
- Retirer les clés de traduction devenues orphelines

---

## Critères d'acceptation

- [ ] Un tenant neuf atteint 100 % sans jamais créer de chantier
- [ ] Un tenant déjà à 100 % avant la bascule reste à 100 % après
- [ ] Aucun chantier existant n'est supprimé ni modifié
- [ ] La somme des poids fait 100
- [ ] `referentiel` bascule dès la première ligne importée dans l'un des trois jeux
