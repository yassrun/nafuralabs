package ma.nafura.item.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import lombok.Data;

@Data
public class MaterielCreateDto {

    @NotBlank
    @Size(max = 50)
    private String code;

    @NotBlank
    @Size(max = 255)
    private String name;

    private String description;

    @Size(max = 50)
    private String familleId;

    @Size(max = 100)
    private String familleName;

    @Size(max = 100)
    private String marque;

    @Size(max = 100)
    private String modele;

    @NotBlank
    @Size(max = 100)
    private String numeroSerie;

    private Integer anneeMiseEnService;

    @Size(max = 100)
    private String puissanceCapacite;

    @Size(max = 30)
    private String status;

    private LocalDate dateDernierEntretien;

    private LocalDate prochaineMaintenance;

    private String notesMaintenance;

    @Size(max = 50)
    private String chantierActuelId;

    @Size(max = 200)
    private String chantierActuelName;

    @NotNull
    private Boolean isActive;
}
