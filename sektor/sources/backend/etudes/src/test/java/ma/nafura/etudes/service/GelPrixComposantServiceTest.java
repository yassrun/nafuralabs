package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.api.request.PrixDpuUpdateDto;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.PrixDpu;
import ma.nafura.etudes.domain.model.StatutDossierEtude;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.DpgfRepository;
import ma.nafura.etudes.repository.DpuVersionRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.catalogue.api.CatalogLookupApi;
import ma.nafura.catalogue.api.CatalogPriceSnapshot;
import ma.nafura.catalogue.api.CatalogPriceSource;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class GelPrixComposantServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ITEM = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID SOURCE_REF = UUID.fromString("33333333-3333-3333-3333-333333333333");

    private CatalogLookupApi catalogLookupApi;
    private ParametresEtudeService parametres;
    private GelPrixComposantService gelPrix;
    private PrixDpuRepository repository;
    private DpgfNoeudRepository noeudRepository;
    private DossierEtudeRepository dossierEtudeRepository;
    private DpuService dpuService;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        catalogLookupApi = mock(CatalogLookupApi.class);
        parametres = mock(ParametresEtudeService.class);
        when(parametres.basePrixChiffrage()).thenReturn("MARCHE");
        when(parametres.fraisGenerauxPercentDefaut()).thenReturn(new BigDecimal("10"));
        when(parametres.margePercentDefaut()).thenReturn(new BigDecimal("17.5"));
        when(parametres.tvaTauxDefaut()).thenReturn(new BigDecimal("20"));
        gelPrix = new GelPrixComposantService(catalogLookupApi, parametres);

        repository = mock(PrixDpuRepository.class);
        noeudRepository = mock(DpgfNoeudRepository.class);
        dossierEtudeRepository = mock(DossierEtudeRepository.class);
        dpuService = new DpuService(
                repository,
                mock(DpuVersionRepository.class),
                mock(OuvrageRepository.class),
                noeudRepository,
                mock(DpgfRepository.class),
                mock(DpgfAgregationService.class),
                new DpuCalculator(),
                parametres,
                dossierEtudeRepository,
                mock(DossierIntervenantService.class),
                gelPrix,
                new OuvrageCompositeService(mock(OuvrageRepository.class), new DpuCalculator()),
                new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void item_sans_gel_recoit_prix_resolu_fige() {
        when(catalogLookupApi.resolvePurchasePrice(eq(ITEM), any()))
                .thenReturn(new CatalogPriceSnapshot(
                        new BigDecimal("1.20"),
                        CatalogPriceSource.CATALOGUE,
                        SOURCE_REF,
                        LocalDate.of(2026, 6, 12),
                        null,
                        "Catalogue Lafarge — 12/06/2026",
                        false));

        UUID dpuId = UUID.randomUUID();
        PrixDpu entity = PrixDpu.builder()
                .id(dpuId)
                .tenantId(TENANT)
                .fraisGenerauxPercent(new BigDecimal("10"))
                .margeBeneficiairePercent(new BigDecimal("5"))
                .tvaTaux(new BigDecimal("20"))
                .deboursSec(BigDecimal.ZERO)
                .prixVenteHt(BigDecimal.ZERO)
                .prixVenteTtc(BigDecimal.ZERO)
                .composants(new ArrayList<>())
                .build();
        when(repository.findByIdAndTenantId(dpuId, TENANT)).thenReturn(Optional.of(entity));
        when(repository.save(any(PrixDpu.class))).thenAnswer(inv -> inv.getArgument(0));

        ComposantDpuInputDto line = new ComposantDpuInputDto();
        line.setType(ComposantDpu.TYPE_MATIERE);
        line.setReferenceType("ITEM");
        line.setItemId(ITEM);
        line.setLibelle("Ciment CPJ");
        line.setRendement(new BigDecimal("10"));
        line.setUnite("kg");
        line.setPrixUnitaire(BigDecimal.ZERO);

        PrixDpuUpdateDto update = new PrixDpuUpdateDto();
        update.setComposants(List.of(line));

        PrixDpu saved = dpuService.update(dpuId, update);

        ComposantDpu c = saved.getComposants().get(0);
        assertThat(c.getPrixUnitaire()).isEqualByComparingTo("1.20");
        assertThat(c.getSourcePrix()).isEqualTo(CatalogPriceSource.CATALOGUE);
        assertThat(c.getPrixSourceRefId()).isEqualTo(SOURCE_REF);
        assertThat(c.getPrixDateSource()).isEqualTo(LocalDate.of(2026, 6, 12));
        assertThat(c.getPrixLibelleSource()).isEqualTo("Catalogue Lafarge — 12/06/2026");
    }

    @Test
    void gel_existant_n_est_pas_ecrase_sans_force() {
        when(catalogLookupApi.resolvePurchasePrice(eq(ITEM), any()))
                .thenReturn(new CatalogPriceSnapshot(
                        new BigDecimal("9.99"),
                        CatalogPriceSource.TARIF,
                        SOURCE_REF,
                        LocalDate.now(),
                        null,
                        "Nouveau tarif",
                        false));

        UUID dpuId = UUID.randomUUID();
        PrixDpu entity = PrixDpu.builder()
                .id(dpuId)
                .tenantId(TENANT)
                .fraisGenerauxPercent(BigDecimal.TEN)
                .margeBeneficiairePercent(BigDecimal.TEN)
                .tvaTaux(new BigDecimal("20"))
                .deboursSec(BigDecimal.ZERO)
                .prixVenteHt(BigDecimal.ZERO)
                .prixVenteTtc(BigDecimal.ZERO)
                .composants(new ArrayList<>())
                .build();
        when(repository.findByIdAndTenantId(dpuId, TENANT)).thenReturn(Optional.of(entity));
        when(repository.save(any(PrixDpu.class))).thenAnswer(inv -> inv.getArgument(0));

        ComposantDpuInputDto line = new ComposantDpuInputDto();
        line.setType(ComposantDpu.TYPE_MATIERE);
        line.setReferenceType("ITEM");
        line.setItemId(ITEM);
        line.setLibelle("Ciment");
        line.setRendement(BigDecimal.ONE);
        line.setUnite("t");
        line.setPrixUnitaire(new BigDecimal("1.20"));
        line.setSourcePrix(CatalogPriceSource.CATALOGUE);
        line.setPrixLibelleSource("Catalogue Lafarge — 12/06/2026");
        line.setPrixSourceRefId(SOURCE_REF);

        PrixDpuUpdateDto update = new PrixDpuUpdateDto();
        update.setComposants(List.of(line));
        PrixDpu saved = dpuService.update(dpuId, update);

        assertThat(saved.getComposants().get(0).getPrixUnitaire()).isEqualByComparingTo("1.20");
        assertThat(saved.getComposants().get(0).getPrixLibelleSource())
                .isEqualTo("Catalogue Lafarge — 12/06/2026");
        verify(catalogLookupApi, never()).resolvePurchasePrice(any(), any());
    }

    @Test
    void refresh_refuse_si_dossier_valide() {
        UUID dpuId = UUID.randomUUID();
        UUID noeudId = UUID.randomUUID();
        UUID dpgfId = UUID.randomUUID();
        UUID dossierId = UUID.randomUUID();

        PrixDpu entity = PrixDpu.builder()
                .id(dpuId)
                .tenantId(TENANT)
                .dpgfNoeudId(noeudId)
                .composants(new ArrayList<>())
                .fraisGenerauxPercent(BigDecimal.TEN)
                .margeBeneficiairePercent(BigDecimal.TEN)
                .tvaTaux(new BigDecimal("20"))
                .deboursSec(BigDecimal.ZERO)
                .prixVenteHt(BigDecimal.ZERO)
                .prixVenteTtc(BigDecimal.ZERO)
                .build();
        when(repository.findByIdAndTenantId(dpuId, TENANT)).thenReturn(Optional.of(entity));

        Dpgf dpgf = Dpgf.builder().id(dpgfId).tenantId(TENANT).build();
        DpgfNoeud noeud = DpgfNoeud.builder()
                .id(noeudId)
                .tenantId(TENANT)
                .type(DpgfNoeud.TYPE_ARTICLE)
                .dpgf(dpgf)
                .build();
        when(noeudRepository.findByIdAndTenantId(noeudId, TENANT)).thenReturn(Optional.of(noeud));

        DossierEtude dossier = DossierEtude.builder()
                .id(dossierId)
                .tenantId(TENANT)
                .numero("ET-1")
                .objet("x")
                .status(StatutDossierEtude.VALIDEE)
                .dpgfId(dpgfId)
                .build();
        when(dossierEtudeRepository.findByTenantIdAndDpgfId(TENANT, dpgfId))
                .thenReturn(Optional.of(dossier));
        when(dossierEtudeRepository.findByIdAndTenantId(dossierId, TENANT))
                .thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> dpuService.refreshPrices(dpuId))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.verrouille");
    }

    @Test
    void refresh_met_a_jour_gel_si_dossier_modifiable() {
        when(catalogLookupApi.resolvePurchasePrice(eq(ITEM), any()))
                .thenReturn(new CatalogPriceSnapshot(
                        new BigDecimal("2.50"),
                        CatalogPriceSource.CATALOGUE,
                        SOURCE_REF,
                        LocalDate.of(2026, 8, 1),
                        null,
                        "Catalogue Lafarge — 01/08/2026",
                        false));

        UUID dpuId = UUID.randomUUID();
        UUID noeudId = UUID.randomUUID();
        UUID dpgfId = UUID.randomUUID();
        UUID dossierId = UUID.randomUUID();

        ComposantDpu existing = ComposantDpu.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT)
                .type(ComposantDpu.TYPE_MATIERE)
                .referenceType("ITEM")
                .itemId(ITEM)
                .libelle("Ciment")
                .rendement(BigDecimal.TEN)
                .unite("kg")
                .prixUnitaire(new BigDecimal("1.20"))
                .total(new BigDecimal("12.00"))
                .sourcePrix(CatalogPriceSource.CATALOGUE)
                .prixSourceRefId(SOURCE_REF)
                .prixDateSource(LocalDate.of(2026, 6, 12))
                .prixLibelleSource("Catalogue Lafarge — 12/06/2026")
                .ordre(0)
                .build();

        PrixDpu entity = PrixDpu.builder()
                .id(dpuId)
                .tenantId(TENANT)
                .dpgfNoeudId(noeudId)
                .composants(new ArrayList<>(List.of(existing)))
                .fraisGenerauxPercent(BigDecimal.TEN)
                .margeBeneficiairePercent(BigDecimal.TEN)
                .tvaTaux(new BigDecimal("20"))
                .deboursSec(BigDecimal.ZERO)
                .prixVenteHt(BigDecimal.ZERO)
                .prixVenteTtc(BigDecimal.ZERO)
                .build();
        existing.setPrixDpu(entity);
        when(repository.findByIdAndTenantId(dpuId, TENANT)).thenReturn(Optional.of(entity));
        when(repository.save(any(PrixDpu.class))).thenAnswer(inv -> inv.getArgument(0));

        Dpgf dpgf = Dpgf.builder().id(dpgfId).tenantId(TENANT).build();
        DpgfNoeud noeud = DpgfNoeud.builder()
                .id(noeudId)
                .tenantId(TENANT)
                .type(DpgfNoeud.TYPE_ARTICLE)
                .dpgf(dpgf)
                .build();
        when(noeudRepository.findByIdAndTenantId(noeudId, TENANT)).thenReturn(Optional.of(noeud));

        DossierEtude dossier = DossierEtude.builder()
                .id(dossierId)
                .tenantId(TENANT)
                .numero("ET-2")
                .objet("x")
                .status(StatutDossierEtude.BROUILLON)
                .dpgfId(dpgfId)
                .build();
        when(dossierEtudeRepository.findByTenantIdAndDpgfId(TENANT, dpgfId))
                .thenReturn(Optional.of(dossier));
        when(dossierEtudeRepository.findByIdAndTenantId(dossierId, TENANT))
                .thenReturn(Optional.of(dossier));

        PrixDpu refreshed = dpuService.refreshPrices(dpuId);
        ComposantDpu c = refreshed.getComposants().get(0);
        assertThat(c.getPrixUnitaire()).isEqualByComparingTo("2.50");
        assertThat(c.getPrixLibelleSource()).isEqualTo("Catalogue Lafarge — 01/08/2026");
        assertThat(c.getPrixDateSource()).isEqualTo(LocalDate.of(2026, 8, 1));
    }
}
