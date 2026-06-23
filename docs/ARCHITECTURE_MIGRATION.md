# NafuraLabs — Architecture & migration

**Status:** Sektor ERP migré (2026-06)  
**Source legacy:** `nf/nafura` (à archiver après bascule prod)

---

## 1. Décisions

- **Product-first** : métier dans `products/<app-id>/`
- **Platform** : `platform/backend` + `platform/web` uniquement
- **Pas de JSON spec** comme source de vérité (fichier `sektor-btp.application.json` = lifecycle uniquement, à retirer plus tard)
- **Pas de nafgen / nafspec / nafops** → `toolchain/ops/nlops.sh`
- **2 environnements** : `staging` (K8s local) + `prod` (GKE)
- **Namespaces** : `nafura-infra` + `nafura-sektor`

---

## 2. Sektor BTP — migré

| Ancien (nafura) | Nouveau (nafuralabs) |
|-----------------|----------------------|
| `backend/domains/*` | `products/sektor-btp/backend/modules/*` (`:sektor:*`) |
| `backend/applications/erp` | `products/sektor-btp/backend/app` (`:sektor:app`) |
| `web/app/applications/erp` | `products/sektor-btp/web/app` |
| `web/app/platform` | `platform/web` |
| `web/` (workspace) | `nafuralabs/web/` |
| `infra/k8s/.../erp` | `products/sektor-btp/deploy/k8s/` |
| `marketing/nafuralabs` | `marketing/corporate/` |
| Gradle `:domains:` | `:sektor:` |

**DB prod conservée :** `nafura_erp`

---

## 3. Gradle

```bash
.\gradlew.bat :sektor:app:bootJar
.\gradlew.bat :tools:lifecycle:collectMigrations -PappId=sektor-btp
```

---

## 4. Kubernetes

```bash
ENV=staging bash toolchain/ops/nlops.sh infra-up
bash toolchain/ops/nlops.sh provision-db sektor-btp
bash toolchain/ops/nlops.sh deploy sektor-btp
```

---

## 5. Bascule prod (manuel)

1. Build + push images `sektor-btp-backend`, `sektor-btp-web`
2. `ENV=prod bash toolchain/ops/nlops.sh deploy sektor-btp`
3. DNS `sektor.nafuralabs.com` → nouveau cluster / ingress
4. Archiver `nf/nafura`

---

## 6. Reste à faire

- [ ] Vérifier compile Gradle + build Angular localement
- [ ] Vault paths `nafura/staging` et `nafura/prod` pour sektor-btp
- [ ] CI/CD GitHub Actions
- [ ] Retirer `sektor-btp.application.json` quand lifecycle 100 % code
- [ ] Découpler imports ERP du shell platform (alias `@applications/*` OK pour l’instant)

Voir le guide de maintenance : [README.md](README.md).
