package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.math.BigDecimal;
import java.util.List;
import java.util.UUID;
import ma.nafura.etudes.api.dto.completude.CompletudeCompteursDto;
import ma.nafura.etudes.api.dto.completude.CompletudeEtude;
import ma.nafura.etudes.api.dto.completude.SeveriteControle;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dpu.OrigineCout;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.Mockito.when;

/** SEKTOR-211 — garde-fous complétude avant gain (AC-1 à AC-4). */
@ExtendWith(MockitoExtension.class)
class CompletudeEtudeServiceTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOSSIER_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID DPGF_ID = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @Mock
    private DossierEtudeRepository dossierRepository;

    @Mock
    private DpgfNoeudRepository noeudRepository;

    @Mock
    private PrixDpuRepository prixDpuRepository;

    @Mock
    private DecisionCatalogueService decisionCatalogueService;

    private CompletudeEtudeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        var syntheseCout = new SyntheseCoutAffaireService(dossierRepository, noeudRepository);
        var debourse = new DebourseDuNoeudService(prixDpuRepository);
        service = new CompletudeEtudeService(
                dossierRepository, noeudRepository, syntheseCout, debourse, prixDpuRepository, decisionCatalogueService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void troisPostes100PourCentEstime_produitEtu130Bloquant() {
        DossierEtude dossier = dossier();
        List<DpgfNoeud> noeuds = List.of(
                article("1.1", OrigineCout.ESTIME.name(), new BigDecimal("100"), new BigDecimal("10000")),
                article("1.2", OrigineCout.ESTIME.name(), new BigDecimal("200"), new BigDecimal("15000")),
                article("1.3", OrigineCout.ESTIME.name(), new BigDecimal("80"), new BigDecimal("8000")));

        when(dossierRepository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(java.util.Optional.of(dossier));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT)).thenReturn(noeuds);
        when(decisionCatalogueService.compterLibresSansDecision(dossier)).thenReturn(0L);

        CompletudeEtude completude = service.evaluer(DOSSIER_ID);

        assertThat(completude.getControles()).hasSize(1);
        assertThat(completude.getControles().get(0).getCode()).isEqualTo(CompletudeEtudeService.ETU_130);
        assertThat(completude.getControles().get(0).getSeverite()).isEqualTo(SeveriteControle.BLOCKING);
        assertThat(completude.getCompteurs().getBloquants()).isEqualTo(1);
        assertThat(service.anomaliesAffichees(completude)).isEqualTo(1);
    }

    @Test
    void coutPartiellementEstime_produitEtu120Warning() {
        DossierEtude dossier = dossier();
        List<DpgfNoeud> noeuds = List.of(
                article("1.1", OrigineCout.FORFAIT.name(), new BigDecimal("500"), new BigDecimal("600")),
                article("1.2", OrigineCout.ESTIME.name(), BigDecimal.ZERO, new BigDecimal("400")));

        when(dossierRepository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(java.util.Optional.of(dossier));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT)).thenReturn(noeuds);
        when(decisionCatalogueService.compterLibresSansDecision(dossier)).thenReturn(0L);

        CompletudeEtude completude = service.evaluer(DOSSIER_ID);

        assertThat(completude.getControles()).hasSize(1);
        assertThat(completude.getControles().get(0).getCode()).isEqualTo(CompletudeEtudeService.ETU_120);
        assertThat(completude.getControles().get(0).getSeverite()).isEqualTo(SeveriteControle.WARNING);
        assertThat(completude.getCompteurs().getWarnings()).isEqualTo(1);
        assertThat(service.anomaliesAffichees(completude)).isEqualTo(1);
    }

    @Test
    void zeroComposant_afficheAucunComposant() {
        DossierEtude dossier = dossier();
        List<DpgfNoeud> noeuds = List.of(
                article("1.1", OrigineCout.FORFAIT.name(), new BigDecimal("500"), new BigDecimal("600")));

        when(dossierRepository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(java.util.Optional.of(dossier));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT)).thenReturn(noeuds);
        when(decisionCatalogueService.compterLibresSansDecision(dossier)).thenReturn(0L);

        CompletudeEtude completude = service.evaluer(DOSSIER_ID);

        assertThat(completude.getQualiteChiffrage().getComposantsTotal()).isZero();
        assertThat(completude.getQualiteChiffrage().getRatioComposantsAffichage())
                .isEqualTo("aucun composant");
    }

    @Test
    void libresSansDecision_produitEtu131Warning() {
        DossierEtude dossier = dossier();
        List<DpgfNoeud> noeuds = List.of(
                article("1.1", OrigineCout.FORFAIT.name(), new BigDecimal("500"), new BigDecimal("600")));

        when(dossierRepository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(java.util.Optional.of(dossier));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT)).thenReturn(noeuds);
        when(decisionCatalogueService.compterLibresSansDecision(dossier)).thenReturn(2L);

        CompletudeEtude completude = service.evaluer(DOSSIER_ID);

        assertThat(completude.getControles()).anyMatch(c -> CompletudeEtudeService.ETU_131.equals(c.getCode())
                && c.getSeverite() == SeveriteControle.WARNING);
    }

    private static DossierEtude dossier() {
        DossierEtude d = new DossierEtude();
        d.setId(DOSSIER_ID);
        d.setDpgfId(DPGF_ID);
        d.setStatus(StatutDossierEtude.DEVIS_GENERE);
        d.setCurrentStep(DossierEtude.ETAPE_CHIFFRAGE);
        return d;
    }

    private static DpgfNoeud article(String code, String origine, BigDecimal cout, BigDecimal prix) {
        DpgfNoeud n = new DpgfNoeud();
        n.setId(UUID.randomUUID());
        n.setType(DpgfNoeud.TYPE_ARTICLE);
        n.setCode(code);
        n.setOrigineCout(origine);
        n.setCoutUnitaire(cout);
        n.setPrixUnitaire(prix);
        n.setQuantite(BigDecimal.ONE);
        n.setFraisGenerauxPercent(new BigDecimal("5"));
        n.setMargePercent(new BigDecimal("10"));
        if (prix != null) {
            n.setTotal(prix);
        }
        return n;
    }
}
