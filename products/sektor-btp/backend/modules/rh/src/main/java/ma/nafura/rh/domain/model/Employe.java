package ma.nafura.rh.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "employes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Employe {

    public static final String STATUT_ACTIF = "ACTIF";
    public static final String STATUT_SUSPENDU = "SUSPENDU";
    public static final String STATUT_SOLDE = "SOLDE";

    @Id
    @Column(length = 100)
    private String id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(nullable = false, length = 50)
    private String matricule;

    @Column(nullable = false, length = 120)
    private String nom;

    @Column(nullable = false, length = 120)
    private String prenom;

    @Column(nullable = false, length = 20)
    private String cin;

    @Column(length = 20)
    private String cnss;

    @Column(name = "date_naissance")
    private LocalDate dateNaissance;

    private String adresse;

    private String ville;

    @Column(length = 30)
    private String telephone;

    @Column(length = 255)
    private String email;

    @Column(nullable = false)
    private String poste;

    @Column(length = 120)
    private String departement;

    @Column(nullable = false, length = 30)
    private String categorie;

    @Column(name = "type_contrat", nullable = false, length = 30)
    private String typeContrat;

    @Column(nullable = false, length = 30)
    private String statut;

    @Column(name = "date_embauche", nullable = false)
    private LocalDate dateEmbauche;

    @Column(name = "date_fin_contrat")
    private LocalDate dateFinContrat;

    @Column(name = "salaire_base", nullable = false, precision = 18, scale = 4)
    private BigDecimal salaireBase;

    @Column(name = "indemnite_representation", precision = 18, scale = 4)
    private BigDecimal indemniteRepresentation;

    @Column(name = "indemnite_transport", precision = 18, scale = 4)
    private BigDecimal indemniteTransport;

    @Column(length = 34)
    private String rib;

    @Column(length = 120)
    private String banque;

    private String notes;

    @Column(length = 20)
    private String ice;

    @Column(name = "if_fiscal", length = 20)
    private String ifFiscal;

    @Column(length = 120)
    private String rc;

    @Column(length = 120)
    private String patente;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (createdAt == null) {
            createdAt = now;
        }
        updatedAt = now;
        if (salaireBase == null) {
            salaireBase = BigDecimal.ZERO;
        }
        if (statut == null || statut.isBlank()) {
            statut = STATUT_ACTIF;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
