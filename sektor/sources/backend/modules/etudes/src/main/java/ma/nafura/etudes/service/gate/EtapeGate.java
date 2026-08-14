package ma.nafura.etudes.service.gate;

/**
 * Règle de franchissement d'une étape du parcours d'étude.
 *
 * <p>Une implémentation par étape plutôt qu'un {@code switch} géant — c'était la forme de
 * {@code ConsultationService.assertGate()}, qui mélangeait cinq règles dans une méthode.
 *
 * <p>Ce sur quoi les règles se prononcent est décrit par {@link ContexteGate}.
 */
public interface EtapeGate {

    /** Numéro d'étape couverte (1..5). */
    int etape();

    /**
     * Une étape non bloquante produit des avertissements visibles mais laisse passer.
     * C'est le cas de la consultation fournisseurs (4) : on chiffre couramment sans l'avoir
     * terminée, sous contrainte de délai.
     */
    default boolean bloquant() {
        return true;
    }

    ResultatGate evaluer(ContexteGate contexte);
}
