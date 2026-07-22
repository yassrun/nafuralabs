package ma.nafura.etudes.service.gate;

import java.util.List;
import ma.nafura.etudes.domain.model.DpgfNoeud;

/**
 * Ce sur quoi une règle d'étape se prononce.
 *
 * <p>Les quatre règles portant sur le chiffrage n'ont besoin que des articles à plat. L'étape 1
 * — dépôt des pièces du marché — se prononce sur les documents, qui existent avant tout article.
 * Passer une liste d'articles seule rendait cette étape inexprimable : c'est ce qui a conduit à
 * lui donner par erreur la règle du bordereau, et donc à exiger des articles que seule l'étape
 * suivante peut créer.
 *
 * @param articles articles du bordereau, déjà extraits de l'arbre — aucune règle n'a besoin de
 *     la hiérarchie, et ça évite que chacune la reparcoure
 * @param nombreDocuments pièces déposées sur le dossier
 * @param hasBordereau au moins une pièce de type bordereau (ou CPS+bordereau)
 * @param hasCps au moins une pièce de type CPS (ou CPS+bordereau)
 */
public record ContexteGate(
        List<DpgfNoeud> articles, long nombreDocuments, boolean hasBordereau, boolean hasCps) {

    public static ContexteGate deArticles(List<DpgfNoeud> articles) {
        return new ContexteGate(articles, 0L, false, false);
    }

    public static ContexteGate documents(boolean hasBordereau, boolean hasCps) {
        long n = (hasBordereau ? 1 : 0) + (hasCps ? 1 : 0);
        return new ContexteGate(List.of(), n, hasBordereau, hasCps);
    }
}
