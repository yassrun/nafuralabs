package ma.nafura.chantiers.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.domain.model.AvancementPhysique;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.domain.model.ChantierLot;
import ma.nafura.chantiers.domain.model.SituationLigne;
import ma.nafura.chantiers.domain.model.SituationTravaux;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.ChantierLotRepository;
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

@ExtendWith(MockitoExtension.class)
class SituationGenerationServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final String CHANTIER_ID = "ch-001";

    @Mock
    private SituationTravauxRepository situationRepository;

    @Mock
    private SituationLigneRepository ligneRepository;

    @Mock
    private AvancementPhysiqueRepository avancementRepository;

    @Mock
    private ChantierLotRepository lotRepository;

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

    @Test
    void generateBuildsDraftFromValidatedAvancementsAndPreviousSituation() {
        Chantier chantier = Chantier.builder()
                .id(CHANTIER_ID)
                .tenantId(TENANT_ID)
                .code("CH-2025-001")
                .label("Residence Yasmine")
                .tauxRg(new BigDecimal("7"))
                .tauxAvance(new BigDecimal("10"))
                .tauxTva(new BigDecimal("20"))
                .build();

        ChantierLot lot1 = ChantierLot.builder()
                .id("lot-1")
                .tenantId(TENANT_ID)
                .chantierId(CHANTIER_ID)
                .code("L01")
                .designation("Terrassement")
                .unite("m3")
                .quantite(new BigDecimal("1000"))
                .prixUnitaireHt(new BigDecimal("120"))
                .ordre(1)
                .build();

        ChantierLot lot2 = ChantierLot.builder()
                .id("lot-2")
                .tenantId(TENANT_ID)
                .chantierId(CHANTIER_ID)
                .code("L02")
                .designation("Fondations")
                .unite("m3")
                .quantite(new BigDecimal("500"))
                .prixUnitaireHt(new BigDecimal("200"))
                .ordre(2)
                .build();

        SituationTravaux previous = SituationTravaux.builder()
                .id("ch-001-sit-01")
                .tenantId(TENANT_ID)
                .chantierId(CHANTIER_ID)
                .numeroOrdre(1)
                .cumulCourantHt(new BigDecimal("50000"))
                .build();

        List<AvancementPhysique> validated = List.of(
                AvancementPhysique.builder()
                        .id("av-1")
                        .tenantId(TENANT_ID)
                        .chantierId(CHANTIER_ID)
                        .lotId("lot-1")
                        .dateSaisie(java.time.LocalDate.of(2026, 2, 15))
                        .quantiteRealisee(new BigDecimal("300"))
                        .status(AvancementPhysique.STATUS_VALIDE)
                        .build(),
                AvancementPhysique.builder()
                        .id("av-2")
                        .tenantId(TENANT_ID)
                        .chantierId(CHANTIER_ID)
                        .lotId("lot-1")
                        .dateSaisie(java.time.LocalDate.of(2026, 2, 20))
                        .quantiteRealisee(new BigDecimal("150"))
                        .status(AvancementPhysique.STATUS_VALIDE)
                        .build(),
                AvancementPhysique.builder()
                        .id("av-3")
                        .tenantId(TENANT_ID)
                        .chantierId(CHANTIER_ID)
                        .lotId("lot-2")
                        .dateSaisie(java.time.LocalDate.of(2026, 2, 25))
                        .quantiteRealisee(new BigDecimal("80"))
                        .status(AvancementPhysique.STATUS_VALIDE)
                        .build(),
                AvancementPhysique.builder()
                        .id("av-4")
                        .tenantId(TENANT_ID)
                        .chantierId(CHANTIER_ID)
                        .lotId("lot-2")
                        .dateSaisie(java.time.LocalDate.of(2026, 2, 28))
                        .quantiteRealisee(new BigDecimal("20"))
                        .status(AvancementPhysique.STATUS_BROUILLON)
                        .build());

        when(chantierService.getById(CHANTIER_ID)).thenReturn(chantier);
        when(situationRepository.findByTenantIdAndChantierIdAndNumeroOrdre(TENANT_ID, CHANTIER_ID, 2))
                .thenReturn(Optional.empty());
        when(lotRepository.findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(TENANT_ID, CHANTIER_ID))
                .thenReturn(List.of(lot1, lot2));
        when(avancementRepository.findByTenantIdAndChantierIdAndStatusOrderByDateSaisieAscCreatedAtAsc(
                        TENANT_ID, CHANTIER_ID, AvancementPhysique.STATUS_VALIDE))
                .thenReturn(validated.stream()
                        .filter(row -> AvancementPhysique.STATUS_VALIDE.equals(row.getStatus()))
                        .toList());
        when(situationRepository.findByTenantIdAndChantierIdAndNumeroOrdre(TENANT_ID, CHANTIER_ID, 1))
                .thenReturn(Optional.of(previous));
        when(ligneRepository.findByTenantIdAndSituationIdOrderByOrdreAsc(TENANT_ID, previous.getId()))
                .thenReturn(List.of(
                        SituationLigne.builder()
                                .lotId("lot-1")
                                .quantiteCumulee(new BigDecimal("200"))
                                .build(),
                        SituationLigne.builder()
                                .lotId("lot-2")
                                .quantiteCumulee(new BigDecimal("50"))
                                .build()));
        when(situationRepository.save(any(SituationTravaux.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));
        when(ligneRepository.save(any(SituationLigne.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        SituationTravaux generated = service.generate(CHANTIER_ID, 2);

        assertNotNull(generated);
        assertEquals("ch-001-sit-02", generated.getId());
        assertEquals("SIT-2025-001-02", generated.getNumero());
        assertEquals(SituationTravaux.STATUS_BROUILLON, generated.getStatus());
        assertEquals(new BigDecimal("50000.00"), generated.getCumulPrecedentHt());
        assertEquals(new BigDecimal("70000.00"), generated.getCumulCourantHt());
        assertEquals(new BigDecimal("20000.00"), generated.getTravauxPeriodeHt());
        assertEquals(new BigDecimal("1400.00"), generated.getRetenueGarantieMontant());
        assertEquals(new BigDecimal("1000.00"), generated.getRetenueAvanceMontant());
        assertEquals(new BigDecimal("17600.00"), generated.getNetAPayerHt());
        assertEquals(new BigDecimal("21120.00"), generated.getNetAPayerTtc());

        ArgumentCaptor<SituationLigne> ligneCaptor = ArgumentCaptor.forClass(SituationLigne.class);
        verify(ligneRepository, org.mockito.Mockito.times(2)).save(ligneCaptor.capture());
        List<SituationLigne> savedLignes = ligneCaptor.getAllValues();
        assertEquals(new BigDecimal("450"), savedLignes.get(0).getQuantiteCumulee());
        assertEquals(new BigDecimal("200"), savedLignes.get(0).getQuantitePrecedente());
        assertEquals(new BigDecimal("54000.00"), savedLignes.get(0).getMontantHt());
        assertEquals(new BigDecimal("80"), savedLignes.get(1).getQuantiteCumulee());
        assertEquals(new BigDecimal("50"), savedLignes.get(1).getQuantitePrecedente());
        assertEquals(new BigDecimal("16000.00"), savedLignes.get(1).getMontantHt());
    }

    @Test
    void generateRejectsDuplicateNumeroOrdre() {
        when(chantierService.getById(CHANTIER_ID)).thenReturn(Chantier.builder().id(CHANTIER_ID).build());
        when(situationRepository.findByTenantIdAndChantierIdAndNumeroOrdre(TENANT_ID, CHANTIER_ID, 1))
                .thenReturn(Optional.of(SituationTravaux.builder().id("existing").build()));

        assertThrows(IllegalStateException.class, () -> service.generate(CHANTIER_ID, 1));
        verify(lotRepository, never()).findByTenantIdAndChantierIdOrderByOrdreAscCodeAsc(any(), any());
    }

    @Test
    void computeValidatedCumulsIgnoresNonValidatedRows() {
        when(avancementRepository.findByTenantIdAndChantierIdAndStatusOrderByDateSaisieAscCreatedAtAsc(
                        TENANT_ID, CHANTIER_ID, AvancementPhysique.STATUS_VALIDE))
                .thenReturn(List.of(
                        AvancementPhysique.builder()
                                .lotId("lot-1")
                                .quantiteRealisee(new BigDecimal("10"))
                                .build(),
                        AvancementPhysique.builder()
                                .lotId("lot-1")
                                .quantiteRealisee(new BigDecimal("5"))
                                .build()));

        var cumuls = service.computeValidatedCumuls(TENANT_ID, CHANTIER_ID);

        assertEquals(new BigDecimal("15"), cumuls.get("lot-1"));
        verify(avancementRepository)
                .findByTenantIdAndChantierIdAndStatusOrderByDateSaisieAscCreatedAtAsc(
                        eq(TENANT_ID), eq(CHANTIER_ID), eq(AvancementPhysique.STATUS_VALIDE));
    }
}
