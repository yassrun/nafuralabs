package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.AvisExecutionCreateDto;
import ma.nafura.etudes.api.request.AvisExecutionTraiterDto;
import ma.nafura.etudes.domain.model.AvisExecution;
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.Dpgf;
import ma.nafura.etudes.domain.model.DpgfNoeud;
import ma.nafura.etudes.domain.model.StatutDossierEtude;
import ma.nafura.etudes.repository.AvisExecutionRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.gate.ContexteGate;
import ma.nafura.etudes.service.gate.GatesEtude;
import ma.nafura.etudes.service.gate.ResultatGate;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class AvisExecutionServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID DOSSIER = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final UUID NOEUD = UUID.fromString("33333333-3333-3333-3333-333333333333");
    private static final UUID DPGF = UUID.fromString("44444444-4444-4444-4444-444444444444");

    private AvisExecutionRepository repository;
    private DossierEtudeRepository dossierRepository;
    private DpgfNoeudRepository noeudRepository;
    private DossierIntervenantService intervenantService;
    private AvisExecutionService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        repository = mock(AvisExecutionRepository.class);
        dossierRepository = mock(DossierEtudeRepository.class);
        noeudRepository = mock(DpgfNoeudRepository.class);
        intervenantService = mock(DossierIntervenantService.class);
        service = new AvisExecutionService(
                repository, dossierRepository, noeudRepository, intervenantService);

        DossierEtude dossier = DossierEtude.builder()
                .id(DOSSIER)
                .tenantId(TENANT)
                .numero("ET-1")
                .objet("x")
                .status(StatutDossierEtude.EN_ETUDE)
                .dpgfId(DPGF)
                .build();
        when(dossierRepository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));

        Dpgf dpgf = Dpgf.builder().id(DPGF).tenantId(TENANT).build();
        DpgfNoeud noeud = DpgfNoeud.builder()
                .id(NOEUD)
                .tenantId(TENANT)
                .type(DpgfNoeud.TYPE_ARTICLE)
                .dpgf(dpgf)
                .build();
        when(noeudRepository.findByIdAndTenantId(NOEUD, TENANT)).thenReturn(Optional.of(noeud));
        when(repository.save(any(AvisExecution.class))).thenAnswer(inv -> {
            AvisExecution a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(UUID.randomUUID());
            }
            return a;
        });
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void difficile_sans_commentaire_refuse() {
        AvisExecutionCreateDto dto = new AvisExecutionCreateDto();
        dto.setDpgfNoeudId(NOEUD);
        dto.setNiveau("DIFFICILE");
        assertThatThrownBy(() -> service.creer(DOSSIER, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.avis.commentaire_obligatoire");
    }

    @Test
    void creer_difficile_ok() {
        AvisExecutionCreateDto dto = new AvisExecutionCreateDto();
        dto.setDpgfNoeudId(NOEUD);
        dto.setNiveau("DIFFICILE");
        dto.setCommentaire("Échafaudage manquant");
        dto.setEcartPropose(new BigDecimal("4.00"));

        AvisExecution saved = service.creer(DOSSIER, dto);
        assertThat(saved.getStatut()).isEqualTo("OUVERT");
        assertThat(saved.getNiveau()).isEqualTo("DIFFICILE");
        verify(intervenantService).enregistrerAvis(eq(DOSSIER), any(), any(), eq(false));
    }

    @Test
    void ecarter_sans_motif_refuse() {
        UUID avisId = UUID.randomUUID();
        AvisExecution avis = AvisExecution.builder()
                .id(avisId)
                .tenantId(TENANT)
                .dossierEtudeId(DOSSIER)
                .dpgfNoeudId(NOEUD)
                .niveau("DIFFICILE")
                .commentaire("x")
                .auteurUserId("u1")
                .statut("OUVERT")
                .build();
        when(repository.findByIdAndTenantIdAndDossierEtudeId(avisId, TENANT, DOSSIER))
                .thenReturn(Optional.of(avis));

        AvisExecutionTraiterDto dto = new AvisExecutionTraiterDto();
        dto.setStatut("ECARTE");
        assertThatThrownBy(() -> service.traiter(DOSSIER, avisId, dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.avis.motif_obligatoire");
    }

    @Test
    void gate_avis_ouverts_non_bloquant() {
        DpgfNoeud article = DpgfNoeud.builder()
                .id(NOEUD)
                .type(DpgfNoeud.TYPE_ARTICLE)
                .code("3.2")
                .libelle("Enduit")
                .prixUnitaire(new BigDecimal("53.16"))
                .fraisGenerauxPercent(new BigDecimal("8"))
                .margePercent(new BigDecimal("7"))
                .origineCout("DECOMPOSE")
                .build();
        ContexteGate ctx = ContexteGate.avecAvis(ContexteGate.deArticles(List.of(article)), 1, 2);
        ResultatGate r = new GatesEtude.GateChiffrage().evaluer(ctx);
        assertThat(r.autoriseLaSuite()).isTrue();
        assertThat(r.problemes())
                .extracting(ResultatGate.ProblemeGate::message)
                .contains("etudes.gate.chiffrage.avis_ouverts", "etudes.gate.chiffrage.avis_ecartes");
    }
}
