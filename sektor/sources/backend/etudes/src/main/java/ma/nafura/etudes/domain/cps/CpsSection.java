package ma.nafura.etudes.domain.cps;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Une section du CPS : unite de recherche et de restitution.
 *
 * <p>Le decoupage suit la structure du document (articles, chapitres numerotes) plutot qu'une
 * taille fixe, pour qu'une section se lise seule. Voir {@code CpsSectionneur}.
 *
 * <p>{@code contenu_tsv} est genere par Postgres : la recherche est locale et gratuite. Le LLM
 * n'intervient qu'ensuite, sur les quelques sections retenues.
 */
@Entity
@Table(name = "cps_sections")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CpsSection {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    @Column(name = "cps_document_id", nullable = false)
    private UUID cpsDocumentId;

    /** '3.2.1', '12', 'IV' — null quand le document n'a pas de structure detectable. */
    @Column(name = "numero", length = 50)
    private String numero;

    @Column(name = "titre", length = 500)
    private String titre;

    @Column(name = "contenu", nullable = false, columnDefinition = "text")
    private String contenu;

    @Column(name = "ordre", nullable = false)
    private Integer ordre;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    /** Libelle court pour l'affichage de la source. */
    public String reference() {
        if (numero != null && titre != null) {
            return numero + " — " + titre;
        }
        if (numero != null) {
            return numero;
        }
        return titre != null ? titre : "Section " + (ordre + 1);
    }

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
    }
}
