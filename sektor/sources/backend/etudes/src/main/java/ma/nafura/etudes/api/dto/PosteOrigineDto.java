package ma.nafura.etudes.api.dto;

import java.util.UUID;
import lombok.Builder;
import lombok.Data;

/**
 * AC-2 / AC-16 — le poste du devis d'origine, retrouvé depuis le lien retour que porte une ligne
 * vendue du chantier. C'est ce que l'écran chantier suit pour « remonter au poste vendu ».
 */
@Data
@Builder
public class PosteOrigineDto {

    /** Le nœud DPGF lui-même — l'identifiant que la ligne vendue conserve. */
    private UUID posteId;

    private String code;
    private String libelle;
    private String type;

    /** Le bordereau qui le contient. */
    private UUID dpgfId;

    /** L'étude à ouvrir. Nul si le bordereau n'est rattaché à aucun dossier. */
    private UUID dossierId;

    private String dossierNumero;
    private String dossierObjet;
}
