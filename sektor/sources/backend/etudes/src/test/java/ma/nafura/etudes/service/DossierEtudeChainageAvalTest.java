package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.atLeastOnce;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.dto.DossierConversionResultDto;
import ma.nafura.etudes.api.request.DossierConvertirDto;
import ma.nafura.etudes.api.request.DossierGagneDto;
import ma.nafura.etudes.api.request.DossierPerduDto;
import ma.nafura.etudes.api.request.PlacementPosteOrphelinDto;
import ma.nafura.etudes.domain.devis.Devis;
import ma.nafura.etudes.domain.dpgf.DpgfNoeud;
import ma.nafura.etudes.domain.dossier.DossierEtude;
import ma.nafura.etudes.domain.dossier.StatutDossierEtude;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.AvisExecutionRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.etudes.repository.DossierEtudeRepository;
import ma.nafura.etudes.repository.DossierPieceAttendueRepository;
import ma.nafura.etudes.repository.DpgfNoeudRepository;
import ma.nafura.etudes.service.DossierEtudeService.AttributionMismatchException;
import ma.nafura.etudes.service.DossierEtudeService.MargeNegativeRefuseeException;
import ma.nafura.etudes.service.DossierEtudeService.PostesOrphelinsException;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort;
import ma.nafura.etudes.service.port.capability.EtudeApprovalPort;
import ma.nafura.etudes.service.port.bc.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DossierEtudeChainageAvalTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOSSIER_ID = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID DPGF_ID = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID DEVIS_ID = UUID.fromString("dddddddd-dddd-dddd-dddd-ddddddddd002");
    private static final UUID DEVIS_FALLBACK_ID = UUID.fromString("dddddddd-dddd-dddd-dddd-ddddddddd001");
    private static final UUID ORPHELIN_ID = UUID.fromString("ffffffff-ffff-ffff-ffff-ffffffffffff");

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

    @Mock
    private DebourseDuNoeudService debourseDuNoeudService;

    @Mock
    private ChainageAvalPort chainageAvalPort;

    @Mock
    private TransitionEtudeService transitionEtudeService;

    private DossierEtudeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
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
                debourseDuNoeudService,
                chainageAvalPort,
                mock(ConsultationEtudeService.class),
                transitionEtudeService,
                List.of());
        lenient()
                .when(repository.save(any(DossierEtude.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    @Test
    void gagne_depuisDevisGenere_approuveLeDevisEtJournalise() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        Devis devis = devis(Devis.STATUS_EMIS);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setReferenceMarche("M-42");
        body.setDevisId(DEVIS_ID);
        body.setMontantAttribue(new BigDecimal("737106.00"));

        DossierEtude out = service.gagne(DOSSIER_ID, body);

        // AC-1 — l'étude est gagnée et le devis lié est approuvé, même transaction.
        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.GAGNE);
        assertThat(out.getReferenceMarche()).isEqualTo("M-42");
        assertThat(out.getMontantAttribue()).isEqualByComparingTo("737106.00");
        assertThat(devis.getStatus()).isEqualTo(Devis.STATUS_APPROUVE);
        verify(devisRepository).save(devis);
        // AC-6 — les deux transitions partagent un identifiant de corrélation.
        ArgumentCaptor<UUID> correlation = ArgumentCaptor.forClass(UUID.class);
        verify(transitionEtudeService, times(2))
                .consignerGain(any(), any(), any(), any(), correlation.capture(), any(), any(), any(), any());
        assertThat(correlation.getAllValues()).hasSize(2);
        assertThat(correlation.getAllValues().get(0)).isEqualTo(correlation.getAllValues().get(1));
    }

    /** SEKTOR-209/1 — le devis explicitement accepté remplace le fallback et alimente la conversion. */
    @Test
    void gagne_devisExpliciteDifferentDuFallback_devientLaSourceDuSnapshot() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        dossier.setDevisGenereId(DEVIS_FALLBACK_ID);
        dossier.setClientId("client-1");
        dossier.setClientNom("MOA");
        dossier.setDpgfId(DPGF_ID);
        Devis devisAccepte = devis(Devis.STATUS_EMIS, new BigDecimal("100000.00"));
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devisAccepte));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT))
                .thenReturn(noeudsSomme(new BigDecimal("100000.00")));
        when(parametres.tvaTauxDefaut()).thenReturn(new BigDecimal("20"));
        when(chainageAvalPort.convert(any())).thenReturn(new ChainageAvalPort.ConversionResult("CH-SELECTED"));

        DossierGagneDto gain = new DossierGagneDto();
        gain.setDateAttribution(LocalDate.of(2026, 8, 1));
        gain.setDevisId(DEVIS_ID);
        gain.setMontantAttribue(new BigDecimal("100000.00"));
        service.gagne(DOSSIER_ID, gain);

        assertThat(dossier.getDevisGenereId()).isEqualTo(DEVIS_ID);
        service.convertir(DOSSIER_ID, new DossierConvertirDto());

        ArgumentCaptor<ChainageAvalPort.ConversionCommand> command =
                ArgumentCaptor.forClass(ChainageAvalPort.ConversionCommand.class);
        verify(chainageAvalPort).convert(command.capture());
        assertThat(command.getValue().devisId()).isEqualTo(DEVIS_ID);
        assertThat(command.getValue().devisNumero()).isEqualTo("DV-2026-0002");
        assertThat(command.getValue().montantVenteInitialHt()).isEqualByComparingTo("100000.00");
        verify(devisRepository, never()).findByIdAndTenantId(DEVIS_FALLBACK_ID, TENANT);
    }

    /** SEKTOR-209/2 — un replay strictement identique est un no-op, audit compris. */
    @Test
    void gagne_replayIdentique_renvoieLeMemeResultatSansNouvelAudit() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        Devis devis = devis(Devis.STATUS_EMIS);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        DossierGagneDto body = gainStandard();

        DossierEtude premier = service.gagne(DOSSIER_ID, body);
        DossierEtude replay = service.gagne(DOSSIER_ID, body);

        assertThat(replay).isSameAs(premier);
        verify(devisRepository, times(1)).save(devis);
        verify(transitionEtudeService, times(2))
                .consignerGain(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    /** SEKTOR-209/2 — changer une donnée de la commande rejouée est refusé explicitement. */
    @Test
    void gagne_replayDivergent_refuse() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        Devis devis = devis(Devis.STATUS_EMIS);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        service.gagne(DOSSIER_ID, gainStandard());

        DossierGagneDto divergent = gainStandard();
        divergent.setReferenceMarche("AUTRE-MARCHE");

        assertThatThrownBy(() -> service.gagne(DOSSIER_ID, divergent))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.gain_rejeu_divergent");
        verify(transitionEtudeService, times(2))
                .consignerGain(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    /** AC-2 — un devis absent interdit le gain, sans écriture. */
    @Test
    void gagne_devisAbsent_refuse() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.empty());

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setDevisId(DEVIS_ID);
        body.setMontantAttribue(new BigDecimal("737106.00"));

        assertThatThrownBy(() -> service.gagne(DOSSIER_ID, body))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.dossier.gain_devis_introuvable");
        assertThat(dossier.getStatus()).isEqualTo(StatutDossierEtude.DEVIS_GENERE);
        verify(transitionEtudeService, never())
                .consignerGain(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    /** AC-2 — sans devisId explicite, le devisGenereId du dossier fait foi (rétrocompat web). */
    @Test
    void gagne_sansDevisIdExplicite_utiliseDevisGenereIdDuDossier() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        dossier.setDevisGenereId(DEVIS_ID);
        Devis devis = devis(Devis.STATUS_EMIS);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setMontantAttribue(new BigDecimal("737106.00"));

        DossierEtude out = service.gagne(DOSSIER_ID, body);
        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.GAGNE);
        assertThat(devis.getStatus()).isEqualTo(Devis.STATUS_APPROUVE);
    }

    /** AC-2 — un devis appartenant à une autre étude interdit le gain. */
    @Test
    void gagne_devisAutreEtude_refuse() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        Devis devis = devis(Devis.STATUS_EMIS);
        devis.setDossierEtudeId(UUID.fromString("99999999-9999-9999-9999-999999999999"));
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setDevisId(DEVIS_ID);
        body.setMontantAttribue(new BigDecimal("737106.00"));

        assertThatThrownBy(() -> service.gagne(DOSSIER_ID, body))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.gain_devis_autre_etude");
    }

    /** AC-2 — un devis annulé/perdu/expiré interdit le gain. */
    @Test
    void gagne_devisAnnule_refuse() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        Devis devis = devis(Devis.STATUS_ANNULE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setDevisId(DEVIS_ID);
        body.setMontantAttribue(new BigDecimal("737106.00"));

        assertThatThrownBy(() -> service.gagne(DOSSIER_ID, body))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.dossier.gain_devis_termine");
    }

    /** AC-3 — attribution ≠ total devis : refus qui porte les deux montants, aucune écriture. */
    @Test
    void gagne_attributionDifferentDuTotalDevis_refuse() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        Devis devis = devis(Devis.STATUS_EMIS);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setDevisId(DEVIS_ID);
        body.setMontantAttribue(new BigDecimal("500000.00"));

        assertThatThrownBy(() -> service.gagne(DOSSIER_ID, body))
                .isInstanceOf(AttributionMismatchException.class)
                .satisfies(ex -> {
                    AttributionMismatchException mismatch = (AttributionMismatchException) ex;
                    assertThat(mismatch.getTotalDevis()).isEqualByComparingTo("737106.00");
                    assertThat(mismatch.getMontantAttribue()).isEqualByComparingTo("500000.00");
                });
        assertThat(devis.getStatus()).isEqualTo(Devis.STATUS_EMIS);
        assertThat(dossier.getStatus()).isEqualTo(StatutDossierEtude.DEVIS_GENERE);
        verify(devisRepository, never()).save(any());
    }

    /** AC-4 — marge négative refusée aux rôles ordinaires (ingenieur, ni owner ni dg). */
    @Test
    void gagne_margeNegative_roleOrdinaire_refuse() {
        UserContext.setUserRole("BTP_INGENIEUR");
        UserContext.setSuperAdmin(false);
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        Devis devis = devis(Devis.STATUS_EMIS, new BigDecimal("500000.00"));
        devis.setDpgfId(DPGF_ID);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT)).thenReturn(List.of());
        when(debourseDuNoeudService.sommeDebourseArticles(any())).thenReturn(new BigDecimal("582600.00"));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setDevisId(DEVIS_ID);
        body.setMontantAttribue(new BigDecimal("500000.00"));
        body.setMotifDerogation("Vente stratégique");

        assertThatThrownBy(() -> service.gagne(DOSSIER_ID, body))
                .isInstanceOf(MargeNegativeRefuseeException.class)
                .satisfies(ex -> {
                    MargeNegativeRefuseeException refus = (MargeNegativeRefuseeException) ex;
                    assertThat(refus.getMontantAttribue()).isEqualByComparingTo("500000.00");
                    assertThat(refus.getDebourseInitial()).isEqualByComparingTo("582600.00");
                });
        verify(devisRepository, never()).save(any());
        verify(transitionEtudeService, never())
                .consignerGain(any(), any(), any(), any(), any(), any(), any(), any(), any());
        UserContext.clear();
    }

    /** AC-4 — dg peut déroger avec un motif obligatoire ; le motif est journalisé. */
    @Test
    void gagne_margeNegative_dg_avecMotif_aboutit() {
        UserContext.setUserRole("BTP_DG");
        UserContext.setSuperAdmin(false);
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        Devis devis = devis(Devis.STATUS_EMIS, new BigDecimal("500000.00"));
        devis.setDpgfId(DPGF_ID);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT)).thenReturn(List.of());
        when(debourseDuNoeudService.sommeDebourseArticles(any())).thenReturn(new BigDecimal("582600.00"));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setDevisId(DEVIS_ID);
        body.setMontantAttribue(new BigDecimal("500000.00"));
        body.setMotifDerogation("Vente stratégique validée en comité");

        DossierEtude out = service.gagne(DOSSIER_ID, body);

        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.GAGNE);
        assertThat(devis.getStatus()).isEqualTo(Devis.STATUS_APPROUVE);
        verify(transitionEtudeService, times(2))
                .consignerGain(
                        any(), any(), any(), any(), any(), eq("Vente stratégique validée en comité"),
                        eq(new BigDecimal("500000.00")), eq(new BigDecimal("582600.00")),
                        eq(new BigDecimal("-82600.00")));
        UserContext.clear();
    }

    /** AC-4 — dg sans motif : refus, même pour un dérogateur. */
    @Test
    void gagne_margeNegative_dg_sansMotif_refuse() {
        UserContext.setUserRole("BTP_DG");
        UserContext.setSuperAdmin(false);
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        Devis devis = devis(Devis.STATUS_EMIS, new BigDecimal("500000.00"));
        devis.setDpgfId(DPGF_ID);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT)).thenReturn(List.of());
        when(debourseDuNoeudService.sommeDebourseArticles(any())).thenReturn(new BigDecimal("582600.00"));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setDevisId(DEVIS_ID);
        body.setMontantAttribue(new BigDecimal("500000.00"));

        assertThatThrownBy(() -> service.gagne(DOSSIER_ID, body))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.dossier.derogation_motif_requis");
        verify(devisRepository, never()).save(any());
        UserContext.clear();
    }

    /** AC-1 — un échec à la seconde écriture fait échouer la commande entière, sans journal. */
    @Test
    void gagne_panneApresApprobationDevis_neLaissePasDEtatPartiel() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        Devis devis = devis(Devis.STATUS_EMIS);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        // La seconde écriture (transition GAGNE) échoue : la commande entière doit échouer.
        when(repository.save(any(DossierEtude.class)))
                .thenThrow(new RuntimeException("panne simulée après approbation du devis"));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setDevisId(DEVIS_ID);
        body.setMontantAttribue(new BigDecimal("737106.00"));

        assertThatThrownBy(() -> service.gagne(DOSSIER_ID, body))
                .isInstanceOf(RuntimeException.class)
                .hasMessage("panne simulée après approbation du devis");

        // Aucun état partiel observé : l'étude n'est pas passée GAGNE et aucune transition
        // n'a été consignée. Le rollback JPA réel (les deux écritures) est couvert par
        // @Transactional et vérifié en Mode B (SEKTOR-195).
        verify(repository, atLeastOnce()).save(any(DossierEtude.class));
        verify(transitionEtudeService, never())
                .consignerGain(any(), any(), any(), any(), any(), any(), any(), any(), any());
    }

    @Test
    void perdu_enregistreMotif() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));

        DossierPerduDto body = new DossierPerduDto();
        body.setMotif("PRIX");
        body.setConcurrentRetenu("Concurrent X");
        body.setEcartPrixEstime(new BigDecimal("12000"));

        DossierEtude out = service.perdu(DOSSIER_ID, body);
        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.PERDU);
        assertThat(out.getMotifPerte()).isEqualTo("PRIX");
        assertThat(out.getConcurrentRetenu()).isEqualTo("Concurrent X");
    }

    @Test
    void gagne_horsEtat_refuse() {
        DossierEtude dossier = dossier(StatutDossierEtude.VALIDEE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.now());
        assertThatThrownBy(() -> service.gagne(DOSSIER_ID, body))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("gagne_hors_etat");
    }

    /** AC-7, AC-13 — l'etude gagnee se convertit, avec ce que l'humain complete. */
    @Test
    void convertir_appellePortEtPasseConvertie() {
        DossierEtude dossier = dossier(StatutDossierEtude.GAGNE);
        dossier.setClientId("client-1");
        dossier.setClientNom("MOA");
        dossier.setMontantAttribue(new BigDecimal("100000"));
        dossier.setDevisGenereId(DEVIS_ID);
        dossier.setDpgfId(DPGF_ID);
        dossier.setDateAttribution(LocalDate.of(2026, 8, 1));
        Devis devis = devis(Devis.STATUS_APPROUVE, new BigDecimal("100000"));
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT))
                .thenReturn(noeudsSomme(new BigDecimal("100000")));
        when(parametres.tvaTauxDefaut()).thenReturn(new BigDecimal("20"));
        when(chainageAvalPort.convert(any()))
                .thenReturn(new ChainageAvalPort.ConversionResult("CH-1"));

        DossierConvertirDto body = new DossierConvertirDto();
        body.setChantierCode("CH-2026-009");
        body.setDateDemarrage(LocalDate.of(2026, 9, 1));
        body.setDureeMois(8);

        DossierConversionResultDto result = service.convertir(DOSSIER_ID, body);

        assertThat(result.getChantierId()).isEqualTo("CH-1");
        assertThat(result.getStatus()).isEqualTo("CONVERTIE");
        assertThat(dossier.getChantierGenereId()).isEqualTo("CH-1");
        assertThat(dossier.getStatus()).isEqualTo(StatutDossierEtude.CONVERTIE);
        // AC-10 — rien du cote contractuel : aucun marche n'a ete memorise.
        assertThat(dossier.getMarcheGenereId()).isNull();

        ArgumentCaptor<ChainageAvalPort.ConversionCommand> cap =
                ArgumentCaptor.forClass(ChainageAvalPort.ConversionCommand.class);
        verify(chainageAvalPort).convert(cap.capture());
        assertThat(cap.getValue().montantHt()).isEqualByComparingTo("100000");
        assertThat(cap.getValue().clientId()).isEqualTo("client-1");
        // AC-13 — code chantier, date de demarrage et duree portes tels quels ; aucune zone.
        assertThat(cap.getValue().chantierCode()).isEqualTo("CH-2026-009");
        assertThat(cap.getValue().dateDemarrage()).isEqualTo(LocalDate.of(2026, 9, 1));
        assertThat(cap.getValue().dureeMois()).isEqualTo(8);
        // AC-9/AC-10 — le snapshot commercial est transmis : provenance DEVIS, vente initiale
        // cohérente avec le devis accepté, déboursé initial et date d'acceptation.
        assertThat(cap.getValue().devisId()).isEqualTo(DEVIS_ID);
        assertThat(cap.getValue().devisNumero()).isEqualTo("DV-2026-0002");
        assertThat(cap.getValue().devisVersion()).isEqualTo(3);
        assertThat(cap.getValue().sourceVente()).isEqualTo("DEVIS");
        assertThat(cap.getValue().montantVenteInitialHt()).isEqualByComparingTo("100000");
        assertThat(cap.getValue().montantVenteInitialHt()).isEqualByComparingTo(cap.getValue().montantHt());
        assertThat(cap.getValue().dateAcceptation()).isEqualTo(LocalDate.of(2026, 8, 1));
    }

    /** AC-10 — toute divergence entre montant, total devis et somme de l'arbre bloque la conversion. */
    @Test
    void convertir_snapshotIncoherent_refuseAvantTouteCreation() {
        DossierEtude dossier = dossier(StatutDossierEtude.GAGNE);
        dossier.setClientId("client-1");
        dossier.setClientNom("MOA");
        dossier.setMontantAttribue(new BigDecimal("100000"));
        dossier.setDevisGenereId(DEVIS_ID);
        dossier.setDpgfId(DPGF_ID);
        // Le devis accepté vaut 737106 mais le montant attribué 100000 : divergence AC-10.
        Devis devis = devis(Devis.STATUS_APPROUVE, new BigDecimal("737106.00"));
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT))
                .thenReturn(noeudsSomme(new BigDecimal("100000")));

        assertThatThrownBy(() -> service.convertir(DOSSIER_ID, new DossierConvertirDto()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("snapshot_vente_incoherent");
        // Rien n'a été créé : le port n'est jamais appelé et l'étude reste GAGNE.
        verify(chainageAvalPort, never()).convert(any());
        assertThat(dossier.getStatus()).isEqualTo(StatutDossierEtude.GAGNE);
        assertThat(dossier.getChantierGenereId()).isNull();
    }

    /** AC-9 — une étude gagnée sans devis lié ne peut pas produire un chantier issu d'étude. */
    @Test
    void convertir_sansDevisLie_refuse() {
        DossierEtude dossier = dossier(StatutDossierEtude.GAGNE);
        dossier.setClientId("client-1");
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> service.convertir(DOSSIER_ID, new DossierConvertirDto()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("convertir_sans_devis");
        verify(chainageAvalPort, never()).convert(any());
    }

    /** AC-7 — depuis un statut autre que GAGNE, refus avec un message metier. */
    @Test
    void convertir_horsEtat_refuse() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));

        assertThatThrownBy(() -> service.convertir(DOSSIER_ID, new DossierConvertirDto()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("convertir_hors_etat");
        verify(chainageAvalPort, never()).convert(any());
    }

    /**
     * AC-9 — rejouer sur une etude deja convertie renvoie le chantier deja cree. Un seul
     * comportement : ni second chantier, ni refus.
     */
    @Test
    void convertir_rejoue_renvoieLeChantierDejaCree() {
        DossierEtude dossier = dossier(StatutDossierEtude.CONVERTIE);
        dossier.setChantierGenereId("CH-EXIST");
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));

        DossierConversionResultDto result = service.convertir(DOSSIER_ID, new DossierConvertirDto());

        assertThat(result.getChantierId()).isEqualTo("CH-EXIST");
        assertThat(result.getStatus()).isEqualTo("CONVERTIE");
        assertThat(dossier.getStatus()).isEqualTo(StatutDossierEtude.CONVERTIE);
        verify(chainageAvalPort, never()).convert(any());
    }

    @Test
    void convertir_rejoue_clotureLaDemandeMoteurResiduelle() {
        DossierEtude dossier = dossier(StatutDossierEtude.CONVERTIE);
        dossier.setChantierGenereId("CH-EXIST");
        dossier.setApprovalRequestId("apr-walk");
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(approvalPort.isAvailable()).thenReturn(true);

        DossierConversionResultDto result = service.convertir(DOSSIER_ID, new DossierConvertirDto());

        assertThat(result.getChantierId()).isEqualTo("CH-EXIST");
        verify(approvalPort).cloreApprouvee(eq("apr-walk"), any(), any(), eq("Étude déjà convertie"));
        verify(chainageAvalPort, never()).convert(any());
    }

    /**
     * AC-12 — un poste sans lot parent arrete la conversion AVANT toute creation, et est nomme.
     * Le port n'est jamais appele : ni chantier, ni arbre, ni budget.
     */
    @Test
    void convertir_posteOrphelin_arreteAvantTouteCreationEtLeNomme() {
        DossierEtude dossier = dossierAvecDpgf();
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT))
                .thenReturn(noeudsAvecUnOrphelin());

        assertThatThrownBy(() -> service.convertir(DOSSIER_ID, new DossierConvertirDto()))
                .isInstanceOf(PostesOrphelinsException.class)
                .satisfies(ex -> {
                    PostesOrphelinsException orph = (PostesOrphelinsException) ex;
                    assertThat(orph.getPostes()).hasSize(1);
                    assertThat(orph.getPostes().get(0).code()).isEqualTo("A-ORPH");
                    assertThat(orph.getPostes().get(0).designation()).isEqualTo("Poste sans lot");
                    assertThat(orph.getLotsDisponibles()).extracting("code").containsExactly("L01");
                });

        verify(chainageAvalPort, never()).convert(any());
        // Abandon : rien n'a ete cree, l'etude reste GAGNE.
        assertThat(dossier.getStatus()).isEqualTo(StatutDossierEtude.GAGNE);
        assertThat(dossier.getChantierGenereId()).isNull();
    }

    /** AC-12 — place sur un lot existant du devis, la conversion reprend et aboutit. */
    @Test
    void convertir_posteOrphelin_placeSurUnLotExistant_aboutit() {
        DossierEtude dossier = dossierAvecDpgf();
        Devis devis = devis(Devis.STATUS_APPROUVE, new BigDecimal("15500"));
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT))
                .thenReturn(noeudsAvecUnOrphelin());
        when(parametres.tvaTauxDefaut()).thenReturn(new BigDecimal("20"));
        when(chainageAvalPort.convert(any()))
                .thenReturn(new ChainageAvalPort.ConversionResult("CH-2"));

        PlacementPosteOrphelinDto placement = new PlacementPosteOrphelinDto();
        placement.setPosteId(ORPHELIN_ID);
        placement.setLotCode("L01");
        DossierConvertirDto body = new DossierConvertirDto();
        body.setPlacementsPostesOrphelins(List.of(placement));

        DossierConversionResultDto result = service.convertir(DOSSIER_ID, body);

        assertThat(result.getChantierId()).isEqualTo("CH-2");
        ArgumentCaptor<ChainageAvalPort.ConversionCommand> cap =
                ArgumentCaptor.forClass(ChainageAvalPort.ConversionCommand.class);
        verify(chainageAvalPort).convert(cap.capture());
        ChainageAvalPort.LotProjection orphelin = cap.getValue().lots().stream()
                .filter(l -> ORPHELIN_ID.equals(l.dpgfNoeudId()))
                .findFirst()
                .orElseThrow();
        assertThat(orphelin.parentCode()).isEqualTo("L01");
    }

    /**
     * AC-12 — le lot d'accueil cree par l'humain ne vient pas du devis : il part sans origine,
     * donc interne (AC-3), et accueille le poste.
     */
    @Test
    void convertir_posteOrphelin_placeDansUnLotDAccueilCree_aboutit() {
        DossierEtude dossier = dossierAvecDpgf();
        Devis devis = devis(Devis.STATUS_APPROUVE, new BigDecimal("15500"));
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT))
                .thenReturn(noeudsAvecUnOrphelin());
        when(parametres.tvaTauxDefaut()).thenReturn(new BigDecimal("20"));
        when(chainageAvalPort.convert(any()))
                .thenReturn(new ChainageAvalPort.ConversionResult("CH-3"));

        PlacementPosteOrphelinDto placement = new PlacementPosteOrphelinDto();
        placement.setPosteId(ORPHELIN_ID);
        placement.setNouveauLotCode("L99");
        placement.setNouveauLotDesignation("Divers");
        DossierConvertirDto body = new DossierConvertirDto();
        body.setPlacementsPostesOrphelins(List.of(placement));

        service.convertir(DOSSIER_ID, body);

        ArgumentCaptor<ChainageAvalPort.ConversionCommand> cap =
                ArgumentCaptor.forClass(ChainageAvalPort.ConversionCommand.class);
        verify(chainageAvalPort).convert(cap.capture());
        ChainageAvalPort.LotProjection accueil = cap.getValue().lots().stream()
                .filter(l -> "L99".equals(l.code()))
                .findFirst()
                .orElseThrow();
        assertThat(accueil.dpgfNoeudId()).isNull();
        assertThat(accueil.type()).isEqualTo(DpgfNoeud.TYPE_LOT);
        assertThat(accueil.designation()).isEqualTo("Divers");
        ChainageAvalPort.LotProjection orphelin = cap.getValue().lots().stream()
                .filter(l -> ORPHELIN_ID.equals(l.dpgfNoeudId()))
                .findFirst()
                .orElseThrow();
        assertThat(orphelin.parentCode()).isEqualTo("L99");
    }

    /** AC-D2 — libellé chantier obligatoire quand envoyé explicitement vide. */
    @Test
    void convertir_libelleVide_refuse() {
        DossierEtude dossier = dossierAvecDpgf();
        Devis devis = devis(Devis.STATUS_APPROUVE, new BigDecimal("15500"));
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
        when(devisRepository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        when(noeudRepository.findByDpgfIdAndTenantIdOrderByOrdreAsc(DPGF_ID, TENANT))
                .thenReturn(noeudsSomme(new BigDecimal("15500")));

        DossierConvertirDto body = new DossierConvertirDto();
        body.setChantierLabel("   ");

        assertThatThrownBy(() -> service.convertir(DOSSIER_ID, body))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("libelle_chantier_requis");
        verify(chainageAvalPort, never()).convert(any());
    }

    private DossierEtude dossierAvecDpgf() {
        DossierEtude dossier = dossier(StatutDossierEtude.GAGNE);
        dossier.setClientId("client-1");
        dossier.setClientNom("MOA");
        dossier.setDpgfId(DPGF_ID);
        dossier.setDevisGenereId(DEVIS_ID);
        // AC-10 — cohérent avec l'arbre (15000 + 500) et le total du devis.
        dossier.setMontantAttribue(new BigDecimal("15500"));
        return dossier;
    }

    /** Un arbre simple dont les articles somment exactement au montant donné (AC-10). */
    private static List<DpgfNoeud> noeudsSomme(BigDecimal total) {
        UUID lotId = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DpgfNoeud lot = DpgfNoeud.builder()
                .id(lotId)
                .tenantId(TENANT)
                .code("L01")
                .libelle("Gros oeuvre")
                .type(DpgfNoeud.TYPE_LOT)
                .ordre(0)
                .build();
        DpgfNoeud article = DpgfNoeud.builder()
                .id(UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"))
                .tenantId(TENANT)
                .parentId(lotId)
                .code("A-01")
                .libelle("Poste unique")
                .type(DpgfNoeud.TYPE_ARTICLE)
                .unite("U")
                .quantite(BigDecimal.ONE)
                .prixUnitaire(total)
                .total(total)
                .ordre(1)
                .build();
        return List.of(lot, article);
    }

    /** Un devis avec un lot, un article bien range dessous, et un article sans lot parent. */
    private static List<DpgfNoeud> noeudsAvecUnOrphelin() {
        UUID lotId = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
        DpgfNoeud lot = DpgfNoeud.builder()
                .id(lotId)
                .tenantId(TENANT)
                .code("L01")
                .libelle("Gros oeuvre")
                .type(DpgfNoeud.TYPE_LOT)
                .ordre(0)
                .build();
        DpgfNoeud article = DpgfNoeud.builder()
                .id(UUID.fromString("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee"))
                .tenantId(TENANT)
                .parentId(lotId)
                .code("A-01")
                .libelle("Beton")
                .type(DpgfNoeud.TYPE_ARTICLE)
                .unite("m3")
                .quantite(new BigDecimal("10"))
                .prixUnitaire(new BigDecimal("1500"))
                .total(new BigDecimal("15000"))
                .ordre(1)
                .build();
        DpgfNoeud orphelin = DpgfNoeud.builder()
                .id(ORPHELIN_ID)
                .tenantId(TENANT)
                .code("A-ORPH")
                .libelle("Poste sans lot")
                .type(DpgfNoeud.TYPE_ARTICLE)
                .unite("U")
                .quantite(BigDecimal.ONE)
                .prixUnitaire(new BigDecimal("500"))
                .total(new BigDecimal("500"))
                .ordre(2)
                .build();
        return List.of(lot, article, orphelin);
    }

    private static DossierEtude dossier(StatutDossierEtude status) {
        return DossierEtude.builder()
                .id(DOSSIER_ID)
                .tenantId(TENANT)
                .numero("ET-1")
                .objet("Affaire test")
                .status(status)
                .currentStep(5)
                .build();
    }

    private static DossierGagneDto gainStandard() {
        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setReferenceMarche("M-42");
        body.setDevisId(DEVIS_ID);
        body.setMontantAttribue(new BigDecimal("737106.00"));
        return body;
    }

    /** Un devis EMIS lié au dossier, total 737106 — valeurs discriminantes du contrat. */
    private static Devis devis(String statut) {
        return devis(statut, new BigDecimal("737106.00"));
    }

    /** Un devis EMIS lié au dossier avec un total HT donné (AC-3 / AC-4). */
    private static Devis devis(String statut, BigDecimal totalHt) {
        return Devis.builder()
                .id(DEVIS_ID)
                .tenantId(TENANT)
                .numero("DV-2026-0002")
                .version(3)
                .clientId("cli-001")
                .clientName("MOA")
                .objet("Affaire test")
                .dateEmission(LocalDate.of(2026, 7, 1))
                .dateValidite(LocalDate.of(2026, 10, 1))
                .conditionsPaiement("30/60/10")
                .totalHt(totalHt)
                .tvaTaux(new BigDecimal("20"))
                .totalTva(totalHt.multiply(new BigDecimal("0.20")).setScale(2, java.math.RoundingMode.HALF_UP))
                .totalTtc(totalHt.multiply(new BigDecimal("1.20")).setScale(2, java.math.RoundingMode.HALF_UP))
                .status(statut)
                .dossierEtudeId(DOSSIER_ID)
                .build();
    }
}
