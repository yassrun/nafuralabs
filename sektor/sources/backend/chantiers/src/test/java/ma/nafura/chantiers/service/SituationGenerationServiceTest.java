package ma.nafura.chantiers.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.attachement.AttachementChantier;
import ma.nafura.chantiers.domain.attachement.AttachementLigne;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.situation.SituationLigne;
import ma.nafura.chantiers.domain.situation.SituationTravaux;
import ma.nafura.chantiers.repository.AttachementChantierRepository;
import ma.nafura.chantiers.repository.AttachementLigneRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.chantiers.repository.SituationLigneRepository;
import ma.nafura.chantiers.repository.SituationTravauxRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * Contrat {@code situation-et-retenues} — AC-1 à AC-12. Les scénarios e2e nommés dans le contrat
 * vivent sous SEKTOR-158 ; ce test couvre le service en isolation.
 */
@ExtendWith(MockitoExtension.class)
class SituationGenerationServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final String CHANTIER_ID = "ch-001";

    @Mock
    private SituationTravauxRepository situationRepository;

    @Mock
    private SituationLigneRepository ligneRepository;

    @Mock
    private AttachementChantierRepository attachementRepository;

    @Mock
    private AttachementLigneRepository attachementLigneRepository;

    @Mock
    private ChantierLotRepository lotRepository;

    @Mock
    private PosteBudgetaireRepository posteRepository;

    @Mock
    private ChantierService chantierService;

    @InjectMocks
    private SituationGenerationService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        TenantContext.setTenantEnabled(true);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Chantier chantier() {
        return Chantier.builder()
                .id(CHANTIER_ID)
                .tenantId(TENANT_ID)
                .code("CH-2025-001")
                .label("Residence Yasmine")
                .tauxRg(new BigDecimal("7"))
                .tauxAvance(new BigDecimal("10"))
                .tauxTva(new BigDecimal("20"))
                .tauxRas(new BigDecimal("5"))
                .build();
    }

    /** AC-1, AC-2, AC-3 — les lignes viennent des attachements signés, groupées par nœud. */
    @Test
    void generateBuildsDraftFromSignedAttachements() {
        Chantier chantier = chantier();

        AttachementChantier attachement = AttachementChantier.builder()
                .id("att-1")
                .tenantId(TENANT_ID)
                .chantierId(CHANTIER_ID)
                .status(AttachementChantier.STATUS_SIGNE_MOE)
                .dateDebut(LocalDate.of(2026, 2, 1))
                .dateFin(LocalDate.of(2026, 2, 28))
                .build();

        AttachementLigne ligne1 = AttachementLigne.builder()
                .id("att-1-l-0")
                .tenantId(TENANT_ID)
                .attachementId("att-1")
                .noeudId("poste-vendu")
                .quantitePeriode(new BigDecimal("100"))
                .ordre(0)
                .build();

        when(chantierService.getById(CHANTIER_ID)).thenReturn(chantier);
        when(situationRepository.findByTenantIdAndChantierIdAndNumeroOrdre(TENANT_ID, CHANTIER_ID, 1))
                .thenReturn(Optional.empty());
        when(attachementRepository.findByTenantIdAndChantierIdAndStatusInAndSituationIdIsNullOrderByDateDebutAsc(
                        TENANT_ID, CHANTIER_ID, AttachementChantier.STATUTS_FIGES))
                .thenReturn(List.of(attachement));
        when(attachementLigneRepository.findByTenantIdAndAttachementIdInOrderByOrdreAsc(TENANT_ID, List.of("att-1")))
                .thenReturn(List.of(ligne1));
        // AC-2 — un poste vendu sous un lot d'accueil interne : résolu via le repository poste.
        when(posteRepository.findByIdAndTenantId("poste-vendu", TENANT_ID))
                .thenReturn(Optional.of(PosteBudgetaire.builder()
                        .id("poste-vendu")
                        .code("P01")
                        .designation("Gros œuvre")
                        .unite("m3")
                        .prixUnitaireHt(new BigDecimal("120"))
                        .build()));
        when(situationRepository.save(any(SituationTravaux.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(ligneRepository.save(any(SituationLigne.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(attachementRepository.save(any(AttachementChantier.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SituationTravaux generated = service.generate(CHANTIER_ID, 1);

        assertNotNull(generated);
        assertEquals("ch-001-sit-01", generated.getId());
        assertEquals(LocalDate.of(2026, 2, 1), generated.getDatePeriodeDebut());
        assertEquals(LocalDate.of(2026, 2, 28), generated.getDatePeriodeFin());
        // 100 x 120
        assertEquals(new BigDecimal("12000.00"), generated.getTravauxPeriodeHt());
        assertEquals(new BigDecimal("12000.00"), generated.getCumulCourantHt());

        ArgumentCaptor<SituationLigne> ligneCaptor = ArgumentCaptor.forClass(SituationLigne.class);
        verify(ligneRepository).save(ligneCaptor.capture());
        SituationLigne savedLigne = ligneCaptor.getValue();
        assertEquals("poste-vendu", savedLigne.getNoeudId());
        assertEquals("P01", savedLigne.getCode());
        assertEquals(new BigDecimal("100"), savedLigne.getQuantitePeriode());
        assertEquals(new BigDecimal("12000.00"), savedLigne.getMontantHt());

        // AC-4 — l'attachement consommé est marqué, jamais réutilisable par une situation suivante.
        ArgumentCaptor<AttachementChantier> attCaptor = ArgumentCaptor.forClass(AttachementChantier.class);
        verify(attachementRepository).save(attCaptor.capture());
        assertEquals(generated.getId(), attCaptor.getValue().getSituationId());
    }

    /** AC-5 — pas d'attachement signé disponible : refus, pas de situation vide. */
    @Test
    void generateRefuseSansAttachementSigneDisponible() {
        when(chantierService.getById(CHANTIER_ID)).thenReturn(chantier());
        when(situationRepository.findByTenantIdAndChantierIdAndNumeroOrdre(TENANT_ID, CHANTIER_ID, 1))
                .thenReturn(Optional.empty());
        when(attachementRepository.findByTenantIdAndChantierIdAndStatusInAndSituationIdIsNullOrderByDateDebutAsc(
                        TENANT_ID, CHANTIER_ID, AttachementChantier.STATUTS_FIGES))
                .thenReturn(List.of());

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.generate(CHANTIER_ID, 1));
        assertEquals("chantiers.situation.aucun_attachement_signe: " + CHANTIER_ID, ex.getMessage());
        verify(situationRepository, never()).save(any());
    }

    @Test
    void generateRejectsDuplicateNumeroOrdre() {
        when(chantierService.getById(CHANTIER_ID)).thenReturn(Chantier.builder().id(CHANTIER_ID).build());
        when(situationRepository.findByTenantIdAndChantierIdAndNumeroOrdre(TENANT_ID, CHANTIER_ID, 1))
                .thenReturn(Optional.of(SituationTravaux.builder().id("existing").build()));

        assertThrows(IllegalStateException.class, () -> service.generate(CHANTIER_ID, 1));
        verify(attachementRepository, never())
                .findByTenantIdAndChantierIdAndStatusInAndSituationIdIsNullOrderByDateDebutAsc(any(), any(), any());
    }

    /** AC-6 — deux nœuds distincts sommés séparément, montant lu sur le lot-feuille. */
    @Test
    void generateSommeParNoeudEtLitLeLot() {
        Chantier chantier = chantier();
        AttachementChantier attachement = AttachementChantier.builder()
                .id("att-1")
                .tenantId(TENANT_ID)
                .chantierId(CHANTIER_ID)
                .status(AttachementChantier.STATUS_SIGNE_MOE)
                .dateDebut(LocalDate.of(2026, 2, 1))
                .dateFin(LocalDate.of(2026, 2, 28))
                .build();
        AttachementLigne ligneA = AttachementLigne.builder()
                .id("l-a")
                .tenantId(TENANT_ID)
                .attachementId("att-1")
                .noeudId("lot-1")
                .quantitePeriode(new BigDecimal("30"))
                .ordre(0)
                .build();
        AttachementLigne ligneB = AttachementLigne.builder()
                .id("l-b")
                .tenantId(TENANT_ID)
                .attachementId("att-1")
                .noeudId("lot-1")
                .quantitePeriode(new BigDecimal("20"))
                .ordre(1)
                .build();

        when(chantierService.getById(CHANTIER_ID)).thenReturn(chantier);
        when(situationRepository.findByTenantIdAndChantierIdAndNumeroOrdre(TENANT_ID, CHANTIER_ID, 1))
                .thenReturn(Optional.empty());
        when(attachementRepository.findByTenantIdAndChantierIdAndStatusInAndSituationIdIsNullOrderByDateDebutAsc(
                        TENANT_ID, CHANTIER_ID, AttachementChantier.STATUTS_FIGES))
                .thenReturn(List.of(attachement));
        when(attachementLigneRepository.findByTenantIdAndAttachementIdInOrderByOrdreAsc(TENANT_ID, List.of("att-1")))
                .thenReturn(List.of(ligneA, ligneB));
        when(posteRepository.findByIdAndTenantId("lot-1", TENANT_ID)).thenReturn(Optional.empty());
        when(lotRepository.findByIdAndTenantId("lot-1", TENANT_ID))
                .thenReturn(Optional.of(ChantierLot.builder()
                        .id("lot-1")
                        .code("L01")
                        .designation("Terrassement")
                        .unite("m3")
                        .prixUnitaireHt(new BigDecimal("10"))
                        .build()));
        when(situationRepository.save(any(SituationTravaux.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(ligneRepository.save(any(SituationLigne.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(attachementRepository.save(any(AttachementChantier.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SituationTravaux generated = service.generate(CHANTIER_ID, 1);

        ArgumentCaptor<SituationLigne> ligneCaptor = ArgumentCaptor.forClass(SituationLigne.class);
        verify(ligneRepository).save(ligneCaptor.capture());
        assertEquals(new BigDecimal("50"), ligneCaptor.getValue().getQuantitePeriode());
        assertEquals(new BigDecimal("500.00"), ligneCaptor.getValue().getMontantHt());
        assertEquals(new BigDecimal("500.00"), generated.getTravauxPeriodeHt());
    }

    /** AC-8, AC-9, AC-10 — cascade pénalités puis RG/avance (assiette réduite) puis TVA puis RAS. */
    @Test
    void computeFinancialTotalsAppliesFixedCascade() {
        SituationGenerationService.FinancialTotals totals = SituationGenerationService.computeFinancialTotals(
                new BigDecimal("20000.00"),
                new BigDecimal("1000.00"),
                new BigDecimal("7"),
                new BigDecimal("10"),
                new BigDecimal("20"),
                new BigDecimal("5"));

        // assiette = 20000 - 1000 = 19000 ; RG = 7% = 1330 ; avance = 10% = 1900
        assertEquals(new BigDecimal("1330.00"), totals.retenueGarantieMontant());
        assertEquals(new BigDecimal("1900.00"), totals.retenueAvanceMontant());
        // net HT = 20000 - 1000 - 1330 - 1900 = 15770
        assertEquals(new BigDecimal("15770.00"), totals.netAPayerHt());
        // net TTC = 15770 x 1.20 = 18924
        assertEquals(new BigDecimal("18924.00"), totals.netAPayerTtc());
        // RAS = 5% de 18924, informative — ne réduit jamais le net TTC ci-dessus (AC-11).
        assertEquals(new BigDecimal("946.20"), totals.rasMontant());
    }

    /** AC-12 — sans pénalités ni RAS, la cascade reste calculable, RAS à zéro. */
    @Test
    void computeFinancialTotalsAtZeroPenalitesEtRas() {
        SituationGenerationService.FinancialTotals totals = SituationGenerationService.computeFinancialTotals(
                new BigDecimal("10000.00"), BigDecimal.ZERO, new BigDecimal("7"), new BigDecimal("10"),
                new BigDecimal("20"), null);

        assertEquals(BigDecimal.ZERO.setScale(2), totals.penalitesRetardHt());
        assertEquals(BigDecimal.ZERO.setScale(2), totals.rasMontant());
        assertNotNull(totals.netAPayerTtc());
    }
}
