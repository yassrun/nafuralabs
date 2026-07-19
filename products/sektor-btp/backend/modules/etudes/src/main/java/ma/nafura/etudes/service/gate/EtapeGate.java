package ma.nafura.etudes.service.gate;

import java.util.List;
import ma.nafura.etudes.domain.model.DpgfNoeud;

/**
 * Règle de franchissement d'une étape du parcours d'étude.
 *
 * <p>Une implémentation par étape plutôt qu'un {@code switch} géant — c'était la forme de
 * {@code ConsultationService.assertGate()}, qui mélangeait cinq règles dans une méthode.
 *
 * <p>Les implémentations reçoivent la liste à plat des ARTICLES, déjà extraite de l'arbre :
 * aucune n'a besoin de la hiérarchie, et ça évite que chacune la reparcoure.
 */
public interface EtapeGate {

    /** Numéro d'étape couverte (1..5). */
    int etape();

    /**
     * Une étape non bloquante produit des avertissements visibles mais laisse passer.
     * C'est le cas des descriptifs (2) et de la consultation fournisseurs (4) : on chiffre
     * couramment sans les avoir terminés, sous contrainte de délai.
     */
    default boolean bloquant() {
        return true;
    }

    ResultatGate evaluer(List<DpgfNoeud> articles);
}
