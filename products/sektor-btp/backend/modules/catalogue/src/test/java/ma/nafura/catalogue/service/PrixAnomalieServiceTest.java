package ma.nafura.catalogue.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.domain.model.CatalogPrixReference;
import ma.nafura.catalogue.repository.CatalogPrixReferenceRepository;
import ma.nafura.catalogue.service.PrixAnomalieService.AnomaliePrix;
import ma.nafura.catalogue.service.port.TenantPrixHistoriquePort;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PrixAnomalieServiceTest {

    @Mock
    private CatalogPrixReferenceRepository prixRepository;

    @Mock
    private TenantPrixHistoriquePort tenantPrixHistorique;

    private PrixAnomalieService service;

    @BeforeEach
    void setUp() {
        service = new PrixAnomalieService(prixRepository, tenantPrixHistorique);
    }

    @Test
    void auDessusDe18pct_signaleAnormal() {
        when(prixRepository.findByCatalogArticleCleOrderByValidFromDesc("ciment"))
                .thenReturn(List.of(
                        ref("ciment", "100.0000"),
                        ref("ciment", "100.0000"),
                        ref("ciment", "100.0000")));

        Optional<AnomaliePrix> out = service.evaluer("ciment", new BigDecimal("125.00"));

        assertThat(out).isPresent();
        assertThat(out.get().anormal()).isTrue();
        assertThat(out.get().source()).isEqualTo("CATALOGUE");
        assertThat(out.get().ecartRelatif()).isGreaterThan(0.18);
    }

    @Test
    void dansNorme_pasAnormal() {
        when(prixRepository.findByCatalogArticleCleOrderByValidFromDesc("ciment"))
                .thenReturn(List.of(ref("ciment", "100.0000")));

        Optional<AnomaliePrix> out = service.evaluer("ciment", new BigDecimal("110.00"));

        assertThat(out).isPresent();
        assertThat(out.get().anormal()).isFalse();
    }

    @Test
    void tenantPrioritaire_surCatalogue() {
        UUID itemId = UUID.randomUUID();
        when(tenantPrixHistorique.moyenne6Mois(itemId)).thenReturn(Optional.of(new BigDecimal("100.0000")));

        Optional<AnomaliePrix> out =
                service.evaluer(itemId, "ciment", new BigDecimal("125.00"));

        assertThat(out).isPresent();
        assertThat(out.get().anormal()).isTrue();
        assertThat(out.get().source()).isEqualTo("TENANT");
    }

    private static CatalogPrixReference ref(String cle, String prix) {
        return CatalogPrixReference.builder()
                .id(UUID.randomUUID())
                .catalogArticleCle(cle)
                .prix(new BigDecimal(prix))
                .validFrom(LocalDate.now().minusMonths(1))
                .build();
    }
}
