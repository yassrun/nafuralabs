package ma.nafura.approbations.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.time.LocalDate;
import ma.nafura.approbations.domain.model.ApprovalRequest;
import ma.nafura.approbations.domain.model.ApprovalWorkflow;
import org.junit.jupiter.api.Test;

class EscaladeApprobationServiceTest {

    @Test
    void isPastEscaladeThreshold_trueWhenPastDeadline() {
        ApprovalWorkflow workflow = ApprovalWorkflow.builder()
                .escaladeApresJours(5)
                .build();
        ApprovalRequest request = ApprovalRequest.builder()
                .dateSoumission(LocalDate.of(2026, 5, 1))
                .build();

        assertThat(EscaladeApprobationService.isPastEscaladeThreshold(
                        request, workflow, LocalDate.of(2026, 5, 10)))
                .isTrue();
    }

    @Test
    void isPastEscaladeThreshold_falseWhenWithinDeadline() {
        ApprovalWorkflow workflow = ApprovalWorkflow.builder()
                .escaladeApresJours(5)
                .build();
        ApprovalRequest request = ApprovalRequest.builder()
                .dateSoumission(LocalDate.of(2026, 5, 1))
                .build();

        assertThat(EscaladeApprobationService.isPastEscaladeThreshold(
                        request, workflow, LocalDate.of(2026, 5, 5)))
                .isFalse();
    }

    @Test
    void isPastEscaladeThreshold_falseWhenEscaladeDisabled() {
        ApprovalWorkflow workflow = ApprovalWorkflow.builder()
                .escaladeApresJours(null)
                .build();
        ApprovalRequest request = ApprovalRequest.builder()
                .dateSoumission(LocalDate.of(2026, 5, 1))
                .build();

        assertThat(EscaladeApprobationService.isPastEscaladeThreshold(
                        request, workflow, LocalDate.of(2026, 6, 1)))
                .isFalse();
    }
}
