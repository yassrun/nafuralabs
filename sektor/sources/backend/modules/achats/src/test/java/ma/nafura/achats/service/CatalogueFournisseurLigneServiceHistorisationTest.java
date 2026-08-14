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
import ma.nafura.item.repository.UnitOfMeasureRepository;
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

    @Mock
    private PrixNormaliseCatalogueService prixNormaliseCatalogueService;

    @Mock
    private UnitOfMeasureRepository uomRepository;

    private CatalogueFournisseurLigneService service;
    private UUID tenantId;
    private UUID currencyId;
    private UUID fournisseurId;
    private UUID articleId;

    @BeforeEach
    void setUp() {
        service = new CatalogueFournisseurLigneService(
                repository, currencyConversionService, prixNormaliseCatalogueService, uomRepository);
        tenantId = UUID.randomUUID();
        currencyId = UUID.randomUUID();
        fournisseurId = UUID.randomUUID();
        articleId = UUID.randomUUID();
        TenantContext.setTenantId(tenantId);
        TenantContext.setTenantEnabled(true);
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
                .fournisseurId(fournisseurId)
                .articleId(articleId)
                .designation("Ciment")
                .prixUnitaireHt(new BigDecimal("100"))
                .validFrom(LocalDate.of(2026, 1, 1))
                .validTo(null)
                .actif(true)
                .build();
        when(repository.findByTenantIdAndFournisseurIdAndArticleIdAndActifTrueAndValidToIsNull(
                        tenantId, fournisseurId, articleId))
                .thenReturn(Optional.of(previous));

        LocalDate from = LocalDate.of(2026, 6, 12);
        service.upsertHistorise(
                tenantId,
                fournisseurId,
                articleId,
                "Ciment",
                new BigDecimal("120"),
                null,
                null,
                null,
                null,
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
        verify(prixNormaliseCatalogueService).apply(created);
    }
}
