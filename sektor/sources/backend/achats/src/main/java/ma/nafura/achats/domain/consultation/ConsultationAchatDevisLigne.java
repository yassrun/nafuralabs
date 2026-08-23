package ma.nafura.achats.domain.consultation;

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
@Table(name = "consultation_achat_devis_ligne")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ConsultationAchatDevisLigne {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "identite", length = 120)
    private String identite;

    @Column(name = "libelle", nullable = false, length = 500)
    private String libelle;

    @Column(name = "quantite", precision = 18, scale = 4)
    private BigDecimal quantite;

    @Column(name = "unite", length = 30)
    private String unite;

    @Column(name = "prix_unitaire", precision = 18, scale = 4)
    private BigDecimal prixUnitaire;

    @Column(name = "ordre", nullable = false)
    @Builder.Default
    private int ordre = 0;
}
