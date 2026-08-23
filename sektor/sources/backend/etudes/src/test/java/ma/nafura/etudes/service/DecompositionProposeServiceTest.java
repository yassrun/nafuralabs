package ma.nafura.etudes.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.api.CatalogItemSnapshot;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.CatalogPriceSnapshot;
import ma.nafura.catalogue.api.CatalogPriceSource;
import ma.nafura.catalogue.api.IdentiteClasse;
import ma.nafura.etudes.api.dto.DecompositionProposeDto;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.cps.CpsService;
import ma.nafura.etudes.service.port.capability.DecompositionNeedsPort;
import ma.nafura.etudes.service.port.capability.DecompositionNeedsPort.BesoinComposant;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DecompositionProposeServiceTest {

    @Mock private DpgfNoeudRepository noeudRepository;
    @Mock private CpsService cpsService;
    @Mock private DecompositionNeedsPort needsPort;
    @Mock private CatalogLookupApi catalogLookupApi;

    private DecompositionProposeService service;
    private final UUID tenantId = UUID.randomUUID();
    private final UUID articleId = UUID.randomUUID();
    private final UUID dossierId = UUID.randomUUID();
    private final UUID itemId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new DecompositionProposeService(noeudRepository, cpsService, needsPort, catalogLookupApi);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void separeDeuxSeaux_dejaTenantSansCreation_aCreerSansEcrire() {
        DpgfNoeud article = article();
        when(needsPort.isAvailable()).thenReturn(true);
        when(noeudRepository.findByIdAndTenantId(articleId, tenantId)).thenReturn(Optional.of(article));
        when(needsPort.extract(eq(article), any())).thenReturn(List.of(
                new BesoinComposant("Beton B35", "MATIERE", "M3", 1.0, 0.9),
                new BesoinComposant("Coffrage special XY", "MATIERE", "M2", 2.0, 0.7)));
        when(catalogLookupApi.classerIdentite("Beton B35", "MATIERE"))
                .thenReturn(IdentiteClasse.dejaTenant(
                        "beton-b35", "Béton B35", itemId.toString(), null));
        when(catalogLookupApi.classerIdentite("Coffrage special XY", "MATIERE"))
                .thenReturn(IdentiteClasse.aCreer(null, "Coffrage special XY", null));
        when(catalogLookupApi.getItem(itemId))
                .thenReturn(Optional.of(new CatalogItemSnapshot(
                        itemId.toString(), "BET-B35", "Beton B35", "M3", "MATIERE", "beton-b35")));
        when(catalogLookupApi.resolvePurchasePrice(eq(itemId), any()))
                .thenReturn(new CatalogPriceSnapshot(
                        BigDecimal.valueOf(850),
                        CatalogPriceSource.TARIF,
                        null,
                        null,
                        null,
                        "Tarif standard",
                        false));

        Optional<DecompositionProposeDto> result = service.proposer(dossierId, articleId, null);

        assertTrue(result.isPresent());
        assertEquals(1, result.get().matched().size());
        assertEquals(itemId.toString(), result.get().matched().get(0).itemId());
        assertEquals("beton-b35", result.get().matched().get(0).cleStable());
        assertEquals(1, result.get().missing().size());
        assertEquals("Coffrage special XY", result.get().missing().get(0).designation());
        assertEquals("a_creer", result.get().missing().get(0).raison());
        assertTrue(result.get().uncertain() == null || result.get().uncertain().isEmpty());
        verify(catalogLookupApi, never()).createAllege(any(), any(), any());
    }

    @Test
    void dejaTenant_memeSansPrixConsultable() {
        DpgfNoeud article = article();
        when(needsPort.isAvailable()).thenReturn(true);
        when(noeudRepository.findByIdAndTenantId(articleId, tenantId)).thenReturn(Optional.of(article));
        when(needsPort.extract(eq(article), any()))
                .thenReturn(List.of(new BesoinComposant("Beton B35", "MATIERE", "M3", 1.0, 0.9)));
        when(catalogLookupApi.classerIdentite("Beton B35", "MATIERE"))
                .thenReturn(IdentiteClasse.dejaTenant("beton-b35", "Béton B35", itemId.toString(), null));
        when(catalogLookupApi.getItem(itemId))
                .thenReturn(Optional.of(new CatalogItemSnapshot(
                        itemId.toString(), "BET-B35", "Beton B35", "M3", "MATIERE", "beton-b35")));
        when(catalogLookupApi.resolvePurchasePrice(eq(itemId), any())).thenReturn(null);

        Optional<DecompositionProposeDto> result = service.proposer(dossierId, articleId, null);

        assertTrue(result.isPresent());
        assertEquals(1, result.get().matched().size());
        assertNull(result.get().matched().get(0).prixUnitaire());
        assertTrue(result.get().missing().isEmpty());
    }

    @Test
    void incertain_niLienNiCreation() {
        DpgfNoeud article = article();
        when(needsPort.isAvailable()).thenReturn(true);
        when(noeudRepository.findByIdAndTenantId(articleId, tenantId)).thenReturn(Optional.of(article));
        when(needsPort.extract(eq(article), any()))
                .thenReturn(List.of(new BesoinComposant("produit ambigu", "MATIERE", "U", 1.0, 0.5)));
        when(catalogLookupApi.classerIdentite("produit ambigu", "MATIERE"))
                .thenReturn(IdentiteClasse.incertain(List.of("peinture-acrylique-interieure", "ciment-cpj-45")));

        Optional<DecompositionProposeDto> result = service.proposer(dossierId, articleId, null);

        assertTrue(result.isPresent());
        assertTrue(result.get().matched().isEmpty());
        assertTrue(result.get().missing().isEmpty());
        assertEquals(1, result.get().uncertain().size());
        assertEquals(List.of("peinture-acrylique-interieure", "ciment-cpj-45"),
                result.get().uncertain().get(0).identitesCandidates());
        verify(catalogLookupApi, never()).createAllege(any(), any(), any());
        verify(catalogLookupApi, never()).getItem(any());
    }

    @Test
    void retourneVideSiPortIndisponible() {
        when(needsPort.isAvailable()).thenReturn(false);
        assertTrue(service.proposer(dossierId, articleId, null).isEmpty());
    }

    private DpgfNoeud article() {
        return DpgfNoeud.builder()
                .id(articleId)
                .type("ARTICLE")
                .code("1-1-3")
                .libelle("BETON ARME")
                .unite("M3")
                .build();
    }
}
