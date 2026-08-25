package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.lenient;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
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
import ma.nafura.etudes.service.DossierEtudeService.PostesOrphelinsException;
import ma.nafura.etudes.service.port.bc.ChainageAvalPort;
import ma.nafura.etudes.service.port.capability.EtudeApprovalPort;
import ma.nafura.etudes.service.port.bc.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
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
                List.of());
        lenient()
                .when(repository.save(any(DossierEtude.class)))
                .thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void gagne_depuisDevisGenere() {
        DossierEtude dossier = dossier(StatutDossierEtude.DEVIS_GENERE);
        when(repository.findByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));

        DossierGagneDto body = new DossierGagneDto();
        body.setDateAttribution(LocalDate.of(2026, 8, 1));
        body.setReferenceMarche("M-42");
        body.setMontantAttribue(new BigDecimal("150000"));

        DossierEtude out = service.gagne(DOSSIER_ID, body);
        assertThat(out.getStatus()).isEqualTo(StatutDossierEtude.GAGNE);
        assertThat(out.getReferenceMarche()).isEqualTo("M-42");
        assertThat(out.getMontantAttribue()).isEqualByComparingTo("150000");
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
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
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
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
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
        when(repository.lockByIdAndTenantId(DOSSIER_ID, TENANT)).thenReturn(Optional.of(dossier));
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

    private DossierEtude dossierAvecDpgf() {
        DossierEtude dossier = dossier(StatutDossierEtude.GAGNE);
        dossier.setClientId("client-1");
        dossier.setClientNom("MOA");
        dossier.setDpgfId(DPGF_ID);
        dossier.setMontantAttribue(new BigDecimal("100000"));
        return dossier;
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
}
