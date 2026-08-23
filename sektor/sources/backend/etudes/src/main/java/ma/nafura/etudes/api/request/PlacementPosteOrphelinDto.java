package ma.nafura.etudes.api.request;

import java.util.UUID;
import lombok.Data;

/**
 * AC-12 — la décision de l'humain pour <b>un</b> poste du devis qui n'a pas de lot parent.
 *
 * <p>Rien n'est rattaché par défaut : chaque poste nommé à l'écran revient avec, soit un lot
 * existant du devis ({@link #lotCode}), soit un lot d'accueil à créer ({@link #nouveauLotCode} +
 * {@link #nouveauLotDesignation}). Un poste laissé sans décision arrête la conversion.
 */
@Data
public class PlacementPosteOrphelinDto {

    /** Identifiant du nœud DPGF de l'article orphelin — celui que l'écran a nommé. */
    private UUID posteId;

    /** Code d'un lot (ou sous-lot) déjà présent dans le devis. */
    private String lotCode;

    /** Ou bien : code du lot d'accueil à créer dans l'arbre du chantier. */
    private String nouveauLotCode;

    /** Désignation de ce lot d'accueil. */
    private String nouveauLotDesignation;
}
