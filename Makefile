ENV ?= staging
GRADLEW := ./gradlew.bat

.PHONY: help infra-up provision-db-sektor build-sektor deploy-sektor compile-sektor migrate-sektor

help:
	@echo "Targets: infra-up, provision-db-sektor, build-sektor, migrate-sektor, deploy-sektor"

infra-up:
	ENV=$(ENV) bash toolchain/ops/nlops.sh infra-up

provision-db-sektor:
	ENV=$(ENV) bash toolchain/ops/nlops.sh provision-db sektor-btp

migrate-sektor:
	ENV=$(ENV) bash toolchain/ops/nlops.sh migrate sektor-btp

build-sektor:
	$(GRADLEW) :sektor:app:bootJar

compile-sektor:
	$(GRADLEW) :sektor:app:compileJava

deploy-sektor:
	ENV=$(ENV) bash toolchain/ops/nlops.sh deploy sektor-btp
