# Délègue vers ops/ (CLI + runbooks). Depuis la racine du repo :
#   make -C nafura-platform <cible>
.DEFAULT_GOAL := help

.PHONY: help
help:
	@$(MAKE) -C ops help

%:
	@$(MAKE) -C ops $@
