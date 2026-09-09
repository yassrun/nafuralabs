---
id: SEKTOR-320
status: done
context: nafura
type: bug
agent_type: exec
priority: P1
assignee: agent
---

# Cadrage — Enregistrer persiste l'identité et la durée d'exécution

> Enregistrer et Continuer confirment les propositions CPS affichées, les persisttent, et l’en-tête affiche la durée d’exécution.

## Étapes

- [x] Enregistrer confirme les propositions encore affichées (plus de blocage revue)
- [x] Stepper / Continuer sauvent le cadrage avant de quitter l’étape 1
- [x] Durée d’exécution lue en live dans l’en-tête ; persistée sur l’AOC
- [x] Rechargement : champs déjà sauvés marqués acceptés, pas reproposés
- [x] Test `update_cadrageAo_persisteDelaiEtType`

## Journal

```
08/09 10:41  posée
08/09 10:41  status → doing
08/09 10:55  Enregistrer persistait 0 champ tant que la revue CPS restait ouverte ; le stepper quittait sans save ; l’en-tête lisait seulement l’AOC.
08/09 10:50  status → done
08/09 10:50  status → done
```

## Rapport de livraison

**Cause :** Enregistrer refusait tant qu’un champ CPS était `proposed` (valeurs déjà dans le formulaire). Le stepper changeait d’étape sans sauver. Au retour, l’extraction reproposait tout. L’en-tête « Durée d’exéc. » lisait `dossier.aoDelaiExecutionJours`, jamais le formulaire.

**Front :** Enregistrer / Continuer appellent `accepterTout()` puis persistent. Quitter l’étape 1 via le stepper sauve d’abord. L’en-tête prend la durée du formulaire dès qu’elle est connue. Un champ déjà persisté n’est plus reproposé.

**Back :** la réponse update recopie type / réf. / délai sur les transients AO si l’AOC ne les a pas encore fournis.

**Preuve :** `./gradlew.bat :sektor:etudes:test --tests ma.nafura.etudes.service.DossierEtudeServiceClientTest` OK. Front 4200 et API 8082 UP. Pas de browser MCP — recharger l’étude, Enregistrer, quitter et revenir.

Écarts : le backend local Mode B n’a pas été relancé (le correctif Java n’est actif qu’après reboot de bootRun). Le front ng serve reprend les fichiers à chaud.
