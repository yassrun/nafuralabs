package ma.nafura.platform.collaboration.docmanager.domain.model;

import jakarta.persistence.*;
import java.time.OffsetDateTime;
import java.util.UUID;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * A reusable block included by document templates — first and foremost the company header and
 * footer.
 *
 * <p>Before this, every template carried its own copy of the letterhead: changing an address
 * meant editing devis, bordereau, synthèse and facture separately. Templates now write
 * {@code <div th:replace="~{fragment :: HEADER_DEFAULT}"></div>} and the block is edited once.
 */
@Entity
@Table(name = "document_fragments")
@Data
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DocumentFragment {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private UUID id;

    @Column(name = "tenant_id", nullable = false)
    private UUID tenantId;

    /** Referenced from templates, e.g. HEADER_DEFAULT. Unique per tenant. */
    @Column(name = "code", nullable = false, length = 60)
    private String code;

    @Column(name = "name", nullable = false, length = 200)
    private String name;

    @Column(name = "body", columnDefinition = "text")
    private String body;

    /** HEADER | FOOTER | BLOCK — drives where the editor offers it. */
    @Column(name = "scope", length = 20)
    private String scope;

    /** Seeded by the platform; regenerated from document settings rather than hand-edited. */
    @Column(name = "is_system", nullable = false)
    @Builder.Default
    private Boolean isSystem = false;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        this.createdAt = OffsetDateTime.now();
        this.updatedAt = OffsetDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        this.updatedAt = OffsetDateTime.now();
    }
}
