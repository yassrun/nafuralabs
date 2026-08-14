package ma.nafura.venuecatalog.enrichment.adapter.persistence;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.PrePersist;
import jakarta.persistence.PreUpdate;
import jakarta.persistence.Table;
import lombok.Getter;
import lombok.Setter;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

@Entity
@Table(name = "catalog_place_ai_enrichments")
@Getter
@Setter
public class CatalogPlaceAiEnrichmentEntity {

    @Id
    private UUID id;

    @Column(name = "catalog_place_id", nullable = false)
    private UUID catalogPlaceId;

    @Column(name = "taxonomy_version", nullable = false, length = 64)
    private String taxonomyVersion;

    @Column(name = "prompt_version", nullable = false, length = 64)
    private String promptVersion;

    @Column(length = 128)
    private String model;

    @Column(name = "input_hash", nullable = false, length = 64)
    private String inputHash;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "venue_types", columnDefinition = "jsonb")
    private List<String> venueTypes;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> activities;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> settings;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> offers;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> experiences;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "suitable_for", columnDefinition = "jsonb")
    private List<String> suitableFor;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "experience_tags", columnDefinition = "jsonb")
    private List<String> experienceTags;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "music_styles", columnDefinition = "jsonb")
    private List<String> musicStyles;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> cuisines;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "audience_tags", columnDefinition = "jsonb")
    private List<String> audienceTags;

    @Column(name = "category_fit_score")
    private Double categoryFitScore;

    private Double confidence;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "evidence_fields", columnDefinition = "jsonb")
    private List<String> evidenceFields;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    private List<String> warnings;

    @Column(name = "selection_suggestion", length = 64)
    private String selectionSuggestion;

    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "structured_output", columnDefinition = "jsonb")
    private Map<String, Object> structuredOutput;

    @Column(name = "filter_decision", length = 32)
    private String filterDecision;

    @Column(length = 32)
    private String verdict;

    @Column(name = "usage_request_id", length = 255)
    private String usageRequestId;

    @Column(name = "manual_override", nullable = false)
    private boolean manualOverride;

    @Column(name = "manual_override_at")
    private OffsetDateTime manualOverrideAt;

    @Column(name = "manual_override_by", length = 128)
    private String manualOverrideBy;

    @Column(name = "created_at", nullable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at", nullable = false)
    private OffsetDateTime updatedAt;

    @PrePersist
    void onCreate() {
        OffsetDateTime now = OffsetDateTime.now();
        if (id == null) {
            id = UUID.randomUUID();
        }
        createdAt = now;
        updatedAt = now;
    }

    @PreUpdate
    void onUpdate() {
        updatedAt = OffsetDateTime.now();
    }
}
