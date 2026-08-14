package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class EpiDotationCreateDto {

    private String id;

    @NotBlank
    private String reference;

    @NotBlank
    private String designation;

    @NotBlank
    private String categorie;

    @NotBlank
    private String marque;

    private String normeCe;

    @NotBlank
    private String employeId;

    @NotBlank
    private String employeNom;

    private String chantierId;

    private String chantierCode;

    @NotNull
    private LocalDate dateAttribution;

    private LocalDate dateExpiration;

    private BigDecimal prixUnitaire;

    private String status;

    private String articleId;

    private LocalDate dateDerniereVerification;

    private LocalDate prochaineVerification;
}
