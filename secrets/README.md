# Secrets locaux — `nafura.secrets`

Un seul fichier : **`secrets/nafura.secrets`** — gitignored, jamais commité, reste sur ta machine.

Bootstrap Vault : `ENV=staging bash toolchain/ops/nlops.sh bootstrap-env`  
Re-seed : `ENV=staging bash toolchain/ops/nlops.sh vault-seed`

Autre chemin : `SECRETS_FILE=/path/to/file bash toolchain/ops/nlops.sh vault-seed`

Arbre Vault : [docs/VAULT_SECRETS.md](../docs/VAULT_SECRETS.md).

---

## Brevo — staging vs prod

| Env | Clé Brevo | Usage |
|-----|-----------|--------|
| **staging** | API key **dédiée** (compte test / sender staging) | Signup, invitations, workflows mail en local |
| **prod** | API key prod (déjà dans Vault prod) | Clients réels uniquement |

Ne pas réutiliser la clé prod en staging : risque d’envoyer de vrais mails et de polluer les stats Brevo.

Après avoir créé la clé staging dans [Brevo](https://app.brevo.com) → **Settings → SMTP & API → onglet API keys** (pas « SMTP keys ») :

- Créer une clé nommée `staging` → la valeur commence par `xkeysib-...`
- Coller dans `[staging/platform/integrations/email/brevo]` → `api_key=...`
- `KUBE_CONTEXT=docker-desktop ENV=staging bash toolchain/ops/nlops.sh vault-seed`
- `kubectl -n sektor-staging rollout restart deploy/sektor-btp-backend`

Tester signup sur `http://sektor.nafuralabs.staging` — les mails partent via la clé staging.

---

## Format

Sections `[env/chemin/vault]` puis `clé=valeur` → écrit dans `secret/nafura/{env}/{chemin}`.

Créer le fichier s'il n'existe pas encore, avec au minimum les sections pour ton `ENV` :

```ini
# secrets/nafura.secrets — NE PAS COMMITTER

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
# Blanner prod: [prod/apps/blanner/database] + [prod/apps/blanner/integrations]
# Venue Catalog prod: [prod/apps/venue-catalog/database], object-storage, integrations
```