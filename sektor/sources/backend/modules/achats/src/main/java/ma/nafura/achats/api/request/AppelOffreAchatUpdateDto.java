package ma.nafura.achats.api.request;

import jakarta.validation.Valid;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import lombok.Data;

@Data
public class AppelOffreAchatUpdateDto {

    private String objet;

    private String chantierId;

    private String chantierCode;

    private String chantierName;

    private LocalDate datePublication;

    private LocalDate dateLimiteDepot;

    private String status;

    private String fournisseurAttribueId;

    private String fournisseurAttribueName;

    private String bcGenereId;

    private String bcGenereNumero;

    private BigDecimal totalAttribueHt;

    private String notes;

    private List<String> fournisseurInvitesIds;

    @Valid
    private List<AppelOffreLigneInputDto> lignes;

    @Valid
    private List<OffreFournisseurInputDto> reponses;
}
