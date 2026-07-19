# Lot 1 — Le wizard de reprise de données

**Objectif** : enchaîner les cinq imports existants dans un parcours d'accueil.
**Dépend de** : rien. Les briques sont en place.

---

## T1.1 — État de reprise persisté

Un onboarding s'interrompt : fermeture d'onglet, session expirée, reprise le lendemain. L'état
doit survivre (D4).

Étendre `TenantOnboardingMeta` plutôt que créer une entité : la reprise **est** un fait
d'onboarding.

```
reprise_etape_courante    INT          -- 1..5
reprise_etapes_passees    TEXT         -- clés des étapes explicitement passées
reprise_terminee          BOOLEAN      -- l'utilisateur a atteint la fin du parcours
```

> **Nullable, défaut neutre.** Un tenant déjà onboardé n'a pas ces valeurs et ne doit pas s'en
> trouver affecté — voir `02-completude-retrait-chantier.md`.

**Distinguer « passée » de « non visitée »** : c'est ce qui permet de répondre à O1 (une étape
passée compte-t-elle dans la complétude ?) sans re-migrer ensuite.

## T1.2 — API d'état

```
GET  /api/v1/onboarding/reprise          état courant
PUT  /api/v1/onboarding/reprise/etape    { etape: 1..5, passee?: boolean }
```

L'écriture en base des données importées passe par les **API métier existantes** (clients,
fournisseurs, employés, articles, ouvrages), via les handlers front. **Aucun endpoint d'import
nouveau côté back** — les handlers appellent déjà les services applicatifs.

## T1.3 — Page du wizard

`products/sektor-btp/web/app/onboarding/pages/onboarding-reprise/`

Composition : `WizardShellComponent` + `SmartImportTriggerComponent`, une étape par définition.

```ts
// Table de configuration — l'étape est une donnée, pas une branche de code.
interface EtapeReprise {
  cle: 'clients' | 'fournisseurs' | 'employes' | 'articles' | 'bibliotheque';
  libelle: string;
  definition: ExtractionDefinition;   // la constante *_IMPORT_DEFINITION existante
  importer: (data) => Promise<ApplicationImportResult>;
  aide: string;                       // ce que la société doit chercher chez elle
}
```

Cinq entrées dans un tableau. **Pas de `switch` sur la clé d'étape** : ajouter une sixième
reprise plus tard doit être une ligne de configuration, pas une branche de plus.

⚠️ `WizardShellComponent` indexe à partir de **0**, l'étape persistée va de **1 à 5**. Convertir
une fois, dans une valeur nommée. C'est le défaut relevé sur l'ancien écran de consultation, et
retrouvé au lot 2 de l'epic étude de prix.

## T1.4 — Le comportement de chaque étape

| Événement | Comportement attendu |
|---|---|
| `completed` (extraction relue) | Appeler le handler, afficher `created` / `skippedDuplicates`, avancer |
| `cancelled` | Rester sur l'étape, aucun message d'erreur — l'utilisateur a changé d'avis |
| `failed` | Afficher la cause, **laisser l'étape franchissable** (D7) |
| « Passer » | Marquer l'étape passée, avancer. Aucune relance ultérieure |

**Le résultat doit être lisible sans jargon** : « 42 clients ajoutés, 3 doublons ignorés », pas
« ApplicationImportResult{created:42, skippedDuplicates:3} ».

## T1.5 — L'aide par étape

C'est ce qui fait la différence entre un import qui aboutit et un utilisateur qui abandonne. Pour
chaque étape, dire **quel fichier chercher**, en langage métier :

| Étape | Formulation |
|---|---|
| Clients | « Votre fichier clients, ou un export de votre logiciel de facturation. » |
| Fournisseurs | « La liste de vos fournisseurs habituels — même incomplète. » |
| Employés | « Votre registre du personnel, ou le fichier de paie. » |
| Articles | « Ce que vous achetez régulièrement : ciment, acier, location d'engins. » |
| Bibliothèque | « Vos sous-détails de prix — le classeur où vous calculez vos prix unitaires. » |

Le dialogue d'aide de `smart-import` (`smart-import-help-dialog.component.ts`) existe : le
réutiliser plutôt que réécrire un panneau d'aide.

## T1.6 — Sortie du parcours

Retirer `/onboarding/chantier` de `ONBOARDING_V2_ROUTES` et brancher `/onboarding/reprise` à sa
place. `OnboardingChantierPage` est supprimée ; `ChantierCreatePage` reste, y compris son entrée
`onboardingMode` si d'autres appelants l'utilisent — **vérifier avant de la retirer**.

La sortie mène au tableau de bord, comme aujourd'hui.

---

## Critères d'acceptation

- [ ] Un tenant neuf parcourt les 5 étapes et importe au moins un jeu de données réel
- [ ] Un tenant qui **passe les 5 étapes** arrive sur un outil pleinement utilisable
- [ ] Fermer l'onglet en cours de parcours puis revenir reprend à la bonne étape
- [ ] Un fichier partiellement fautif importe les lignes valides et liste les autres
- [ ] Un même fichier importé deux fois ne crée pas de doublon (`skippedDuplicates` > 0)
- [ ] Aucune donnée n'est écrite sans être passée par la relecture
- [ ] Plus aucune route ne mène à la création de chantier depuis l'onboarding
- [ ] Un tenant déjà onboardé ne voit ni régression de complétude ni parcours rouvert

---

## Hors périmètre de ce lot

- La pondération de complétude → lot 2
- Le sort des chantiers d'onboarding déjà créés → lot 2
- La création d'articles manquants depuis l'étape bibliothèque → question O5
