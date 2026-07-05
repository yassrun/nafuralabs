# Vault secrets — NafuraLabs

Convention for all environments (`staging`, `prod`, `demo`). Engine: **KV v2** at mount `secret/`.

## Tree

```
secret/nafura/{env}/
├── platform/
│   ├── data/postgres          # username, password, host, port, database_keycloak
│   ├── storage/minio            # root_user, root_password, access_key, secret_key
│   ├── iam/
│   │   ├── keycloak             # admin_*, db_* (Keycloak pod)
│   │   └── clients/{app-id}     # client_secret (OAuth backend clients)
│   ├── integrations/
│   │   ├── email/brevo          # api_key
│   │   └── ai/gemini            # api_key
│   └── security/invitation      # token_secret
└── apps/
    └── {app-id}/
        ├── database             # name, schema, user, pass, ai_user, ai_user_password
        └── object-storage       # endpoint, bucket, user, password
```

## Who reads what

| Consumer | Vault paths |
|----------|-------------|
| postgres pod | `platform/data/postgres` |
| keycloak pod | `platform/iam/keycloak` |
| minio pod | `platform/storage/minio` |
| `{app}-backend` | `apps/{app}/*`, `platform/integrations/email/brevo`, `platform/integrations/ai/gemini`, `platform/iam/keycloak`, `platform/security/invitation`, `platform/iam/clients/{app}` |

## Bootstrap

1. Créer / éditer `secrets/nafura.secrets` (gitignored) — structure dans [secrets/README.md](../secrets/README.md).
2. `ENV={env} bash toolchain/ops/nlops.sh bootstrap-env` :
   - Job `vault-init` : arbre KV, policies, Kubernetes auth
   - `vault-seed` : applique `secrets/nafura.secrets` pour `ENV`

Re-seed sans rebootstrap :

```bash
ENV=staging bash toolchain/ops/nlops.sh vault-seed
```

Onboard app: `vault-sync` job creates `apps/{app}/database` + `object-storage` and backend policy/role.

## Common operations

### Set Brevo API key (prod)

```bash
kubectl config use-context nafura-vps-prod
ROOT=$(kubectl -n nafura-infra-prod get secret vault-bootstrap -o jsonpath='{.data.root_token}' | base64 -d)
kubectl -n nafura-infra-prod exec deploy/vault -- env \
  VAULT_ADDR=http://127.0.0.1:8200 VAULT_TOKEN="$ROOT" \
  vault kv put secret/nafura/prod/platform/integrations/email/brevo api_key="xkeysib-..."
kubectl -n sektor-prod rollout restart deploy/sektor-btp-backend
```

### Set Gemini API key

```bash
vault kv put secret/nafura/prod/platform/integrations/ai/gemini api_key="..."
```

Path in UI: **Secrets → secret → nafura → prod → platform → integrations → email → brevo**

## Migration from legacy paths

Legacy `infra/*` and `apps/*/db|minio` were migrated to `platform/*` and `apps/*/database|object-storage`.

```bash
ENV=prod bash infra/scripts/vault-migrate-platform-paths.sh
```

Idempotent; old paths are kept until manually deleted.

## K8s secrets outside Vault

| Secret | Namespace | Purpose |
|--------|-----------|---------|
| `vault-bootstrap` | `nafura-infra-{env}` | root_token + unseal_key (never commit) |
| `nafura-registry` | app + infra ns | Docker registry pull |
