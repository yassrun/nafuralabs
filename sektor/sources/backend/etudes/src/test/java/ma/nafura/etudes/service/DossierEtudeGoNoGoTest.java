package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.ChargeEtudeCandidatDto;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPieceAttendueRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort;
import ma.nafura.etudes.service.port.bc.EtudeClientPort;
import ma.nafura.etudes.service.port.capability.EtudeApprovalPort;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DossierEtudeGoNoGoTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOSSIER = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static final UUID INGE = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @Mock
    private DossierEtudeRepository repository;

    @Mock
    private ChargeEtudeService chargeEtudeService;

    @Mock
    private DpgfNoeudRepository noeudRepository;

    private DossierEtudeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        UserContext.setUserRole("BTP_DG");
        UserContext.setUserId(UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"));
        org.mockito.Mockito.lenient()
                .when(chargeEtudeService.requireIngenieur(any(), any()))
                .thenAnswer(inv -> {
                    String nom = inv.getArgument(1);
                    return nom != null && !nom.isBlank() ? nom.trim() : "Ingénieur test";
                });
        service = new DossierEtudeService(
                repository,
                noeudRepository,
                org.mockito.Mockito.mock(DossierDocumentRepository.class),
                org.mockito.Mockito.mock(DevisRepository.class),
                org.mockito.Mockito.mock(ParametresEtudeService.class),
                org.mockito.Mockito.mock(EtudeApprovalPort.class),
                org.mockito.Mockito.mock(EtudeClientPort.class),
                org.mockito.Mockito.mock(DevisService.class),
                org.mockito.Mockito.mock(AppelOffreClientService.class),
                org.mockito.Mockito.mock(AppelOffreClientRepository.class),
                org.mockito.Mockito.mock(DossierPieceAttendueService.class),
                org.mockito.Mockito.mock(DossierPieceAttendueRepository.class),
                chargeEtudeService,
                org.mockito.Mockito.mock(DossierIntervenantService.class),
                org.mockito.Mockito.mock(ma.nafura.etudes.repository.AvisExecutionRepository.class),
                org.mockito.Mockito.mock(DebourseDuNoeudService.class),
                org.mockito.Mockito.mock(ChainageAvalPort.class),
                org.mockito.Mockito.mock(ConsultationEtudeService.class),
                org.mockito.Mockito.mock(TransitionEtudeService.class),
                org.mockito.Mockito.mock(CompletudeEtudeService.class),
                org.mockito.Mockito.mock(DecisionCatalogueService.class),
                java.util.List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    @Test
    void go_affecte_ingenieur_et_ouvre_bordereau() {
        DossierEtude dossier = brouillon();
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.go(DOSSIER, INGE.toString(), "QA Ingenieur");

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.ASSIGNED);
        assertThat(out.getCurrentStep()).isEqualTo(DossierEtude.ETAPE_BORDEREAU);
        assertThat(out.getChargeEtudeUserId()).isEqualTo(INGE.toString());
        assertThat(out.getResponsableExecutionUserId()).isEqualTo(INGE.toString());
        assertThat(out.exigeAvisExecution()).isFalse();
        assertThat(out.getGoDecidePar()).isNotBlank();
        assertThat(out.getGoDecideAt()).isNotNull();
    }

    @Test
    void go_deux_ingenieurs_distincts() {
        UUID exec = UUID.fromString("99999999-9999-9999-9999-999999999999");
        DossierEtude dossier = brouillon();
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.go(DOSSIER, INGE.toString(), "QA Ingenieur", exec.toString(), "QA Exec");

        assertThat(out.getChargeEtudeUserId()).isEqualTo(INGE.toString());
        assertThat(out.getResponsableExecutionUserId()).isEqualTo(exec.toString());
        assertThat(out.exigeAvisExecution()).isTrue();
    }

    @Test
    void avis_retour_renvoie_en_chiffrage() {
        UUID exec = UUID.fromString("99999999-9999-9999-9999-999999999999");
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(exec);
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.IN_PROGRESS);
        dossier.setChargeEtudeUserId(INGE.toString());
        dossier.setResponsableExecutionUserId(exec.toString());
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.avisExecutionRetour(DOSSIER, "Délais irréalistes sur le lot 2");

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.IN_PROGRESS);
        assertThat(out.getAvisExecutionDossier()).isEqualTo("RETOUR");
        assertThat(out.getAvisExecutionCommentaire()).contains("Délais");
    }

    @Test
    void go_preselectionne_auteur_ingenieur() {
        DossierEtude dossier = brouillon();
        dossier.setCreatedBy(INGE.toString());
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        when(chargeEtudeService.findMatchingIngenieur(INGE.toString()))
                .thenReturn(new ChargeEtudeCandidatDto(INGE.toString(), "qa.ingenieur@local", "QA Ingenieur"));

        DossierEtude out = service.go(DOSSIER, null, null);

        assertThat(out.getChargeEtudeUserId()).isEqualTo(INGE.toString());
        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.ASSIGNED);
    }

    @Test
    void go_vers_soi_meme_prend_en_charge() {
        UUID moi = UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee");
        UserContext.setUserRole("BTP_DG");
        UserContext.setUserId(moi);
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.PENDING_ASSIGNMENT);
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.go(DOSSIER, moi.toString(), "QA Owner");

        assertThat(out.getChargeEtudeUserId()).isEqualTo(moi.toString());
        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.IN_PROGRESS);
    }

    @Test
    void allerAEtape_ne_change_pas_le_statut() {
        UserContext.setUserRole("BTP_INGENIEUR");
        DossierEtude dossier = brouillon();
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.allerAEtape(DOSSIER, DossierEtude.ETAPE_BORDEREAU);

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.DRAFT);
        assertThat(out.getCurrentStep()).isEqualTo(DossierEtude.ETAPE_BORDEREAU);
    }

    @Test
    void allerAEtape_affecte_ne_accepte_pas() {
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.ASSIGNED);
        dossier.setChargeEtudeUserId(INGE.toString());
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> service.allerAEtape(DOSSIER, DossierEtude.ETAPE_DECOMPOSITION))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.verrouille");
        assertThat(dossier.getStatus()).isEqualTo(StatutDossierEtude.ASSIGNED);
    }

    @Test
    void nogo_clot_avec_motif() {
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.PENDING_ASSIGNMENT);
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.nogo(DOSSIER, "Hors capacité");

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.REJECTED);
        assertThat(out.getMotifNoGo()).isEqualTo("Hors capacité");
        assertThat(out.isModifiable()).isFalse();
    }

    @Test
    void revenir_au_draft_depuis_rejected() {
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.REJECTED);
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.revenirAuDraft(DOSSIER);

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.DRAFT);
    }

    @Test
    void archiver_draft_ou_rejete() {
        DossierEtude dossier = brouillon();
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.annuler(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.ARCHIVED);

        DossierEtude rejete = brouillon();
        rejete.setStatus(StatutDossierEtude.REJECTED);
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(rejete));
        assertThat(service.annuler(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.ARCHIVED);

        DossierEtude refusChiffrage = brouillon();
        refusChiffrage.setStatus(StatutDossierEtude.STUDY_REJECTED);
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(refusChiffrage));
        assertThat(service.annuler(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.ARCHIVED);
    }

    @Test
    void nogo_sans_motif_accepte() {
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.PENDING_ASSIGNMENT);
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.nogo(DOSSIER, "  ");

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.REJECTED);
        assertThat(out.getMotifNoGo()).isNull();
    }

    @Test
    void archiver_depuis_a_decider() {
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.PENDING_ASSIGNMENT);
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        assertThat(service.annuler(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.ARCHIVED);
    }

    @Test
    void renvoyer_au_charge_depuis_rejet_chiffrage() {
        UserContext.setUserRole("BTP_ASSISTANT_ETUDE");
        UserContext.setUserId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.STUDY_REJECTED);
        dossier.setChargeEtudeUserId(INGE.toString());
        dossier.setChargeEtudeNom("QA Ingenieur");
        dossier.setMotifRefusCharge("BDP manquant");
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.renvoyerAuCharge(DOSSIER);

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.IN_PROGRESS);
        assertThat(out.getChargeEtudeUserId()).isEqualTo(INGE.toString());
        assertThat(out.getMotifRefusCharge()).isNull();
    }

    @Test
    void renvoyer_au_charge_depuis_draft_si_deja_nomme() {
        UserContext.setUserRole("BTP_ASSISTANT_ETUDE");
        DossierEtude dossier = brouillon();
        dossier.setChargeEtudeUserId(INGE.toString());
        dossier.setChargeEtudeNom("QA Ingenieur");
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.renvoyerAuCharge(DOSSIER);

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.ASSIGNED);
    }

    @Test
    void revenir_au_draft_interdit_depuis_study_rejected() {
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.STUDY_REJECTED);
        dossier.setChargeEtudeUserId(INGE.toString());
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> service.revenirAuDraft(DOSSIER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.transition_interdite");
    }

    @Test
    void suspendre_et_reprendre_chiffrage() {
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.IN_PROGRESS);
        dossier.setChargeEtudeUserId(INGE.toString());
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude suspendu = service.suspendreChiffrage(DOSSIER);
        assertThat(suspendu.getStatus()).isEqualTo(StatutDossierEtude.SUSPENDED);

        DossierEtude repris = service.reprendreChiffrage(DOSSIER);
        assertThat(repris.getStatus()).isEqualTo(StatutDossierEtude.IN_PROGRESS);
    }

    @Test
    void saisie_apres_go_refuse_si_pas_charge() {
        UserContext.setUserRole("BTP_MAGASINIER");
        UserContext.setUserId(UUID.fromString("11111111-1111-1111-1111-111111111111"));
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.IN_PROGRESS);
        dossier.setChargeEtudeUserId(INGE.toString());
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));

        ma.nafura.etudes.api.request.DossierEtudeUpdateDto dto =
                new ma.nafura.etudes.api.request.DossierEtudeUpdateDto();
        dto.setObjet("Tentative hors chargé");

        assertThatThrownBy(() -> service.update(DOSSIER, dto))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.saisie_reservee_charge");
    }

    @Test
    void accepter_affectation_refuse_si_pas_le_charge() {
        UserContext.setUserRole("BTP_DG");
        UserContext.setUserId(UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"));
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.ASSIGNED);
        dossier.setChargeEtudeUserId(INGE.toString());
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> service.accepterAffectation(DOSSIER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.accept_reserve_charge");
    }

    @Test
    void refuser_affectation_refuse_si_pas_le_charge() {
        UserContext.setUserRole("BTP_DG");
        UserContext.setUserId(UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"));
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.ASSIGNED);
        dossier.setChargeEtudeUserId(INGE.toString());
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> service.refuserAffectation(DOSSIER, "DOC_MANQUANT", "BDP lot 3 manquant"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.refus_reserve_charge");
    }

    @Test
    void accepter_affectation_ouvre_chiffrage() {
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.ASSIGNED);
        dossier.setChargeEtudeUserId(INGE.toString());
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.accepterAffectation(DOSSIER);

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.IN_PROGRESS);
    }

    @Test
    void refuser_affectation_passe_en_rejete_chiffrage() {
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.ASSIGNED);
        dossier.setChargeEtudeUserId(INGE.toString());
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.refuserAffectation(DOSSIER, "DOC_MANQUANT", "BDP lot 3 manquant");

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.STUDY_REJECTED);
        assertThat(out.getMotifRefusChargeType()).isEqualTo("DOC_MANQUANT");
        assertThat(out.getMotifRefusCharge()).isEqualTo("BDP lot 3 manquant");
        assertThat(out.isModifiable()).isTrue();
    }

    @Test
    void allerAEtape_autorise_ingenieur_lot_affecte() {
        UUID lotIng = UUID.fromString("99999999-9999-9999-9999-999999999999");
        UUID dpgfId = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(lotIng);

        DossierEtude dossier = brouillon();
        dossier.setStatus(StatutDossierEtude.IN_PROGRESS);
        dossier.setChargeEtudeUserId(INGE.toString());
        dossier.setDpgfId(dpgfId);
        dossier.setCurrentStep(DossierEtude.ETAPE_BORDEREAU);

        ma.nafura.etudes.domain.dpgf.DpgfNoeud lot = ma.nafura.etudes.domain.dpgf.DpgfNoeud.builder()
                .type(ma.nafura.etudes.domain.dpgf.DpgfNoeud.TYPE_LOT)
                .chargeLotUserId(lotIng.toString())
                .build();
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(dpgfId, TENANT))
                .thenReturn(java.util.List.of(lot));
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude out = service.allerAEtape(DOSSIER, DossierEtude.ETAPE_DECOMPOSITION);
        assertThat(out.getCurrentStep()).isEqualTo(DossierEtude.ETAPE_DECOMPOSITION);
    }

    private static DossierEtude brouillon() {
        return DossierEtude.builder()
                .id(DOSSIER)
                .tenantId(TENANT)
                .numero("DE-0099")
                .objet("Cadrage")
                .clientNom("MOA")
                .status(StatutDossierEtude.DRAFT)
                .currentStep(DossierEtude.ETAPE_PREMIERE)
                .build();
    }
}
