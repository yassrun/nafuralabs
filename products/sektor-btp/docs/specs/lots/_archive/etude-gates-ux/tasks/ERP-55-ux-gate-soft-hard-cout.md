---
id: ERP-55
status: done
context: nafura
kind: task
priority: P1
assignee: agent
gate: qa
feature: etude-gates-ux
sprint: 2026-W33
tags: [sektor, etudes, ux, gates]
---

# UX — Gate soft à l’entrée / hard au Continuer (étape Coût)

> Sur Coût, la bannière rouge liste tous les PU manquants dès l’arrivée
> (« empêche de continuer ») alors que c’est un état **incomplet attendu**.
> Doublons visibles (ex. 5.1 / 5.2 listés 2×). Reco produit : soft au départ,
> hard à la vérif / Continuer.

## Contexte
- Repro : DE-0001 · étape **3. Coût** · Mode B QA
- Observé : « 4 points empêchent… » + 4 lignes (2 postes × 2) alors que PU = « — »
- Décision UX (11/08) : distinguer **incomplet** vs **blocage à la sortie**

## Critères d'acceptation
- [x] **Entrée Coût** : pas de bannière « empêche de continuer » pour les seuls
      `cout_unitaire_manquant` / équivalents « pas encore chiffré »
- [x] À la place : signal **neutre** (KPI / pastille / résumé) — ex. « X postes sans PU »
      cliquable → focus premier nœud concerné
- [x] **Continuer** (ou action « Vérifier le chiffrage ») : si incomplets →
      bannière **bloquante** actionnable (liste dédupliquée + Voir dans l’arbre)
- [x] Gate **OK** : feedback court positif (« Prêt pour la synthèse » / équivalent)
- [x] **Dédoublonnage** des problèmes gate (même `noeudId` / même code+libellé
      ne s’affiche qu’une fois)
- [x] Backend gate inchangé pour la **vérité métier** (bloquer la suite) ;
      seul le **moment / ton** d’affichage UI change (soft vs hard)
- [x] QA DE-0001 : entrée Coût calme → Continuer → liste hard si PU vides

## Hors scope
- Changer les règles de calcul PU / forfait
- Refonte complète du drawer chiffrage (ERP-16)

## Journal
```
11/08 14:09  créé · décision UX soft/hard + dédup · sprint W33
11/08 14:14  done · soft entrée + hard Continuer/Vérifier · dédup noeudId · QA DE-0001 OK
```
