package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
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
class DossierEtudeWorkflowServiceTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOSSIER = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static final UUID INGE = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");

    @Mock
    private DossierEtudeRepository repository;

    @Mock
    private ChargeEtudeService chargeEtudeService;

    private DossierEtudeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        UserContext.setUserRole("BTP_ADMIN_ETUDE");
        UserContext.setUserId(UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"));
        org.mockito.Mockito.lenient()
                .when(chargeEtudeService.requireIngenieur(any(), any()))
                .thenAnswer(inv -> {
                    String nom = inv.getArgument(1);
                    return nom != null && !nom.isBlank() ? nom.trim() : "Ingénieur test";
                });
        org.mockito.Mockito.lenient().when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));
        service = new DossierEtudeService(
                repository,
                org.mockito.Mockito.mock(DpgfNoeudRepository.class),
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
    void draft_vers_pending_assignment() {
        given(StatutDossierEtude.DRAFT);
        assertThat(service.soumettreAuDg(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.PENDING_ASSIGNMENT);
    }

    @Test
    void ingenieur_peut_soumettre_pour_affectation() {
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        given(StatutDossierEtude.DRAFT);
        assertThat(service.soumettreAuDg(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.PENDING_ASSIGNMENT);
    }

    @Test
    void draft_vers_assigned_avec_affectation() {
        DossierEtude d = given(StatutDossierEtude.DRAFT);
        d.setChargeEtudeUserId(INGE.toString());
        d.setChargeEtudeNom("QA");
        assertThat(service.renvoyerAuCharge(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.ASSIGNED);
    }

    @Test
    void draft_vers_assigned_sans_affectation_interdit() {
        given(StatutDossierEtude.DRAFT);
        assertThatThrownBy(() -> service.renvoyerAuCharge(DOSSIER))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.charge_etude.requis");
    }

    @Test
    void pending_vers_assigned_et_rejected() {
        given(StatutDossierEtude.PENDING_ASSIGNMENT);
        assertThat(service.go(DOSSIER, INGE.toString(), "QA").getStatus()).isEqualTo(StatutDossierEtude.ASSIGNED);

        given(StatutDossierEtude.PENDING_ASSIGNMENT);
        assertThat(service.nogo(DOSSIER, "Hors capa").getStatus()).isEqualTo(StatutDossierEtude.REJECTED);
    }

    @Test
    void rejected_vers_draft() {
        given(StatutDossierEtude.REJECTED);
        assertThat(service.revenirAuDraft(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.DRAFT);
    }

    @Test
    void assigned_vers_in_progress_et_study_rejected() {
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        DossierEtude d = given(StatutDossierEtude.ASSIGNED);
        d.setChargeEtudeUserId(INGE.toString());
        assertThat(service.accepterAffectation(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.IN_PROGRESS);

        d = given(StatutDossierEtude.ASSIGNED);
        d.setChargeEtudeUserId(INGE.toString());
        assertThat(service.refuserAffectation(DOSSIER, "DOC_MANQUANT", "BDP manquant").getStatus())
                .isEqualTo(StatutDossierEtude.STUDY_REJECTED);
    }

    @Test
    void study_rejected_vers_in_progress() {
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        DossierEtude d = given(StatutDossierEtude.STUDY_REJECTED);
        d.setChargeEtudeUserId(INGE.toString());
        assertThat(service.reprendreChiffrage(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.IN_PROGRESS);
    }

    @Test
    void suspendre_et_reprendre() {
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        DossierEtude d = given(StatutDossierEtude.IN_PROGRESS);
        d.setChargeEtudeUserId(INGE.toString());
        assertThat(service.suspendreChiffrage(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.SUSPENDED);
        assertThat(service.reprendreChiffrage(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.IN_PROGRESS);
    }

    @Test
    void validations_et_retours() {
        UserContext.setUserRole("BTP_DAF");
        given(StatutDossierEtude.COMPLETED);
        assertThat(service.approuverFinancierement(DOSSIER, "daf").getStatus())
                .isEqualTo(StatutDossierEtude.FINANCIALLY_APPROVED);

        given(StatutDossierEtude.COMPLETED);
        assertThat(service.refuserFinancierement(DOSSIER, "marge trop juste").getStatus())
                .isEqualTo(StatutDossierEtude.FINANCIALLY_REJECTED);

        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        DossierEtude d = given(StatutDossierEtude.FINANCIALLY_REJECTED);
        d.setChargeEtudeUserId(INGE.toString());
        assertThat(service.reprendreChiffrage(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.IN_PROGRESS);

        UserContext.setUserRole("BTP_ADMIN_ETUDE");
        given(StatutDossierEtude.FINANCIALLY_APPROVED);
        assertThat(service.approuverDefinitivement(DOSSIER, "admin").getStatus())
                .isEqualTo(StatutDossierEtude.FINAL_APPROVED);

        given(StatutDossierEtude.FINANCIALLY_APPROVED);
        assertThat(service.refuserDefinitivement(DOSSIER, "relire le BPU").getStatus())
                .isEqualTo(StatutDossierEtude.FINAL_REJECTED);

        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setUserId(INGE);
        d = given(StatutDossierEtude.FINAL_REJECTED);
        d.setChargeEtudeUserId(INGE.toString());
        assertThat(service.reprendreChiffrage(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.IN_PROGRESS);
    }

    @Test
    void archive_depuis_draft() {
        given(StatutDossierEtude.DRAFT);
        assertThat(service.annuler(DOSSIER).getStatus()).isEqualTo(StatutDossierEtude.ARCHIVED);
    }

    @Test
    void terminaux_interdits() {
        given(StatutDossierEtude.FINAL_APPROVED);
        assertThatThrownBy(() -> service.reprendreChiffrage(DOSSIER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.transition_interdite");
        given(StatutDossierEtude.ARCHIVED);
        assertThatThrownBy(() -> service.revenirAuDraft(DOSSIER))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.transition_interdite");
        given(StatutDossierEtude.IN_PROGRESS);
        assertThatThrownBy(() -> service.approuverFinancierement(DOSSIER, "daf"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.transition_interdite");
    }

    private DossierEtude given(StatutDossierEtude status) {
        DossierEtude dossier = DossierEtude.builder()
                .id(DOSSIER)
                .tenantId(TENANT)
                .numero("DE-0099")
                .objet("Workflow")
                .status(status)
                .currentStep(DossierEtude.ETAPE_PREMIERE)
                .build();
        when(repository.findByIdAndTenantId(DOSSIER, TENANT)).thenReturn(Optional.of(dossier));
        return dossier;
    }
}
