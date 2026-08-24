package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.DebourseNoeudDto;
import ma.nafura.chantiers.api.request.DebourseNoeudSaisieDto;
import ma.nafura.chantiers.domain.budget.DebourseNoeud;
import ma.nafura.chantiers.domain.budget.OrigineDebourse;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.domain.budget.RubriqueDebourse;
import ma.nafura.chantiers.domain.chantier.NatureLigne;
import ma.nafura.chantiers.repository.DebourseNoeudRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/** AC-1, AC-5, AC-6, AC-7 — la copie ne se refait pas, l'interne se saisit, la révision se pose à côté. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DebourseNoeudServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final UUID PRIX_DPU = UUID.fromString("44444444-4444-4444-8444-444444444444");
    private static final String POSTE = "ch-1-lot-01-poste-01";

    @Mock private DebourseNoeudRepository repository;
    @Mock private PosteBudgetaireRepository posteRepository;

    private DebourseNoeudService service;
    private Map<String, DebourseNoeud> stockage;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DebourseNoeudService(repository, posteRepository);
        stockage = new LinkedHashMap<>();

        when(repository.save(any())).thenAnswer(inv -> {
            DebourseNoeud ligne = inv.getArgument(0);
            stockage.put(ligne.getId(), ligne);
            return ligne;
        });
        when(repository.findByTenantIdAndPosteIdAndRubrique(eq(TENANT), any(), any()))
                .thenAnswer(inv -> Optional.ofNullable(
                        stockage.get(DebourseNoeud.buildId(inv.getArgument(1), inv.getArgument(2)))));
        when(repository.findByTenantIdAndPosteIdOrderByRubriqueAsc(eq(TENANT), any()))
                .thenAnswer(inv -> new ArrayList<>(stockage.values()));
        when(posteRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    /** AC-2, AC-5 — la copie pose les montants, l'origine, la source et sa date. */
    @Test
    void copie_poseLesMontantsEtDateLInstantane() {
        PosteBudgetaire poste = poste(NatureLigne.VENDU);
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT)).thenReturn(Optional.of(poste));

        service.copierDepuisLEtude(
                POSTE,
                OrigineDebourse.DECOMPOSE,
                true,
                PRIX_DPU,
                7L,
                List.of(
                        part(RubriqueDebourse.MATIERE, "600.00"),
                        part(RubriqueDebourse.MAIN_DOEUVRE, "400.00")));

        ArgumentCaptor<PosteBudgetaire> cap = ArgumentCaptor.forClass(PosteBudgetaire.class);
        verify(posteRepository).save(cap.capture());
        assertThat(cap.getValue().getDebourseOrigine()).isEqualTo(OrigineDebourse.DECOMPOSE);
        assertThat(cap.getValue().getDebourseNonFiable()).isTrue();
        assertThat(cap.getValue().getDeboursePrixDpuId()).isEqualTo(PRIX_DPU);
        assertThat(cap.getValue().getDeboursePrixDpuVersion()).isEqualTo(7L);
        assertThat(cap.getValue().getDebourseCopieLe()).isNotNull();

        // Le révisé part de la copie : corriger est un geste, pas un état par défaut (AC-7).
        assertThat(stockage).hasSize(2);
        assertThat(stockage.values())
                .allSatisfy(l -> assertThat(l.getReviseHt()).isEqualByComparingTo(l.getPrevuHt()));
    }

    /**
     * AC-5 — après la conversion, aucune resynchronisation : une seconde copie sur le même nœud
     * est refusée, pas silencieusement appliquée.
     */
    @Test
    void copie_uneSeuleFois_laSecondeEstRefusee() {
        PosteBudgetaire poste = poste(NatureLigne.VENDU);
        poste.setDebourseCopieLe(OffsetDateTime.now().minusDays(30));
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT)).thenReturn(Optional.of(poste));

        assertThatThrownBy(() -> service.copierDepuisLEtude(
                        POSTE, OrigineDebourse.DECOMPOSE, false, PRIX_DPU, 9L,
                        List.of(part(RubriqueDebourse.MATIERE, "1.00"))))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining("copie_deja_faite");

        verify(repository, never()).save(any());
    }

    /** AC-6 — un nœud interne n'a pas de DPU : ses quatre rubriques se saisissent, origine SAISI. */
    @Test
    void interne_saisieDesQuatreRubriques() {
        PosteBudgetaire poste = poste(NatureLigne.INTERNE);
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT)).thenReturn(Optional.of(poste));

        DebourseNoeudDto dto = service.saisirSurNoeudInterne(
                POSTE, saisie(Map.of("MATIERE", "1200.00", "MAIN_DOEUVRE", "800.00")));

        assertThat(poste.getDebourseOrigine()).isEqualTo(OrigineDebourse.SAISI);
        assertThat(dto.getPrevuHt()).isEqualByComparingTo("2000.00");
        assertThat(dto.getReviseHt()).isEqualByComparingTo("2000.00");
        // Les quatre rubriques sont toujours là, même à zéro (AC-1).
        assertThat(dto.getRubriques())
                .extracting(DebourseNoeudDto.DebourseRubriqueDto::getRubrique)
                .containsExactly("MATIERE", "MAIN_DOEUVRE", "MATERIEL", "SOUS_TRAITANCE");
    }

    /** AC-7 — le prévu d'un nœud vendu est une copie : il ne se réécrit pas par saisie. */
    @Test
    void vendu_saisieDuPrevuRefusee() {
        PosteBudgetaire poste = poste(NatureLigne.VENDU);
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT)).thenReturn(Optional.of(poste));

        assertThatThrownBy(() ->
                        service.saisirSurNoeudInterne(POSTE, saisie(Map.of("MATIERE", "1.00"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("prevu_vendu_non_modifiable");
    }

    /** AC-7 — réviser ne touche que le révisé ; le prévu reste lisible et l'écart est visible. */
    @Test
    void revision_neReecritPasLaCopie() {
        PosteBudgetaire poste = poste(NatureLigne.VENDU);
        poste.setDebourseOrigine(OrigineDebourse.DECOMPOSE);
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT)).thenReturn(Optional.of(poste));
        stockage.put(
                DebourseNoeud.buildId(POSTE, RubriqueDebourse.MATIERE),
                ligne(RubriqueDebourse.MATIERE, "600.00", "600.00"));

        DebourseNoeudDto dto = service.reviser(POSTE, saisie(Map.of("MATIERE", "750.00")));

        DebourseNoeud matiere = stockage.get(DebourseNoeud.buildId(POSTE, RubriqueDebourse.MATIERE));
        assertThat(matiere.getPrevuHt()).isEqualByComparingTo("600.00");
        assertThat(matiere.getReviseHt()).isEqualByComparingTo("750.00");
        assertThat(dto.getPrevuHt()).isEqualByComparingTo("600.00");
        assertThat(dto.getReviseHt()).isEqualByComparingTo("750.00");
        assertThat(dto.getEcartRevisionHt()).isEqualByComparingTo("150.00");
    }

    /** Le non ventilé est le constat d'un chiffrage non décomposé, pas une case de saisie. */
    @Test
    void nonVentile_nEstPasSaisissable() {
        PosteBudgetaire poste = poste(NatureLigne.INTERNE);
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT)).thenReturn(Optional.of(poste));

        assertThatThrownBy(() ->
                        service.saisirSurNoeudInterne(POSTE, saisie(Map.of("NON_VENTILE", "10.00"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("non_ventile_non_saisissable");
    }

    /** Un déboursé négatif n'existe pas : il est refusé, pas ramené à zéro en silence. */
    @Test
    void montantNegatif_refuse() {
        PosteBudgetaire poste = poste(NatureLigne.INTERNE);
        when(posteRepository.findByIdAndTenantId(POSTE, TENANT)).thenReturn(Optional.of(poste));

        assertThatThrownBy(() ->
                        service.saisirSurNoeudInterne(POSTE, saisie(Map.of("MATERIEL", "-5.00"))))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining("montant_negatif");
    }

    // ── Fixtures ────────────────────────────────────────────────────────────

    private static PosteBudgetaire poste(NatureLigne nature) {
        return PosteBudgetaire.builder()
                .id(POSTE)
                .tenantId(TENANT)
                .lotId("ch-1-lot-01")
                .code("01")
                .designation("Béton de propreté")
                .nature(nature)
                .debourseNonFiable(false)
                .build();
    }

    private static DebourseNoeud ligne(RubriqueDebourse rubrique, String prevu, String revise) {
        return DebourseNoeud.builder()
                .id(DebourseNoeud.buildId(POSTE, rubrique))
                .tenantId(TENANT)
                .posteId(POSTE)
                .rubrique(rubrique)
                .prevuHt(new BigDecimal(prevu))
                .reviseHt(new BigDecimal(revise))
                .build();
    }

    private static DebourseNoeudService.PartCopiee part(RubriqueDebourse rubrique, String montant) {
        return new DebourseNoeudService.PartCopiee(rubrique, new BigDecimal(montant));
    }

    private static DebourseNoeudSaisieDto saisie(Map<String, String> montants) {
        DebourseNoeudSaisieDto dto = new DebourseNoeudSaisieDto();
        List<DebourseNoeudSaisieDto.LigneDto> lignes = new ArrayList<>();
        montants.forEach((rubrique, montant) -> {
            DebourseNoeudSaisieDto.LigneDto ligne = new DebourseNoeudSaisieDto.LigneDto();
            ligne.setRubrique(rubrique);
            ligne.setMontantHt(new BigDecimal(montant));
            lignes.add(ligne);
        });
        dto.setRubriques(lignes);
        return dto;
    }
}
