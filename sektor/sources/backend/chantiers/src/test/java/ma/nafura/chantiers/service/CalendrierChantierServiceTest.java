package ma.nafura.chantiers.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.doThrow;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.CalendrierChantierDto;
import ma.nafura.chantiers.api.request.CalendrierCreneauWriteDto;
import ma.nafura.chantiers.api.request.CalendrierExceptionWriteDto;
import ma.nafura.chantiers.api.request.CalendrierVersionWriteDto;
import ma.nafura.chantiers.domain.calendrier.CalendrierChantier;
import ma.nafura.chantiers.domain.calendrier.CalendrierCreneau;
import ma.nafura.chantiers.domain.calendrier.CalendrierException;
import ma.nafura.chantiers.domain.calendrier.CalendrierExceptionCreneau;
import ma.nafura.chantiers.domain.calendrier.CalendrierKind;
import ma.nafura.chantiers.domain.calendrier.CalendrierOuvreCalculator;
import ma.nafura.chantiers.domain.calendrier.CalendrierVersion;
import ma.nafura.chantiers.domain.chantier.Chantier;
import ma.nafura.chantiers.repository.ActiviteChantierRepository;
import ma.nafura.chantiers.repository.CalendrierChantierRepository;
import ma.nafura.chantiers.repository.CalendrierCreneauRepository;
import ma.nafura.chantiers.repository.CalendrierExceptionCreneauRepository;
import ma.nafura.chantiers.repository.CalendrierExceptionRepository;
import ma.nafura.chantiers.repository.CalendrierVersionRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.web.server.ResponseStatusException;

/** SEKTOR-326 — CRUD calendrier, création paresseuse, pas de recalcul de masse. */
@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class CalendrierChantierServiceTest {

    private static final UUID TENANT = UUID.fromString("00000000-0000-0000-0000-000000000001");
    private static final String CHANTIER = "ch-1";
    private static final LocalDate VENDREDI = LocalDate.of(2026, 9, 11);
    private static final LocalDate SAMEDI = LocalDate.of(2026, 9, 12);
    private static final LocalDate LUNDI = LocalDate.of(2026, 9, 14);

    @Mock private CalendrierChantierRepository calendrierRepository;
    @Mock private CalendrierVersionRepository versionRepository;
    @Mock private CalendrierCreneauRepository creneauRepository;
    @Mock private CalendrierExceptionRepository exceptionRepository;
    @Mock private CalendrierExceptionCreneauRepository exceptionCreneauRepository;
    @Mock private ActiviteChantierRepository activiteRepository;
    @Mock private ChantierService chantierService;
    @Mock private PlanningPolicy planningPolicy;

    private CalendrierChantierService service;
    private final List<CalendrierChantier> calendriers = new ArrayList<>();
    private final List<CalendrierVersion> versions = new ArrayList<>();
    private final List<CalendrierCreneau> creneaux = new ArrayList<>();
    private final List<CalendrierException> exceptions = new ArrayList<>();
    private final List<CalendrierExceptionCreneau> exceptionCreneaux = new ArrayList<>();
    private long activiteCount;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        activiteCount = 0;
        service = new CalendrierChantierService(
                calendrierRepository,
                versionRepository,
                creneauRepository,
                exceptionRepository,
                exceptionCreneauRepository,
                activiteRepository,
                chantierService,
                planningPolicy);

        when(chantierService.getById(CHANTIER))
                .thenReturn(Chantier.builder().id(CHANTIER).code("CH-1").label("Résidence").build());
        when(activiteRepository.countByTenantIdAndChantierId(eq(TENANT), eq(CHANTIER)))
                .thenAnswer(inv -> activiteCount);

        when(calendrierRepository.save(any())).thenAnswer(inv -> {
            CalendrierChantier c = inv.getArgument(0);
            calendriers.removeIf(x -> x.getId().equals(c.getId()));
            calendriers.add(c);
            return c;
        });
        when(calendrierRepository.findByTenantIdAndChantierId(eq(TENANT), eq(CHANTIER)))
                .thenAnswer(inv -> calendriers.stream().findFirst());

        when(versionRepository.save(any())).thenAnswer(inv -> {
            CalendrierVersion v = inv.getArgument(0);
            versions.removeIf(x -> x.getId().equals(v.getId()));
            versions.add(v);
            return v;
        });
        when(versionRepository.findByTenantIdAndCalendrierIdOrderByDateEffetAsc(eq(TENANT), any()))
                .thenAnswer(inv -> {
                    String calId = inv.getArgument(1);
                    return versions.stream()
                            .filter(v -> calId.equals(v.getCalendrierId()))
                            .sorted((a, b) -> a.getDateEffet().compareTo(b.getDateEffet()))
                            .toList();
                });
        when(versionRepository.findByCalendrierIdAndDateEffet(any(), any())).thenAnswer(inv -> {
            String calId = inv.getArgument(0);
            LocalDate date = inv.getArgument(1);
            return versions.stream()
                    .filter(v -> calId.equals(v.getCalendrierId()) && date.equals(v.getDateEffet()))
                    .findFirst();
        });

        when(creneauRepository.save(any())).thenAnswer(inv -> {
            CalendrierCreneau c = inv.getArgument(0);
            creneaux.add(c);
            return c;
        });
        when(creneauRepository.findByTenantIdAndVersionId(eq(TENANT), any())).thenAnswer(inv -> {
            String versionId = inv.getArgument(1);
            return creneaux.stream().filter(c -> versionId.equals(c.getVersionId())).toList();
        });

        when(exceptionRepository.save(any())).thenAnswer(inv -> {
            CalendrierException e = inv.getArgument(0);
            exceptions.add(e);
            return e;
        });
        when(exceptionRepository.findByTenantIdAndVersionId(eq(TENANT), any())).thenAnswer(inv -> {
            String versionId = inv.getArgument(1);
            return exceptions.stream().filter(e -> versionId.equals(e.getVersionId())).toList();
        });
        when(exceptionCreneauRepository.save(any())).thenAnswer(inv -> {
            CalendrierExceptionCreneau c = inv.getArgument(0);
            exceptionCreneaux.add(c);
            return c;
        });
        when(exceptionCreneauRepository.findByTenantIdAndExceptionId(eq(TENANT), any())).thenAnswer(inv -> {
            String exId = inv.getArgument(1);
            return exceptionCreneaux.stream().filter(c -> exId.equals(c.getExceptionId())).toList();
        });
        doAnswer(inv -> {
            String versionId = inv.getArgument(0);
            creneaux.removeIf(c -> versionId.equals(c.getVersionId()));
            return null;
        })
                .when(creneauRepository)
                .deleteByVersionId(any());
        doAnswer(inv -> {
            String versionId = inv.getArgument(0);
            exceptions.removeIf(e -> versionId.equals(e.getVersionId()));
            return null;
        })
                .when(exceptionRepository)
                .deleteByVersionId(any());
        doAnswer(inv -> {
            String exId = inv.getArgument(0);
            exceptionCreneaux.removeIf(c -> exId.equals(c.getExceptionId()));
            return null;
        })
                .when(exceptionCreneauRepository)
                .deleteByExceptionId(any());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void find_sansEcriture_nEstPasCree() {
        assertThat(service.find(CHANTIER)).isEmpty();
        assertThat(calendriers).isEmpty();
    }

    @Test
    void derive_chantierVide_creeStandardLundiVendredi() {
        LocalDate fin = service.deriveInclusiveFin(CHANTIER, VENDREDI, 960);

        assertThat(fin).isEqualTo(LUNDI);
        assertThat(calendriers).hasSize(1);
        assertThat(calendriers.get(0).getKind()).isEqualTo(CalendrierKind.STANDARD);
        assertThat(service.find(CHANTIER).orElseThrow().getVersions().get(0).getFuseauIana())
                .isEqualTo(CalendrierOuvreCalculator.FUSEAU_DEFAUT);
    }

    @Test
    void derive_lignesExistantes_creeHistoriqueSeptJours() {
        activiteCount = 3;

        LocalDate fin = service.deriveInclusiveFin(CHANTIER, SAMEDI, 480);

        assertThat(fin).isEqualTo(SAMEDI);
        assertThat(calendriers.get(0).getKind()).isEqualTo(CalendrierKind.HISTORIQUE);
    }

    @Test
    void upsert_shiftNuitStockable_sansRecalculActivites() {
        CalendrierVersionWriteDto body = lundiVendredi();
        CalendrierCreneauWriteDto nuit = new CalendrierCreneauWriteDto();
        nuit.setJourSemaine(1);
        nuit.setHeureDebut(LocalTime.of(22, 0));
        nuit.setHeureFin(LocalTime.of(6, 0));
        body.getCreneaux().add(nuit);

        CalendrierChantierDto dto = service.upsert(CHANTIER, body);

        assertThat(dto.getKind()).isEqualTo("STANDARD");
        assertThat(dto.getVersions().get(0).getCreneaux())
                .anyMatch(c -> c.isLendemain() && c.getHeureDebut().equals(LocalTime.of(22, 0)));
        verify(activiteRepository, never()).save(any());
    }

    @Test
    void upsert_exceptionFermeture_puisCalculAc04() {
        CalendrierVersionWriteDto body = lundiSamedi();
        CalendrierExceptionWriteDto fermeture = new CalendrierExceptionWriteDto();
        fermeture.setDateLocale(SAMEDI);
        fermeture.setType("FERMETURE");
        body.setExceptions(List.of(fermeture));
        service.upsert(CHANTIER, body);

        assertThat(service.deriveInclusiveFin(CHANTIER, VENDREDI, 960)).isEqualTo(LUNDI);
        verify(activiteRepository, never()).save(any());
    }

    @Test
    void upsert_fuseauInvalide_refuse() {
        CalendrierVersionWriteDto body = lundiVendredi();
        body.setFuseauIana("UTC+1");

        assertThatThrownBy(() -> service.upsert(CHANTIER, body))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(CalendrierOuvreCalculator.ERR_FUSEAU);
    }

    @Test
    void deleteVersion_refuseLaDerniere() {
        service.upsert(CHANTIER, lundiVendredi());
        String versionId = versions.get(0).getId();

        assertThatThrownBy(() -> service.deleteVersion(CHANTIER, versionId))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessageContaining(CalendrierChantierService.ERR_DERNIERE_VERSION);
    }

    @Test
    void upsert_sansDroitAdministrer_403() {
        doThrow(new ResponseStatusException(HttpStatus.FORBIDDEN, PlanningPolicy.REFUS_CODE))
                .when(planningPolicy)
                .assertCanAdministerCalendar(CHANTIER);

        assertThatThrownBy(() -> service.upsert(CHANTIER, lundiVendredi()))
                .isInstanceOf(ResponseStatusException.class)
                .hasMessageContaining(PlanningPolicy.REFUS_CODE);
        verify(calendrierRepository, never()).save(any());
    }

    private static CalendrierVersionWriteDto lundiVendredi() {
        CalendrierVersionWriteDto dto = new CalendrierVersionWriteDto();
        dto.setDateEffet(LocalDate.of(1900, 1, 1));
        dto.setFuseauIana(CalendrierOuvreCalculator.FUSEAU_DEFAUT);
        dto.setCreneaux(new ArrayList<>());
        for (int jour = 1; jour <= 5; jour++) {
            dto.getCreneaux().add(creneau(jour, 8, 16, false));
        }
        return dto;
    }

    private static CalendrierVersionWriteDto lundiSamedi() {
        CalendrierVersionWriteDto dto = lundiVendredi();
        dto.getCreneaux().add(creneau(6, 8, 16, false));
        return dto;
    }

    private static CalendrierCreneauWriteDto creneau(int jour, int hDebut, int hFin, boolean lendemain) {
        CalendrierCreneauWriteDto dto = new CalendrierCreneauWriteDto();
        dto.setJourSemaine(jour);
        dto.setHeureDebut(LocalTime.of(hDebut, 0));
        dto.setHeureFin(LocalTime.of(hFin, 0));
        dto.setLendemain(lendemain);
        return dto;
    }
}
