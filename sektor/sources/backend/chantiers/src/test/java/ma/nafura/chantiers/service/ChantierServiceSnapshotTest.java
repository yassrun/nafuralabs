package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ChantierAffectationDto;
import ma.nafura.chantiers.api.request.ChantierCreateDto;
import ma.nafura.chantiers.api.request.ChantierDemarrerOsDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.domain.chantier.JournalChantier;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.chantiers.repository.JournalChantierRepository;
import ma.nafura.chantiers.seeders.ChantierSeedService;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;

/**
 * SEKTOR-192 (AC-9/AC-17) + SEKTOR-198 (AC-5/AC-6/AC-8) — snapshot commercial, provenance
 * immuable, et démarrage par ordre de service.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ChantierServiceSnapshotTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");

    @Mock
    private ChantierRepository repository;

    @Mock
    private ChantierSeedService seedService;

    @Mock
    private AvancementLectureService avancementLectureService;

    @Mock
    private ChantierScopeService scopeService;

    @Mock
    private ChantierAffectationService affectationService;

    @Mock
    private ChantierLotRepository lotRepository;

    @Mock
    private JournalChantierRepository journalRepository;

    private ChantierService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new ChantierService(
                repository, seedService, avancementLectureService, scopeService,
                affectationService, lotRepository, journalRepository);
        when(repository.save(any(Chantier.class))).thenAnswer(inv -> inv.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private ChantierCreateDto baseDto() {
        ChantierCreateDto dto = new ChantierCreateDto();
        dto.setLabel("École Al Amal");
        dto.setClientId("cli-001");
        dto.setClientName("MOA");
        dto.setStatus(Chantier.STATUS_EN_PREPARATION);
        dto.setMontantHt(new BigDecimal("737106.00"));
        return dto;
    }

    /** AC-9 — la conversion pose la provenance et le snapshot ; rien n'est recalculé ici. */
    @Test
    void create_poseLeSnapshotCommercial() {
        ChantierCreateDto dto = baseDto();
        dto.setDossierEtudeId(UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));
        dto.setDevisId(UUID.fromString("dddddddd-dddd-dddd-dddd-ddddddddd002"));
        dto.setDevisNumero("DV-2026-0002");
        dto.setDevisVersion(3);
        dto.setDateAcceptation(LocalDate.of(2026, 8, 1));
        dto.setSourceVente("DEVIS");
        dto.setMontantVenteInitialHt(new BigDecimal("737106.00"));
        dto.setDebourseInitialHt(new BigDecimal("582600.00"));

        Chantier c = service.create(dto);

        assertThat(c.getDossierEtudeId()).isEqualTo(dto.getDossierEtudeId());
        assertThat(c.getDevisId()).isEqualTo(dto.getDevisId());
        assertThat(c.getDevisNumero()).isEqualTo("DV-2026-0002");
        assertThat(c.getDevisVersion()).isEqualTo(3);
        assertThat(c.getDateAcceptation()).isEqualTo(LocalDate.of(2026, 8, 1));
        assertThat(c.getSourceVente()).isEqualTo("DEVIS");
        assertThat(c.getMontantVenteInitialHt()).isEqualByComparingTo("737106.00");
        assertThat(c.getDebourseInitialHt()).isEqualByComparingTo("582600.00");
    }

    /** AC-17 — création directe : aucune provenance fabriquée, aucun faux devis ni source. */
    @Test
    void create_direct_sansFausseProvenance() {
        Chantier c = service.createDirect(baseDto());

        assertThat(c.getDossierEtudeId()).isNull();
        assertThat(c.getDevisId()).isNull();
        assertThat(c.getDevisNumero()).isNull();
        assertThat(c.getDevisVersion()).isNull();
        assertThat(c.getSourceVente()).isNull();
        assertThat(c.getMontantVenteInitialHt()).isNull();
        assertThat(c.getDebourseInitialHt()).isNull();
    }

    /** SEKTOR-209/3 — le endpoint public ne peut pas forger une provenance de conversion. */
    @Test
    void createDirect_provenanceFabriquee_refuse() {
        ChantierCreateDto dto = baseDto();
        dto.setDossierEtudeId(UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb"));
        dto.setDevisId(UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd"));
        dto.setDevisNumero("DV-FORGE");
        dto.setDevisVersion(99);
        dto.setDateAcceptation(LocalDate.of(2026, 8, 1));
        dto.setSourceVente("DEVIS");
        dto.setMontantVenteInitialHt(new BigDecimal("999999.00"));
        dto.setDebourseInitialHt(new BigDecimal("1.00"));

        assertThatThrownBy(() -> service.createDirect(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("chantiers.creation_directe.provenance_interdite");
        verify(repository, org.mockito.Mockito.never()).save(any(Chantier.class));
    }

    // ── SEKTOR-198 — démarrage par ordre de service (AC-5, AC-6, AC-8) ────────

    private Chantier chantierPret() {
        Chantier c = service.createDirect(baseDto());
        c.setDebourseInitialHt(new BigDecimal("582600.00"));
        c.setDateDemarrage(LocalDate.of(2026, 9, 1));
        c.setDateFinPrevue(LocalDate.of(2027, 5, 1));
        return c;
    }

    /** AC-5/AC-6 — tout est prêt, l'OS est fourni : démarrage atomique EN_COURS + journal. */
    @Test
    void demarrerAvecOs_toutPret_aboutit() {
        Chantier c = chantierPret();
        when(repository.findByIdAndTenantId(any(), any())).thenReturn(java.util.Optional.of(c));
        when(lotRepository.countByTenantIdAndChantierId(TENANT, c.getId())).thenReturn(2L);
        ChantierAffectationDto conducteur = affectation("BTP_CONDUCTEUR_TRAVAUX");
        ChantierAffectationDto chef = affectation("BTP_CHEF_CHANTIER");
        when(affectationService.listByChantier(c.getId())).thenReturn(java.util.List.of(conducteur, chef));

        ChantierDemarrerOsDto os = new ChantierDemarrerOsDto();
        os.setOsReference("OS-2026-001");
        os.setOsDateEffet(LocalDate.of(2026, 9, 1));

        Chantier out = service.demarrerAvecOs(c.getId(), os);

        assertThat(out.getStatus()).isEqualTo(Chantier.STATUS_EN_COURS);
        assertThat(out.getOsReference()).isEqualTo("OS-2026-001");
        assertThat(out.getOsDateEffet()).isEqualTo(LocalDate.of(2026, 9, 1));
        verify(journalRepository).save(any(JournalChantier.class));
    }

    /** AC-5 — un bloqueur restant refuse le démarrage avec la liste stable des codes. */
    @Test
    void demarrerAvecOs_responsablesManquants_refuseAvecCodes() {
        Chantier c = chantierPret();
        when(repository.findByIdAndTenantId(any(), any())).thenReturn(java.util.Optional.of(c));
        when(lotRepository.countByTenantIdAndChantierId(TENANT, c.getId())).thenReturn(2L);
        // aucun responsable
        when(affectationService.listByChantier(c.getId())).thenReturn(java.util.List.of());

        ChantierDemarrerOsDto os = new ChantierDemarrerOsDto();
        os.setOsReference("OS-2026-001");
        os.setOsDateEffet(LocalDate.of(2026, 9, 1));

        assertThatThrownBy(() -> service.demarrerAvecOs(c.getId(), os))
                .isInstanceOf(ChantierService.PreparationIncompleteException.class)
                .satisfies(ex -> assertThat(((ChantierService.PreparationIncompleteException) ex).getCodes())
                        .contains("responsables"));
        assertThat(c.getStatus()).isEqualTo(Chantier.STATUS_EN_PREPARATION);
    }

    /** AC-6 — l'OS est obligatoire, même si la préparation est complète. */
    @Test
    void demarrerAvecOs_sansOs_refuse() {
        Chantier c = chantierPret();
        when(repository.findByIdAndTenantId(any(), any())).thenReturn(java.util.Optional.of(c));
        when(lotRepository.countByTenantIdAndChantierId(TENANT, c.getId())).thenReturn(2L);
        ChantierAffectationDto conducteur = affectation("BTP_CONDUCTEUR_TRAVAUX");
        ChantierAffectationDto chef = affectation("BTP_CHEF_CHANTIER");
        when(affectationService.listByChantier(c.getId())).thenReturn(java.util.List.of(conducteur, chef));

        assertThatThrownBy(() -> service.demarrerAvecOs(c.getId(), null))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("chantiers.demarrage.os_requis");
        assertThat(c.getStatus()).isEqualTo(Chantier.STATUS_EN_PREPARATION);
    }

    /** AC-8 — le planning n'est jamais exigé au démarrage (aucun champ planning dans la commande). */
    @Test
    void demarrerAvecOs_neDemandeJamaisDePlanning() throws Exception {
        // La commande expose exactement osReference et osDateEffet, rien d'autre.
        assertThat(ChantierDemarrerOsDto.class.getDeclaredField("osReference")).isNotNull();
        assertThat(ChantierDemarrerOsDto.class.getDeclaredField("osDateEffet")).isNotNull();
        assertThat(ChantierDemarrerOsDto.class.getDeclaredFields())
                .filteredOn(f -> !f.isSynthetic())
                .extracting(f -> f.getName())
                .containsExactlyInAnyOrder("osReference", "osDateEffet");
    }

    @Test
    void demarrerAvecOs_creationDirecteSansBudget_refuse() {
        Chantier c = service.create(baseDto());
        c.setDateDemarrage(LocalDate.of(2026, 9, 1));
        c.setDateFinPrevue(LocalDate.of(2027, 5, 1));
        when(repository.findByIdAndTenantId(any(), any())).thenReturn(java.util.Optional.of(c));
        when(lotRepository.countByTenantIdAndChantierId(TENANT, c.getId())).thenReturn(2L);
        when(affectationService.listByChantier(c.getId())).thenReturn(java.util.List.of(
                affectation("BTP_CONDUCTEUR_TRAVAUX"), affectation("BTP_CHEF_CHANTIER")));

        ChantierDemarrerOsDto os = new ChantierDemarrerOsDto();
        os.setOsReference("OS-2026-001");
        os.setOsDateEffet(LocalDate.of(2026, 9, 1));

        assertThatThrownBy(() -> service.demarrerAvecOs(c.getId(), os))
                .isInstanceOf(ChantierService.PreparationIncompleteException.class)
                .satisfies(ex -> assertThat(((ChantierService.PreparationIncompleteException) ex).getCodes())
                        .contains("budget_initial"));
    }

    @Test
    void demarrerAvecOs_datesEgales_refuse() {
        Chantier c = chantierPret();
        c.setDateFinPrevue(c.getDateDemarrage());
        when(repository.findByIdAndTenantId(any(), any())).thenReturn(java.util.Optional.of(c));
        when(lotRepository.countByTenantIdAndChantierId(TENANT, c.getId())).thenReturn(2L);
        when(affectationService.listByChantier(c.getId())).thenReturn(java.util.List.of(
                affectation("BTP_CONDUCTEUR_TRAVAUX"), affectation("BTP_CHEF_CHANTIER")));

        ChantierDemarrerOsDto os = new ChantierDemarrerOsDto();
        os.setOsReference("OS-2026-001");
        os.setOsDateEffet(c.getDateDemarrage());

        assertThatThrownBy(() -> service.demarrerAvecOs(c.getId(), os))
                .isInstanceOf(ChantierService.PreparationIncompleteException.class)
                .satisfies(ex -> assertThat(((ChantierService.PreparationIncompleteException) ex).getCodes())
                        .contains("dates_prevues"));
    }

    @Test
    void demarrerAvecOs_brouillon_refuseMemeSiPret() {
        Chantier c = chantierPret();
        c.setStatus(Chantier.STATUS_BROUILLON);
        when(repository.findByIdAndTenantId(any(), any())).thenReturn(java.util.Optional.of(c));

        ChantierDemarrerOsDto os = new ChantierDemarrerOsDto();
        os.setOsReference("OS-2026-001");
        os.setOsDateEffet(c.getDateDemarrage());

        assertThatThrownBy(() -> service.demarrerAvecOs(c.getId(), os))
                .isInstanceOf(IllegalStateException.class)
                .hasMessageContaining(Chantier.STATUS_BROUILLON);
    }

    @Test
    void create_refuseUnStatutNonInitialAuLieuDeLeNormaliser() {
        ChantierCreateDto dto = baseDto();
        dto.setStatus("TERMINE");

        assertThatThrownBy(() -> service.create(dto))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("chantiers.creation.statut_initial_invalide");
    }

    private static ChantierAffectationDto affectation(String roleCode) {
        return ChantierAffectationDto.builder().roleCode(roleCode).isActive(true).build();
    }
}
