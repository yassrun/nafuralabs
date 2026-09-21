package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.api.CatalogCandidate;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.CatalogPriceHistoryEntry;
import ma.nafura.etudes.api.dto.HistoriquePrixComposantDto;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class HistoriquePrixComposantServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DOSSIER = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID ITEM = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    private DossierEtudeRepository dossierRepository;
    private CatalogLookupApi catalogLookupApi;
    private HistoriquePrixComposantService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        dossierRepository = mock(DossierEtudeRepository.class);
        catalogLookupApi = mock(CatalogLookupApi.class);
        service = new HistoriquePrixComposantService(dossierRepository, catalogLookupApi);
        when(dossierRepository.findByIdAndTenantId(DOSSIER, TENANT))
                .thenReturn(Optional.of(DossierEtude.builder().id(DOSSIER).tenantId(TENANT).build()));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void achatAvantConsultation() {
        when(catalogLookupApi.getItem(ITEM)).thenReturn(Optional.of(item()));
        when(catalogLookupApi.listPurchasePriceHistory(eq(ITEM), any()))
                .thenReturn(List.of(
                        entry(
                                CatalogPriceHistoryEntry.KIND_CONSULTATION,
                                CatalogPriceHistoryEntry.DETAIL_DEVIS,
                                "CONSULTE",
                                "790",
                                "Sika"),
                        entry(
                                CatalogPriceHistoryEntry.KIND_ACHATS,
                                CatalogPriceHistoryEntry.DETAIL_FACTURE,
                                "HISTORIQUE",
                                "820",
                                "Lafarge")));

        HistoriquePrixComposantDto dto = service.historique(DOSSIER, ITEM, null, "MATIERE");

        assertThat(dto.item().itemId()).isEqualTo(ITEM.toString());
        assertThat(dto.lignes()).hasSize(2);
        assertThat(dto.lignes().get(0).kind()).isEqualTo(CatalogPriceHistoryEntry.KIND_ACHATS);
        assertThat(dto.lignes().get(0).prixUnitaire()).isEqualByComparingTo("820");
        assertThat(dto.lignes().get(1).kind()).isEqualTo(CatalogPriceHistoryEntry.KIND_CONSULTATION);
    }

    @Test
    void designationLieeSiScoreHaut() {
        when(catalogLookupApi.lookup("Béton B20", "MATIERE", 8))
                .thenReturn(List.of(new CatalogCandidate(
                        ITEM.toString(), "ART-BETON-B20", "Béton B20", "M3", "MATIERE", 1.0)));
        when(catalogLookupApi.getItem(ITEM)).thenReturn(Optional.of(item()));
        when(catalogLookupApi.listPurchasePriceHistory(eq(ITEM), any())).thenReturn(List.of());

        HistoriquePrixComposantDto dto = service.historique(DOSSIER, null, "Béton B20", "MATIERE");

        assertThat(dto.item().name()).isEqualTo("Béton B20");
        assertThat(dto.lignes()).isEmpty();
    }

    private static CatalogItemSnapshot item() {
        return new CatalogItemSnapshot(
                ITEM.toString(), "ART-BETON-B20", "Béton B20", "M3", "MATIERE", "beton-b20");
    }

    private static CatalogPriceHistoryEntry entry(
            String kind, String detail, String source, String pu, String supplier) {
        return new CatalogPriceHistoryEntry(
                kind,
                detail,
                source,
                new BigDecimal(pu),
                LocalDate.of(2026, 3, 12),
                UUID.randomUUID(),
                source + " · " + supplier,
                supplier,
                false);
    }
}
