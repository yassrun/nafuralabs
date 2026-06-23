package ma.nafura.rh.api.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class EmployeCreateDto {

    private String id;

    @NotBlank
    private String nom;

    @NotBlank
    private String prenom;

    @NotBlank
    private String cin;

    private String cnss;

    private LocalDate dateNaissance;

    private String adresse;

    private String ville;

    private String telephone;

    private String email;

    @NotBlank
    private String poste;

    private String departement;

    @NotBlank
    private String categorie;

    @NotBlank
    private String typeContrat;

    private String statut;

    @NotNull
    private LocalDate dateEmbauche;

    private LocalDate dateFinContrat;

    @NotNull
    private BigDecimal salaireBase;

    private BigDecimal indemniteRepresentation;

    private BigDecimal indemniteTransport;

    private String rib;

    private String banque;

    private String notes;

    private String ice;

    private String ifFiscal;

    private String rc;

    private String patente;
}
