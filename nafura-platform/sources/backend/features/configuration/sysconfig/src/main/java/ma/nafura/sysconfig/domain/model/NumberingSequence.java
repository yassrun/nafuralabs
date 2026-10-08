package ma.nafura.platform.configuration.sysconfig.domain.model;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Table;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.time.OffsetDateTime;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;
import ma.nafura.platform.framework.audit.Auditable;
import ma.nafura.platform.framework.domain.TenantEntity;
import org.hibernate.annotations.Formula;

@Entity
@Table(name = "numbering_sequences")
@Getter
@Setter
@NoArgsConstructor
@Auditable(entityType = "numbering-sequence", trackedFields = {"code", "name", "prefix", "currentNumber"})
public class NumberingSequence extends TenantEntity {

    @NotBlank
    @Size(max = 50)
    @Column(name = "code", nullable = false, length = 50)
    private String code;

    @NotBlank
    @Size(max = 100)
    @Column(name = "name", nullable = false, length = 100)
    private String name;

    @Size(max = 50)
    @Column(name = "prefix", length = 50)
    private String prefix;

    @NotNull
    @Min(0)
    @Column(name = "current_number", nullable = false)
    private Long currentNumber = 0L;

    @NotNull
    @Min(1)
    @Column(name = "increment_by", nullable = false)
    private Integer incrementBy = 1;

    @NotNull
    @Min(0)
    @Column(name = "pad_length", nullable = false)
    private Integer padLength = 6;

    @Size(max = 5)
    @Column(name = "separator", length = 5)
    private String separator;

    @Size(max = 20)
    @Column(name = "reset_policy", length = 20)
    private String resetPolicy;

    @Size(max = 10)
    @Column(name = "year_format", length = 10)
    private String yearFormat;

    @Column(name = "last_reset_at")
    private OffsetDateTime lastResetAt;

    /**
     * Next number as documents will show it (prefix, year, padded counter).
     * Matches {@code NumberingSequenceService#formatNumber}.
     */
    @Setter(AccessLevel.NONE)
    @Formula(
        "(coalesce(prefix, '')"
            + " || case when year_format is not null and btrim(year_format) <> '' then"
            + " (case when separator is not null and separator <> '' then separator else '' end)"
            + " || case when upper(year_format) = 'YY' then to_char(current_timestamp, 'YY')"
            + " else to_char(current_timestamp, 'YYYY') end else '' end"
            + " || case when separator is not null and separator <> '' then separator else '' end"
            + " || case when pad_length is not null and pad_length > 0"
            + " then lpad(cast(current_number as text), pad_length, '0')"
            + " else cast(current_number as text) end)"
    )
    private String preview;

    /** French label of {@link #resetPolicy} for the list and filters. */
    @Setter(AccessLevel.NONE)
    @Formula(
        "(case when upper(coalesce(reset_policy, 'NEVER')) = 'YEARLY' then 'Annuel'"
            + " when upper(coalesce(reset_policy, 'NEVER')) = 'MONTHLY' then 'Mensuel'"
            + " else 'Jamais' end)"
    )
    private String resetLabel;
}
