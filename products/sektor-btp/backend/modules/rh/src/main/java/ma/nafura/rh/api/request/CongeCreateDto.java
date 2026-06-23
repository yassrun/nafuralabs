package ma.nafura.rh.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class CongeCreateDto {

    private String id;

    @NotBlank
    private String employeId;

    private String employeNom;

    @NotBlank
    private String type;

    @NotNull
    private LocalDate dateDebut;

    @NotNull
    private LocalDate dateFin;

    @NotNull
    private BigDecimal nombreJours;

    private String status;

    private String motif;

    private String notes;
}
