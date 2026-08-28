# Études — décisions 20/08 + parcours QA

> Identité Extraire + consultation + blast mètres. **Raster autonome.** Contrat = [`DECISIONS-PRODUIT.md`](../../DECISIONS-PRODUIT.md).

Sous-lots :

| Sous-lot | Quoi |
|----------|------|
| `identite-extraire` | `cle_stable` 1–1, Extraire deux seaux, publier Sektor — **livré** |
| `article-code-extraire` | Extraire pose un code article tenant (liste Catalogue) |
| `consultation-etudes` | livré 20/08 — **cassé 22/08**, remplacé par le lot `consultation` |
| `metres-retrait` | blast code mètres — **livré** |
| `parcours-qa` | voie manuelle sans PDF, consultation à l’écran, chrome walk 20/08 |
| `dpgf-utf8` | POST nœud libellé accentué |
| `devis-client` | créer le client Partner à Générer le devis |
| `extraire-rattachement` | Extraire rattache + `ng build` cleStable |
| `completer-parcours` | CTA Continuer / Voir la synthèse + PU arbre après Extraire (walk 2 DE-0036) |
| `picker-article` | Picker **partagé** (DPU + stock + lookups) — pas de dump, filtres serveur, canvas 23/08 |
| `raffinement-etude` | intégrité du parcours, IA explicable, création Catalogue fiable, workspace chiffrage, synthèse et mobile — contrat 26/08 |
| `finition-parcours` | garde-fous avant gain, conversion sans marché, traçabilité Étude–Devis–Chantier–Catalogue, IA du dossier — revue 27/08 |

Hors lot (inbox, pas gelé) : L9 `createAllege`, slug LLM, fichier vs lignes identifier, Mockito 21, Liquibase `metrees`. Extraire incertain et tiny spec sont repris par `raffinement-etude`. DA / BL / clôture métier : vague 2 chantiers, pas ce chapitre.
