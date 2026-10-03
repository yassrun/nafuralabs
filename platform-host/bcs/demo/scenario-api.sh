#!/usr/bin/env bash
# bc.demo API scenario against a running host (default http://localhost:8090): records, lifecycle, approval.
set -euo pipefail
BASE=${BASE:-http://localhost:8090}
token() { curl -s -X POST -H 'Content-Type: application/json' -d "{\"email\":\"$1\"}" "$BASE/api/public/lab/session" | sed -E 's/.*"accessToken":"([^"]+)".*/\1/'; }
TENANT=$(curl -s -H "Authorization: Bearer $(token lead@host.local)" "$BASE/api/v1/me/session" | sed -E 's/.*"tenant":\{"id":"([^"]+)".*/\1/')
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
r=$(call $LEAD GET "/api/v1/demo/supplier-contacts?supplierId=$SUP"); expect "$r" "200 {\"content\":[{" "contacts of supplier"
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

exit $FAILED
