package ma.nafura.rh.api.request;

import java.math.BigDecimal;
import java.time.LocalDate;
import lombok.Data;

@Data
public class EmployeUpdateDto {

    private String nom;

    private String prenom;

    private String cin;

    private String cnss;

    private LocalDate dateNaissance;

    private String adresse;

    private String ville;

    private String telephone;

    private String email;

    private String poste;

    private String departement;

    private String categorie;

    private String typeContrat;

    private String statut;

    private LocalDate dateEmbauche;

    private LocalDate dateFinContrat;

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
