package ma.nafura.chantiers.api.request;

import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

/**
 * AC-10, AC-11 — un attachement se crée sur une **période**, jamais sur une grille de lignes :
 * ses lignes sont montées depuis les déclarations, aucune saisie de ligne n'est offerte ici.
 */
@Data
public class AttachementChantierCreateDto {

    @NotNull
    private LocalDate dateDebut;

    @NotNull
    private LocalDate dateFin;

    private String meteoCode;
    private Integer temperatureC;

    @NotNull
    private Integer effectifPresent;

    private String signatureMoeDataUrl;
}
