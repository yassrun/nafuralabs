# Smart Import — architecture écran → extractor → écran

La platform extrait, valide et fait relire le document. Elle retourne ensuite le JSON métier validé sans mapper de payload ERP et sans appeler d’API.

1. **Définition** — Créer une `ExtractionDefinition` pure à partir du schéma d’extraction : `key`, schémas data/UI, instructions, `arrayPath` et règles de review.
2. **Écran** — Monter `<nf-smart-import-trigger [definition]="importDefinition" (completed)="consume($event)" />`.
3. **Consommation** — Dans `consume`, l’écran choisit le traitement du `ReviewedExtraction.data` :
   - formulaire détail : mapper puis `form.patchValue`;
   - import métier : déléguer le mapping, la déduplication et les appels API à un service applicatif, puis rafraîchir l’écran.

```text
écran (fichier + définition)
  → platform (extraction + validation + Magic UI)
  → écran (JSON validé)
  → service applicatif ERP ou patch formulaire
```

Règle de frontière : aucun service de la feature platform `smart-import` ne doit dépendre d’une API ERP ni exposer de méthode `create`.
