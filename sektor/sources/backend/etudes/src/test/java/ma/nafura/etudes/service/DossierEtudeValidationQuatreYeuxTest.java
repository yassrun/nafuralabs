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
import ma.nafura.etudes.domain.model.DossierEtude;
import ma.nafura.etudes.domain.model.StatutDossierEtude;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.AvisExecutionRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPieceAttendueRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.port.EtudeApprovalPort;
import ma.nafura.etudes.service.port.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DossierEtudeValidationQuatreYeuxTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOSSIER_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final String CHARGE = "charge-user-id";
    private static final String REVISEUR = "reviseur-user-id";
    private static final String DIRECTEUR = "directeur-user-id";
    private static final String AVIS_ONLY = "avis-user-id";

    @Mock
    private DossierEtudeRepository repository;

    @Mock
    private DpgfNoeudRepository noeudRepository;

    @Mock
    private DossierDocumentRepository documentRepository;

    @Mock
    private DevisRepository devisRepository;

    @Mock
    private ParametresEtudeService parametres;

    @Mock
    private EtudeApprovalPort approvalPort;

    @Mock
    private EtudeClientPort clientPort;

    @Mock
    private DevisService devisService;

    @Mock
    private AppelOffreClientService aocService;

    @Mock
    private AppelOffreClientRepository aocRepository;

    @Mock
    private DossierPieceAttendueService pieceAttendueService;

    @Mock
    private DossierPieceAttendueRepository pieceAttendueRepository;

    @Mock
    private ChargeEtudeService chargeEtudeService;

    @Mock
    private DossierIntervenantService intervenantService;

    private DossierEtudeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        when(parametres.auteurPeutValider()).thenReturn(false);
        when(approvalPort.isAvailable()).thenReturn(false);
        service = new DossierEtudeService(
                repository,
                noeudRepository,
                documentRepository,
                devisRepository,
                parametres,
                approvalPort,
                clientPort,
                devisService,
                aocService,
                aocRepository,
                pieceAttendueService,
                pieceAttendueRepository,
                chargeEtudeService,
                intervenantService,
                mock(AvisExecutionRepository.class),
                mock(BudgetVentilationService.class),
                mock(ma.nafura.etudes.service.port.ChainageAvalPort.class),
                List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void chargeEtude_ne_peut_pas_approuver() {
        DossierEtude dossier = dossierEnValidation(1);
        dossier.setChargeEtudeUserId(CHARGE);
        dossier.setCreatedBy("assistante");
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(intervenantService.bloqueApprobation(DOSSIER_ID, CHARGE)).thenReturn(true);

        assertThatThrownBy(() -> service.valider(DOSSIER_ID, CHARGE))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.intervenant_ne_peut_valider");
    }

    @Test
    void reviseur_ne_peut_pas_approuver() {
        DossierEtude dossier = dossierEnValidation(2);
        dossier.setCreatedBy("assistante");
        dossier.setChargeEtudeUserId(CHARGE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(intervenantService.bloqueApprobation(DOSSIER_ID, REVISEUR)).thenReturn(true);

        assertThatThrownBy(() -> service.valider(DOSSIER_ID, REVISEUR))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.intervenant_ne_peut_valider");
    }

    @Test
    void avis_seul_ne_bloque_pas() {
        DossierEtude dossier = dossierEnValidation(1);
        dossier.setCreatedBy("assistante");
        dossier.setChargeEtudeUserId(CHARGE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(intervenantService.bloqueApprobation(DOSSIER_ID, AVIS_ONLY)).thenReturn(false);
        when(repository.save(any(DossierEtude.class))).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude result = service.valider(DOSSIER_ID, AVIS_ONLY);

        assertThat(result.getStatus()).isEqualTo(StatutDossierEtude.VALIDEE);
        verify(intervenantService).enregistrerApprobateur(eq(DOSSIER_ID), eq(AVIS_ONLY), eq(AVIS_ONLY));
    }

    @Test
    void sous_seuil_un_seul_niveau_suffit() {
        DossierEtude dossier = dossierEnValidation(1);
        dossier.setCreatedBy("assistante");
        dossier.setChargeEtudeUserId(CHARGE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(intervenantService.bloqueApprobation(DOSSIER_ID, DIRECTEUR)).thenReturn(false);
        when(repository.save(any(DossierEtude.class))).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude result = service.valider(DOSSIER_ID, DIRECTEUR);

        assertThat(result.getStatus()).isEqualTo(StatutDossierEtude.VALIDEE);
        assertThat(result.getValidationEtape()).isNull();
    }

    @Test
    void au_dessus_seuil_n1_puis_n2() {
        DossierEtude dossier = dossierEnValidation(2);
        dossier.setCreatedBy("assistante");
        dossier.setChargeEtudeUserId(CHARGE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(intervenantService.bloqueApprobation(DOSSIER_ID, DIRECTEUR)).thenReturn(false);
        when(repository.save(any(DossierEtude.class))).thenAnswer(inv -> inv.getArgument(0));

        DossierEtude n1 = service.valider(DOSSIER_ID, DIRECTEUR);

        assertThat(n1.getStatus()).isEqualTo(StatutDossierEtude.EN_VALIDATION);
        assertThat(n1.getValidationEtape()).isEqualTo(DossierEtude.VALIDATION_N2);
    }

    @Test
    void niveauxApprobationPour_respecte_seuil() {
        ParametresEtudeService calc =
                new ParametresEtudeService(org.mockito.Mockito.mock(TenantSettingReader.class));

        assertThat(calc.niveauxApprobationPour(new BigDecimal("100000"))).isEqualTo(1);
        assertThat(calc.niveauxApprobationPour(new BigDecimal("500000"))).isEqualTo(2);
        assertThat(calc.niveauxApprobationPour(new BigDecimal("12000000"))).isEqualTo(2);
    }

    private DossierEtude dossierEnValidation(int niveaux) {
        return DossierEtude.builder()
                .id(DOSSIER_ID)
                .tenantId(TENANT)
                .numero("ET-TEST")
                .objet("Test")
                .status(StatutDossierEtude.EN_VALIDATION)
                .validationEtape(DossierEtude.VALIDATION_N1)
                .niveauxApprobation(niveaux)
                .build();
    }
}
