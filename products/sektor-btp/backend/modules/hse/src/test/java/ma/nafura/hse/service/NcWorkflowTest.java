package ma.nafura.hse.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.hse.api.request.CapaActionCreateDto;
import ma.nafura.hse.api.request.NonConformiteCreateDto;
import ma.nafura.hse.domain.model.CapaAction;
import ma.nafura.hse.domain.model.NonConformite;
import ma.nafura.hse.repository.CapaActionRepository;
import ma.nafura.hse.repository.NonConformiteRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class NcWorkflowTest {

    @Mock
    private NonConformiteRepository repository;

    @Mock
    private CapaActionRepository capaRepository;

    @Mock
    private NonConformiteSeedService seedService;

    private NonConformiteService service;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new NonConformiteService(repository, capaRepository, seedService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void workflow_fullCycleFromOuverteToCloturee() {
        NonConformite nc = baseNc(NonConformite.STATUS_OUVERTE);
        when(repository.findByIdAndTenantId("nc001", tenantId)).thenReturn(Optional.of(nc));
        when(repository.save(any(NonConformite.class))).thenAnswer(inv -> inv.getArgument(0));

        NonConformite assigned = service.assigner("nc001", null);
        assertThat(assigned.getStatus()).isEqualTo(NonConformite.STATUS_ASSIGNEE);

        NonConformite inTreatment = service.traiter("nc001");
        assertThat(inTreatment.getStatus()).isEqualTo(NonConformite.STATUS_EN_TRAITEMENT);

        NonConformite verified = service.verifier("nc001");
        assertThat(verified.getStatus()).isEqualTo(NonConformite.STATUS_VERIFIEE);

        NonConformite closed = service.cloturer("nc001");
        assertThat(closed.getStatus()).isEqualTo(NonConformite.STATUS_CLOTUREE);
    }

    @Test
    void traiter_fromOuverteSkipsAssignee() {
        NonConformite nc = baseNc(NonConformite.STATUS_OUVERTE);
        when(repository.findByIdAndTenantId("nc001", tenantId)).thenReturn(Optional.of(nc));
        when(repository.save(any(NonConformite.class))).thenAnswer(inv -> inv.getArgument(0));

        NonConformite result = service.traiter("nc001");
        assertThat(result.getStatus()).isEqualTo(NonConformite.STATUS_EN_TRAITEMENT);
    }

    @Test
    void verifier_rejectsWhenNotEnTraitement() {
        NonConformite nc = baseNc(NonConformite.STATUS_OUVERTE);
        when(repository.findByIdAndTenantId("nc001", tenantId)).thenReturn(Optional.of(nc));

        assertThatThrownBy(() -> service.verifier("nc001"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("EN_TRAITEMENT");
    }

    @Test
    void createCapa_updatesCorrectiveField() {
        NonConformite nc = baseNc(NonConformite.STATUS_EN_TRAITEMENT);
        nc.setCapaActions(new ArrayList<>());
        when(repository.findByIdAndTenantId("nc001", tenantId)).thenReturn(Optional.of(nc));
        when(capaRepository.findByTenantIdAndNonConformiteIdOrderByCreatedAtAsc(tenantId, "nc001"))
                .thenReturn(new ArrayList<>());
        when(repository.save(any(NonConformite.class))).thenAnswer(inv -> inv.getArgument(0));
        when(capaRepository.save(any(CapaAction.class))).thenAnswer(inv -> inv.getArgument(0));

        CapaActionCreateDto dto = new CapaActionCreateDto();
        dto.setTypeCapa("CORRECTIVE");
        dto.setDescription("Pose garde-corps provisoires");
        dto.setResponsableNom("Youssef Tahri");

        CapaAction capa = service.createCapa("nc001", dto);

        assertThat(capa.getTypeCapa()).isEqualTo(CapaAction.TYPE_CORRECTIVE);
        assertThat(nc.getActionCorrective()).isEqualTo("Pose garde-corps provisoires");
        assertThat(nc.getResponsableNom()).isEqualTo("Youssef Tahri");
        verify(capaRepository).save(any(CapaAction.class));
    }

    @Test
    void create_generatesNumeroAndDefaultsStatus() {
        when(repository.findByIdAndTenantId(any(), any())).thenReturn(Optional.empty());
        when(repository.findByTenantIdOrderByDateNcDescCreatedAtDesc(tenantId)).thenReturn(new ArrayList<>());
        when(repository.save(any(NonConformite.class))).thenAnswer(inv -> inv.getArgument(0));

        NonConformiteCreateDto dto = new NonConformiteCreateDto();
        dto.setDateNc(LocalDate.of(2026, 5, 29));
        dto.setTypeNc("SECURITE");
        dto.setDescription("Test NC");

        NonConformite created = service.create(dto);

        ArgumentCaptor<NonConformite> captor = ArgumentCaptor.forClass(NonConformite.class);
        verify(repository).save(captor.capture());
        assertThat(captor.getValue().getNumero()).startsWith("NC-2026-");
        assertThat(created.getStatus()).isEqualTo(NonConformite.STATUS_OUVERTE);
        verify(seedService, never()).seedIfEmpty();
    }

    private NonConformite baseNc(String status) {
        return NonConformite.builder()
                .id("nc001")
                .tenantId(tenantId)
                .numero("NC-2026-0001")
                .dateNc(LocalDate.of(2026, 1, 15))
                .typeNc(NonConformite.TYPE_SECURITE)
                .description("Test")
                .status(status)
                .build();
    }
}
