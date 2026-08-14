package ma.nafura.achats.api.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import lombok.Data;

@Data
public class AppelOffreAchatCreateDto {

    @NotBlank
    private String objet;

    private String chantierId;

    private String chantierCode;

    private String chantierName;

    private LocalDate datePublication;

    @NotNull
    private LocalDate dateLimiteDepot;

    private String status;

    private String fournisseurAttribueId;

    private String fournisseurAttribueName;

    private String bcGenereId;

    private String bcGenereNumero;

    private BigDecimal totalAttribueHt;

    private String notes;

    private List<String> fournisseurInvitesIds = new ArrayList<>();

    @Valid
    private List<AppelOffreLigneInputDto> lignes = new ArrayList<>();

    @Valid
    private List<OffreFournisseurInputDto> reponses = new ArrayList<>();
}
