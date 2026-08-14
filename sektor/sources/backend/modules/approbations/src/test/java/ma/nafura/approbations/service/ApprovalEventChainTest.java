package ma.nafura.approbations.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.when;

import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.approbations.api.dto.ApprovalIntegrityResultDto;
import ma.nafura.approbations.domain.model.ApprovalEvent;
import ma.nafura.approbations.repository.ApprovalEventRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ApprovalEventChainTest {

    @Mock
    private ApprovalEventRepository repository;

    private ApprovalEventService service;
    private final UUID tenantId = UUID.randomUUID();
    private final List<ApprovalEvent> store = new ArrayList<>();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new ApprovalEventService(repository, new com.fasterxml.jackson.databind.ObjectMapper());
        store.clear();

        lenient().when(repository.findByTenantIdAndRequestIdOrderByCreatedAtAsc(any(), any()))
                .thenAnswer(inv -> store.stream()
                        .filter(e -> e.getTenantId().equals(inv.getArgument(0))
                                && e.getRequestId().equals(inv.getArgument(1)))
                        .toList());
        lenient().when(repository.save(any(ApprovalEvent.class))).thenAnswer(inv -> {
            ApprovalEvent event = inv.getArgument(0);
            store.add(event);
            return event;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void appendEvent_buildsValidHashChain() {
        service.appendEvent("apr-001", ApprovalEvent.ACTION_SOUMIS, "emp-001", "Karim", "Submit", null);
        service.appendEvent("apr-001", ApprovalEvent.ACTION_APPROUVE, "emp-002", "Amal", "OK", null);

        ApprovalIntegrityResultDto result = service.verifyIntegrity("apr-001");
        assertThat(result.isValid()).isTrue();
        assertThat(result.getEventCount()).isEqualTo(2);

        ArgumentCaptor<ApprovalEvent> captor = ArgumentCaptor.forClass(ApprovalEvent.class);
        org.mockito.Mockito.verify(repository, org.mockito.Mockito.times(2)).save(captor.capture());
        List<ApprovalEvent> saved = captor.getAllValues();
        assertThat(saved.get(1).getPreviousHash()).isEqualTo(saved.get(0).getEventHash());
    }

    @Test
    void verifyIntegrity_detectsTamperedEvent() {
        ApprovalEvent first = service.appendEvent("apr-002", ApprovalEvent.ACTION_SOUMIS, "emp-001", "Karim", null, null);
        ApprovalEvent second = service.appendEvent("apr-002", ApprovalEvent.ACTION_APPROUVE, "emp-002", "Amal", null, null);

        second.setEventHash("deadbeef".repeat(8));
        store.set(1, second);

        ApprovalIntegrityResultDto result = service.verifyIntegrity("apr-002");
        assertThat(result.isValid()).isFalse();
        assertThat(first.getEventHash()).isNotBlank();
    }

    @Test
    void computeHash_isDeterministicForSameInputs() {
        OffsetDateTime ts = OffsetDateTime.parse("2026-05-06T09:15:00+01:00");
        String hash1 = ApprovalEventService.computeHash("", ApprovalEvent.ACTION_SOUMIS, "emp-001", ts, "");
        String hash2 = ApprovalEventService.computeHash("", ApprovalEvent.ACTION_SOUMIS, "emp-001", ts, "");
        assertThat(hash1).isEqualTo(hash2);
    }
}
