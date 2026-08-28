package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.OffsetDateTime;
import java.util.Set;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.ChantierAffectationDto;
import ma.nafura.chantiers.api.dto.ChantierSummaryDto;
import ma.nafura.chantiers.api.dto.CockpitChantierDto;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.AttachementChantierRepository;
import ma.nafura.chantiers.repository.AvancementPhysiqueRepository;
import ma.nafura.chantiers.repository.JournalChantierRepository;
import ma.nafura.chantiers.service.port.DemandeAchatCockpitPort;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.beans.factory.ObjectProvider;

/**
 * SEKTOR-196 — read model cockpit : checklist AC-5, alertes AC-9/AC-12/AC-13, prochaines
 * actions AC-10/AC-11, finance AC-3/AC-4/AC-20, absence AC-14, statut AC-2.
 */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CockpitChantierServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";

    @Mock private ChantierService chantierService;
    @Mock private ChantierSummaryReadService summaryService;
    @Mock private ChantierAffectationService affectationService;
    @Mock private ChantierLotRepository lotRepository;
    @Mock private JournalChantierRepository journalRepository;
    @Mock private AttachementChantierRepository attachementRepository;
    @Mock private AvancementPhysiqueRepository avancementRepository;
    @Mock private ObjectProvider<DemandeAchatCockpitPort> demandeAchatPort;
    @Mock private DemandeAchatCockpitPort demandeAchatCockpitPort;

    private CockpitChantierService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        when(demandeAchatPort.getIfAvailable()).thenReturn(demandeAchatCockpitPort);
        when(demandeAchatCockpitPort.compterParChantier(CHANTIER)).thenReturn(0L);
        service = new CockpitChantierService(
                chantierService, summaryService, affectationService, lotRepository,
                journalRepository, attachementRepository, avancementRepository, demandeAchatPort);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
    }

    private Chantier chantier(String status) {
        return Chantier.builder()
                .id(CHANTIER)
                .tenantId(TENANT)
                .code("CH-2026-002")
                .label("École Al Amal")
                .clientName("MOA")
                .status(status)
                .build();
    }

    private ChantierSummaryDto summaryCanonique() {
        return ChantierSummaryDto.builder()
                .montantVenteActifHt(new BigDecimal("737106.00"))
                .montantVenteInitialHt(new BigDecimal("737106.00"))
                .debourseInitialHt(new BigDecimal("582600.00"))
                .budgetReviseHt(new BigDecimal("582600.00"))
                .margeInitialeHt(new BigDecimal("154506.00"))
                .margeProjeteeHt(new BigDecimal("154506.00"))
                .margeProjeteePct(new BigDecimal("20.96"))
                .sourceVente("DEVIS")
                .build();
    }

    private void prepare(Chantier c, ChantierSummaryDto s) {
        when(chantierService.getById(CHANTIER)).thenReturn(c);
        when(summaryService.getSummary(CHANTIER)).thenReturn(s);
        when(affectationService.listByChantier(CHANTIER)).thenReturn(List.of());
        when(lotRepository.countByTenantIdAndChantierId(TENANT, CHANTIER)).thenReturn(0L);
        when(journalRepository.findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(any(), any()))
                .thenReturn(List.of());
    }

    @Test
    void checklist_EN_PREPARATION_incomplete_marqueLesBloqueurs() {
        Chantier c = chantier(Chantier.STATUS_EN_PREPARATION);
        prepare(c, summaryCanonique());

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(dto.getIdentity().getStatus()).isEqualTo(Chantier.STATUS_EN_PREPARATION);
        // identité OK (client posé), vente OK (DEVIS + snapshot), arbre KO (0 lot), responsables KO…
        CockpitChantierDto.PreparationDto arbre = parCode(dto, "arbre");
        assertThat(arbre.getEtat()).isEqualTo("BLOQUANT");
        CockpitChantierDto.PreparationDto responsables = parCode(dto, "responsables");
        assertThat(responsables.getEtat()).isEqualTo("BLOQUANT");
        // Planning jamais bloquant (AC-8).
        assertThat(parCode(dto, "planning").getEtat()).isEqualTo("A_FAIRE");
        // Le chantier EN_PREPARATION n'est jamais présenté EN_COURS (AC-2/AC-14).
        assertThat(dto.getIdentity().getStatus()).isNotEqualTo(Chantier.STATUS_EN_COURS);
    }

    @Test
    void checklist_venteNonApplicable_enCreationDirecte() {
        Chantier c = chantier(Chantier.STATUS_EN_PREPARATION);
        ChantierSummaryDto s = ChantierSummaryDto.builder().build(); // sans source DEVIS
        prepare(c, s);

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(parCode(dto, "reference_vente").getEtat()).isEqualTo("NON_APPLICABLE");
        assertThat(parCode(dto, "budget_initial").getEtat()).isEqualTo("BLOQUANT");
    }

    @Test
    void finance_owner_voitLesMontantsCanoniques() {
        UserContext.setUserRole("OWNER");
        Chantier c = chantier(Chantier.STATUS_EN_PREPARATION);
        prepare(c, summaryCanonique());

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(dto.getFinance().getMontantVenteActifHt().getEtat()).isEqualTo("AVAILABLE");
        assertThat(dto.getFinance().getMontantVenteActifHt().getMontant())
                .isEqualByComparingTo("737106.00");
        assertThat(dto.getFinance().getMargeProjeteeHt().getMontant())
                .isEqualByComparingTo("154506.00");
        assertThat(dto.getFinance().getMargeProjeteePct().getMontant())
                .isEqualByComparingTo("20.96");
    }

    @Test
    void identite_utiliseLaFraicheurReelleDuChantier() {
        UserContext.setUserRole("OWNER");
        Chantier c = chantier(Chantier.STATUS_EN_COURS);
        OffsetDateTime source = OffsetDateTime.parse("2026-08-20T09:30:00Z");
        c.setUpdatedAt(source);
        prepare(c, summaryCanonique());

        assertThat(service.lireCockpit(CHANTIER).getIdentity().getFraicheur()).isEqualTo(source);
    }

    @Test
    void finance_chefChantier_forbidden_pasDeFauxZero() {
        UserContext.setUserRole("BTP_CHEF_CHANTIER");
        Chantier c = chantier(Chantier.STATUS_EN_PREPARATION);
        prepare(c, summaryCanonique());

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(dto.getFinance().getMontantVenteActifHt().getEtat()).isEqualTo("FORBIDDEN");
        assertThat(dto.getFinance().getMontantVenteActifHt().getMontant()).isNull();
    }

    @Test
    void finance_venteAbsente_notAvailable_pasDeZero() {
        UserContext.setUserRole("OWNER");
        Chantier c = chantier(Chantier.STATUS_EN_PREPARATION);
        ChantierSummaryDto s = ChantierSummaryDto.builder().build(); // aucun montant
        prepare(c, s);

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(dto.getFinance().getMontantVenteActifHt().getEtat()).isEqualTo("NOT_AVAILABLE");
        assertThat(dto.getFinance().getMontantVenteActifHt().getMontant()).isNull();
        assertThat(dto.getFinance().getMargeProjeteePct().getMontant()).isNull();
    }

    @Test
    void alerte_margeNegative_critical() {
        UserContext.setUserRole("OWNER");
        Chantier c = chantier(Chantier.STATUS_EN_COURS);
        ChantierSummaryDto s = summaryCanonique();
        s.setMargeProjeteeHt(new BigDecimal("-50000.00"));
        s.setMargeProjeteePct(new BigDecimal("-10.00"));
        prepare(c, s);

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(dto.getAlerts()).anyMatch(a ->
                "marge_negative".equals(a.getCode()) && "CRITICAL".equals(a.getSeverite()));
    }

    @Test
    void alerte_margeEnBaisse_warning() {
        UserContext.setUserRole("OWNER");
        Chantier c = chantier(Chantier.STATUS_EN_COURS);
        ChantierSummaryDto s = summaryCanonique();
        s.setMargeInitialeHt(new BigDecimal("200000.00"));
        s.setMargeProjeteeHt(new BigDecimal("150000.00"));
        prepare(c, s);

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(dto.getAlerts()).anyMatch(a ->
                "marge_en_baisse".equals(a.getCode()) && "WARNING".equals(a.getSeverite()));
    }

    @Test
    void retard_calculeSurDatesReelles_seulement() {
        UserContext.setUserRole("OWNER");
        // Sans fin prévue : pas de retard calculé, absence signalée (AC-13).
        Chantier sansFin = chantier(Chantier.STATUS_EN_COURS);
        prepare(sansFin, summaryCanonique());
        CockpitChantierDto dto1 = service.lireCockpit(CHANTIER);
        assertThat(dto1.getSchedule().getJoursRestantsOuRetard()).isNull();
        assertThat(dto1.getSchedule().isEnRetard()).isFalse();
        assertThat(dto1.getSchedule().getAbsence()).isNotBlank();

        // En retard : fin prévue passée.
        Chantier enRetard = chantier(Chantier.STATUS_EN_COURS);
        enRetard.setDateFinPrevue(LocalDate.now().minusDays(5));
        prepare(enRetard, summaryCanonique());
        CockpitChantierDto dto2 = service.lireCockpit(CHANTIER);
        assertThat(dto2.getSchedule().isEnRetard()).isTrue();
        assertThat(dto2.getSchedule().getJoursRestantsOuRetard()).isEqualTo(5);
    }

    @Test
    void prochaineAction_preparation_et_cours() {
        UserContext.setUserRole("OWNER");
        Chantier prep = chantier(Chantier.STATUS_EN_PREPARATION);
        prepare(prep, summaryCanonique());
        CockpitChantierDto dto1 = service.lireCockpit(CHANTIER);
        assertThat(dto1.getNextActions()).isNotEmpty();
        assertThat(dto1.getNextActions().get(0).getPriorite()).isEqualTo(1);
        assertThat(dto1.getNextActions().get(0).getPermission()).isNotBlank();

        Chantier cours = chantier(Chantier.STATUS_EN_COURS);
        prepare(cours, summaryCanonique());
        CockpitChantierDto dto2 = service.lireCockpit(CHANTIER);
        assertThat(dto2.getNextActions().get(0).getLibelle())
                .isEqualTo("chantiers.cockpit.action.avancement");
        assertThat(dto2.getNextActions()).extracting(CockpitChantierDto.NextActionDto::getLibelle)
                .contains(
                        "chantiers.cockpit.action.avancement",
                        "chantiers.cockpit.action.demandeAchat",
                        "chantiers.cockpit.action.receptionBl",
                        "chantiers.cockpit.action.documents",
                        "chantiers.cockpit.action.sousTraitance");
        assertThat(dto2.getNextActions()).allMatch(a -> a.getRoute() != null && a.getRoute().contains(CHANTIER));
    }

    @Test
    void prochaineAction_preparationAvecBudgetEtArbreManquants_neProposeJamaisDemarrer() {
        UserContext.setUserRole("OWNER");
        Chantier prep = chantier(Chantier.STATUS_EN_PREPARATION);
        prep.setClientId("client-1");
        prep.setDateDemarrage(LocalDate.now());
        prep.setDateFinPrevue(LocalDate.now().plusDays(10));
        prepare(prep, summaryCanonique());

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(dto.getNextActions().getFirst().getLibelle())
                .isEqualTo("chantiers.cockpit.action.preparer");
        assertThat(dto.getNextActions()).noneMatch(a ->
                "chantiers.cockpit.action.demarrer".equals(a.getLibelle()));
    }

    @Test
    void flux_litAttachementEtDevientSituation_apresAttachementReel() {
        UserContext.setUserRole("OWNER");
        Chantier cours = chantier(Chantier.STATUS_EN_COURS);
        cours.setAvancementPercent(new BigDecimal("20"));
        prepare(cours, summaryCanonique());
        when(attachementRepository
                .findByTenantIdAndChantierIdAndDateDebutLessThanEqualAndDateFinGreaterThanEqual(
                        org.mockito.ArgumentMatchers.eq(TENANT), org.mockito.ArgumentMatchers.eq(CHANTIER),
                        org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(ma.nafura.chantiers.domain.attachement.AttachementChantier.builder()
                        .id("att-1").build()));
        when(avancementRepository.findByTenantIdAndChantierIdAndDateSaisieBetween(
                org.mockito.ArgumentMatchers.eq(TENANT), org.mockito.ArgumentMatchers.eq(CHANTIER),
                org.mockito.ArgumentMatchers.any(), org.mockito.ArgumentMatchers.any()))
                .thenReturn(List.of(ma.nafura.chantiers.domain.avancement.AvancementPhysique.builder()
                        .id("av-1").build()));

        CockpitChantierDto.FluxMensuelDto flux = service.lireCockpit(CHANTIER)
                .getProgress().getFluxMois();

        assertThat(flux.getEtape()).isEqualTo("chantiers.cockpit.flux.etapeSituation");
    }

    @Test
    void flux_terminal_estToujoursLectureSeule() {
        UserContext.setUserRole("OWNER");
        for (String status : List.of(
                Chantier.STATUS_RECEPTION_PROVISOIRE,
                Chantier.STATUS_RECEPTION_DEFINITIF,
                Chantier.STATUS_CLOS)) {
            Chantier terminal = chantier(status);
            prepare(terminal, summaryCanonique());

            CockpitChantierDto.FluxMensuelDto flux = service.lireCockpit(CHANTIER)
                    .getProgress().getFluxMois();

            assertThat(flux.isActionnable()).as(status).isFalse();
            assertThat(flux.getPremiereAction()).as(status).isNull();
        }
    }

    @Test
    void panneEquipeEtActivite_restePartielleSansNpe() {
        UserContext.setUserRole("OWNER");
        Chantier c = chantier(Chantier.STATUS_EN_COURS);
        prepare(c, summaryCanonique());
        when(affectationService.listByChantier(CHANTIER)).thenThrow(new IllegalStateException("équipe HS"));
        when(journalRepository.findByTenantIdAndChantierIdOrderByDateDescCreatedAtDesc(any(), any()))
                .thenThrow(new IllegalStateException("journal HS"));

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(dto.getIdentity()).isNotNull();
        assertThat(dto.getActivityFeed()).isEmpty();
        assertThat(dto.getDegradations()).extracting(CockpitChantierDto.DegradationDto::getSection)
                .contains("chantiers.cockpit.degradation.equipe", "chantiers.cockpit.degradation.activite");
    }

    /** AC-11/AC-20 — sans rôle, aucune action d'écriture n'est proposée (jamais un 403 au clic). */
    @Test
    void prochaineAction_sansRole_aucuneActionEcriture() {
        Chantier cours = chantier(Chantier.STATUS_EN_COURS);
        prepare(cours, summaryCanonique());
        CockpitChantierDto dto = service.lireCockpit(CHANTIER);
        assertThat(dto.getNextActions())
                .allMatch(a -> !"chantiers.update".equals(a.getPermission()));
    }

    /** AC-20 / vie-de-chantier AC-3 — chef : avancement, docs, BL ; pas DA, ST, situation, marché. */
    @Test
    void prochaineAction_chefChantier_ecritureSansBudget() {
        UserContext.setUserRole("BTP_CHEF_CHANTIER");
        Chantier cours = chantier(Chantier.STATUS_EN_COURS);
        prepare(cours, summaryCanonique());
        CockpitChantierDto dto = service.lireCockpit(CHANTIER);
        assertThat(dto.getNextActions())
                .extracting(CockpitChantierDto.NextActionDto::getLibelle)
                .contains(
                        "chantiers.cockpit.action.avancement",
                        "chantiers.cockpit.action.documents",
                        "chantiers.cockpit.action.receptionBl")
                .doesNotContain(
                        "chantiers.cockpit.action.demandeAchat",
                        "chantiers.cockpit.action.sousTraitance",
                        "chantiers.cockpit.action.situation",
                        "chantiers.cockpit.action.attachement",
                        "chantiers.cockpit.action.notifierMarche");
        assertThat(dto.getNextActions())
                .noneMatch(a -> "chantiers.budget.read".equals(a.getPermission()));
    }

    @Test
    void prochaineAction_conducteur_daEtAvancement() {
        UserContext.setUserRole("BTP_CONDUCTEUR_TRAVAUX");
        Chantier cours = chantier(Chantier.STATUS_EN_COURS);
        prepare(cours, summaryCanonique());
        CockpitChantierDto dto = service.lireCockpit(CHANTIER);
        assertThat(dto.getNextActions())
                .extracting(CockpitChantierDto.NextActionDto::getLibelle)
                .contains(
                        "chantiers.cockpit.action.avancement",
                        "chantiers.cockpit.action.demandeAchat",
                        "chantiers.cockpit.action.sousTraitance",
                        "chantiers.cockpit.action.attachement",
                        "chantiers.cockpit.action.situation",
                        "chantiers.cockpit.action.notifierMarche");
        assertThat(dto.getNextActions()).allMatch(a -> a.getRoute().contains(CHANTIER));
    }

    @Test
    void prochaineAction_conducteur_apresNotification_sansNotifierMarche() {
        UserContext.setUserRole("BTP_CONDUCTEUR_TRAVAUX");
        Chantier cours = chantier(Chantier.STATUS_EN_COURS);
        cours.setSourceVente(Chantier.SOURCE_MARCHE);
        prepare(cours, summaryCanonique());
        CockpitChantierDto dto = service.lireCockpit(CHANTIER);
        assertThat(dto.getNextActions())
                .extracting(CockpitChantierDto.NextActionDto::getLibelle)
                .doesNotContain("chantiers.cockpit.action.notifierMarche");
    }

    @Test
    void finance_sourceVente_suitNotification() {
        UserContext.setUserRole("OWNER");
        Chantier devis = chantier(Chantier.STATUS_EN_COURS);
        devis.setSourceVente(Chantier.SOURCE_DEVIS);
        prepare(devis, summaryCanonique());
        assertThat(service.lireCockpit(CHANTIER).getFinance().getMontantVenteActifHt().getSource())
                .isEqualTo(Chantier.SOURCE_DEVIS);

        Chantier marche = chantier(Chantier.STATUS_EN_COURS);
        marche.setSourceVente(Chantier.SOURCE_MARCHE);
        prepare(marche, summaryCanonique());
        assertThat(service.lireCockpit(CHANTIER).getFinance().getMontantVenteActifHt().getSource())
                .isEqualTo(Chantier.SOURCE_MARCHE);
    }

    @Test
    void prochaineAction_magasinier_receptionSansSituation() {
        UserContext.setUserRole("BTP_MAGASINIER");
        Chantier cours = chantier(Chantier.STATUS_EN_COURS);
        prepare(cours, summaryCanonique());
        CockpitChantierDto dto = service.lireCockpit(CHANTIER);
        assertThat(dto.getNextActions())
                .extracting(CockpitChantierDto.NextActionDto::getLibelle)
                .contains("chantiers.cockpit.action.receptionBl")
                .doesNotContain(
                        "chantiers.cockpit.action.situation",
                        "chantiers.cockpit.action.attachement",
                        "chantiers.cockpit.action.demandeAchat");
    }

    /** AC-20 — daf : budget lisible, aucune écriture terrain. */
    @Test
    void prochaineAction_daf_budgetSansEcriture() {
        UserContext.setPermissions(Set.of("chantiers.chantiers.chantier.budget.read"));
        Chantier cours = chantier(Chantier.STATUS_EN_COURS);
        prepare(cours, summaryCanonique());
        CockpitChantierDto dto = service.lireCockpit(CHANTIER);
        assertThat(dto.getNextActions())
                .anyMatch(a -> "chantiers.budget.read".equals(a.getPermission()))
                .noneMatch(a -> "chantiers.update".equals(a.getPermission()));
    }

    @Test
    void prochaineAction_etatsSuspenduEtTerminaux_neProposeAucuneSaisieOperationnelle() {
        UserContext.setPermissions(Set.of(
                "chantiers.chantiers.chantier.read",
                "chantiers.chantiers.chantier.update",
                "chantiers.chantiers.chantier.budget.read"));
        for (String status : List.of(
                Chantier.STATUS_SUSPENDU,
                Chantier.STATUS_RECEPTION_PROVISOIRE,
                Chantier.STATUS_RECEPTION_DEFINITIF,
                Chantier.STATUS_CLOS)) {
            Chantier c = chantier(status);
            prepare(c, summaryCanonique());
            CockpitChantierDto dto = service.lireCockpit(CHANTIER);
            assertThat(dto.getNextActions())
                    .as("status %s", status)
                    .noneMatch(a -> a.getRoute() != null && (
                            a.getRoute().contains("avancements/saisie")
                                    || a.getRoute().contains("attachements/saisie")
                                    || a.getRoute().contains("demarrer-os")));
        }
    }

    @Test
    void ops_enCours_compteLesDemandesAchat() {
        UserContext.setUserRole("OWNER");
        Chantier cours = chantier(Chantier.STATUS_EN_COURS);
        prepare(cours, summaryCanonique());
        when(demandeAchatCockpitPort.compterParChantier(CHANTIER)).thenReturn(3L);

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(dto.getOps()).isNotNull();
        assertThat(dto.getOps().getDemandesAchat().getEtat()).isEqualTo("AVAILABLE");
        assertThat(dto.getOps().getDemandesAchat().getValeur()).isEqualTo(3L);
    }

    /** SEKTOR-227 — panne Achats : NOT_AVAILABLE sur la tuile DA, cockpit lisible, pas de faux zéro. */
    @Test
    void ops_panneAchats_demandesIndisponibles_pasDeFauxZero() {
        UserContext.setUserRole("OWNER");
        Chantier cours = chantier(Chantier.STATUS_EN_COURS);
        prepare(cours, summaryCanonique());
        when(demandeAchatCockpitPort.compterParChantier(CHANTIER))
                .thenThrow(new IllegalStateException("achats HS"));

        CockpitChantierDto dto = service.lireCockpit(CHANTIER);

        assertThat(dto.getIdentity()).isNotNull();
        assertThat(dto.getFinance().getMontantVenteActifHt().getEtat()).isEqualTo("AVAILABLE");
        assertThat(dto.getOps().getDemandesAchat().getEtat()).isEqualTo("NOT_AVAILABLE");
        assertThat(dto.getOps().getDemandesAchat().getValeur()).isNull();
        assertThat(dto.getOps().getDemandesAchat().getCause())
                .isEqualTo("chantiers.cockpit.ops.demandesAchat.indisponible");
        assertThat(dto.getDegradations()).extracting(CockpitChantierDto.DegradationDto::getSection)
                .contains("chantiers.cockpit.degradation.demandesAchat");
    }

    @Test
    void ops_enPreparation_absent() {
        UserContext.setUserRole("OWNER");
        Chantier prep = chantier(Chantier.STATUS_EN_PREPARATION);
        prepare(prep, summaryCanonique());

        assertThat(service.lireCockpit(CHANTIER).getOps()).isNull();
    }

    @Test
    void alertes_portentPreuveCompleteEtOrdreDeterministe() {
        UserContext.setUserRole("OWNER");
        Chantier c = chantier(Chantier.STATUS_EN_COURS);
        c.setUpdatedAt(OffsetDateTime.parse("2026-08-20T09:30:00Z"));
        c.setDateFinPrevue(LocalDate.now().minusDays(5));
        ChantierSummaryDto s = summaryCanonique();
        s.setMargeProjeteeHt(new BigDecimal("-50000.00"));
        prepare(c, s);

        CockpitChantierDto.AlerteDto alerte = service.lireCockpit(CHANTIER).getAlerts().getFirst();
        assertThat(alerte.getCode()).isEqualTo("marge_negative");
        assertThat(alerte.getDateFait()).isNotNull();
        assertThat(alerte.getValeurObservee()).isEqualByComparingTo("-50000.00");
        assertThat(alerte.getRegle()).isNotBlank();
        assertThat(alerte.getSourceId()).isNotBlank();
    }

    private static CockpitChantierDto.PreparationDto parCode(CockpitChantierDto dto, String code) {
        return dto.getPreparation().stream()
                .filter(p -> code.equals(p.getCode()))
                .findFirst()
                .orElseThrow(() -> new AssertionError("checklist item " + code + " absent"));
    }
}
