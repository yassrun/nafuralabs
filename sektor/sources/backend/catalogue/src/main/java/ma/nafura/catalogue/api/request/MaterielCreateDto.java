package ma.nafura.catalogue.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.LocalDate;
import java.util.UUID;
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

    /** Optional: link an existing catalogue item (must be nature MATERIEL). */
    private UUID itemId;

    private UUID itemCategoryId;

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
