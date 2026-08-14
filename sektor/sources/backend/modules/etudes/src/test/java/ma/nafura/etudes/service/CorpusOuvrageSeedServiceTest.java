package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.ArrayList;
import java.util.UUID;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CorpusOuvrageSeedServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000099");

    @Mock
    private OuvrageRepository repository;

    private CorpusOuvrageSeedService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new CorpusOuvrageSeedService(repository, new ObjectMapper(), new DpuCalculator());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void mapFamille_grillePr2() {
        assertThat(CorpusOuvrageSeedService.mapFamille("TERRASSEMENTS GÉNÉRAUX")).isEqualTo("TER_GEN");
        assertThat(CorpusOuvrageSeedService.mapFamille("Maconnerie en elevation")).isEqualTo("MAC_ELEV");
        assertThat(CorpusOuvrageSeedService.mapFamille("g1")).isEqualTo("GO_G1");
    }

    @Test
    void loadAll_cree84OuvragesAvecTotaux() {
        when(repository.existsByTenantIdAndCode(any(), any())).thenReturn(false);
        when(repository.save(any(Ouvrage.class))).thenAnswer(inv -> {
            Ouvrage o = inv.getArgument(0);
            o.setId(UUID.randomUUID());
            assertThat(o.getSousTotalDebourse()).isNotNull();
            assertThat(o.getOrigine()).isEqualTo("CATALOGUE");
            assertThat(o.getCatalogCleStable()).startsWith("corpus:");
            return o;
        });

        int created = service.loadAll(TENANT);
        assertThat(created).isEqualTo(84);
    }

    @Test
    void seedCorpusIfAbsent_noopSiDejaCharge() {
        Ouvrage existing = Ouvrage.builder()
                .origine("CATALOGUE")
                .catalogCleStable("corpus:x:a")
                .build();
        when(repository.findByTenantIdOrderByCodeAsc(TENANT))
                .thenReturn(new ArrayList<>(java.util.List.of(existing)));

        assertThat(service.seedCorpusIfAbsent()).isZero();
    }
}
