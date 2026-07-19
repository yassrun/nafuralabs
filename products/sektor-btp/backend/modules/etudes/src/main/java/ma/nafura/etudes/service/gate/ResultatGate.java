package ma.nafura.etudes.service.gate;

import java.util.List;
import java.util.UUID;

/**
 * Résultat de l'évaluation d'une étape.
 *
 * <p>Retourne la <b>liste des articles fautifs</b>, pas un simple booléen. C'est ce qui
 * permet à l'interface d'afficher des liens cliquables au lieu d'un bouton grisé sans
 * explication — défaut identifié dans le module {@code consultation} supprimé, où le front
 * bloquait avant l'appel et n'affichait donc jamais les bons messages du back.
 *
 * @param etape numéro d'étape évaluée (1..5)
 * @param bloquant un problème empêche-t-il de continuer ? Les étapes 2 et 4 produisent des
 *     avertissements non bloquants.
 * @param problemes vide si l'étape est franchie
 */
public record ResultatGate(int etape, boolean bloquant, List<ProblemeGate> problemes) {

    public record ProblemeGate(UUID noeudId, String codeArticle, String libelle, String message) {}

    public boolean passe() {
        return problemes.isEmpty();
    }

    /** L'étape autorise-t-elle le passage à la suivante ? */
    public boolean autoriseLaSuite() {
        return !bloquant || problemes.isEmpty();
    }

    public static ResultatGate ok(int etape) {
        return new ResultatGate(etape, true, List.of());
    }
}
