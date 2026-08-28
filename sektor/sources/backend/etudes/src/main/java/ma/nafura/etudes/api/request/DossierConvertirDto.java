package ma.nafura.etudes.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

/**
 * Payload de la conversion (L13). Champs optionnels = défauts depuis le dossier.
 *
 * <p>AC-13 — l'écran demande code chantier, date de démarrage et durée. Aucun de ces champs ne
 * suppose un planning, et le zonage n'y figure pas : la conversion aboutit sans zone.
 *
 * <p>AC-10 — aucun marché n'est créé ici. {@link #marcheReference} n'est qu'une référence de
 * vente recopiée sur le chantier.
 */
@Data
public class DossierConvertirDto {

    private String chantierLabel;
    private String chantierCode;
    private String chantierVille;
    private LocalDate dateDemarrage;
    private Integer dureeMois;

    private String marcheReference;
    private BigDecimal montantHt;
    private BigDecimal tauxTva;

    /**
     * AC-12 — le placement, poste par poste, des articles du devis sans lot parent. Vide au
     * premier appel : c'est le refus nominatif du serveur qui apprend à l'humain quoi placer.
     */
    private List<PlacementPosteOrphelinDto> placementsPostesOrphelins;

    /** SEKTOR-211 — acceptation auditée des warnings commerciaux avant conversion. */
    private Boolean acceptWarnings;

    /** Motif obligatoire lorsque {@link #acceptWarnings} est vrai. */
    private String motifDerogation;
}
