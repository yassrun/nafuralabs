package ma.nafura.etudes.api.request;

import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import lombok.Data;

/**
 * Payload du gain (SEKTOR-191).
 *
 * <p>Le gain est un geste atomique : il marque l'étude {@code GAGNE} et approuve la version de
 * devis correspondante (AC-1). {@code devisId} désigne le devis faisant foi — il doit appartenir
 * à la même étude et au même tenant (AC-2). {@code montantAttribue} est obligatoire et doit être
 * égal au total HT du devis accepté à 0,01 MAD près (AC-3). En cas de marge négative, seuls
 * {@code owner}/{@code dg} peuvent déroger, avec un motif obligatoire et audité (AC-4).
 */
@Data
public class DossierGagneDto {

    @NotNull
    private LocalDate dateAttribution;

    private String referenceMarche;

    /**
     * Devis faisant foi — même étude, même tenant (AC-2). Optionnel : à défaut, le backend
     * prend le {@code devisGenereId} du dossier (c'est la référence de l'étude).
     */
    private UUID devisId;

    /** Montant attribué HT — contre-vérification du total devis (AC-3). */
    @NotNull
    private BigDecimal montantAttribue;

    /** Motif obligatoire de la dérogation de marge négative (AC-4). */
    private String motifDerogation;
}
