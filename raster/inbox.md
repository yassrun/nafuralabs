# INBOX

<!-- Capture globale Raster — task draft : une ligne = description, @tag optionnel, pas d'ID. -->
sektor : portail invité chrome-less (lien email+token, vue client + dépôt devis fournisseur) — livré hors Pact (Sektor pas encore pacté) @sektor
document-extraction : colonnes JPA `extracted_record.workflow_status` / `doc_type_definition.builder_state` encore en base alors que compose/décider ne sont plus exposés — drop lab à trancher @platform
document-extraction : libellés i18n validate/workflow encore présents alors que l'action décider n'est plus exposée @platform
impression CH-03 : canvas « Proposer » (IA) — aucune capacité conversation/IA consommable ici ; livré le fallback manuel (textarea). Brancher Proposer quand le BC conversation sera consommable. @platform
sektor études : à « Générer le devis » sans client Partner, demander si on crée le client (sinon on ne peut pas) — aujourd’hui bandeau + erreur, pas de création @sektor
sektor études : retirer Métrés & Quantitatifs du menu et du code (entité, API, createFromMetre, metreId DPGF/devis/AO, seeds, lookups) — gelé dans raster-src/DECISIONS-PRODUIT.md @sektor
sektor : sortir « Console catalogue Sektor » (/catalogue) du chrome tenant — interne Nafura G2, pas le catalogue articles client — gelé dans raster-src/DECISIONS-PRODUIT.md @sektor
sektor études : journal produit avant Pact — cycle chiffrage poste décomposé / articles / ouvrages à confirmer dans raster-src/DECISIONS-PRODUIT.md (pas encore SPEC) @sektor
commentaire : CommentServiceImplTest utilise entityType dpgf_noeud (mot produit) — hors scan main de la baseline INIT @platform
commentaire : erreurs exposées = message / statut HTTP, pas de code — POL-ERREUR-CODE @platform
approbation : `getEntityTypes` fuit un catalogue produit (Invoice, Quote, Receipt, Order, PurchaseOrder, Contract, Document) — POL-PAS-METIER-PRODUIT @platform
approbation : refus — commentaire obligatoire au front (`rejectCommentRequired` défaut true), optionnel au back (null accepté) @platform
approbation : `timeoutHours` / escalation stockés sur la chaîne, jamais joués par WorkflowEngine @platform
approbation : exceptions métier (CrudNotFound, IllegalArgument, IllegalState) = message seule, pas de code — POL-ERREUR-CODE @platform
conversation : erreurs exposées = HTTP + texte, pas de code — POL-ERREUR-CODE @platform
conversation : statuts ARCHIVED/CLOSED dans l'enum, aucune transition exposée @platform
conversation : actions d'une session nouvelle non listées via l'API agent (baseline sans tour, R-3) @platform
identite : erreurs invite / retrait / jeton = message (IllegalArgumentException ; parfois INVALID_OR_EXPIRED_INVITATION) — pas un code métier — POL-ERREUR-CODE @platform
identite : relancer l'invitation échoue si le courrier n'est pas parti alors que l'invite initiale crée quand même l'appartenance invitée @platform
