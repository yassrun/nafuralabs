# Secrets locaux — un seul endroit

Fichiers gitignored, jamais commités, restent sur la machine :

| Fichier | Usage |
|---------|--------|
| `nafura-platform/ops/secrets/nafura.secrets` | Seed Vault (`bootstrap-env` / `vault-seed`) |
| `nafura-platform/ops/secrets/dev-staging-local.env` | Mode B local (source dans le shell avant `bootRun`) |

Seule exception suivie : **ce README** (la forme, jamais les valeurs).

```bash
ENV=staging bash toolchain/ops/nlops.sh bootstrap-env
ENV=staging bash toolchain/ops/nlops.sh vault-seed
SECRETS_FILE=/path/to/file bash toolchain/ops/nlops.sh vault-seed
```

---

## Format `nafura.secrets`

Sections `[env/chemin/vault]` puis `clé=valeur` → écrit dans `secret/nafura/{env}/{chemin}`.

Engine : **KV v2** au mount `secret/`.

```
secret/nafura/{env}/
├── platform/
│   ├── data/postgres          # username, password, host, port, database_keycloak
│   ├── storage/minio          # root_user, root_password, access_key, secret_key
│   ├── iam/
│   │   ├── keycloak           # admin_*, db_* (Keycloak pod)
│   │   └── clients/{app-id}   # client_secret (OAuth backend clients)
│   ├── integrations/
│   │   ├── email/brevo        # api_key
│   │   └── ai/gemini          # api_key
│   └── security/invitation    # token_secret
└── apps/
    └── {app-id}/
        ├── database           # name, schema, user, pass, ai_user, ai_user_password
        ├── object-storage     # endpoint, bucket, user, password
        └── integrations       # app-specific (clés d'API tierces)
```

| Consumer | Vault paths |
|----------|-------------|
| postgres pod | `platform/data/postgres` |
| keycloak pod | `platform/iam/keycloak` |
| minio pod | `platform/storage/minio` |
| `{app}-backend` | `apps/{app}/*`, `platform/integrations/email/brevo`, `platform/integrations/ai/gemini`, `platform/iam/keycloak`, `platform/security/invitation`, `platform/iam/clients/{app}` |

Créer le fichier s'il n'existe pas, avec au minimum les sections pour ton `ENV` :

```ini
# nafura-platform/ops/secrets/nafura.secrets — NE PAS COMMITTER

[staging/platform/data/postgres]
username=nafura
password=nafura
host=postgres
port=5432
database_keycloak=keycloak

[staging/platform/iam/keycloak]
admin_username=admin
admin_password=admin
db_username=nafura
db_password=nafura
db_database=keycloak

[staging/platform/storage/minio]
root_user=minioadmin
root_password=minioadmin
access_key=minioadmin
secret_key=minioadmin

[staging/platform/integrations/email/brevo]
api_key=

[staging/platform/integrations/ai/gemini]
api_key=

[staging/platform/security/invitation]
token_secret=change-me-staging-local

[staging/apps/sektor-btp/database]
name=nafura_erp
schema=public
user=nafura
pass=nafura
ai_user=nafura_ai
ai_user_password=nafura_ai

[staging/apps/sektor-btp/object-storage]
endpoint=http://minio.nafura-infra-staging.svc:9000
bucket=nafura-documents
user=minioadmin
password=minioadmin

[staging/apps/blanner/database]
name=nafura_blanner
schema=public
user=nafura
pass=nafura

[staging/apps/blanner/integrations]
google_places_api_key=

[staging/apps/venue-catalog/database]
name=nafura_venue_catalog
schema=public
user=nafura
pass=nafura

[staging/apps/venue-catalog/object-storage]
endpoint=http://minio.nafura-infra-staging.svc:9000
bucket=venue-catalog-media
user=minioadmin
password=minioadmin

[staging/apps/venue-catalog/integrations]
google_places_api_key=

[prod/platform/data/postgres]
username=nafura
password=CHANGEME
host=postgres
port=5432
database_keycloak=keycloak

# … mêmes sections prod avec mots de passe forts et endpoints nafura-infra-prod
```

Onboard app : le job `vault-sync` crée `apps/{app}/database` + `object-storage` et la policy/role backend.

---

## Brevo — staging vs prod

| Env | Clé Brevo | Usage |
|-----|-----------|--------|
| **staging** | API key **dédiée** (compte test / sender staging) | Signup, invitations, workflows mail en local |
| **prod** | API key prod (déjà dans Vault prod) | Clients réels uniquement |

Ne pas réutiliser la clé prod en staging.

Après création de la clé staging dans [Brevo](https://app.brevo.com) → **Settings → SMTP & API → onglet API keys** (pas « SMTP keys ») :

- Créer une clé nommée `staging` → la valeur commence par `xkeysib-…`
- Coller dans `[staging/platform/integrations/email/brevo]` → `api_key=…`
- `KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh vault-seed`
- `kubectl -n sektor-staging rollout restart deploy/sektor-btp-backend`

---

## Opérations Vault (forme)

### Set Brevo API key (prod)

```bash
kubectl config use-context nafura-vps-prod
ROOT=$(kubectl -n nafura-infra-prod get secret vault-bootstrap -o jsonpath='{.data.root_token}' | base64 -d)
kubectl -n nafura-infra-prod exec deploy/vault -- env \
  VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN="$ROOT" \
  vault kv put secret/nafura/prod/platform/integrations/email/brevo api_key="…"
kubectl -n sektor-prod rollout restart deploy/sektor-btp-backend
```

### Set Gemini API key

```bash
vault kv put secret/nafura/prod/platform/integrations/ai/gemini api_key="…"
```

### Venue Catalog

```bash
vault kv put secret/nafura/staging/apps/venue-catalog/database \
  name=nafura_venue_catalog schema=public user=nafura pass=nafura
vault kv put secret/nafura/staging/apps/venue-catalog/object-storage \
  endpoint=http://minio.nafura-infra-staging.svc:9000 bucket=venue-catalog-media \
  user=minioadmin password=minioadmin
vault kv put secret/nafura/staging/apps/venue-catalog/integrations \
  google_places_api_key="…"
```

Policy / role K8s (forme) :

```hcl
path "secret/data/nafura/staging/apps/venue-catalog/*" {
  capabilities = ["read"]
}
```

```bash
vault policy write venue-catalog-backend venue-catalog-backend.hcl
vault write auth/kubernetes/role/venue-catalog-backend \
  bound_service_account_names=venue-catalog-backend \
  bound_service_account_namespaces=venue-catalog-staging \
  policies=venue-catalog-backend ttl=24h
```

UI : **Secrets → secret → nafura → {env} → platform → integrations → …**

---

## K8s secrets hors Vault

| Secret | Namespace | Purpose |
|--------|-----------|---------|
| `vault-bootstrap` | `nafura-infra-{env}` | root_token + unseal_key (never commit) |
| `nafura-registry` | app + infra ns | Docker registry pull |

Legacy `infra/*` et `apps/*/db|minio` ont été migrés vers `platform/*` et `apps/*/database|object-storage`. Script : `ENV=prod bash infra/scripts/vault-migrate-platform-paths.sh` (idempotent).

Apps sorties du dépôt (`blanner`, `usage-ops`, `build-intelligence`, `layali`, `beauty`) : leurs chemins Vault existent encore côté infra.
