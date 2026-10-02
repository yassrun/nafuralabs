# Capabilities v1 — le host embarque tout, le produit retire

> `platform-host` démarre avec **toutes** les capabilities plateforme, chacune prouvée par un test. Un produit en retire par `spec.capabilities.disabled` ; le retrait vaut au build, côté web et backend.

Lot : [`../LOT.md`](../LOT.md) (D-5, D-6).

## Intention

Le host v1 montait 3 capabilities en liste blanche. La cible : un nouveau produit part du **tout**, testé ensemble, et ne configure que ce qu’il retire. Aucun produit ne recâble une capability.

## Critères d’acceptation

- **AC-1** Catalogue unique : chaque capability plateforme a un id `cap.*`, ses modules backend, ses routes web, ses dépendances (`requires`). Source unique lue par le web, le build Gradle et les tests.
- **AC-2** Contrat : `spec.capabilities.disabled: string[]` remplace la liste blanche. Le validateur rejette une capability inconnue, et le retrait d’une capability dont une autre active (ou un BC) dépend.
- **AC-3** Backend : le build du host dérive ses modules du catalogue moins `disabled`. Tous activés, le host démarre.
- **AC-4** Lab autonome : sans Docker ni installation, le host démarre sur PostgreSQL embarqué ; services externes (stockage, e-mail, LLM, PDF) en implémentation locale ou désactivés proprement.
- **AC-5** Web : toutes les routes et la navigation des capabilities actives sont montées ; aucune clé i18n brute ni icône manquante.
- **AC-6** Preuve : un test par capability appelle son API dans le host complet avec un jeton lab et attend une réponse non 5xx / non 404. Un test prouve qu’une capability retirée disparaît (route web et API).

## Approche

1. Catalogue (`capabilities.json` plateforme) + contrat + validateur + tests purs.
2. Backend : `platform-host` embarque tout ; démarrer, corriger chaque échec de boot **dans la plateforme** (valeurs par défaut lab, conditions), jamais dans le produit.
3. Build : Gradle lit `app.nafura.json` + catalogue → dépendances.
4. Web : table de montage complète, i18n et icônes.
5. Preuves : suite `capabilities` (JUnit, contexte complet + PostgreSQL embarqué) + parcours navigateur.

Risque principal : modules jamais démarrés ensemble hors Sektor (Postgres + Keycloak + MinIO). Chaque correction de boot est une correction plateforme, testée.

## Validation technique

| Preuve | Couvre |
|--------|--------|
| `npm run architecture:check` (catalogue, contrat, validateur) | AC-1, AC-2 |
| `gradlew :test` dans `platform-host/sources/backend` (boot complet + une requête par capability + retrait) | AC-3, AC-4, AC-6 |
| Parcours navigateur de toutes les entrées de navigation, 0 erreur console / réseau | AC-5 |

## Livraison

- Catalogue `nafura-platform/capabilities.json` (20 capabilities, 28 modules) lu par le web, Gradle (`gradle/nafura-host.gradle`) et `host-tests`.
- `host-tests` : `verifyCapabilityCatalog` (catalogue ↔ graphe Gradle réel, testé en négatif) ; boot complet sur PostgreSQL embarqué, santé UP, 401 anonyme, **tous** les GET exposés sans 5xx.
- Web : `host-screens.ts` monte 19 écrans selon les capabilities actives ; tests purs contrat opt-out, cohérence écrans ↔ catalogue, icônes (83 utilisées, 0 manquante), i18n (clés rendues, dynamiques, texte/section).
- Corrections plateforme trouvées en embarquant tout : `observability` et `webhook` (API Boot 4), OpenTelemetry 2.28.1, ports IAM en auto-configuration, stockage local `DocumentStorage` (anti-traversée), 4xx pour les erreurs de requête, 404 modèle introuvable, client Google Places (Jackson 2/3), imports cassés `document-extraction`, lanceur JUnit centralisé (139 tests qui ne tournaient plus).
- `socle-sektor` avancé : admin IA et adaptateur e-mail d’invitation remontés.
- Produits alignés sur la stack : Sektor et Venue Catalog passent de Gradle 8.14 à 9.7.1 et compilent sous Boot 4.1.1 / JDK 25.

Écart : `/administration/ai-providers` n’a pas été revérifié dans le navigateur après remontée (couvert par le balayage GET de `host-tests`).
