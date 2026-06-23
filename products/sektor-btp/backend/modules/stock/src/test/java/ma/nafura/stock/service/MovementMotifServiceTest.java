package ma.nafura.stock.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.domain.model.MovementMotif;
import ma.nafura.stock.mapper.MovementMotifMapper;
import ma.nafura.stock.repository.MovementMotifRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class MovementMotifServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private MovementMotifRepository repository;

    @Mock
    private MovementMotifMapper mapper;

    @Mock
    private MovementMotifSeedService seedService;

    @InjectMocks
    private MovementMotifService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void listAll_filtersByTxType() {
        MovementMotif motif = MovementMotif.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .code("CONSO_CHANTIER")
                .name("Consommation chantier")
                .txType("SORTIE")
                .isActive(true)
                .build();
        when(repository.findByTenantIdAndTxTypeAndIsActiveTrueOrderByCodeAsc(TENANT_ID, "SORTIE"))
                .thenReturn(List.of(motif));

        List<MovementMotif> result = service.listAll("SORTIE");

        verify(seedService).seedIfEmpty();
        assertThat(result).hasSize(1);
        assertThat(result.getFirst().getCode()).isEqualTo("CONSO_CHANTIER");
    }
}
