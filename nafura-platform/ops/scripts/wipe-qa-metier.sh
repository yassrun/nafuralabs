#!/usr/bin/env bash
# Lab / Mode B — wipe tenant métier (études, chantiers, docs MinIO, graphe user)
# and keep Sektor referentials + QA identities.
#
# Default: dry-run. Apply with --yes.
#
#   bash nafura-platform/ops/scripts/wipe-qa-metier.sh
#   bash nafura-platform/ops/scripts/wipe-qa-metier.sh --yes
#   make -C nafura-platform/ops wipe-qa-metier
#   make -C nafura-platform/ops wipe-qa-metier YES=1
#
# Scope: tenant key qa-local (override TENANT_KEY). ENV=staging only.
set -euo pipefail

ENV="${ENV:-staging}"
KUBE_CONTEXT="${KUBE_CONTEXT:-docker-desktop}"
KUBECTL_BIN="${KUBECTL_BIN:-kubectl}"
TENANT_KEY="${TENANT_KEY:-qa-local}"
DB_NAME="${DB_NAME:-nafura_erp}"
MINIO_USER="${MINIO_USER:-minioadmin}"
MINIO_PASSWORD="${MINIO_PASSWORD:-minioadmin}"
MINIO_BUCKET="${MINIO_BUCKET:-documents}"

DRY_RUN=1
DO_DB=1
DO_MINIO=1

usage() {
  cat <<'EOF'
Wipe QA-local métier data (études, chantiers, docs, graphe user).
Keeps: tenant qa-local, users QA, IAM, référentiels (UoM, articles,
emplacements, plan comptable, RH postes, employés QA, templates).

  --yes          apply (default is dry-run)
  --db-only      skip MinIO
  --minio-only   skip Postgres
  -h, --help

ENV=staging (required)  KUBE_CONTEXT=docker-desktop  TENANT_KEY=qa-local
EOF
}

while [[ $# -gt 0 ]]; do
  case "$1" in
    --yes) DRY_RUN=0; shift ;;
    --db-only) DO_MINIO=0; shift ;;
    --minio-only) DO_DB=0; shift ;;
    -h|--help) usage; exit 0 ;;
    *) echo "ERROR: unknown arg $1" >&2; usage >&2; exit 1 ;;
  esac
done

if [[ "$ENV" != "staging" ]]; then
  echo "ERROR: refused ENV=$ENV — this script is lab/staging only (tenant $TENANT_KEY)." >&2
  exit 1
fi

KUBECTL() { "$KUBECTL_BIN" --context="$KUBE_CONTEXT" "$@"; }

infra_ns() {
  case "$ENV" in
    staging) echo "nafura-infra-staging" ;;
    *) echo "nafura-infra-${ENV}" ;;
  esac
}

INFRA_NS="$(infra_ns)"

psql_erp() {
  KUBECTL exec -i -n "$INFRA_NS" deploy/postgres -c postgres -- \
    psql -U nafura -d "$DB_NAME" -v ON_ERROR_STOP=1 "$@"
}

echo "=== wipe-qa-metier  ENV=$ENV  context=$KUBE_CONTEXT  tenant=$TENANT_KEY  dry-run=$DRY_RUN"

TENANT_ID="$(
  psql_erp -Atc "SELECT id FROM tenant WHERE key = '${TENANT_KEY//\'/''}';" | tr -d '\r'
)"
if [[ -z "$TENANT_ID" ]]; then
  echo "ERROR: tenant key '$TENANT_KEY' not found in $DB_NAME" >&2
  exit 1
fi
echo "tenant_id=$TENANT_ID"

if [[ "$DO_DB" == "1" ]]; then
  echo "--- postgres $DB_NAME"
  psql_erp <<SQL
SELECT set_config('wipe.dry_run', '$([[ "$DRY_RUN" == "1" ]] && echo on || echo off)', false);

DO \$\$
DECLARE
  v_tid uuid;
  v_dry boolean;
  tbl record;
  n bigint;
  v_keep text[] := ARRAY[
    'accounting_journals',
    'approval_workflows',
    'calendar',
    'chart_of_accounts',
    'code_list',
    'costing_methods',
    'currencies',
    'doc_type_definition',
    'document_fragments',
    'document_settings',
    'document_templates',
    'email_templates',
    'exchange_rates',
    'item_categories',
    'item_prices',
    'items',
    'locations',
    'matrice_pouvoirs',
    'movement_motifs',
    'notification_preferences',
    'numbering_sequences',
    'payment_modes',
    'payment_term_installments',
    'payment_terms',
    'reference_value',
    'rh_departements',
    'rh_postes',
    'tag',
    'tags',
    'tenant_asset',
    'tenant_custom_role',
    'tenant_custom_role_permission',
    'tenant_domain',
    'tenant_invitation',
    'tenant_membership',
    'tenant_onboarding_meta',
    'tenant_setting',
    'tenant_user_role',
    'unit_of_measure',
    'uom_category',
    'user_onboarding_state',
    'workflow_steps',
    'workflow_templates'
  ];
BEGIN
  SELECT id INTO STRICT v_tid FROM tenant WHERE key = '${TENANT_KEY//\'/''}';
  v_dry := current_setting('wipe.dry_run', true) IS NOT DISTINCT FROM 'on';

  RAISE NOTICE 'chantiers=% dossiers=% documents=% dossier_docs=% partners=%',
    (SELECT count(*) FROM chantiers WHERE tenant_id = v_tid),
    (SELECT count(*) FROM dossiers_etude WHERE tenant_id = v_tid),
    (SELECT count(*) FROM document WHERE tenant_id = v_tid),
    (SELECT count(*) FROM dossier_documents WHERE tenant_id = v_tid),
    (SELECT count(*) FROM partners WHERE tenant_id = v_tid);

  IF v_dry THEN
    FOR tbl IN
      SELECT c.table_name
      FROM information_schema.columns c
      WHERE c.table_schema = 'public'
        AND c.column_name = 'tenant_id'
        AND c.table_name <> ALL (v_keep)
        AND c.table_name <> 'employes'
      ORDER BY 1
    LOOP
      EXECUTE format('SELECT count(*) FROM %I WHERE tenant_id::text = \$1', tbl.table_name)
        INTO n USING v_tid::text;
      IF n > 0 THEN
        RAISE NOTICE 'dry-run would delete % row(s) from %', n, tbl.table_name;
      END IF;
    END LOOP;
    n := (SELECT count(*) FROM employes e
          WHERE e.tenant_id = v_tid
            AND NOT (
              e.email ILIKE 'qa%@nafuralabs.local'
              OR e.id LIKE 'qa-emp-%'
              OR e.matricule LIKE 'QA%'
            ));
    RAISE NOTICE 'dry-run would delete % non-QA employe(s); keep QA employes + référentiels', n;
    RETURN;
  END IF;

  UPDATE numbering_sequences SET current_number = 0 WHERE tenant_id = v_tid;

  DELETE FROM employes e
  WHERE e.tenant_id = v_tid
    AND NOT (
      e.email ILIKE 'qa%@nafuralabs.local'
      OR e.id LIKE 'qa-emp-%'
      OR e.matricule LIKE 'QA%'
    );
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE 'deleted % non-QA employe(s)', n;

  PERFORM set_config('session_replication_role', 'replica', true);

  -- Children without tenant_id (join to a tenant-scoped parent).
  DELETE FROM agent_approval x USING agent_action a, agent_run run
    WHERE x.action_id = a.id AND a.run_id = run.id AND run.tenant_id = v_tid::text;
  DELETE FROM agent_execution_log x USING agent_action a, agent_run run
    WHERE x.action_id = a.id AND a.run_id = run.id AND run.tenant_id = v_tid::text;
  DELETE FROM agent_action x USING agent_run run
    WHERE x.run_id = run.id AND run.tenant_id = v_tid::text;
  DELETE FROM conversation_message x USING conversation_session s
    WHERE x.conversation_id = s.id AND s.tenant_id = v_tid::text;
  DELETE FROM appels_offres_achat_invites x USING appels_offres_achat p
    WHERE x.appel_offre_achat_id = p.id AND p.tenant_id = v_tid;
  DELETE FROM consultation_achat_devis_ligne x USING consultation_achat_devis p
    WHERE x.devis_id = p.id AND p.tenant_id = v_tid;
  DELETE FROM consultation_achat_panier x USING consultations_achat p
    WHERE x.consultation_id = p.id AND p.tenant_id = v_tid;
  DELETE FROM consultation_etude_invites x USING consultations_etudes p
    WHERE x.consultation_id = p.id AND p.tenant_id = v_tid;
  DELETE FROM consultation_etude_paquet x USING consultations_etudes p
    WHERE x.consultation_id = p.id AND p.tenant_id = v_tid;
  DELETE FROM consultation_identites_couvertes x USING consultations_etudes p
    WHERE x.consultation_id = p.id AND p.tenant_id = v_tid;
  DELETE FROM formation_hse_participants x USING formations_hse p
    WHERE x.formation_id = p.id AND p.tenant_id = v_tid;
  DELETE FROM incident_photos x USING incidents p
    WHERE x.incident_id = p.id AND p.tenant_id = v_tid;
  DELETE FROM incident_temoins x USING incidents p
    WHERE x.incident_id = p.id AND p.tenant_id = v_tid;

  FOR tbl IN
    SELECT c.table_name
    FROM information_schema.columns c
    WHERE c.table_schema = 'public'
      AND c.column_name = 'tenant_id'
      AND c.table_name <> ALL (v_keep)
      AND c.table_name <> 'employes'
    ORDER BY 1
  LOOP
    EXECUTE format('DELETE FROM %I WHERE tenant_id::text = \$1', tbl.table_name) USING v_tid::text;
    GET DIAGNOSTICS n = ROW_COUNT;
    IF n > 0 THEN
      RAISE NOTICE 'deleted % row(s) from %', n, tbl.table_name;
    END IF;
  END LOOP;

  PERFORM set_config('session_replication_role', 'origin', true);

  RAISE NOTICE 'after: chantiers=% dossiers=% documents=% dossier_docs=% partners=% employes=% items=%',
    (SELECT count(*) FROM chantiers WHERE tenant_id = v_tid),
    (SELECT count(*) FROM dossiers_etude WHERE tenant_id = v_tid),
    (SELECT count(*) FROM document WHERE tenant_id = v_tid),
    (SELECT count(*) FROM dossier_documents WHERE tenant_id = v_tid),
    (SELECT count(*) FROM partners WHERE tenant_id = v_tid),
    (SELECT count(*) FROM employes WHERE tenant_id = v_tid),
    (SELECT count(*) FROM items WHERE tenant_id = v_tid);
END
\$\$;
SQL
fi

if [[ "$DO_MINIO" == "1" ]]; then
  echo "--- minio prefix ${TENANT_ID}/"
  if [[ "$DRY_RUN" == "1" ]]; then
    echo "dry-run would mc rm --recursive ${MINIO_BUCKET}/${TENANT_ID}/"
  else
    KUBECTL delete pod wipe-qa-minio -n "$INFRA_NS" --ignore-not-found >/dev/null
    # YAML apply (not `kubectl run -- /bin/sh`) so Git Bash does not rewrite the container command.
    manifest="$(mktemp)"
    cat > "$manifest" <<YAML
apiVersion: v1
kind: Pod
metadata:
  name: wipe-qa-minio
  namespace: ${INFRA_NS}
spec:
  restartPolicy: Never
  containers:
    - name: mc
      image: quay.io/minio/mc:latest
      imagePullPolicy: IfNotPresent
      command: ["sh", "-c"]
      args:
        - |
          set -e
          mc alias set m http://minio:9000 ${MINIO_USER} ${MINIO_PASSWORD}
          mc rm --recursive --force m/${MINIO_BUCKET}/${TENANT_ID}/ || true
          echo MINIO_WIPE_DONE
YAML
    KUBECTL apply -f "$manifest"
    rm -f "$manifest"
    if KUBECTL wait --for=jsonpath='.status.phase'=Succeeded pod/wipe-qa-minio -n "$INFRA_NS" --timeout=180s; then
      KUBECTL logs pod/wipe-qa-minio -n "$INFRA_NS" || true
    else
      echo "WARN: MinIO wipe pod did not succeed — check: kubectl logs -n $INFRA_NS pod/wipe-qa-minio" >&2
      KUBECTL logs pod/wipe-qa-minio -n "$INFRA_NS" || true
    fi
    KUBECTL delete pod wipe-qa-minio -n "$INFRA_NS" --ignore-not-found >/dev/null
  fi
fi

if [[ "$DRY_RUN" == "1" ]]; then
  echo "=== dry-run only. Re-run with --yes to apply."
else
  echo "=== done. Referentials + QA users kept. Reload the ERP if a listing looks stale."
fi
