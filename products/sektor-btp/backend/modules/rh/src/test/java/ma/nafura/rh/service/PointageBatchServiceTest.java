package ma.nafura.rh.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.dto.PointageBatchDto;
import ma.nafura.rh.api.request.PointageBatchCreateDto;
import ma.nafura.rh.api.request.PointageInputDto;
import ma.nafura.rh.domain.model.Pointage;
import ma.nafura.rh.domain.model.PointageBatch;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.PointageBatchRepository;
import ma.nafura.rh.repository.PointageRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PointageBatchServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final LocalDate DATE = LocalDate.of(2026, 8, 5);

    @Mock
    private PointageBatchRepository batchRepository;

    @Mock
    private PointageRepository pointageRepository;

    @Mock
    private EmployeRepository employeRepository;

    @Mock
    private PointageSeedService seedService;

    @Mock
    private ChantierCodeReader chantierCodeReader;

    @InjectMocks
    private PointageBatchService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void create_rejectsDuplicateEmployeSameChantierSameDay() {
        PointageBatchCreateDto request = batchRequest("ch-001", List.of(pointageInput("emp-001")));
        Pointage existing = Pointage.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .employeId("emp-001")
                .chantierId("ch-001")
                .date(DATE)
                .build();

        when(batchRepository.findByTenantIdAndChantierIdAndDatePointage(TENANT_ID, "ch-001", DATE))
                .thenReturn(Optional.empty());
        when(pointageRepository.findByTenantIdAndEmployeIdAndDateAndChantierId(
                        TENANT_ID, "emp-001", DATE, "ch-001"))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.create(request))
                .isInstanceOf(PointageBatchDuplicateException.class)
                .satisfies(ex -> {
                    PointageBatchDuplicateException dup = (PointageBatchDuplicateException) ex;
                    assertThat(dup.getConflict().getExistingPointageId()).isEqualTo(existing.getId().toString());
                    assertThat(dup.getConflict().getEmployeId()).isEqualTo("emp-001");
                    assertThat(dup.getConflict().getMessage()).contains("employé");
                });

        verify(batchRepository, never()).save(any());
        verify(pointageRepository, never()).save(any());
    }

    @Test
    void create_allowsSameEmployeOnTwoChantiersSameDay() {
        when(batchRepository.findByTenantIdAndChantierIdAndDatePointage(TENANT_ID, "ch-B", DATE))
                .thenReturn(Optional.empty());
        when(pointageRepository.findByTenantIdAndEmployeIdAndDateAndChantierId(
                        TENANT_ID, "emp-001", DATE, "ch-B"))
                .thenReturn(Optional.empty());

        UUID batchId = UUID.randomUUID();
        when(batchRepository.save(any(PointageBatch.class))).thenAnswer(inv -> {
            PointageBatch b = inv.getArgument(0);
            b.setId(batchId);
            return b;
        });
        when(pointageRepository.save(any(Pointage.class))).thenAnswer(inv -> {
            Pointage p = inv.getArgument(0);
            if (p.getId() == null) {
                p.setId(UUID.randomUUID());
            }
            return p;
        });
        when(employeRepository.findByIdAndTenantId(eq("emp-001"), eq(TENANT_ID))).thenReturn(Optional.empty());
        when(chantierCodeReader.resolveCode(TENANT_ID, "ch-B")).thenReturn("CH-2026-B");

        PointageBatchDto dto = service.create(batchRequest("ch-B", List.of(pointageInput("emp-001"))));

        assertThat(dto.getId()).isEqualTo(batchId.toString());
        assertThat(dto.getChantierId()).isEqualTo("ch-B");
        assertThat(dto.getPointages()).hasSize(1);
        assertThat(dto.getPointages().getFirst().getChantierCode()).isEqualTo("CH-2026-B");

        ArgumentCaptor<Pointage> pointageCaptor = ArgumentCaptor.forClass(Pointage.class);
        verify(pointageRepository).save(pointageCaptor.capture());
        assertThat(pointageCaptor.getValue().getChantierId()).isEqualTo("ch-B");
        assertThat(pointageCaptor.getValue().getEmployeId()).isEqualTo("emp-001");
        assertThat(pointageCaptor.getValue().getId()).isNotNull();
    }

    @Test
    void create_rejectsDuplicateBatchSameChantierSameDay() {
        PointageBatch existing = PointageBatch.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .chantierId("ch-001")
                .datePointage(DATE)
                .build();
        when(batchRepository.findByTenantIdAndChantierIdAndDatePointage(TENANT_ID, "ch-001", DATE))
                .thenReturn(Optional.of(existing));

        assertThatThrownBy(() -> service.create(batchRequest("ch-001", List.of(pointageInput("emp-001")))))
                .isInstanceOf(PointageBatchDuplicateException.class)
                .satisfies(ex -> {
                    PointageBatchDuplicateException dup = (PointageBatchDuplicateException) ex;
                    assertThat(dup.getConflict().getExistingBatchId()).isEqualTo(existing.getId().toString());
                    assertThat(dup.getConflict().getMessage()).contains("lot");
                });

        verify(pointageRepository, never()).save(any());
    }

    private static PointageBatchCreateDto batchRequest(String chantierId, List<PointageInputDto> pointages) {
        PointageBatchCreateDto dto = new PointageBatchCreateDto();
        dto.setChefEmployeId("emp-004");
        dto.setChantierId(chantierId);
        dto.setDatePointage(DATE);
        dto.setPointages(pointages);
        return dto;
    }

    private static PointageInputDto pointageInput(String employeId) {
        PointageInputDto input = new PointageInputDto();
        input.setEmployeId(employeId);
        input.setDate(DATE);
        input.setMode(Pointage.MODE_PRESENT);
        input.setHeuresNormales(new BigDecimal("8"));
        input.setHeuresSup(BigDecimal.ZERO);
        return input;
    }
}
