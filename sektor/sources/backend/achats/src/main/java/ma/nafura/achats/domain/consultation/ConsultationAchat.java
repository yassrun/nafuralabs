package ma.nafura.achats.domain.consultation;

import jakarta.persistence.CollectionTable;
import jakarta.persistence.Column;
import jakarta.persistence.ElementCollection;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.HashSet;
import java.util.Set;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Demande de prix fournisseur. Vit dans Achats. Lien étude optionnel.
 * Pas une DA chantier, pas un AO, pas {@code consultations_etudes}.
 */
@Entity
@Table(name = "consultations_achat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationAchat {

    public static final String STATUT_DEMANDE = "DEMANDE";
    public static final String STATUT_DEVIS_RECU = "DEVIS_RECU";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "fournisseur_id", nullable = false)
    private UUID fournisseurId;

    @Column(name = "dossier_etude_id")
    private UUID dossierEtudeId;

    @Column(name = "statut", nullable = false, length = 20)
    @Builder.Default
    private String statut = STATUT_DEMANDE;

    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "consultation_achat_panier",
            joinColumns = @JoinColumn(name = "consultation_id"))
    @Column(name = "cle_stable", nullable = false, length = 120)
    @Builder.Default
    private Set<String> clesStables = new HashSet<>();

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
        if (statut == null) {
            statut = STATUT_DEMANDE;
        }
        if (clesStables == null) {
            clesStables = new HashSet<>();
        }
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
