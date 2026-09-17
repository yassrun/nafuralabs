package ma.nafura.chantiers.domain.chantier;

import java.util.Locale;

/**
 * Nature d'une ligne de l'arbre du chantier — lot, sous-lot ou poste.
 *
 * <p>Une seule question les distingue : est-ce que le client paie ça ?
 *
 * <ul>
 *   <li>{@link #VENDU} — ligne du BDP chiffré du chantier : elle porte une quantité et un prix
 *       unitaire, et entre en situation de travaux. Elle vient soit de la copie du devis validé
 *       (elle garde alors le lien vers le nœud DPGF d'origine), soit du BDP propre au chantier
 *       (import du bordereau du marché ou saisie du chiffrage — {@code dpgfNoeudId} est alors
 *       absent).
 *   <li>{@link #INTERNE} — ajouté au chantier (installation, repli, régie, base vie, aléas).
 *       N'entre jamais en situation, ne porte pas de prix de vente.
 * </ul>
 *
 * <p>Deux producteurs de {@link #VENDU} : la copie depuis le devis validé, et le chiffrage du BDP
 * du chantier. Une ligne vendue sans quantité ni prix n'est pas une ligne vendue : le chiffrage la
 * refuse au lieu de la dégrader en silence.
 */
public enum NatureLigne {
    VENDU,
    INTERNE;

    /** Nature retenue quand l'appelant n'en demande aucune : la saisie ne produit que de l'interne. */
    public static final NatureLigne DEFAUT_SAISIE = INTERNE;

    /**
     * Lit une nature demandée par un appelant d'API.
     *
     * @return {@code null} si rien n'est demandé
     * @throws IllegalArgumentException si la valeur n'est pas une nature connue
     */
    public static NatureLigne parse(String value) {
        if (value == null || value.isBlank()) {
            return null;
        }
        String normalized = value.trim().toUpperCase(Locale.ROOT);
        for (NatureLigne nature : values()) {
            if (nature.name().equals(normalized)) {
                return nature;
            }
        }
        throw new IllegalArgumentException("chantiers.arbre.nature_inconnue: " + value);
    }

    public boolean estVendu() {
        return this == VENDU;
    }

    public boolean estInterne() {
        return this == INTERNE;
    }
}
