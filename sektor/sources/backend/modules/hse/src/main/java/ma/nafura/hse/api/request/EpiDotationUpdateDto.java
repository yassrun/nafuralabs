package ma.nafura.hse.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class EpiDotationUpdateDto {

    private String reference;

    private String designation;

    private String categorie;

    private String marque;

    private String normeCe;

    private String employeId;

    private String employeNom;

    private String chantierId;

    private String chantierCode;

    private LocalDate dateAttribution;

    private LocalDate dateExpiration;

    private BigDecimal prixUnitaire;

    private String status;

    private String articleId;

    private LocalDate dateDerniereVerification;

    private LocalDate prochaineVerification;
}
