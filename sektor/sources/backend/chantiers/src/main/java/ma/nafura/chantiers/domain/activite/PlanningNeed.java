package ma.nafura.chantiers.domain.activite;
import java.math.BigDecimal;
import java.time.LocalDate;

/** Preparation need; a linked purchase request is not a confirmed delivery. */
public record PlanningNeed(String id,String type,String label,BigDecimal quantity,String unit,
                           int daysBeforeStart,int leadDays,String demandeId,String demandeNumero,LocalDate requestedDate) {}
