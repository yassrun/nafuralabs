# IA (`cap.ai`)

## Identité

| | |
|---|---|
| Catalogue | `cap.ai` |
| Modules | `llm-provider`, `ai-agent-api`, `ai-conversation`, `ai-agent-runtime` |
| Requires | `cap.approvals`, `cap.subscriptions`, `cap.app-settings`, `cap.audit` |
| Probe | `GET /api/v1/platform/admin/ai-providers` |
| Note | **~8/10** (post chantier *Fournisseurs IA entreprise* : BYOK chiffré, catalogue 4 providers, RBAC/audit, quotas, privacy) |

## État (livré)

**Runtime LLM.** `LlmService` + registry (`gemini`, `deepseek`, `openai`, `azure-openai`) ; routage `RoutingAiProvider` selon préférences tenant (`app.ai.provider`, `app.ai.model`) sinon défaut `ai.provider`. Clés : priorité **BYOK tenant** (déchiffrée à l’appel) → sinon clé **plateforme** (`ai.gemini.api-key`, `ai.deepseek.api-key`, `ai.openai.api-key`, `ai.azure-openai.api-key` / Vault ops). Clé absente → provider mock (lab), pas d’erreur dure.

**BYOK.** Table `tenant_ai_credential` (AES-256-GCM, master key `AI_CREDENTIALS_MASTER_KEY` ops). Secrets write-only : l’API renvoie `configured` + `keyHint` (4 derniers caractères), jamais le secret. `RoutingAiProvider` injecte la clé tenant dans le contexte (`apiKeyOverride`) sinon retombée plateforme.

**Catalogue strict.** `AiProviderCatalog` : 4 providers, ids de modèles versionnés. Modèle hors liste → 400. Azure = déploiements (pas de liste fixe).

**Quotas / privacy.** `LlmService` refuse si `app.ai.enabled=false` ou budget mensuel (`app.ai.monthlyBudgetUsd`) dépassé (somme `cost_usd` mois UTC). `response_content` null par défaut, persisté seulement si `app.ai.retainPayloads=true`.

**RBAC / audit.** `administration.ai.read` (voir) / `administration.ai.configure` (runtime, credentials, test, limites). Audit manuel `ai_provider_change`, `ai_credential_rotate`, `ai_credential_revoke`, `ai_budget_change` (`entityType` `ai-provider`), sans secret.

**Admin UI.** `/administration/ai-providers` : 3 sections (Runtime · Identifiants · Limites & confidentialité) + bouton Tester ; écriture masquée sans `administration.ai.configure` ; i18n FR host (`administration.aiProviders.*`).

**Usage.** Table `ai_usage_event` (tokens, `cost_usd`, `response_content` seulement si opt-in). Agrégats SuperAdmin via `/api/v1/platform/usage/ai/*`.

**Consommateurs.** Conversations / agents, extraction document (`cap.document-extraction`), déduction couleurs branding (`POST …/branding/extract-colors` dans `llm-provider`).

## Chantier (livré) — Fournisseurs IA entreprise

Objectif : une administration digne d’une organisation (BYOK, quotas, privacy, RBAC, audit, catalogue élargi) **sans** retirer le fallback clés plateforme ops. **Lots 1–6 réalisés.**

### Décisions

| Sujet | Décision |
|---|---|
| Clés | Priorité : credential **tenant (BYOK)** → sinon clé **plateforme** du provider |
| Stockage BYOK | Table `tenant_ai_credential` ; AES-GCM ; master key `AI_CREDENTIALS_MASTER_KEY` (ops/lab, jamais exposée) |
| API secrets | Write-only ; réponse = `configured` + `keyHint` (4 derniers caractères) ; jamais le secret |
| Providers | `gemini`, `deepseek`, `openai`, `azure-openai` |
| Modèles | Catalogue **strict** (ids versionnés) ; refus si hors liste |
| Quotas | `app.ai.monthlyBudgetUsd` (null = illimité) ; somme `cost_usd` mois UTC avant appel → refus métier |
| Kill-switch | `app.ai.enabled` (défaut `true`) |
| Privacy | Défaut : **ne pas** persister prompt / `response_content` ; opt-in `app.ai.retainPayloads` |
| RBAC | `administration.ai.read` (voir) ; `administration.ai.configure` (runtime, credentials, test, limites) |
| Audit | Actions manuelles `ai_provider_change`, `ai_credential_rotate`, `ai_credential_revoke`, `ai_budget_change` (`entityType` `ai-provider`) |
| UI | Une page, 3 sections : Runtime · Identifiants · Limites & confidentialité ; briques `nf-*` ; bouton Tester |

### Modèle de données

**`tenant_ai_credential`** (module `llm-provider`)

| Colonne | Rôle |
|---|---|
| `tenant_id` | Organisation |
| `provider` | `gemini` \| `deepseek` \| `openai` \| `azure-openai` |
| `ciphertext` | Secret chiffré (AES-GCM) |
| `key_hint` | 4 derniers caractères (affichage) |
| `updated_at` / `updated_by` | Traçabilité |
| UNIQUE | `(tenant_id, provider)` |

**`tenant_setting` (limites)**

| Clé | Type | Défaut |
|---|---|---|
| `app.ai.provider` | string | (existant) |
| `app.ai.model` | string | (existant) |
| `app.ai.enabled` | bool | `true` |
| `app.ai.monthlyBudgetUsd` | decimal string | null (illimité) |
| `app.ai.retainPayloads` | bool | `false` |

Pour Azure : base URL / deployment peuvent vivre en settings dédiés (`app.ai.azure.endpoint`, `app.ai.azure.deployment`) si le runtime l’exige — documentés à l’implémentation, jamais la clé en clair.

### API admin (cible)

Base : `/api/v1/platform/admin/ai-providers`

| Méthode | Path | Permission | Effet |
|---|---|---|---|
| `GET` | `/` | `administration.ai.read` | État : providers, `keyConfigured` (plateforme ou BYOK), hint BYOK, runtime, limites |
| `PUT` | `/` | `administration.ai.configure` | Provider + modèle (allowlist) ; audit `ai_provider_change` |
| `PUT` | `/credentials/{provider}` | `administration.ai.configure` | Pose / remplace secret BYOK ; audit `ai_credential_rotate` |
| `DELETE` | `/credentials/{provider}` | `administration.ai.configure` | Révoque BYOK (retombée plateforme) ; audit `ai_credential_revoke` |
| `POST` | `/test` | `administration.ai.configure` | Ping court (vision/texte minimal ou list models) ; **ne logue pas** le secret |
| `GET`/`PUT` | `/limits` | read / configure | `enabled`, `monthlyBudgetUsd`, `retainPayloads` ; audit `ai_budget_change` sur PUT |

Erreurs attendues : `400` modèle/provider invalide ; `503` BYOK demandé mais master key absente ; `429` / `409` budget dépassé ou IA désactivée à l’appel runtime.

### Résolution de clé (runtime)

```
callLlm(tenant)
  → si !enabled → refuse
  → si budget mensuel dépassé → refuse
  → key = decrypt(tenant_ai_credential[provider]) ?? platformEnvKey(provider)
  → si key vide → erreur claire (plus de mock silencieux en mode « clé requise » pour features productives)
  → appel provider ; usage : tokens + cost ; payloads seulement si retainPayloads
```

### UI (cible)

Chemin : `/administration/ai-providers`  
Nav : permission `administration.ai.read`  
Écriture : boutons / formulaires masqués ou disabled sans `administration.ai.configure`

| Section | Contenu |
|---|---|
| **Runtime** | Cartes providers (actif, statut clé plateforme / BYOK) ; sélection modèle (libellés humains) ; Enregistrer |
| **Identifiants** | Par provider : champ secret (password), Remplacer, Révoquer ; hint last4 ; Tester la connexion |
| **Limites & confidentialité** | Switch enabled ; budget mensuel ; switch retainPayloads + avertissement |

i18n FR host complet (`administration.aiProviders.*`).

### Ops / secrets

| Secret | Rôle |
|---|---|
| `AI_CREDENTIALS_MASTER_KEY` | Chiffrement BYOK (obligatoire pour activer la saisie tenant) |
| `AI_GEMINI_API_KEY` / `AI_DEEPSEEK_API_KEY` | Fallback plateforme (existant) |
| `AI_OPENAI_API_KEY` | Fallback OpenAI |
| `AI_AZURE_OPENAI_API_KEY` (+ endpoint) | Fallback Azure |

Documenter dans `ops/secrets/README.md` ; lab injecte la master key si présente (sinon BYOK UI désactivée, fallback plateforme inchangé).

## Contrat

- Un seul chemin LLM : `LlmService` + registry ; pas de second client HTTP IA dans un BC.
- Préférences et credentials : admin `cap.ai` uniquement ; les BCs déclarent des outils / extractions, pas des clés.
- Permissions dans le code : `administration.ai.*` ; jamais de rôles hardcodés dans l’UI.
- Secrets : jamais dans les logs, l’audit (détails), ni les réponses JSON.
- UI : briques anatomy existantes ; pas de page parallèle « AI settings v2 ».

## Hors scope (ce chantier)

- Anthropic, Bedrock, Vertex « native » au-delà de Gemini déjà supporté.
- Quotas par utilisateur / par feature / par conversation.
- SSO ou approval workflow pour changer de clé.
- Export SIEM des usage events ; rétention légale multi-années.
- Refonte produit Conversation / agents (outils BC) — chantier ROADMAP séparé, qui **consomme** ce runtime.

## Roadmap

> **Livré** — lots 1 → 6 réalisés (cf. [État](#état-livré) ci-dessus).

| Lot | Livrable | Done quand |
|---|---|---|
| **1 — Fondations BYOK** | Table + AES-GCM + port résolution clé tenant→plateforme | Round-trip encrypt ; runtime utilise BYOK si présent ; master key absente → 503 sur PUT credential seulement |
| **2 — Catalogue** | `openai` + `azure-openai` ; allowlist stricte | PUT modèle hors liste → 400 ; 4 providers listés en GET |
| **3 — Admin API + RBAC + audit** | Endpoints credentials / test / limits ; permissions ; `AuditActions` | Host-test 403 ; événements audit sans secret |
| **4 — Quotas + privacy** | Budget + enabled dans `LlmService` ; plus de payload par défaut | Budget bas → refus ; `ai_usage_event.response_content` null sauf opt-in |
| **5 — UI** | Page 3 sections + test + i18n + guards | Lab : configurer, tester, sauver limites sans fuite de clé |
| **6 — Docs / ops** | Ce fichier tenu à jour ; secrets README ; pointeur ROADMAP | `node platform-host/ops/run.mjs check` vert |

Ordre : 1 → 2 → 3 → 4 → 5 → 6 (5 peut démarrer en parallèle de 4 une fois le contrat API stable).

## Vérifier

1. `node platform-host/ops/run.mjs check`
2. Lab sans BYOK : provider plateforme + test connexion OK si clé ops présente.
3. Lab avec master key : poser une clé org → hint last4 → test OK → révoquer → retombée plateforme.
4. Modèle hors catalogue → 400.
5. Budget mensuel très bas → appel LLM refusé ; usage sans corps de réponse en base.
6. User sans `administration.ai.configure` : lecture OK, écriture / credentials / test refusés.
7. Chemins UI : `/administration/ai-providers` (sections Runtime, Identifiants, Limites).
