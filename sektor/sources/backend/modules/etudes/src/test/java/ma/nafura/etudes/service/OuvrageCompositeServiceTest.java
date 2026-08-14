package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.ReferenceType;
import ma.nafura.etudes.domain.model.ComposantOuvrage;
import ma.nafura.etudes.domain.model.Ouvrage;
import ma.nafura.etudes.domain.model.UniteMain;
import ma.nafura.etudes.repository.OuvrageRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

/**
 * L10 — récursion déboursé, anti marge-sur-marge, cycle, profondeur.
 */
@ExtendWith(MockitoExtension.class)
class OuvrageCompositeServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001");

    @Mock
    private OuvrageRepository ouvrageRepository;

    private DpuCalculator calculator;
    private OuvrageCompositeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        calculator = new DpuCalculator();
        service = new OuvrageCompositeService(ouvrageRepository, calculator);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void cloison_remonteDebourseMortier_fgMargeUneFoisAuSommet() {
        // Mortier : 100 DH déboursé, FG 10%, marge 10% → vente 120
        UUID mortierId = UUID.randomUUID();
        Ouvrage mortier = flat("MOR", "Mortier", mortierId, "100.00", "10", "10");

        // Cloison : 1 × mortier (déboursé) + 50 DH libre
        UUID cloisonId = UUID.randomUUID();
        Ouvrage cloison = Ouvrage.builder()
                .id(cloisonId)
                .tenantId(TENANT_ID)
                .code("CLO")
                .designation("Cloison")
                .category("MAC_ELEV")
                .codeLot("GROS_OEUVRE")
                .codeFamille("MAC_ELEV")
                .origine("SAISIE")
                .unite("m²")
                .fraisGenerauxPercent(new BigDecimal("10"))
                .beneficePercent(new BigDecimal("10"))
                .uniteMain(UniteMain.builder()
                        .heures(BigDecimal.ZERO)
                        .tauxHoraire(BigDecimal.ZERO)
                        .total(BigDecimal.ZERO)
                        .build())
                .composants(new ArrayList<>(List.of(
                        ouvrageRef(mortierId, "1", false),
                        libre("Enduit", "50.00"))))
                .build();

        when(ouvrageRepository.findByIdAndTenantId(eq(mortierId), eq(TENANT_ID)))
                .thenReturn(Optional.of(mortier));

        BigDecimal debourse = service.computeDebourse(cloison, 0);
        // 100 (mortier deboursé) + 50 = 150 — pas 120
        assertThat(debourse).isEqualByComparingTo("150.00");

        BigDecimal vente = calculator.computePrixVenteHt(
                debourse, cloison.getFraisGenerauxPercent(), cloison.getBeneficePercent());
        // 150 × 1.20 = 180
        assertThat(vente).isEqualByComparingTo("180.00");
    }

    @Test
    void antiMargeSurMarge_compositeIdentiqueAplat() {
        UUID cimentId = UUID.randomUUID();
        // B = ciment 40 + sable 60 = 100 déboursé
        Ouvrage b = Ouvrage.builder()
                .id(cimentId)
                .tenantId(TENANT_ID)
                .code("B")
                .designation("Mortier B")
                .category("DIVERS")
                .codeLot("GROS_OEUVRE")
                .codeFamille("DIVERS")
                .origine("SAISIE")
                .unite("m³")
                .fraisGenerauxPercent(new BigDecimal("20"))
                .beneficePercent(new BigDecimal("10"))
                .uniteMain(zeroMo())
                .composants(new ArrayList<>(List.of(
                        libre("Ciment", "40.00"),
                        libre("Sable", "60.00"))))
                .build();

        when(ouvrageRepository.findByIdAndTenantId(eq(cimentId), eq(TENANT_ID)))
                .thenReturn(Optional.of(b));

        Ouvrage composite = Ouvrage.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .code("A")
                .designation("Cloison A")
                .category("DIVERS")
                .codeLot("GROS_OEUVRE")
                .codeFamille("DIVERS")
                .origine("SAISIE")
                .unite("m²")
                .fraisGenerauxPercent(new BigDecimal("8"))
                .beneficePercent(new BigDecimal("7"))
                .uniteMain(zeroMo())
                .composants(new ArrayList<>(List.of(
                        ouvrageRef(cimentId, "1", false),
                        libre("Main", "20.00"))))
                .build();

        Ouvrage aplati = Ouvrage.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .code("A-FLAT")
                .designation("Cloison aplatie")
                .category("DIVERS")
                .codeLot("GROS_OEUVRE")
                .codeFamille("DIVERS")
                .origine("SAISIE")
                .unite("m²")
                .fraisGenerauxPercent(new BigDecimal("8"))
                .beneficePercent(new BigDecimal("7"))
                .uniteMain(zeroMo())
                .composants(new ArrayList<>(List.of(
                        libre("Ciment", "40.00"),
                        libre("Sable", "60.00"),
                        libre("Main", "20.00"))))
                .build();

        BigDecimal debComposite = service.computeDebourse(composite, 0);
        BigDecimal debAplat = service.computeDebourse(aplati, 0);
        assertThat(debComposite).isEqualByComparingTo(debAplat);
        assertThat(debComposite).isEqualByComparingTo("120.00");

        BigDecimal venteComposite = calculator.computePrixVenteHt(debComposite, new BigDecimal("8"), new BigDecimal("7"));
        BigDecimal venteAplat = calculator.computePrixVenteHt(debAplat, new BigDecimal("8"), new BigDecimal("7"));
        assertThat(venteComposite).isEqualByComparingTo(venteAplat);
    }

    @Test
    void inclureFraisEtMarge_sousTraitanceRemontePrixVente() {
        UUID stId = UUID.randomUUID();
        // Sous-traitant : déboursé 100, FG 10%, marge 10% → vente 120
        Ouvrage st = flat("ST", "Sous-traitance", stId, "100.00", "10", "10");
        when(ouvrageRepository.findByIdAndTenantId(eq(stId), eq(TENANT_ID)))
                .thenReturn(Optional.of(st));

        BigDecimal puDebours = service.prixUnitaireEffectif(stId, false, 1);
        BigDecimal puVente = service.prixUnitaireEffectif(stId, true, 1);
        assertThat(puDebours).isEqualByComparingTo("100.00");
        assertThat(puVente).isEqualByComparingTo("120.00");
    }

    @Test
    void assertAcyclic_refuseCycleA_B_A() {
        UUID aId = UUID.randomUUID();
        UUID bId = UUID.randomUUID();
        Ouvrage a = Ouvrage.builder()
                .id(aId)
                .tenantId(TENANT_ID)
                .code("A")
                .designation("Ouvrage A")
                .category("DIVERS")
                .codeLot("GROS_OEUVRE")
                .codeFamille("DIVERS")
                .origine("SAISIE")
                .unite("u")
                .composants(new ArrayList<>(List.of(ouvrageRef(bId, "1", false))))
                .uniteMain(zeroMo())
                .build();
        Ouvrage b = Ouvrage.builder()
                .id(bId)
                .tenantId(TENANT_ID)
                .code("B")
                .designation("Ouvrage B")
                .category("DIVERS")
                .codeLot("GROS_OEUVRE")
                .codeFamille("DIVERS")
                .origine("SAISIE")
                .unite("u")
                .composants(new ArrayList<>(List.of(ouvrageRef(aId, "1", false))))
                .uniteMain(zeroMo())
                .build();

        when(ouvrageRepository.findByIdAndTenantId(eq(aId), eq(TENANT_ID))).thenReturn(Optional.of(a));
        when(ouvrageRepository.findByIdAndTenantId(eq(bId), eq(TENANT_ID))).thenReturn(Optional.of(b));

        assertThatThrownBy(() -> service.assertAcyclic(aId, List.of(bId)))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("etudes.ouvrage.cycle")
                .hasMessageContaining("A")
                .hasMessageContaining("B");
    }

    @Test
    void assertAcyclic_profondeur5Acceptee_6Refusee() {
        // Chaîne N0 → N1 → N2 → N3 → N4 → N5 (5 arêtes depuis le parent) : OK
        UUID[] ok = chainIds(6);
        stubChain(ok, 5); // leaf = last index, no further child
        service.assertAcyclic(ok[0], List.of(ok[1]));

        // Chaîne N0 → … → N6 (6 arêtes) : refusée
        UUID[] tooDeep = chainIds(7);
        stubChain(tooDeep, 6);
        assertThatThrownBy(() -> service.assertAcyclic(tooDeep[0], List.of(tooDeep[1])))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("etudes.ouvrage.profondeur.max");
    }

    private UUID[] chainIds(int length) {
        UUID[] ids = new UUID[length];
        for (int i = 0; i < length; i++) {
            ids[i] = UUID.randomUUID();
        }
        return ids;
    }

    /** Stub ouvrages ids[0]→…→ids[leafIndex] ; leaf n'a pas d'enfant ouvrage. */
    private void stubChain(UUID[] ids, int leafIndex) {
        for (int i = 0; i <= leafIndex; i++) {
            List<ComposantOuvrage> comps = new ArrayList<>();
            if (i < leafIndex) {
                comps.add(ouvrageRef(ids[i + 1], "1", false));
            } else {
                comps.add(libre("Leaf", "10.00"));
            }
            Ouvrage node = Ouvrage.builder()
                    .id(ids[i])
                    .tenantId(TENANT_ID)
                    .code("N" + i)
                    .designation("Niveau " + i)
                    .category("DIVERS")
                    .codeLot("GROS_OEUVRE")
                    .codeFamille("DIVERS")
                    .origine("SAISIE")
                    .unite("u")
                    .composants(comps)
                    .uniteMain(zeroMo())
                    .build();
            when(ouvrageRepository.findByIdAndTenantId(eq(ids[i]), eq(TENANT_ID)))
                    .thenReturn(Optional.of(node));
        }
    }

    @Test
    void normalizeCodeLot_valideUsageLot() {
        assertThat(service.normalizeCodeLot("vrd")).isEqualTo("VRD");
        assertThatThrownBy(() -> service.normalizeCodeLot("INCONNU"))
                .isInstanceOf(IllegalArgumentException.class);
    }

    private static Ouvrage flat(
            String code, String designation, UUID id, String debourseLine, String fg, String marge) {
        return Ouvrage.builder()
                .id(id)
                .tenantId(TENANT_ID)
                .code(code)
                .designation(designation)
                .category("DIVERS")
                .codeLot("GROS_OEUVRE")
                .codeFamille("DIVERS")
                .origine("SAISIE")
                .unite("u")
                .fraisGenerauxPercent(new BigDecimal(fg))
                .beneficePercent(new BigDecimal(marge))
                .uniteMain(zeroMo())
                .composants(new ArrayList<>(List.of(libre("Ligne", debourseLine))))
                .build();
    }

    private static ComposantOuvrage libre(String libelle, String total) {
        BigDecimal t = new BigDecimal(total);
        return ComposantOuvrage.builder()
                .tenantId(TENANT_ID)
                .type(ComposantOuvrage.TYPE_MATERIAU)
                .referenceType(ReferenceType.LIBRE.name())
                .libelle(libelle)
                .unite("u")
                .rendement(BigDecimal.ONE)
                .prixUnitaire(t)
                .total(t)
                .inclureFraisEtMarge(false)
                .build();
    }

    private static ComposantOuvrage ouvrageRef(UUID refId, String rendement, boolean inclureFg) {
        return ComposantOuvrage.builder()
                .tenantId(TENANT_ID)
                .type(ComposantOuvrage.TYPE_MATERIAU)
                .referenceType(ReferenceType.OUVRAGE.name())
                .refOuvrageId(refId)
                .libelle("ref-" + refId)
                .unite("u")
                .rendement(new BigDecimal(rendement))
                .prixUnitaire(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .inclureFraisEtMarge(inclureFg)
                .build();
    }

    private static UniteMain zeroMo() {
        return UniteMain.builder()
                .heures(BigDecimal.ZERO)
                .tauxHoraire(BigDecimal.ZERO)
                .total(BigDecimal.ZERO)
                .build();
    }
}
