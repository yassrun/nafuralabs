package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.ComposantDpuInputDto;
import ma.nafura.etudes.api.request.PrixDpuCreateDto;
import ma.nafura.etudes.api.request.PrixDpuUpdateDto;
import ma.nafura.etudes.domain.model.ComposantDpu;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.PrixDpu;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.repository.DpgfRepository;
import ma.nafura.etudes.repository.DpuVersionRepository;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.etudes.repository.PrixDpuRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class DpuServiceForNoeudTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private PrixDpuRepository repository;
    private DpgfNoeudRepository noeudRepository;
    private DpgfRepository dpgfRepository;
    private DpgfAgregationService agregationService;
    private ParametresEtudeService parametres;
    private DpuService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        repository = mock(PrixDpuRepository.class);
        noeudRepository = mock(DpgfNoeudRepository.class);
        dpgfRepository = mock(DpgfRepository.class);
        agregationService = mock(DpgfAgregationService.class);
        parametres = mock(ParametresEtudeService.class);
        when(parametres.fraisGenerauxPercentDefaut()).thenReturn(new BigDecimal("10"));
        when(parametres.margePercentDefaut()).thenReturn(new BigDecimal("17.5"));
        when(parametres.tvaTauxDefaut()).thenReturn(new BigDecimal("20"));

        service = new DpuService(
                repository,
                mock(DpuVersionRepository.class),
                mock(OuvrageRepository.class),
                noeudRepository,
                dpgfRepository,
                agregationService,
                new DpuCalculator(),
                parametres,
                mock(ma.nafura.etudes.repository.DossierEtudeRepository.class),
                mock(DossierIntervenantService.class),
                mock(GelPrixComposantService.class),
                new OuvrageCompositeService(mock(OuvrageRepository.class), new DpuCalculator()),
                new ObjectMapper());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createForNoeud_rejectsNonArticle() {
        UUID noeudId = UUID.randomUUID();
        when(noeudRepository.findByIdAndTenantId(noeudId, TENANT))
                .thenReturn(Optional.of(noeud(noeudId, DpgfNoeud.TYPE_LOT)));

        PrixDpuCreateDto dto = new PrixDpuCreateDto();
        dto.setDpgfNoeudId(noeudId);

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("ARTICLE");
    }

    @Test
    void createForNoeud_linksAndSyncsPrixUnitaire() {
        UUID noeudId = UUID.randomUUID();
        UUID dpgfId = UUID.randomUUID();
        Dpgf dpgf = Dpgf.builder().id(dpgfId).tenantId(TENANT).build();
        DpgfNoeud noeud = noeud(noeudId, DpgfNoeud.TYPE_ARTICLE);
        noeud.setDpgf(dpgf);
        noeud.setQuantite(new BigDecimal("10"));

        when(noeudRepository.findByIdAndTenantId(noeudId, TENANT)).thenReturn(Optional.of(noeud));
        when(repository.findByDpgfNoeudIdAndTenantId(noeudId, TENANT)).thenReturn(Optional.empty());
        when(repository.save(any(PrixDpu.class))).thenAnswer(inv -> {
            PrixDpu p = inv.getArgument(0);
            if (p.getId() == null) {
                p.setId(UUID.randomUUID());
            }
            return p;
        });
        when(noeudRepository.save(any(DpgfNoeud.class))).thenAnswer(inv -> inv.getArgument(0));
        when(dpgfRepository.findByIdAndTenantId(dpgfId, TENANT)).thenReturn(Optional.of(dpgf));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dpgfId, TENANT))
                .thenReturn(List.of(noeud));

        PrixDpuCreateDto dto = new PrixDpuCreateDto();
        dto.setDpgfNoeudId(noeudId);
        dto.setFraisGenerauxPercent(new BigDecimal("10"));
        dto.setMargeBeneficiairePercent(new BigDecimal("5"));

        PrixDpu created = service.create(dto);

        assertThat(created.getDpgfNoeudId()).isEqualTo(noeudId);
        assertThat(noeud.getPrixDpuId()).isEqualTo(created.getId());
        assertThat(noeud.getOrigineCout()).isEqualTo("DECOMPOSE");
        assertThat(noeud.getPrixUnitaire()).isEqualByComparingTo(BigDecimal.ZERO);
        verify(agregationService).applyHeaderTotals(eq(dpgf), any());
    }

    @Test
    void update_recomputesAdditiveFormulaAndSyncsNoeud() {
        UUID dpuId = UUID.randomUUID();
        UUID noeudId = UUID.randomUUID();
        UUID dpgfId = UUID.randomUUID();
        Dpgf dpgf = Dpgf.builder().id(dpgfId).tenantId(TENANT).build();
        DpgfNoeud noeud = noeud(noeudId, DpgfNoeud.TYPE_ARTICLE);
        noeud.setDpgf(dpgf);
        noeud.setQuantite(new BigDecimal("2"));

        PrixDpu entity = PrixDpu.builder()
                .id(dpuId)
                .tenantId(TENANT)
                .dpgfNoeudId(noeudId)
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
        when(noeudRepository.findByIdAndTenantId(noeudId, TENANT)).thenReturn(Optional.of(noeud));
        when(noeudRepository.save(any(DpgfNoeud.class))).thenAnswer(inv -> inv.getArgument(0));
        when(dpgfRepository.findByIdAndTenantId(dpgfId, TENANT)).thenReturn(Optional.of(dpgf));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dpgfId, TENANT))
                .thenReturn(List.of(noeud));

        ComposantDpuInputDto line = new ComposantDpuInputDto();
        line.setType(ComposantDpu.TYPE_MATIERE);
        line.setReferenceType("LIBRE");
        line.setLibelle("Ciment");
        line.setRendement(new BigDecimal("10"));
        line.setUnite("kg");
        line.setPrixUnitaire(new BigDecimal("2"));

        PrixDpuUpdateDto update = new PrixDpuUpdateDto();
        update.setComposants(List.of(line));

        PrixDpu saved = service.update(dpuId, update);

        // dÃ©boursÃ© 20 ; PU = 20 Ã— (1 + 0.10 + 0.05) = 23
        assertThat(saved.getDeboursSec()).isEqualByComparingTo("20.00");
        assertThat(saved.getPrixVenteHt()).isEqualByComparingTo("23.00");
        assertThat(noeud.getPrixUnitaire()).isEqualByComparingTo("23.00");
        assertThat(noeud.getTotal()).isEqualByComparingTo("46.00");
    }

    @Test
    void listByDpgfNoeudId_returnsSingleton() {
        UUID noeudId = UUID.randomUUID();
        PrixDpu entity = PrixDpu.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT)
                .dpgfNoeudId(noeudId)
                .fraisGenerauxPercent(BigDecimal.TEN)
                .margeBeneficiairePercent(BigDecimal.TEN)
                .tvaTaux(new BigDecimal("20"))
                .deboursSec(BigDecimal.ZERO)
                .prixVenteHt(BigDecimal.ZERO)
                .prixVenteTtc(BigDecimal.ZERO)
                .composants(new ArrayList<>())
                .build();
        when(repository.findByDpgfNoeudIdAndTenantId(noeudId, TENANT)).thenReturn(Optional.of(entity));

        assertThat(service.list(null, noeudId)).hasSize(1);
        assertThat(service.findByDpgfNoeudId(noeudId).getDpgfNoeudId()).isEqualTo(noeudId);
    }

    private static DpgfNoeud noeud(UUID id, String type) {
        return DpgfNoeud.builder()
                .id(id)
                .tenantId(TENANT)
                .type(type)
                .code("1.1")
                .libelle("Poste")
                .ordre(0)
                .enfants(new ArrayList<>())
                .build();
    }
}
