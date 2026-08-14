package ma.nafura.approbations.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.approbations.api.request.DelegationApprobationCreateDto;
import ma.nafura.approbations.api.request.DelegationApprobationUpdateDto;
import ma.nafura.approbations.domain.model.DelegationApprobation;
import ma.nafura.approbations.repository.DelegationApprobationRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DelegationServiceTest {

    @Mock
    private DelegationApprobationRepository repository;

    private DelegationApprobationService service;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new DelegationApprobationService(repository);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void resolveApprobateur_returnsDelegateWhenActiveDelegationCoversDate() {
        DelegationApprobation delegation = DelegationApprobation.builder()
                .tenantId(tenantId)
                .userId("user-a")
                .delegueUserId("user-b")
                .dateDebut(LocalDate.of(2026, 5, 1))
                .dateFin(LocalDate.of(2026, 5, 31))
                .isActive(true)
                .build();

        when(repository.findByTenantIdAndUserIdOrderByDateDebutDesc(tenantId, "user-a"))
                .thenReturn(List.of(delegation));

        String resolved = service.resolveApprobateur("user-a", LocalDate.of(2026, 5, 15));

        assertThat(resolved).isEqualTo("user-b");
    }

    @Test
    void resolveApprobateur_returnsOriginalUserWhenNoActiveDelegation() {
        DelegationApprobation expired = DelegationApprobation.builder()
                .tenantId(tenantId)
                .userId("user-a")
                .delegueUserId("user-b")
                .dateDebut(LocalDate.of(2026, 4, 1))
                .dateFin(LocalDate.of(2026, 4, 30))
                .isActive(true)
                .build();

        when(repository.findByTenantIdAndUserIdOrderByDateDebutDesc(tenantId, "user-a"))
                .thenReturn(List.of(expired));

        String resolved = service.resolveApprobateur("user-a", LocalDate.of(2026, 5, 15));

        assertThat(resolved).isEqualTo("user-a");
    }

    @Test
    void resolveApprobateur_skipsInactiveDelegation() {
        DelegationApprobation inactive = DelegationApprobation.builder()
                .tenantId(tenantId)
                .userId("user-a")
                .delegueUserId("user-b")
                .dateDebut(LocalDate.of(2026, 5, 1))
                .dateFin(LocalDate.of(2026, 5, 31))
                .isActive(false)
                .build();

        when(repository.findByTenantIdAndUserIdOrderByDateDebutDesc(tenantId, "user-a"))
                .thenReturn(List.of(inactive));

        assertThat(service.resolveApprobateur("user-a", LocalDate.of(2026, 5, 15))).isEqualTo("user-a");
    }

    @Test
    void create_persistsDelegation() {
        DelegationApprobationCreateDto dto = DelegationApprobationCreateDto.builder()
                .userId("user-a")
                .delegueUserId("user-b")
                .dateDebut(LocalDate.of(2026, 6, 1))
                .dateFin(LocalDate.of(2026, 6, 30))
                .isActive(true)
                .build();

        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DelegationApprobation saved = service.create(dto);

        ArgumentCaptor<DelegationApprobation> captor = ArgumentCaptor.forClass(DelegationApprobation.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getTenantId()).isEqualTo(tenantId);
        assertThat(saved.getUserId()).isEqualTo("user-a");
        assertThat(saved.getDelegueUserId()).isEqualTo("user-b");
    }

    @Test
    void create_rejectsInvalidDateRange() {
        DelegationApprobationCreateDto dto = DelegationApprobationCreateDto.builder()
                .userId("user-a")
                .delegueUserId("user-b")
                .dateDebut(LocalDate.of(2026, 6, 30))
                .dateFin(LocalDate.of(2026, 6, 1))
                .build();

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("date_fin");
    }

    @Test
    void update_deactivatesDelegation() {
        UUID id = UUID.randomUUID();
        DelegationApprobation existing = DelegationApprobation.builder()
                .id(id)
                .tenantId(tenantId)
                .userId("user-a")
                .delegueUserId("user-b")
                .dateDebut(LocalDate.of(2026, 6, 1))
                .dateFin(LocalDate.of(2026, 6, 30))
                .isActive(true)
                .build();

        when(repository.findByIdAndTenantId(id, tenantId)).thenReturn(Optional.of(existing));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DelegationApprobation updated =
                service.update(id, DelegationApprobationUpdateDto.builder().isActive(false).build());

        assertThat(updated.getIsActive()).isFalse();
    }
}
