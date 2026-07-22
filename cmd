Prérequis (port-forward Postgres staging) :

bash toolchain/ops/dev-staging-local.sh sektor-btp back
Backend (terminal 1) :

set -a; source secrets/dev-staging-local.env; set +a
./gradlew.bat :sektor:app:bootRun
→ http://localhost:8082

Frontend (terminal 2) :

cd products/sektor-btp/web
npm run start:erp:staging-local
→ http://127.0.0.1:4200