# CH-05-EVOL — quota du tenant

**Type :** `EVOL`
**Cible :** BC `documents`
**Qualification :** la SPEC park le quota en *non spécifié*. Après le compteur et la taille max.

## Pourquoi

Le compteur sans plafond ne protège pas le disque. L'offre pourra donner le chiffre plus tard ; documents **applique**.

## Aujourd'hui

`R-6` mesure. Pas de refus. IAM `storageLimit` vide.

## Attendu

Si `usage + octets nouveaux` (objet **pas** déjà présent pour cette empreinte) dépasse le plafond du tenant : refus, code `STORAGE_QUOTA_EXCEEDED`, pas de ligne. Une deuxième pièce du même fichier ne consomme pas. Plafond = `documents.quota.bytes` (config lab — pas l'abonnement). Absent ou ≤ 0 : pas de plafond.

## Critères d'acceptation (gelés)

- **AC-1** Sous le plafond : joindre réussit.
- **AC-2** Au-delà : refus, usage inchangé.
- **AC-3** Même empreinte déjà chez A : joindre réussit sans augmenter l'usage, même si `usage + N` dépasserait.

## Preuves attendues

| Scénario | État initial | AC |
|----------|--------------|----|
| `documents-quota-sous-plafond` | A, usage + N ≤ plafond | AC-1 |
| `documents-quota-depasse` | A, usage + N > plafond, empreinte nouvelle | AC-2 |
| `documents-quota-dedup-passe` | A déjà au plafond, même fichier à nouveau | AC-3 |

`POL-ERREUR-CODE` · `POL-TENANT-ISOLATION`. Après `CH-04`.

## Hors périmètre

Offre / abonnement qui *fixe* le plafond · écran · seaux · widget produit
