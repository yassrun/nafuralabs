ENV ?= staging
APP ?= sektor-btp
GRADLEW := ./gradlew.bat

BUILD_IMAGES ?=
PUSH_IMAGES ?=
RESET_DB ?=

.PHONY: help clean-env bootstrap-env infra-up infra-wait preflight \
        build-images push-images build-push \
        onboard-app provision-db drop-db migrate deploy \
        deploy-backend deploy-frontend reset-app clean-app \
        release-app release-backend release-frontend \
        build-sektor compile-sektor deploy-sektor provision-db-sektor migrate-sektor

NLops = ENV=$(ENV) BUILD_IMAGES=$(BUILD_IMAGES) PUSH_IMAGES=$(PUSH_IMAGES) RESET_DB=$(RESET_DB) bash toolchain/ops/nlops.sh

help:
	@echo "Generic (APP=$(APP), ENV=$(ENV)):"
	@echo "  clean-env bootstrap-env infra-up infra-wait preflight"
	@echo "  build-images push-images build-push"
	@echo "  onboard-app provision-db drop-db migrate"
	@echo "  deploy deploy-backend deploy-frontend"
	@echo "  reset-app clean-app"
	@echo "  release-app release-backend release-frontend"
	@echo ""
	@echo "Flags: BUILD_IMAGES=true PUSH_IMAGES=true RESET_DB=true"
	@echo ""
	@echo "Examples:"
	@echo "  make bootstrap-env ENV=staging"
	@echo "  make onboard-app APP=sektor-btp ENV=staging BUILD_IMAGES=true"
	@echo "  make release-app APP=sektor-btp ENV=staging BUILD_IMAGES=true"

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

build-sektor:
	$(GRADLEW) :sektor:app:bootJar

compile-sektor:
	$(GRADLEW) :sektor:app:compileJava

deploy-sektor:
	ENV=$(ENV) bash toolchain/ops/nlops.sh deploy sektor-btp

provision-db-sektor:
	ENV=$(ENV) bash toolchain/ops/nlops.sh provision-db sektor-btp

migrate-sektor:
	ENV=$(ENV) bash toolchain/ops/nlops.sh migrate sektor-btp
