package ma.nafura.rh.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.rh.api.request.RhNomenclatureCreateDto;
import ma.nafura.rh.domain.referentiel.RhPoste;
import ma.nafura.rh.repository.EmployeRepository;
import ma.nafura.rh.repository.RhPosteRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class RhPosteServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private RhPosteRepository repository;

    @Mock
    private EmployeRepository employeRepository;

    @InjectMocks
    private RhPosteService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void list_filtersByQuery() {
        RhPoste match = poste("rh-pst-001", "CONDUCTEUR", "Conducteur de travaux");
        RhPoste other = poste("rh-pst-002", "MACON", "Maçon");
        when(repository.findByTenantIdAndActifOrderByLibelleAsc(TENANT_ID, true))
                .thenReturn(List.of(match, other));

        List<RhPoste> rows = service.list("condu", true);

        assertThat(rows).extracting(RhPoste::getCode).containsExactly("CONDUCTEUR");
    }

    @Test
    void create_assignsCodeFromLibelle() {
        when(repository.findByTenantIdOrderByLibelleAsc(TENANT_ID)).thenReturn(List.of());
        when(repository.findByIdAndTenantId(any(), eq(TENANT_ID))).thenReturn(Optional.empty());
        when(repository.findByTenantIdAndCodeIgnoreCase(eq(TENANT_ID), any())).thenReturn(Optional.empty());
        when(repository.save(any(RhPoste.class))).thenAnswer(inv -> inv.getArgument(0));

        RhNomenclatureCreateDto dto = new RhNomenclatureCreateDto();
        dto.setLibelle("Chef de chantier");

        RhPoste created = service.create(dto);

        assertThat(created.getCode()).isEqualTo("CHEF-DE-CHANTIER");
        assertThat(created.getId()).isEqualTo("rh-pst-001");
        assertThat(created.isActif()).isTrue();
    }

    private static RhPoste poste(String id, String code, String libelle) {
        return RhPoste.builder()
                .id(id)
                .tenantId(TENANT_ID)
                .code(code)
                .libelle(libelle)
                .actif(true)
                .build();
    }
}
