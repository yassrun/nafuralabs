package ma.nafura.etudes.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.CatalogCandidateDto;
import ma.nafura.etudes.api.dto.DecompositionProposeDto;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.cps.CpsService;
import ma.nafura.etudes.service.port.CatalogResolverPort;
import ma.nafura.etudes.service.port.DecompositionNeedsPort;
import ma.nafura.etudes.service.port.DecompositionNeedsPort.BesoinComposant;
import ma.nafura.item.domain.SourcePrix;
import ma.nafura.item.service.prix.PrixResolu;
import ma.nafura.item.service.prix.ResolutionPrixService;
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
    @Mock private CatalogResolverPort catalogResolver;
    @Mock private ResolutionPrixService resolutionPrixService;

    private DecompositionProposeService service;
    private final UUID tenantId = UUID.randomUUID();
    private final UUID articleId = UUID.randomUUID();
    private final UUID dossierId = UUID.randomUUID();
    private final UUID itemId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new DecompositionProposeService(
                noeudRepository, cpsService, needsPort, catalogResolver, resolutionPrixService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void separeMatchedEtMissingSelonCatalogueEtPrix() {
        DpgfNoeud article = DpgfNoeud.builder()
                .id(articleId)
                .type("ARTICLE")
                .code("1-1-3")
                .libelle("BETON ARME")
                .unite("M3")
                .build();
        when(needsPort.isAvailable()).thenReturn(true);
        when(noeudRepository.findByIdAndTenantId(articleId, tenantId)).thenReturn(Optional.of(article));
        when(needsPort.extract(eq(article), any())).thenReturn(List.of(
                new BesoinComposant("Beton B35", "MATIERE", "M3", 1.0, 0.9),
                new BesoinComposant("Coffrage special XY", "MATIERE", "M2", 2.0, 0.7)));
        when(catalogResolver.resolve(eq("Beton B35"), eq("MATIERE"), anyInt()))
                .thenReturn(List.of(CatalogCandidateDto.builder()
                        .itemId(itemId.toString())
                        .code("BET-B35")
                        .name("Beton B35")
                        .nature("MATIERE")
                        .score(0.9)
                        .build()));
        when(catalogResolver.resolve(eq("Coffrage special XY"), eq("MATIERE"), anyInt()))
                .thenReturn(List.of());
        when(resolutionPrixService.resoudrePrixAchat(eq(itemId), any()))
                .thenReturn(new PrixResolu(
                        BigDecimal.valueOf(850),
                        SourcePrix.TARIF,
                        null,
                        null,
                        null,
                        "Tarif standard",
                        false));

        Optional<DecompositionProposeDto> result = service.proposer(dossierId, articleId, null);

        assertTrue(result.isPresent());
        assertEquals(1, result.get().matched().size());
        assertEquals(itemId.toString(), result.get().matched().get(0).itemId());
        assertEquals(1, result.get().missing().size());
        assertEquals("Coffrage special XY", result.get().missing().get(0).designation());
    }

    @Test
    void retourneVideSiPortIndisponible() {
        when(needsPort.isAvailable()).thenReturn(false);
        assertTrue(service.proposer(dossierId, articleId, null).isEmpty());
    }
}
