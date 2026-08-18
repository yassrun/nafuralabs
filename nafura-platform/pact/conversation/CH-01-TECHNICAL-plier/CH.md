# CH-01-TECHNICAL — plier l'arbre

**Type :** `TECHNICAL`
**Cible :** BC `conversation`
**Qualification :** le contrat est posé ; le code de **ce** BC vit encore sous `features/ai/`. Aucune règle ne change.

## Pourquoi

Un contexte Pact a un arbre (`ARCHI_BLUEPRINT`). Tant que le code de ce BC porte le nom de son ancien paquet, le prochain Change travaille dans le mauvais dossier.

## Aujourd'hui

- Backend, trois jars owned :
  - `sources/backend/features/ai/ai-conversation/` (sources Java sous `src/main/java/ma/nafura/ai_conversation/`)
  - `sources/backend/features/ai/ai-agent-api/` (sources Java sous `src/main/java/ma/nafura/platform/ai/agent/`)
  - `sources/backend/features/ai/ai-agent-runtime/` (sources Java sous `src/main/java/ma/nafura/ai_agent_runtime/` et `src/main/java/ma/nafura/platform/ai/agent/`)
- Includes `includePlatform(":platform:features:ai:ai-conversation")` · `includePlatform(":platform:features:ai:ai-agent-api")` · `includePlatform(":platform:features:ai:ai-agent-runtime")` dans `sources/backend/settings.gradle.kts`. `llm-provider` reste `:platform:features:ai:llm-provider`.
- Web de ce BC : `sources/web/features/ai/ai-conversation/` (`index.ts` · `services/conversation-api.service.ts` · `components/assistant-block-renderer.component.ts`) ; barrel `sources/web/features/ai/index.ts`.
- Consommateurs (pas de ce BC) : chrome shell `core/shell/platform-app-shell.component.ts` ; panneau / bouton `sources/web/features/ai-assistant/`.
- e2e déjà `e2e/conversation/` ; Gradle des e2e `:platform:features:ai:ai-conversation` (`e2e/conversation/_gradle.mjs`).

## Attendu

Les modules Gradle et le web de **ce** BC vivent sous `conversation`. Les packages Java, les routes HTTP et les noms de scénarios `conversation-*` **ne bougent pas**.

## Coupe web (AC-2) — décidé seul

**Entre** sous `sources/web/app/conversation/` : client HTTP + rendu des blocs (`features/ai/ai-conversation/`).

**Reste consommateur** (repointe l'import, n'entre pas) : chrome shell (`platform-app-shell.component.ts`) · panneau / bouton `features/ai-assistant/` entier.

La SPEC owns session, tour, blocs, liens. Le chrome (panneau, bouton) est **socle**. CH-00 : le client web qui entre = API + blocs.

## Critères d'acceptation (gelés)

- **AC-1** Les trois jars owned de ce BC vivent sous `sources/backend/conversation/`, inclus sous `:platform:conversation` :
  - `:platform:conversation:ai-conversation` (`projectDir` = `conversation/ai-conversation`)
  - `:platform:conversation:ai-agent-api` (`projectDir` = `conversation/ai-agent-api`)
  - `:platform:conversation:ai-agent-runtime` (`projectDir` = `conversation/ai-agent-runtime`)
  Les anciens includes `:platform:features:ai:ai-conversation` · `:platform:features:ai:ai-agent-api` · `:platform:features:ai:ai-agent-runtime` ne sont plus. `llm-provider` reste `:platform:features:ai:llm-provider`. Les e2e lancent `:platform:conversation:ai-conversation:test` ; les dossiers sources Java internes `src/main/java/ma/nafura/ai_conversation/` et `src/main/java/ma/nafura/ai_agent_runtime/` restent.
- **AC-2** Le web de ce BC est sous `sources/web/app/conversation/` (`index.ts` · `services/conversation-api.service.ts` · `components/assistant-block-renderer.component.ts`). Les anciens dossiers `sources/web/features/ai/ai-conversation/` et le barrel `sources/web/features/ai/index.ts` ne sont plus.
- **AC-3** Les e2e restent sous `e2e/conversation/`. Les noms `test("conversation-…")` sont inchangés : `conversation-creer-et-lister` · `conversation-deux-tenants` · `conversation-session-introuvable` · `conversation-messages-vides` · `conversation-frontiere-produit`.
- **AC-4** La suite e2e existante (`conversation-*`) reste verte.
- **AC-5** Les FQCN Java `ma.nafura.platform.ai.conversation` (dont `ConversationController` · `ConversationBaselineTest`) et `ma.nafura.platform.ai.agent` (dont `AssistantController` · `AgentRuntimeController`) et les routes `/api/ai/conversations` · `/api/ai/conversations/{conversationId}/turn` · `/api/ai/conversations/{conversationId}/agent` ne changent pas.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `conversation-plier-arbre` | backend `features/ai/ai-conversation` + `ai-agent-api` + `ai-agent-runtime` · web `features/ai/ai-conversation` · includes `:platform:features:ai:ai-*` (sans `llm-provider`) · e2e déjà `e2e/conversation/` | AC-1, AC-2, AC-3, AC-5 |
| suite `conversation-*` | inchangée (créer-et-lister / deux tenants / session introuvable / messages vides / frontière produit — CH-00) | AC-4 |

`POL-TENANT-ISOLATION` · `POL-ERREUR-CODE` · `POL-PAS-METIER-PRODUIT` — inchangées (pas de patch SPEC).

## Hors périmètre

Renommer les packages · aligner les dossiers `ma/nafura/ai_conversation/` et `ma/nafura/ai_agent_runtime/` sur le FQCN · refondre l'intérieur `api/domain/…` · toucher au comportement · `llm-provider` · chrome shell et `features/ai-assistant/` (consommateur) · autres BC (seul un `project(':platform:…')` qui nomme l'ancien include suit AC-1)
