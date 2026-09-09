package ma.nafura.chantiers.domain.activite;
/** Reservation in working minutes per day, independent from physical progress. */
public record PlanningAllocation(String affectationId, int minutesParJour) {}
