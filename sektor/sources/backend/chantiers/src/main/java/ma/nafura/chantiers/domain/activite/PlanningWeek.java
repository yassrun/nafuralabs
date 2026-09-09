package ma.nafura.chantiers.domain.activite;

import jakarta.persistence.*;
import lombok.*;
import org.hibernate.annotations.JdbcTypeCode;
import org.hibernate.type.SqlTypes;
import java.time.*;
import java.util.*;

@Entity @Table(name="chantier_planning_weeks") @Getter @Setter @NoArgsConstructor
public class PlanningWeek {
    @Id private String id;
    @Column(nullable=false) private UUID tenantId;
    @Column(nullable=false) private String chantierId;
    @Column(nullable=false) private LocalDate weekStart;
    @Version private Long version;
    private int revision;
    private String status;
    @Column(columnDefinition="text") private String note;
    private String token;
    @Column(columnDefinition="text") private String snapshot;
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition="jsonb")
    private List<String> contributors=new ArrayList<>();
    @JdbcTypeCode(SqlTypes.JSON) @Column(columnDefinition="jsonb")
    private List<Event> history=new ArrayList<>();
    public record Event(int revision,String action,String actor,Instant at,String note,String snapshot) {}
}
