package ma.nafura.catalogue.api;

import java.util.List;

/**
 * Classification Extraire après normalisation d'identité Sektor.
 * {@code seau} : DEJA_TENANT | A_CREER | INCERTAIN.
 */
public record IdentiteClasse(
        String seau,
        String cleStable,
        String libelle,
        String itemId,
        String tinySpec,
        List<String> identitesCandidates) {

    public static final String DEJA_TENANT = "DEJA_TENANT";
    public static final String A_CREER = "A_CREER";
    public static final String INCERTAIN = "INCERTAIN";

    public static IdentiteClasse dejaTenant(String cleStable, String libelle, String itemId, String tinySpec) {
        return new IdentiteClasse(DEJA_TENANT, cleStable, libelle, itemId, tinySpec, List.of());
    }

    public static IdentiteClasse aCreer(String cleStable, String libelle, String tinySpec) {
        return new IdentiteClasse(A_CREER, cleStable, libelle, null, tinySpec, List.of());
    }

    public static IdentiteClasse incertain(List<String> identites) {
        return new IdentiteClasse(INCERTAIN, null, null, null, null, identites == null ? List.of() : identites);
    }
}
