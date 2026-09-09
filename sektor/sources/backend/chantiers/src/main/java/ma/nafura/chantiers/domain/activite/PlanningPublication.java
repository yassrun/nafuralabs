package ma.nafura.chantiers.domain.activite;

import jakarta.persistence.*;
import java.time.*;
import java.util.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;

/** Frozen client content. Acknowledgements append evidence without changing the published snapshot. */
@Entity @Table(name="chantier_planning_publications") @Getter @Setter @NoArgsConstructor
public class PlanningPublication {
    @Id private String id;
    @Column(nullable=false) private UUID tenantId;
    @Column(nullable=false) private String chantierId;
    @Version private Long version;
    private int numero;
    private Instant publishedAt;
    private String publishedBy;
    private String title;
    @Column(columnDefinition="text") private String snapshot;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition="jsonb")
    private List<Acknowledgement> acknowledgements=new ArrayList<>();
    public record Acknowledgement(String outcome,LocalDate date,String clientName,String evidence,String note,String actor,Instant recordedAt) {}
}
