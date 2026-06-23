package ma.nafura.achats.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.achats.domain.model.AttestationFournisseur;
import ma.nafura.achats.job.AttestationFournisseurStatusJob;
import ma.nafura.achats.repository.AttestationFournisseurRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.util.ReflectionTestUtils;

@ExtendWith(MockitoExtension.class)
class AttestationStatusJobTest {

    @Mock
    private AttestationFournisseurRepository repository;

    private AttestationFournisseurService service;
    private AttestationFournisseurStatusJob job;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new AttestationFournisseurService(repository);
        job = new AttestationFournisseurStatusJob(service);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void computeStatus_valideWhenBeyond30Days() {
        LocalDate today = LocalDate.of(2026, 5, 29);
        String status = AttestationFournisseurService.computeStatus(today.plusDays(60), today);
        assertThat(status).isEqualTo(AttestationFournisseur.STATUS_VALIDE);
    }

    @Test
    void computeStatus_expireBientotWithin30Days() {
        LocalDate today = LocalDate.of(2026, 5, 29);
        String status = AttestationFournisseurService.computeStatus(today.plusDays(15), today);
        assertThat(status).isEqualTo(AttestationFournisseur.STATUS_EXPIRE_BIENTOT);
    }

    @Test
    void computeStatus_expireWhenPast() {
        LocalDate today = LocalDate.of(2026, 5, 29);
        String status = AttestationFournisseurService.computeStatus(today.minusDays(1), today);
        assertThat(status).isEqualTo(AttestationFournisseur.STATUS_EXPIRE);
    }

    @Test
    void recomputeStatusForTenant_updatesStaleRows() {
        AttestationFournisseur row = AttestationFournisseur.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .partnerId("f1")
                .type(AttestationFournisseur.TYPE_CNSS)
                .dateEmission(LocalDate.of(2025, 1, 1))
                .dateExpiration(LocalDate.now().minusDays(5))
                .status(AttestationFournisseur.STATUS_VALIDE)
                .build();

        when(repository.findByTenantIdOrderByCreatedAtDesc(tenantId)).thenReturn(List.of(row));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        int updated = service.recomputeStatusForTenant();

        assertThat(updated).isEqualTo(1);
        assertThat(row.getStatus()).isEqualTo(AttestationFournisseur.STATUS_EXPIRE);
    }

    @Test
    void scheduledJob_skipsWithoutTenantContext() {
        TenantContext.clear();
        job.recomputeStatuses();
        verify(repository, never()).findByTenantIdOrderByCreatedAtDesc(any());
    }
}
