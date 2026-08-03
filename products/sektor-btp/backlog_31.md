# Backlog 31 — raffiné (session étude)

> Source brute raffinée. Focus session = **parcours étude unifié** (AO + dossier + chiffrage).
> Hors session = RH, print, stock (gardés pour ne pas les perdre).
>
> **UX :** méthode principale = Cursor Canvas wireframes — voir [`docs/ux/METHODE-CANVAS-WIREFRAMES.md`](docs/ux/METHODE-CANVAS-WIREFRAMES.md).  
> Chiffrage S1 validé sur canvas `etude-decompo-wireframe` → livré.  
> S5 wireframe : canvas `etude-ao-unify-wireframe` (nav → create → pièces ; étude hors scope).

---

## Principe Nafura — AI-first, manuel en fallback

**Règle produit non négociable :** partout où l’IA propose (extraction CPS, BDP, descriptifs, pièces attendues, composants…), le parcours **doit rester possible à 100 % à la main** si l’IA échoue, timeout, ou propose faux.

- L’IA **accélère** ; elle ne **bloque** jamais.
- Toute proposition = review / apply / discard user.
- Fallback manuel explicite au même endroit (slots, saisie, « Ajouter… », edit libre).
- Gate métier = données complètes (jointes / validées), **pas** « l’IA a réussi ».

S’applique à **S5** (et déjà à l’esprit BDP auto / descriptif CPS / extract composants).

---

## Session pick (à travailler maintenant)

### S1 — P0 · Chiffrage poste : master-slave → modal ✅
**Statut** : implémenté (drawer MatDialog, tree seul, toggle mode, footer Enregistrer, FOURNI inline FG/MG).

---

### S2 — P0 · Commentaires poste type réseau social ✅
**Statut** : livré — fil platform `entityType=dpgf_noeud` dans le drawer chiffrage (descriptif technique inchangé).

**Décision modèle**  
- Platform ` /api/v1/platform/collaboration/comments` (polymorphe).  
- `descriptif` reste le texte technique ; le fil social ne l’écrase pas.

**Acceptation**  
- 2 users voient le fil à jour après refresh / réouverture drawer.  
- Edit / delete auteur seulement.  
- UI dans le drawer chiffrage (S1).

---

### S3 — P1 · FG / marge variables sur prix fourni ✅
**Statut** : livré avec S1 (champs FG % / marge % inline en mode Prix fourni).

---

### S4 — P1 · Listing dossiers : colonne Objet taille fixe
**Constat**  
`objet` mange la largeur → statut / autres hors viewport.

**Cible**  
Largeur fixe (max + ellipsis + tooltip) sur Objet ; statut toujours visible.

**Acceptation**  
Desktop standard : statut + actions visibles sans scroll forcé par Objet.

---

### S5 — P0 · Unifier AO client + étude + pièces marché depuis CPS
**Constat**  
Deux menus sous Études aujourd’hui :
- `Dossiers` (`/etudes/dossiers`) — wizard chiffrage
- `Appels d’offres clients` (`/etudes/appels-offres-clients`) — fiche AO séparée  

Le lien `dossier.appelOffreClientId` existe déjà côté modèle, mais l’UX reste **deux parcours**.  
À l’étape pièces : seuls slots **BDP + CPS** sont forcés ; le CPS n’alimente pas encore une checklist des autres PJ du marché, ni le max de métadonnées (objet, maître d’ouvrage, délais, type marché…).

**Cible produit**  
**Un seul menu / entrée** « Étude / AO » :
1. Créer ou ouvrir un dossier = démarrer l’appel d’offre (plus de fiche AOC orpheline).
2. Déposer le **CPS (marché)** tôt → IA **propose le max** :
   - métadonnées dossier (objet, client/MOA, dates limite, type…)
   - **liste des pièces attendues** (RC, AE, plans, caution, attestations, CPT…)
3. **Jointure forcée** : checklist à compléter ; gate bloquée tant que les PJ **obligatoires** ne sont pas jointes (peu importe qu’elles viennent de l’IA ou du manuel).
4. **Fallback manuel partout** : ajouter / retirer / marquer obligatoire une pièce à la main ; éditer métadonnées sans attendre l’IA ; continuer si l’extraction CPS échoue (slots BDP+CPS mini + pièces ajoutées manuellement).
5. Rediriger / masquer l’entrée nav AOC ; migration soft : AOC existants → dossiers liés.

**Scope V1 (session)**  
- Nav : une entrée principale ; AOC en redirect ou sous-onglet legacy.
- Après upload CPS : IA propose checklist → slots dynamiques dans `pieces-marche` (apply / discard).
- Gate étape 1 : pièces **requises** jointes (source IA **ou** manuel) — jamais « extraction OK ».
- Prefill métadonnées = suggestion reviewable, jamais écrasement silencieux.

**Hors V1**  
- Extraction parfaite multi-marchés (qualité → E9).
- Fusion avec AO **achat** (`/achats/appels-offres`) — autre domaine.

**Fichiers / zones**  
`pieces-marche.*`, gates dossier, `erp-nav`, `appels-offres-clients/*`, indexation CPS backend, `DossierEtude` / documents.

**Acceptation**  
- Un user ne passe plus par deux menus pour démarrer un chiffrage AO.
- CPS OK → checklist proposée ; CPS KO / timeout → même écran utilisable en 100 % manuel.
- Impossible de quitter l’étape pièces sans joindre les obligatoires (définies IA **ou** user).
- Métadonnées préremplies uniquement après validation user.

---

## Backlog étude (hors session / après)

| ID | Item | Note |
|----|------|------|
| E5 | Raffinement import auto BDP | Suite tests |
| E6 | Templates print | Devis / bordereau / synthèse |
| E8b | Mentions / threads commentaires | Follow-up S2 |
| E9 | Qualité extraction CPS multi-marchés | Améliorer couverture S5 |

---

## Backlog hors étude (ne pas mélanger cette session)

| ID | Item | Domaine |
|----|------|---------|
| R1 | Fixer bugs employés | RH |
| R2 | Revue screen employé | RH |
| R3 | Pointage | RH |
| R4 | Sous-traitance | Achats / chantiers |
| R5 | Gestion matériel | Inventory |

---

## Ordre d’exécution session

1. **S5** unifier AO + étude + pièces CPS ✅
2. **S1** modal chiffrage ✅
3. **S2** fil commentaires dans la modale ✅
4. **S3** FG/MG prix fourni ✅
5. **S4** colonne Objet listing ✅

> Si S5 trop large pour une session : découper en **S5a** (nav + un seul create flow) puis **S5b** (checklist CPS + gates), sans perdre l’intention « un seul menu ».

---

## Hors scope explicite cette session

- Threads / @mentions / réactions
- Templates print, raffinement BDP
- AO achat (fournisseurs)
- Tout le pan RH / matériel / sous-traitance
