#!/usr/bin/env bash
# bc.demo API scenario against a running host (default http://localhost:8090): records, lifecycle, approval.
set -euo pipefail
BASE=${BASE:-http://localhost:8090}
# The filter grammar of the API, URL-encoded: enc '{"status":{"is":"DRAFT"}}'.
enc() { printf '%s' "$1" | sed 's/{/%7B/g;s/}/%7D/g;s/"/%22/g;s/:/%3A/g;s/,/%2C/g;s/\[/%5B/g;s/\]/%5D/g;s/ /%20/g'; }
token() { curl -s -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$1\"}" "$BASE/api/public/lab/session" | sed -E 's/.*"accessToken":"([^"]+)".*/\1/'; }
ORGS=$(curl -s -H "Authorization: Bearer $(token lead@host.local)" "$BASE/api/v1/me/organizations")
org_id() { node -e 'const o=JSON.parse(process.argv[1]); const hit=o.find(x=>x.key===process.argv[2]); if(!hit) process.exit(2); process.stdout.write(hit.id)' "$ORGS" "$1"; }
TENANT=$(org_id org-a)
TENANT_B=$(org_id org-b)
call() { # user method path [json] -> prints "status body"
  local t; t=$(token "$1")
  curl -s -o /tmp/demo-body -w '%{http_code}' -X "$2" -H "Authorization: Bearer $t" -H "X-Tenant-ID: $TENANT" -H 'Content-Type: application/json' ${4:+-d "$4"} "$BASE$3"
  echo " $(cat /tmp/demo-body)"
}
field() { sed -E "s/.*\"$1\":\"?([^\",}]+)\"?.*/\1/"; }
expect() { [[ "$1" == $2* ]] && echo "ok   $3" || { echo "FAIL $3 -> $1"; FAILED=1; }; }
FAILED=0
LEAD=lead@host.local; VIEWER=viewer@host.local

r=$(call $LEAD POST /api/v1/demo/categories '{"code":"SCN-CAT","name":"Categorie scenario"}'); expect "$r" 201 "create category"; CAT=$(echo "$r" | field id)
r=$(call $LEAD POST /api/v1/demo/suppliers "{\"code\":\"SCN-001\",\"name\":\"Atlas Scenario\",\"categoryId\":\"$CAT\",\"city\":\"Casablanca\"}"); expect "$r" 201 "create supplier"; SUP=$(echo "$r" | field id)
r=$(call $LEAD GET "/api/v1/demo/suppliers?q=atlas"); expect "$r" "200 {\"content\":[{" "search supplier"
[[ "$r" == *'"categoryName":"Categorie scenario"'* ]] && echo "ok   derived categoryName" || { echo "FAIL derived categoryName"; FAILED=1; }
r=$(call $LEAD POST /api/v1/demo/supplier-contacts "{\"supplierId\":\"$SUP\",\"name\":\"Salma B.\",\"email\":\"salma@atlas.ma\"}"); expect "$r" 201 "create contact"
r=$(call $LEAD GET "/api/v1/demo/supplier-contacts?filter=$(enc "{\"supplierId\":{\"is\":\"$SUP\"}}")"); expect "$r" "200 {\"content\":[{" "contacts of supplier"
r=$(call $VIEWER POST /api/v1/demo/suppliers '{"code":"X","name":"X"}'); expect "$r" 403 "viewer cannot create"
r=$(call $LEAD POST /api/v1/demo/suppliers '{"code":"","name":"X"}'); expect "$r" 400 "validation"

r=$(call $LEAD POST /api/v1/demo/purchase-requests "{\"subject\":\"Ecrans\",\"supplierId\":\"$SUP\",\"amount\":4500}"); expect "$r" 201 "create small request"; SMALL=$(echo "$r" | field id)
[[ "$r" == *'"status":"DRAFT"'* ]] && echo "ok   initial status" || { echo "FAIL initial status"; FAILED=1; }
r=$(call $LEAD GET /api/v1/demo/purchase-requests/$SMALL/transitions); expect "$r" '200 [{"id":"submit"' "transitions offered"
r=$(call $VIEWER POST /api/v1/demo/purchase-requests/$SMALL/transitions/submit); expect "$r" 403 "viewer cannot submit"
r=$(call $LEAD POST /api/v1/demo/purchase-requests/$SMALL/transitions/order); expect "$r" 409 "order from draft refused"
r=$(call $LEAD POST /api/v1/demo/purchase-requests/$SMALL/transitions/submit); expect "$r" 200 "submit small"
[[ "$r" == *'"status":"APPROVED"'* ]] && echo "ok   small request approved at once" || { echo "FAIL small approved: $r"; FAILED=1; }
r=$(call $LEAD PUT /api/v1/demo/purchase-requests/$SMALL "{\"subject\":\"Autre\",\"supplierId\":\"$SUP\",\"amount\":1}"); expect "$r" 409 "approved request not editable"

r=$(call $LEAD POST /api/v1/demo/purchase-requests "{\"subject\":\"Serveurs\",\"supplierId\":\"$SUP\",\"amount\":48000}"); BIG=$(echo "$r" | field id)
r=$(call $LEAD POST /api/v1/demo/purchase-requests/$BIG/transitions/submit); expect "$r" 200 "submit big"
[[ "$r" == *'"status":"SUBMITTED"'* ]] && echo "ok   big request waits for approval" || { echo "FAIL big submitted: $r"; FAILED=1; }
r=$(call $LEAD GET /api/v1/platform/collaboration/approvals/pending); expect "$r" 200 "lead inbox"
APPROVAL=$(echo "$r" | sed -E "s/.*\"id\":\"([^\"]+)\",\"entityType\":\"demo.purchase-request\",\"entityId\":\"$BIG\".*/\1/")
r=$(call $VIEWER POST /api/v1/platform/collaboration/approvals/$APPROVAL/approve '{}'); expect "$r" 403 "viewer cannot approve"
r=$(call $LEAD POST /api/v1/platform/collaboration/approvals/$APPROVAL/approve '{"comment":"ok"}'); expect "$r" 204 "lead approves"
r=$(call $LEAD GET /api/v1/demo/purchase-requests/$BIG); [[ "$r" == *'"status":"APPROVED"'* ]] && echo "ok   approval fired approve" || { echo "FAIL approval outcome: $r"; FAILED=1; }
r=$(call $LEAD POST /api/v1/demo/purchase-requests/$BIG/transitions/order); [[ "$r" == *'"status":"ORDERED"'* ]] && echo "ok   ordered" || { echo "FAIL order: $r"; FAILED=1; }

r=$(call $LEAD POST /api/v1/demo/projects '{"name":"Siege Anfa","client":"Groupe Anfa"}'); expect "$r" 201 "create project"; PRJ=$(echo "$r" | field id)
r=$(call $LEAD POST /api/v1/demo/projects/$PRJ/transitions/quote); expect "$r" 422 "quote needs budget and study"
r=$(call $LEAD GET /api/v1/demo/projects/lifecycle); expect "$r" '200 {"entity":"demo.project"' "lifecycle declaration"

r=$(call $LEAD GET "/api/v1/demo/items?page=0&size=25"); expect "$r" 200 "items page"
TOTAL=$(echo "$r" | sed -E 's/.*"totalElements":([0-9]+).*/\1/')
[[ "$TOTAL" -ge 80 ]] && echo "ok   at least 80 items" || { echo "FAIL item volume: $TOTAL"; FAILED=1; }
r=$(call $LEAD GET "/api/v1/demo/items?page=0&size=1000"); expect "$r" 200 "items size capped"
[[ "$r" == *'"size":500'* ]] && echo "ok   page size capped at 500" || { echo "FAIL page cap"; FAILED=1; }
r=$(call $LEAD GET "/api/v1/demo/purchase-requests?filter=$(enc '{"status":{"is":"DRAFT"}}')&page=0&size=5"); expect "$r" 200 "requests by status"
[[ "$r" == *'"status":"DRAFT"'* && "$r" != *'"status":"ORDERED"'* && "$r" != *'"status":"APPROVED"'* && "$r" != *'"status":"SUBMITTED"'* ]] && echo "ok   status filter" || { echo "FAIL status filter"; FAILED=1; }

r=$(call $LEAD POST /api/v1/demo/purchase-requests/$BIG/duplicate); expect "$r" 201 "duplicate ordered request"
COPY=$(echo "$r" | field id)
[[ -n "$COPY" && "$COPY" != "$BIG" ]] && echo "ok   duplicate has its own id" || { echo "FAIL duplicate id"; FAILED=1; }
r=$(call $VIEWER POST /api/v1/demo/purchase-requests/$BIG/pdf); expect "$r" 403 "viewer cannot print"
r=$(call $LEAD POST /api/v1/demo/purchase-requests/$SMALL/pdf); expect "$r" 409 "pdf of a draft refused"
PDF=$(curl -s -D /tmp/demo-headers -o /tmp/demo-pdf -w '%{http_code}' -X POST -H "Authorization: Bearer $(token $LEAD)" -H "X-Tenant-ID: $TENANT" "$BASE/api/v1/demo/purchase-requests/$BIG/pdf")
TYPE=$(tr -d '\r' < /tmp/demo-headers | tr '[:upper:]' '[:lower:]')
[[ "$PDF" == 200 && "$TYPE" == *application/pdf* && "$(head -c 4 /tmp/demo-pdf)" == "%PDF" ]] && echo "ok   purchase order pdf" || { echo "FAIL pdf $PDF $TYPE"; FAILED=1; }

r=$(call $LEAD GET "/api/v1/platform/collaboration/notifications?size=20"); expect "$r" 200 "notification inbox"
[[ "$r" == *'Demande approuvée'* ]] && echo "ok   approval notified the author" || { echo "FAIL notification: $r"; FAILED=1; }

NOTE='{"entityType":"demo.purchase-request","entityId":"'"$BIG"'","text":"Relance fournisseur"}'
r=$(call $LEAD POST "/api/v1/platform/collaboration/comments?entityType=demo.purchase-request&entityId=$BIG" "$NOTE"); expect "$r" 201 "note on request"
r=$(call $VIEWER GET "/api/v1/platform/collaboration/comments?entityType=demo.purchase-request&entityId=$BIG"); expect "$r" 200 "viewer reads notes"
r=$(call $VIEWER POST "/api/v1/platform/collaboration/comments?entityType=demo.purchase-request&entityId=$BIG" "$NOTE"); expect "$r" 403 "viewer cannot add a note"
FILE="$(cd "$(dirname "$0")" && pwd)/fixtures/supplier-card.txt"
cp "$FILE" "$HOME/supplier-card.txt"
WINCARD=$(cygpath -w "$HOME/supplier-card.txt")
ATT=$(curl -s -o /tmp/demo-body -w '%{http_code}' -X POST -H "Authorization: Bearer $(token $LEAD)" -H "X-Tenant-ID: $TENANT" -F "entityType=demo.purchase-request" -F "entityId=$BIG" -F "file=@${WINCARD};type=application/pdf" "$BASE/api/v1/platform/collaboration/attachments/upload?entityType=demo.purchase-request&entityId=$BIG" || true)
echo " $(cat /tmp/demo-body)"
expect "$ATT $(cat /tmp/demo-body)" 201 "attach source file"
r=$(call $VIEWER GET "/api/v1/platform/collaboration/attachments?entityType=demo.purchase-request&entityId=$BIG"); expect "$r" 200 "viewer lists attachments"
ATTV=$(curl -s -o /tmp/demo-body -w '%{http_code}' -X POST -H "Authorization: Bearer $(token $VIEWER)" -H "X-Tenant-ID: $TENANT" -F "entityType=demo.purchase-request" -F "entityId=$BIG" -F "file=@${WINCARD};type=application/pdf" "$BASE/api/v1/platform/collaboration/attachments/upload?entityType=demo.purchase-request&entityId=$BIG" || true)
expect "$ATTV $(cat /tmp/demo-body)" 403 "viewer cannot attach"

r=$(call $LEAD GET /api/v1/demo/suppliers/$SUP/overview); expect "$r" 200 "supplier overview"
r=$(call reader@host.local GET /api/v1/demo/suppliers/$SUP/overview); expect "$r" 403 "reader cannot read supplier overview"
EXT=$(curl -s -o /tmp/demo-body -w '%{http_code}' -X POST -H "Authorization: Bearer $(token $LEAD)" -H "X-Tenant-ID: $TENANT" -F "file=@${WINCARD};type=application/pdf" "$BASE/api/v1/demo/suppliers/extract" || true)
echo " $(cat /tmp/demo-body)"
[[ "$EXT" == 200 && "$(cat /tmp/demo-body)" == *'Atlas Import'* ]] && echo "ok   supplier card extracted" || { echo "FAIL extract $EXT"; FAILED=1; }
EXTV=$(curl -s -o /tmp/demo-body -w '%{http_code}' -X POST -H "Authorization: Bearer $(token $VIEWER)" -H "X-Tenant-ID: $TENANT" -F "file=@${WINCARD};type=application/pdf" "$BASE/api/v1/demo/suppliers/extract" || true)
expect "$EXTV $(cat /tmp/demo-body)" 403 "viewer cannot extract"

call_tenant() { # user method path tenant [json]
  local t; t=$(token "$1")
  curl -s -o /tmp/demo-body -w '%{http_code}' -X "$2" -H "Authorization: Bearer $t" -H "X-Tenant-ID: $4" -H 'Content-Type: application/json' ${5:+-d "$5"} "$BASE$3"
  echo " $(cat /tmp/demo-body)"
}
r=$(call_tenant $LEAD GET "/api/v1/demo/suppliers/$SUP" "$TENANT_B"); expect "$r" 404 "supplier of A is invisible from B"
r=$(call_tenant $VIEWER GET /api/v1/demo/suppliers "$TENANT_B"); expect "$r" 403 "viewer of A cannot call B"
r=$(call admin@host.local POST /api/tenants '{"name":"Organisation C","key":"org-c","adminEmail":"owner-c@host.local"}'); expect "$r" 200 "operator creates organization C"
[[ "$r" == *'"demo.categories"'* ]] && echo "ok   reference categories seeded" || { echo "FAIL reference seed: $r"; FAILED=1; }
r=$(call $LEAD POST /api/tenants '{"name":"Non","key":"org-x","adminEmail":"x@host.local"}'); expect "$r" 403 "lead cannot create an organization"
r=$(call_tenant admin@host.local POST "/api/tenants/$TENANT_B/suspend" "$TENANT_B"); expect "$r" 200 "operator suspends B"
r=$(call_tenant $LEAD GET /api/v1/demo/suppliers "$TENANT_B"); expect "$r" 403 "suspended organization refuses its member"
r=$(call_tenant admin@host.local POST "/api/tenants/$TENANT_B/resume" "$TENANT_B"); expect "$r" 200 "operator resumes B"

PUB=$(curl -s -o /tmp/demo-body -w '%{http_code}' "$BASE/api/public/demo/items")
echo " $(cat /tmp/demo-body)"
[[ "$PUB" == 200 && "$(cat /tmp/demo-body)" == *'Écran publié'* && "$(cat /tmp/demo-body)" != *'Article non publié'* && "$(cat /tmp/demo-body)" != *createdBy* ]] && echo "ok   public catalogue" || { echo "FAIL public catalogue $PUB"; FAILED=1; }
[[ "$(cat /tmp/demo-body)" != *'Offre confidentielle'* && "$(cat /tmp/demo-body)" != *'Fournisseur discret'* ]] && echo "ok   confidential item withheld" || { echo "FAIL confidential item listed"; FAILED=1; }
PRIV=$(curl -s -o /dev/null -w '%{http_code}' "$BASE/api/v1/demo/items")
[[ "$PRIV" == 401 ]] && echo "ok   private items need a token" || { echo "FAIL private items $PRIV"; FAILED=1; }

exit $FAILED
