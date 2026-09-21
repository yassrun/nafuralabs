package ma.nafura.etudes.print;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.time.LocalDate;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dpgf.Dpgf;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.planning.DossierPlanningActivite;
import ma.nafura.etudes.domain.planning.DossierPlanningRessource;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.service.DevisService;
import ma.nafura.etudes.service.DossierEtudeService;
import ma.nafura.etudes.service.DossierPlanningService;
import ma.nafura.etudes.service.DpgfService;
import ma.nafura.platform.collaboration.docmanager.config.ThymeleafTemplateConfig;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.core.io.ClassPathResource;
import org.thymeleaf.context.Context;

@ExtendWith(MockitoExtension.class)
class EtudesPrintTemplatesTest {

    static final UUID TENANT_ID = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    static final UUID DOSSIER_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    static final UUID DPGF_ID = UUID.fromString("44444444-4444-4444-4444-444444444444");

    @Mock
    private DevisService devisService;

    @Mock
    private DossierEtudeService dossierEtudeService;

    @Mock
    private DossierEtudeRepository dossierRepository;

    @Mock
    private DpgfService dpgfService;

    @Mock
    private DossierPlanningService planningService;

    private EtudesEntityDataProvider provider;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        provider = new EtudesEntityDataProvider(
                devisService, dossierEtudeService, dossierRepository, dpgfService, planningService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void bdpChiffreExposeHtEtTtc() throws Exception {
        DossierEtude dossier = DossierEtude.builder()
                .id(DOSSIER_ID)
                .numero("ETU-2026-001")
                .objet("Réhabilitation R+2")
                .clientNom("Client Exemple SA")
                .dpgfId(DPGF_ID)
                .bordereauRevision(1)
                .build();
        when(dossierRepository.findByIdAndTenantId(DOSSIER_ID, TENANT_ID)).thenReturn(Optional.of(dossier));

        DpgfNoeud article = DpgfNoeud.builder()
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code("01.01")
                .libelle("Béton armé")
                .unite("m³")
                .quantite(new BigDecimal("10"))
                .prixUnitaire(new BigDecimal("5000"))
                .total(new BigDecimal("50000"))
                .enfants(List.of())
                .build();
        DpgfNoeud lot = DpgfNoeud.builder()
                .type(DpgfNoeud.TYPE_LOT)
                .code("01")
                .libelle("Lot gros œuvre")
                .total(new BigDecimal("50000"))
                .enfants(List.of(article))
                .build();
        Dpgf dpgf = Dpgf.builder()
                .id(DPGF_ID)
                .numero("DPGF-1")
                .tvaTaux(new BigDecimal("20"))
                .totalHt(new BigDecimal("50000"))
                .totalTva(new BigDecimal("10000"))
                .totalTtc(new BigDecimal("60000"))
                .build();
        dpgf.setHierarchie(List.of(lot));
        when(dpgfService.getById(DPGF_ID)).thenReturn(dpgf);

        Map<String, Object> entity = provider.getEntityData(EtudesPrintEntityTypes.DOSSIER_BORDEREAU, DOSSIER_ID);
        @SuppressWarnings("unchecked")
        List<Map<String, Object>> lignes = (List<Map<String, Object>>) entity.get("lignes");
        assertThat(lignes).hasSize(2);
        assertThat(lignes.get(1).get("prixUnitaireHt")).isEqualTo(new BigDecimal("5000"));
        assertThat((BigDecimal) lignes.get(1).get("prixUnitaireTtc")).isEqualByComparingTo("6000.00");
        assertThat((BigDecimal) lignes.get(1).get("totalTtc")).isEqualByComparingTo("60000.00");
        assertThat(entity.get("totalTtcEnLettres")).asString().contains("dirham");

        String html = render("print-templates/dossier-bordereau-a4.html", entity);
        assertThat(html).contains("BDP chiffré");
        assertThat(html).contains("PU HT");
        assertThat(html).contains("PU TTC");
        assertThat(html).contains("Total TTC");
        assertThat(html).contains("ETU-2026-001");
        assertThat(html).contains("Béton armé");
    }

    @Test
    void planningEtRessourcesRendentLesListes() throws Exception {
        DossierEtude dossier = DossierEtude.builder()
                .id(DOSSIER_ID)
                .numero("ETU-2026-001")
                .objet("Réhabilitation R+2")
                .clientNom("Client Exemple SA")
                .build();
        when(dossierRepository.findByIdAndTenantId(DOSSIER_ID, TENANT_ID)).thenReturn(Optional.of(dossier));
        when(planningService.listerActivites(DOSSIER_ID))
                .thenReturn(List.of(DossierPlanningActivite.builder()
                        .libelle("Installation de chantier")
                        .lotLibelle(null)
                        .dateDebut(LocalDate.of(2026, 10, 1))
                        .dateFin(LocalDate.of(2026, 10, 8))
                        .build()));
        when(planningService.listerRessources(DOSSIER_ID))
                .thenReturn(List.of(
                        DossierPlanningRessource.builder()
                                .type(DossierPlanningRessource.TYPE_HUMAIN)
                                .libelle("Ingénieur")
                                .quantite(new BigDecimal("1"))
                                .unite("u")
                                .build(),
                        DossierPlanningRessource.builder()
                                .type(DossierPlanningRessource.TYPE_MATERIEL)
                                .libelle("Grue à tour")
                                .quantite(new BigDecimal("1"))
                                .unite("u")
                                .build()));

        Map<String, Object> planning = provider.getEntityData(EtudesPrintEntityTypes.DOSSIER_PLANNING, DOSSIER_ID);
        assertThat(planning.get("dureeJours")).isEqualTo(8L);
        String planningHtml = render("print-templates/dossier-planning-a4.html", planning);
        assertThat(planningHtml).contains("Planning prévisionnel");
        assertThat(planningHtml).contains("Installation de chantier");
        assertThat(planningHtml).contains("01/10/2026");

        Map<String, Object> ressources =
                provider.getEntityData(EtudesPrintEntityTypes.DOSSIER_RESSOURCES, DOSSIER_ID);
        String ressourcesHtml = render("print-templates/dossier-ressources-a4.html", ressources);
        assertThat(ressourcesHtml).contains("Ressources prévues");
        assertThat(ressourcesHtml).contains("Ingénieur");
        assertThat(ressourcesHtml).contains("Grue à tour");
    }

    @Test
    void echantillonsAdminSeRendent() throws Exception {
        assertThat(render(
                        "print-templates/dossier-bordereau-a4.html",
                        provider.getSampleEntityData(EtudesPrintEntityTypes.DOSSIER_BORDEREAU)))
                .contains("BDP chiffré")
                .contains("6 000,00");
        assertThat(render(
                        "print-templates/dossier-planning-a4.html",
                        provider.getSampleEntityData(EtudesPrintEntityTypes.DOSSIER_PLANNING)))
                .contains("Gros œuvre RDC");
        assertThat(render(
                        "print-templates/dossier-ressources-a4.html",
                        provider.getSampleEntityData(EtudesPrintEntityTypes.DOSSIER_RESSOURCES)))
                .contains("Technicien");
    }

    private static String render(String path, Map<String, Object> entity) throws Exception {
        String template = new String(
                new ClassPathResource(path).getInputStream().readAllBytes(), StandardCharsets.UTF_8);
        Context ctx = new Context(Locale.FRANCE);
        ctx.setVariable("entity", entity);
        ctx.setVariable("tenant", Map.of("name", "Nafura"));
        ctx.setVariable("fragments", Map.of("HEADER_DEFAULT", "", "FOOTER_DEFAULT", ""));
        return new ThymeleafTemplateConfig().stringTemplateEngine().process(template, ctx);
    }
}
