package ma.nafura.hse.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.time.LocalDate;
import lombok.Data;

@Data
public class RegistreLegalCreateDto {

    private String id;

    @NotBlank
    private String registre;

    @NotBlank
    private String numero;

    @NotNull
    private LocalDate date;

    private String reference;
    private String chantierId;
    private String chantierCode;
    private String employeId;
    private String employeNom;

    @NotBlank
    private String description;

    private String statut;
    private LocalDate derniereMaj;
    private String extensionJson;
}
