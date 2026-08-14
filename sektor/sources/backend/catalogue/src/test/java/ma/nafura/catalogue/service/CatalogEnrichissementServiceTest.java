package ma.nafura.catalogue.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.util.List;
import java.util.UUID;
import ma.nafura.catalogue.domain.edition.CatalogCandidat;
import ma.nafura.catalogue.domain.edition.CatalogCandidatSignal;
import ma.nafura.catalogue.repository.CatalogCandidatRepository;
import ma.nafura.catalogue.repository.CatalogCandidatSignalRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CatalogEnrichissementServiceTest {

    @Mock
    private CatalogCandidatRepository candidatRepository;

    @Mock
    private CatalogCandidatSignalRepository signalRepository;

    private CatalogEnrichissementService service;
    private final UUID tenant = UUID.fromString("aaaaaaaa-bbbb-cccc-dddd-eeeeeeeeeeee");

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenant);
        service = new CatalogEnrichissementService(candidatRepository, signalRepository, new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void contribuer_creeCandidat_anonymiseExemples() {
        when(candidatRepository.findByStatutOrderByNbTenantsConfirmantsDescCreatedAtAsc("PROPOSE"))
                .thenReturn(List.of());
        when(candidatRepository.save(any())).thenAnswer(inv -> {
            CatalogCandidat c = inv.getArgument(0);
            if (c.getId() == null) {
                c.setId(UUID.randomUUID());
            }
            return c;
        });
        when(signalRepository.existsByCandidatIdAndTenantHash(any(), any())).thenReturn(false);
        when(signalRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(signalRepository.countByCandidatId(any())).thenReturn(1L);

        CatalogCandidat out = service.contribuer(
                "Peinture blanche contact@acme.ma +212612345678", "MATIERE", "L", "ARTICLE", "REGLE");

        assertThat(out.getStatut()).isEqualTo("PROPOSE");
        assertThat(out.getLibellePropose()).doesNotContain("@").doesNotContain("212");
        assertThat(out.getExemplesLibelles()).doesNotContain("@").doesNotContain("212");
        assertThat(out.getNbTenantsConfirmants()).isEqualTo(1);
        assertThat(out.getModelVersion()).isEqualTo(CatalogEnrichissementService.MODEL_VERSION);
    }

    @Test
    void secondSignalMemeTenant_pasDeDoubleComptage() {
        UUID id = UUID.randomUUID();
        CatalogCandidat existing = CatalogCandidat.builder()
                .id(id)
                .libellePropose("peinture blanche")
                .typeObjet("ARTICLE")
                .nbTenantsConfirmants(1)
                .exemplesLibelles("[\"peinture blanche\"]")
                .statut("PROPOSE")
                .build();
        when(candidatRepository.findByStatutOrderByNbTenantsConfirmantsDescCreatedAtAsc("PROPOSE"))
                .thenReturn(List.of(existing));
        when(signalRepository.existsByCandidatIdAndTenantHash(any(), any())).thenReturn(true);

        CatalogCandidat out = service.contribuer("peinture blanche", "MATIERE", "L", "ARTICLE", "REGLE");

        assertThat(out.getId()).isEqualTo(id);
        verify(signalRepository, never()).save(any(CatalogCandidatSignal.class));
    }
}
