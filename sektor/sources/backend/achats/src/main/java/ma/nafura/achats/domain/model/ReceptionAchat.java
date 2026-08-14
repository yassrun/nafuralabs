package ma.nafura.achats.domain.model;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.EqualsAndHashCode;
import lombok.NoArgsConstructor;
import lombok.ToString;

@Entity
@Table(name = "receptions_achat")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ReceptionAchat {

    public static final String STATUS_VALIDE = "VALIDE";
    public static final String STATUS_ANNULE = "ANNULE";

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "bon_commande_achat_id", nullable = false)
    private UUID bonCommandeAchatId;

    @Column(name = "numero", nullable = false, length = 50)
    private String numero;

    @Column(name = "date_reception", nullable = false)
    private LocalDate dateReception;

    @Column(name = "bl_numero", length = 100)
    private String blNumero;

    @Column(name = "status", nullable = false, length = 30)
    private String status;

    @Column(name = "notes")
    private String notes;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @OneToMany(mappedBy = "reception", cascade = CascadeType.ALL, orphanRemoval = true, fetch = FetchType.EAGER)
    @JsonManagedReference
    @Builder.Default
    @EqualsAndHashCode.Exclude
    @ToString.Exclude
    private List<ReceptionAchatLigne> lignes = new ArrayList<>();

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
        if (this.status == null) {
            this.status = STATUS_VALIDE;
        }
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
