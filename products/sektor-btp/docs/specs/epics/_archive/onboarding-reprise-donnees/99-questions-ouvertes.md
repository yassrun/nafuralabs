# Questions ouvertes

Chaque question dit **ce qui la trancherait**. Une question sans critère de décision est une
question qui traîne.

---

## O1 — Passer une étape fait-il monter la complétude ? 🔴 bloquante

Deux lectures également défendables :

| Lecture | Conséquence |
|---|---|
| « J'ai fait le tour » — passer compte | Le score atteint 100 % sans aucune donnée. L'indicateur mesure le parcours, pas l'état |
| « Il me reste des données à mettre » — passer ne compte pas | Le score reflète l'outil réel, mais une société qui n'importera jamais reste à 85 % à vie |

**Ce qui trancherait** : à quoi sert le score. S'il sert à l'utilisateur (« où j'en suis »), passer
doit compter. S'il sert à l'éditeur (« ce tenant est-il équipé ? »), non.

**Défaut proposé si personne ne tranche** : passer **ne** compte **pas**, mais l'étape n'est plus
jamais représentée et aucune relance n'est faite. Le score dit la vérité sans harceler.
T1.1 distingue déjà « passée » de « non visitée », donc basculer plus tard ne coûte pas de
migration.

---

## O2 — Ordre imposé ou libre ? 🟡

D8 pose la navigation libre. Reste à confirmer que l'ordre **affiché** est le bon : clients →
fournisseurs → employés → articles → bibliothèque.

**Ce qui trancherait** : observer sur quels fichiers une société met la main en premier. À défaut,
l'ordre proposé va du plus courant au plus spécialisé.

---

## O3 — Que faire des chantiers créés par l'ancien onboarding ? 🟡

Ils restent en base (T2.3). Faut-il les signaler ?

**Ce qui trancherait** : leur nombre réel et leur allure en production. Si ce sont majoritairement
des « Chantier test », un signalement discret se justifie. S'ils ont été remplis sérieusement, ne
rien dire.

**À faire avant de décider** : compter, sur staging puis en production, les chantiers créés le
même jour que le tenant et jamais modifiés depuis.

---

## O4 — Un import partiellement fautif bloque-t-il l'étape ? 🟢 tranchée par D7

Non. Les lignes valides entrent, les fautives sont listées, l'étape reste franchissable.

Reste un détail d'interface : les lignes fautives sont-elles corrigibles sur place, ou faut-il
corriger le fichier et le redéposer ? `smart-import` dispose déjà d'un dialogue d'édition
(`smart-import-edit-dialog.component.ts`) — **vérifier ce qu'il permet avant de spécifier**.

---

## O5 — Étape bibliothèque : que faire des articles inconnus ? 🟡

Un ouvrage se compose d'articles. Si l'import de la bibliothèque référence des articles absents du
catalogue, trois options :

| Option | Effet |
|---|---|
| Signaler seulement | L'utilisateur revient à l'étape 4. Sûr, mais peut faire boucler |
| Créer les articles manquants à la volée | Fluide, mais crée des articles sans prix ni catégorie vérifiés |
| Créer en les marquant « à compléter » | Compromis : la bibliothèque est exploitable, les trous sont visibles |

**Ce qui trancherait** : la proportion d'articles inconnus sur un cas réel. Sur le classeur extrait
le 2026-07-19, les 290 composants portaient des codes maison (`CM350`, `G1G2&T`, `MOD`) qui ne
correspondent à aucun catalogue standard — ce qui suggère que **le cas majoritaire est
l'article inconnu**, et donc que « signaler seulement » ferait boucler tout le monde.

---

## O6 — Faut-il un état « reprise terminée » distinct de « onboarding terminé » ? 🟢

Probablement oui (T1.1 le prévoit), pour ne pas rouvrir le parcours à chaque connexion.

**Ce qui trancherait** : l'existence d'un besoin de reprise **ultérieure** — une société qui
voudrait importer ses fournisseurs six mois plus tard. Si oui, la reprise n'est pas seulement un
écran d'onboarding mais une fonction à part entière, accessible depuis les réglages. À réexaminer
une fois le lot 1 en service.
