package ma.nafura.achats.domain.consultation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.Table;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "consultation_achat_destinataire_contacts")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationAchatDestinataireContact {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "destinataire_id", nullable = false)
    private UUID destinataireId;

    @Column(name = "contact_id", nullable = false)
    private UUID contactId;

    @Column(name = "position", nullable = false)
    @Builder.Default
    private int position = 0;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @PrePersist
    protected void onCreate() {
        if (createdAt == null) {
            createdAt = OffsetDateTime.now();
        }
    }
}
