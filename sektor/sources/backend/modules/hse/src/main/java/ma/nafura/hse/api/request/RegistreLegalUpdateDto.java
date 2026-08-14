package ma.nafura.hse.api.request;

import java.time.LocalDate;
import lombok.Data;

@Data
public class RegistreLegalUpdateDto {

    private String registre;
    private String numero;
    private LocalDate date;
    private String reference;
    private String chantierId;
    private String chantierCode;
    private String employeId;
    private String employeNom;
    private String description;
    private String statut;
    private LocalDate derniereMaj;
    private String extensionJson;
}
