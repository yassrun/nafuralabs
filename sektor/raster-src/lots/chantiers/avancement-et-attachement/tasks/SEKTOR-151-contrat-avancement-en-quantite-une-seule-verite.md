---

id: SEKTOR-151
status: done-me
context: nafura
type: spec
agent_type: spec
priority: P1
assignee: agent
gate: me
blocked_by: [SEKTOR-148]
---

# CONTRAT — avancement en quantité, une seule vérité

> Geler les AC : la quantité est le seul fait saisi, le pourcentage est dérivé. Palier 1 = saisie sur le nœud. L'attachement lit la période, il ne ressaisit pas.

## Étapes

- [ ] …

## Journal

```
23/08 18:22  posée
23/08 19:05  doing. Lu AGENTS 0.1/2, gel avancement + amendement palier 1/2, gel simplicite, 00-PLAN, CONTRAT arbre-et-conversion (AC-5) et budget-et-marge (AC-13).
23/08 19:20  Code lu : AvancementPhysique (quantiteRealisee + pourcentage), AvancementPhysiqueService (pourcentage calcule a l ecriture puis STOCKE, et .min(100) = depassement ecrase en silence).
23/08 20:10  Coupe infra apres lecture code. CONTRAT.md ecrit par blocs sauvegardes : en-tete + Intention, AC-1..9 (avancement), AC-10..18 (attachement), hors perimetre + e2e.
23/08 20:25  Integre les deux constats QA du voisin : AttachementLigne sans lien vers l arbre (-> AC-12) et situation calculee sur les lots seuls (-> hors perimetre, pour situation-et-retenues).
23/08 20:30  check : 0 erreur.
23/08 21:37  status → doing
```

## Rapport de livraison

ce qui a changé      `lots/chantiers/avancement-et-attachement/CONTRAT.md` — créé, 18 `AC-n` gelés (AC-1..9 avancement, AC-10..18 attachement), hors périmètre, 16 scénarios e2e nommés + état initial. Aucun fichier sous `sources/` touché.

critères prouvés     Aucun `AC-n` n'est prouvé ici — c'est une task `spec` : elle **pose** les critères, l'exec (152/153) les implémente et le QA (154) les joue. Preuves faites : lecture du code avant écriture (`AvancementPhysique`, `AvancementPhysiqueService`, `ChantierProgressSyncService`, `AttachementChantier` / `AttachementLigne`, `AttachementChantierService`, `AvancementPhysiqueController`, `AttachementWorkflowController`, `SignaturePublicController`, `AttachementSignatureService`, web `chantiers/avancements/` et `chantiers/attachements/`) ; `node raster/t.mjs check` = **0 erreur**.

décidé seul          (1) **Trois** endroits stockent un pourcentage, pas un : la colonne `pourcentage`, plus `avancement_percent` sur le lot **et** sur le chantier, écrits par `ChantierProgressSyncService` — AC-2 les supprime tous les trois et rend le calcul à la lecture. (2) **Le nœud déclaré est une feuille** (AC-1) : un lot qui porte des enfants ne se saisit pas en direct — sinon la règle des deux portes est violée un étage au-dessus de celui qu'elle vise. (3) **La pondération du lot se fait au montant vendu** (AC-4) : les unités des postes ne s'additionnent pas, et un lot sans enfant vendu n'affiche aucun avancement plutôt qu'un 0 % faux. (4) **Un nœud sans quantité prévue refuse la déclaration** (AC-6), sans quoi ni `fait / prévu` ni le refus de dépassement ne sont calculables. (5) **L'attachement devient une période** (AC-10) : « les quantités de la période » n'a pas de sens sur un document à date unique. (6) **La contestation retourne à la déclaration** (AC-17) — c'est AC-9 appliqué à l'attachement. (7) Le référentiel de zones est créé **ici**, vide par défaut et facultatif (AC-14), parce que l'attachement en est le premier consommateur et que le gel interdit un second référentiel ailleurs.

écarts / dette       Le **jeton du lien de signature est l'identifiant de l'attachement** (stub assumé dans `AttachementSignatureService`) : AC-15 s'appuie sur le lien tel quel et ne le durcit pas — voir `## Question`. AC-9 n'a **pas** de scénario e2e (aucune activité ne peut exister au palier 1) : sa preuve est unitaire, c'est écrit dans le contrat. Le contreseing MOA et les faits quotidiens (météo, effectif) portés par l'attachement ne sont pas retouchés — `JournalChantier` ne porte pas encore ces champs. Constat QA du sous-lot voisin repris en hors périmètre : **la situation se calcule sur les lots seuls** (`quantite × prixUnitaireHt`), donc `situation-et-retenues` devra descendre au poste avant de pouvoir consommer les lignes d'attachement d'AC-12.

## Question

Le lien public de signature accepte aujourd'hui l'**identifiant de l'attachement comme jeton** (`SignaturePublicController` → `AttachementSignatureService`, stub assumé en commentaire). AC-15 fait de l'attachement signé la pièce qui **fait foi**. Faut-il durcir le jeton dans ce sous-lot ?

- **A** — Garder le lien tel quel, dette nommée dans le contrat. Le palier 1 est livré vite ; une signature « qui fait foi » reste apposable par quiconque connaît ou devine un identifiant d'attachement.
- **B** — Ajouter un `AC-n` : jeton non devinable, daté, à usage unique par attachement et par signataire. Le sous-lot gagne un morceau de sécurité qui touche la plateforme (émission, expiration, révocation), et la chaîne palier 1 sort plus tard.

Recommandé : **A** — le geste manquant du métier est la chaîne quantité → attachement, pas la cryptographie du lien ; et un vrai jeton signé est un chapitre plateforme, pas un critère d'attachement. Si tu préfères B, ça se pose proprement comme **une 5ᵉ task** du sous-lot sans toucher aux AC déjà gelés.
