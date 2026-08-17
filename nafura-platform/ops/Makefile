ENV ?= staging
APP ?= sektor-btp
SCOPE ?= full

BUILD_IMAGES ?=
PUSH_IMAGES ?=
RESET_DB ?=
KUBE_CONTEXT ?=
REGISTRY_PASS ?=

.PHONY: help clean-env bootstrap-env infra-up infra-wait preflight \
        build-images push-images build-push \
        onboard-app provision-db drop-db migrate deploy \
        deploy-backend deploy-frontend reset-app clean-app \
        release-app release-backend release-frontend \
        dev-up stg-up prod-up

NLops = ENV=$(ENV) BUILD_IMAGES=$(BUILD_IMAGES) PUSH_IMAGES=$(PUSH_IMAGES) RESET_DB=$(RESET_DB) \
	KUBE_CONTEXT=$(KUBE_CONTEXT) REGISTRY_PASS=$(REGISTRY_PASS) \
	bash ./nlops.sh

help:
	@echo "Cycle de vie — depuis la racine du repo :"
	@echo "  make -C nafura-platform/ops <cible>"
	@echo "  # ou : cd nafura-platform && make <cible>"
	@echo ""
	@echo "SCOPE=front|back|full  APP=$(APP)"
	@echo "  make -C nafura-platform/ops dev-up  SCOPE=front|back|full   # process locaux → infra staging"
	@echo "  make -C nafura-platform/ops stg-up  SCOPE=front|back|full   # build + deploy pods staging"
	@echo "  make -C nafura-platform/ops prod-up SCOPE=front|back|full   # prod (front = image web only)"
	@echo ""
	@echo "Bas niveau (ENV=$(ENV)):"
	@echo "  clean-env bootstrap-env infra-up infra-wait preflight"
	@echo "  build-images push-images build-push"
	@echo "  onboard-app provision-db drop-db migrate"
	@echo "  deploy deploy-backend deploy-frontend"
	@echo "  reset-app clean-app"
	@echo "  release-app release-backend release-frontend"
	@echo ""
	@echo "Flags: BUILD_IMAGES=true PUSH_IMAGES=true RESET_DB=true KUBE_CONTEXT=… REGISTRY_PASS=…"
	@echo ""
	@echo "Examples:"
	@echo "  make -C nafura-platform/ops dev-up SCOPE=full APP=sektor-btp"
	@echo "  make -C nafura-platform/ops stg-up SCOPE=back APP=sektor-btp"
	@echo "  REGISTRY_PASS=*** make -C nafura-platform/ops prod-up SCOPE=full APP=sektor-btp"
	@echo "  make -C nafura-platform/ops bootstrap-env ENV=staging KUBE_CONTEXT=docker-desktop"

# ─── Cycle de vie ───────────────────────────────────────────────

# Process locaux branchés sur infra staging (Mode B) — pas de rebuild image.
dev-up:
	@case "$(SCOPE)" in \
	  front|back|full) ;; \
	  *) echo "ERROR: SCOPE must be front|back|full (got: $(SCOPE))" >&2; exit 1 ;; \
	esac
	ENV=staging KUBE_CONTEXT=$(or $(KUBE_CONTEXT),docker-desktop) \
	  bash ./nlops.sh dev-up $(APP) $(SCOPE)

# Build images + deploy pods staging.
stg-up:
	@case "$(SCOPE)" in \
	  front|back|full) ;; \
	  *) echo "ERROR: SCOPE must be front|back|full (got: $(SCOPE))" >&2; exit 1 ;; \
	esac
	$(MAKE) _cluster-up ENV=staging KUBE_CONTEXT=$(or $(KUBE_CONTEXT),docker-desktop) \
	  BUILD_IMAGES=true PUSH_IMAGES= SCOPE=$(SCOPE) APP=$(APP)

# Build + push + deploy pods prod. REGISTRY_PASS optional : lu depuis le secret k8s si vide.
prod-up:
	@case "$(SCOPE)" in \
	  front|back|full) ;; \
	  *) echo "ERROR: SCOPE must be front|back|full (got: $(SCOPE))" >&2; exit 1 ;; \
	esac
	$(MAKE) _cluster-up ENV=prod KUBE_CONTEXT=$(or $(KUBE_CONTEXT),nafura-vps-prod) \
	  BUILD_IMAGES=true PUSH_IMAGES=true SCOPE=$(SCOPE) APP=$(APP) REGISTRY_PASS=$(REGISTRY_PASS)

_cluster-up:
ifeq ($(SCOPE),front)
	$(NLops) release-frontend $(APP)
else ifeq ($(SCOPE),back)
	$(NLops) release-backend $(APP)
else ifeq ($(SCOPE),full)
	$(NLops) release-app $(APP)
else
	@echo "ERROR: SCOPE must be front|back|full" >&2; exit 1
endif

# ─── Bas niveau ─────────────────────────────────────────────────

clean-env:
	$(NLops) clean-env

bootstrap-env:
	$(NLops) bootstrap-env

infra-up:
	$(NLops) infra-up

infra-wait:
	$(NLops) infra-wait

preflight:
	$(NLops) preflight

build-images:
	$(NLops) build-images $(APP)

push-images:
	$(NLops) push-images $(APP)

build-push:
	$(NLops) build-push $(APP)

onboard-app:
	$(NLops) onboard-app $(APP)

provision-db:
	$(NLops) provision-db $(APP)

drop-db:
	$(NLops) drop-db $(APP)

migrate:
	$(NLops) migrate $(APP)

deploy:
	$(NLops) deploy $(APP)

deploy-backend:
	$(NLops) deploy-backend $(APP)

deploy-frontend:
	$(NLops) deploy-frontend $(APP)

reset-app:
	$(NLops) reset-app $(APP)

clean-app:
	$(NLops) clean-app $(APP)

release-app:
	$(NLops) release-app $(APP)

release-backend:
	$(NLops) release-backend $(APP)

release-frontend:
	$(NLops) release-frontend $(APP)
