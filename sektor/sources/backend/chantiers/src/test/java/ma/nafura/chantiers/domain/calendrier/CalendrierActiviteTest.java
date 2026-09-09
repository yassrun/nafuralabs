package ma.nafura.chantiers.domain.calendrier;

import static org.assertj.core.api.Assertions.*;
import java.time.*;
import java.util.*;
import org.junit.jupiter.api.Test;

class CalendrierActiviteTest {
    @Test void weekEndSpecifiqueNeDependPasDuCalendrierChantier() {
        var calendar = new CalendrierActivite("Africa/Casablanca", List.of(
                new CalendrierActivite.Plage(6, LocalTime.of(8,0), LocalTime.of(16,0), false),
                new CalendrierActivite.Plage(7, LocalTime.of(8,0), LocalTime.of(16,0), false)), List.of());
        assertThat(calendar.calculator().deriveInclusiveFin(LocalDate.of(2026,9,12), 960)).isEqualTo(LocalDate.of(2026,9,13));
    }
    @Test void nuitSeTermineLeLendemain() {
        var calendar = new CalendrierActivite("Africa/Casablanca", List.of(
                new CalendrierActivite.Plage(1, LocalTime.of(22,0), LocalTime.of(6,0), true)), List.of());
        assertThat(calendar.calculator().deriveInclusiveFin(LocalDate.of(2026,9,14), 480)).isEqualTo(LocalDate.of(2026,9,15));
    }
    @Test void doublonExceptionRefuse() {
        var day = new CalendrierActivite.ExceptionDate(LocalDate.of(2026,9,14), CalendrierExceptionType.FERMETURE, List.of());
        var calendar = new CalendrierActivite("Africa/Casablanca", List.of(
                new CalendrierActivite.Plage(1, LocalTime.of(8,0), LocalTime.of(16,0), false)), List.of(day,day));
        assertThatThrownBy(calendar::calculator).isInstanceOf(IllegalArgumentException.class).hasMessageContaining("dupliquee");
    }
}
