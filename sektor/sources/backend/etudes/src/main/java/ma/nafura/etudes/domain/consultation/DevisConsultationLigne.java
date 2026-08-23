package ma.nafura.etudes.domain.consultation;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import java.math.BigDecimal;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "devis_consultation_lignes")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DevisConsultationLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "cle_stable", nullable = false, length = 120)
    private String cleStable;

    @Column(name = "designation", length = 500)
    private String designation;

    @Column(name = "quantite", precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "unite", length = 30)
    private String unite;

    @Column(name = "prix_unitaire", nullable = false, precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    @Column(name = "item_id")
    private UUID itemId;

    @Column(name = "ordre", nullable = false)
    @Builder.Default
    private Integer ordre = 0;
}
