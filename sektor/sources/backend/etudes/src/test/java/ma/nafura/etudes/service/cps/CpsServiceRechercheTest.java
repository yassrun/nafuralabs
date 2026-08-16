package ma.nafura.etudes.service.cps;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.domain.cps.CpsSection;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.repository.CpsDocumentRepository;
import ma.nafura.etudes.repository.CpsSectionRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.service.port.capability.DescriptifCpsPort;
import ma.nafura.etudes.service.port.capability.MarcheProposePort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class CpsServiceRechercheTest {

    private static final UUID TENANT = UUID.fromString("a5e802e9-abd4-47db-9242-8c4942a3d3db");
    private static final UUID CPS = UUID.fromString("b22cb7fa-2493-43af-bb95-f506002a866c");

    @Mock private DossierDocumentRepository dossierDocumentRepository;
    @Mock private CpsDocumentRepository cpsDocumentRepository;
    @Mock private CpsSectionRepository sectionRepository;
    @Mock private ExtracteurTextePdf extracteur;
    @Mock private CpsSectionneur sectionneur;
    @Mock private DescriptifCpsPort descriptifPort;
    @Mock private MarcheProposePort marcheProposePort;

    private CpsService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new CpsService(
                dossierDocumentRepository,
                cpsDocumentRepository,
                sectionRepository,
                extracteur,
                sectionneur,
                descriptifPort,
                marcheProposePort);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void retrouveLaSectionParNumeroMemeSiLeLibelleBdpEstTropPrecis() {
        DpgfNoeud article = DpgfNoeud.builder()
                .code("6.1.3")
                .libelle("REVETEMENT DE SOL EN CARREAUX GRES CERAME ANTIDERAPENT D'IMPORTATION DE 20X20 Y COMPRIS PLINTHES DE 7 CM")
                .build();
        CpsSection section = CpsSection.builder()
                .id(UUID.randomUUID())
                .numero("6.1.3")
                .titre("REVETEMENT DE SOL EN CARREAUX GRES CERAME ANTI-DERAPANT")
                .contenu("Prescriptions techniques du carrelage.")
                .build();
        when(sectionRepository.countByTenantIdAndCpsDocumentId(TENANT, CPS)).thenReturn(1L);
        when(sectionRepository.trouverParNumero(eq(TENANT), eq(CPS), eq("6.1.3"), eq(4)))
                .thenReturn(List.of(section));

        List<CpsSection> hits = service.rechercherPourArticle(CPS, article, 4);

        assertEquals(1, hits.size());
        assertEquals("6.1.3", hits.get(0).getNumero());
        verify(sectionRepository, never()).rechercherTsQuery(eq(TENANT), eq(CPS), org.mockito.ArgumentMatchers.anyString(), anyInt());
    }
}
