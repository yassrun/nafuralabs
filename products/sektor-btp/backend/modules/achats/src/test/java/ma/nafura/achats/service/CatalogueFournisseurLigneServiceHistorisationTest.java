package ma.nafura.achats.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.CatalogueSource;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.achats.repository.CatalogueFournisseurLigneRepository;
import ma.nafura.currency.domain.model.Currency;
import ma.nafura.currency.service.CurrencyConversionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CatalogueFournisseurLigneServiceHistorisationTest {

    @Mock
    private CatalogueFournisseurLigneRepository repository;

    @Mock
    private CurrencyConversionService currencyConversionService;

    private CatalogueFournisseurLigneService service;
    private UUID tenantId;
    private UUID currencyId;

    @BeforeEach
    void setUp() {
        service = new CatalogueFournisseurLigneService(repository, currencyConversionService);
        tenantId = UUID.randomUUID();
        currencyId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
        TenantContext.setTenantEnabled(true);
        // lenient() : la devise pivot n'est résolue que lorsque l'appelant n'en fournit pas.
        lenient().when(currencyConversionService.findReferenceCurrency(tenantId))
                .thenReturn(Optional.of(Currency.builder().id(currencyId).code("MAD").build()));
        when(repository.save(any())).thenAnswer(inv -> {
            CatalogueFournisseurLigne e = inv.getArgument(0);
            if (e.getId() == null) {
                e.setId(UUID.randomUUID());
            }
            return e;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void upsertFermeLaLignePrecedente() {
        CatalogueFournisseurLigne previous = CatalogueFournisseurLigne.builder()
                .id(UUID.randomUUID())
                .tenantId(tenantId)
                .fournisseurId("F1")
                .articleId("A1")
                .designation("Ciment")
                .prixUnitaireHt(new BigDecimal("100"))
                .validFrom(LocalDate.of(2026, 1, 1))
                .validTo(null)
                .actif(true)
                .build();
        when(repository.findByTenantIdAndFournisseurIdAndArticleIdAndActifTrueAndValidToIsNull(
                        tenantId, "F1", "A1"))
                .thenReturn(Optional.of(previous));

        LocalDate from = LocalDate.of(2026, 6, 12);
        service.upsertHistorise(
                tenantId,
                "F1",
                "A1",
                "Ciment",
                new BigDecimal("120"),
                null,
                "T",
                currencyId,
                from,
                BigDecimal.ZERO,
                null,
                null,
                CatalogueSource.OFFRE_RETENUE,
                UUID.randomUUID(),
                null,
                true);

        assertEquals(from.minusDays(1), previous.getValidTo());
        ArgumentCaptor<CatalogueFournisseurLigne> captor = ArgumentCaptor.forClass(CatalogueFournisseurLigne.class);
        verify(repository, atLeast(2)).save(captor.capture());
        CatalogueFournisseurLigne created = captor.getAllValues().stream()
                .filter(l -> l.getValidTo() == null && new BigDecimal("120").compareTo(l.getPrixUnitaireHt()) == 0)
                .findFirst()
                .orElseThrow();
        assertEquals(CatalogueSource.OFFRE_RETENUE, created.getSource());
        assertEquals(from, created.getValidFrom());
    }
}
