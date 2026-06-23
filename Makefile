ENV ?= staging
APP ?= sektor-btp
GRADLEW := ./gradlew.bat

.PHONY: help bootstrap-env infra-up onboard-app provision-db migrate deploy \
        build-sektor compile-sektor deploy-sektor provision-db-sektor migrate-sektor

help:
	@echo "Generic (APP=$(APP), ENV=$(ENV)):"
	@echo "  bootstrap-env     Shared infra once per cluster (staging|prod)"
	@echo "  onboard-app       First deploy: provision-db + migrate + deploy"
	@echo "  provision-db      Create Postgres database for APP"
	@echo "  migrate           Collect/apply migrations for APP"
	@echo "  deploy            Deploy product K8s overlay only"
	@echo ""
	@echo "Sektor shortcuts:"
	@echo "  build-sektor compile-sektor deploy-sektor provision-db-sektor migrate-sektor"
	@echo ""
	@echo "Examples:"
	@echo "  make bootstrap-env ENV=staging"
	@echo "  make onboard-app APP=sektor-btp ENV=staging"
	@echo "  make deploy APP=sektor-btp ENV=prod"

bootstrap-env:
	ENV=$(ENV) bash toolchain/ops/nlops.sh bootstrap-env

infra-up:
	ENV=$(ENV) bash toolchain/ops/nlops.sh infra-up

onboard-app:
	ENV=$(ENV) bash toolchain/ops/nlops.sh onboard-app $(APP)

provision-db:
	ENV=$(ENV) bash toolchain/ops/nlops.sh provision-db $(APP)

migrate:
	ENV=$(ENV) bash toolchain/ops/nlops.sh migrate $(APP)

deploy:
	ENV=$(ENV) bash toolchain/ops/nlops.sh deploy $(APP)

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
