package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import com.fasterxml.jackson.databind.ObjectMapper;
import java.time.LocalDate;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.DocumentChantierDto;
import ma.nafura.chantiers.api.request.DocumentChantierCreateDto;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.DocumentChantierRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.chantiers.seeders.ChantierDocumentsSeedService;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/** SEKTOR-223 — AC-10 types palier 1, AC-11 pas d'orphelin, nœud facultatif. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentChantierServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-al-qods";
    private static final String LOT = "lot-2";
    private static final String POSTE = "poste-2-1";

    @Mock private DocumentChantierRepository repository;
    @Mock private ChantierService chantierService;
    @Mock private ChantierDocumentsSeedService seedService;
    @Mock private PosteBudgetaireRepository posteRepository;
    @Mock private ChantierLotRepository lotRepository;

    private DocumentChantierService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DocumentChantierService(
                repository,
                chantierService,
                seedService,
                new ObjectMapper(),
                posteRepository,
                lotRepository);
        when(chantierService.getById(CHANTIER)).thenReturn(Chantier.builder()
                .id(CHANTIER)
                .tenantId(TENANT)
                .code("CH-ALQODS")
                .build());
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT))
                .thenReturn(Optional.of(PosteBudgetaire.builder().id(POSTE).lotId(LOT).code("2.1").build()));
        when(lotRepository.findByIdAndTenantId(LOT, TENANT))
                .thenReturn(Optional.of(ChantierLot.builder().id(LOT).chantierId(CHANTIER).code("2").build()));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createSansChantier_refuse() {
        assertThatThrownBy(() -> service.create("  ", dto("OS", null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(DocumentChantierService.ERR_CHANTIER_REQUIS);
    }

    @Test
    void createTypeInconnu_refuse() {
        assertThatThrownBy(() -> service.create(CHANTIER, dto("FAKE", null)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(DocumentChantierService.ERR_TYPE_INCONNU);
    }

    @Test
    void createOsSansNoeud_persisteChantier() {
        DocumentChantierDto saved = service.create(CHANTIER, dto("OS", null));
        assertThat(saved.getChantierId()).isEqualTo(CHANTIER);
        assertThat(saved.getType()).isEqualTo("OS");
        assertThat(saved.getNoeudId()).isNull();
    }

    @Test
    void createPvSurNoeud_persisteNoeud() {
        DocumentChantierDto saved = service.create(CHANTIER, dto("PV", POSTE));
        assertThat(saved.getType()).isEqualTo("PV");
        assertThat(saved.getNoeudId()).isEqualTo(POSTE);
        assertThat(saved.getChantierId()).isEqualTo(CHANTIER);
    }

    @Test
    void createNoeudHorsChantier_refuse() {
        when(lotRepository.findByIdAndTenantId(LOT, TENANT))
                .thenReturn(Optional.of(ChantierLot.builder().id(LOT).chantierId("autre-ch").code("2").build()));
        assertThatThrownBy(() -> service.create(CHANTIER, dto("PV", POSTE)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(DocumentChantierService.ERR_NOEUD_HORS_CHANTIER);
    }

    private static DocumentChantierCreateDto dto(String type, String noeudId) {
        DocumentChantierCreateDto body = new DocumentChantierCreateDto();
        body.setType(type);
        body.setTitre("OS Al Qods");
        body.setFichier("OS-ALQODS-001.pdf");
        body.setTaille(1200L);
        body.setUploadedAt(LocalDate.parse("2026-08-01"));
        body.setUploadedPar("qa-chef");
        body.setNoeudId(noeudId);
        return body;
    }
}
