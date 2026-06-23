package ma.nafura.hse.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.UUID;
import ma.nafura.hse.api.dto.HseKpiDto;
import ma.nafura.hse.domain.model.Incident;
import ma.nafura.hse.repository.IncidentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class HseKpiServiceTest {

    @Mock
    private IncidentRepository incidentRepository;

    @Mock
    private IncidentSeedService incidentSeedService;

    private HseKpiService service;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new HseKpiService(incidentRepository, incidentSeedService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void compute_appliesTf1Tf2TgFormulasWithStubHeures() {
        LocalDate from = LocalDate.of(2026, 1, 1);
        LocalDate to = LocalDate.of(2026, 12, 31);

        Incident atAvecArret1 = at("at1", LocalDate.of(2026, 1, 12), 10);
        Incident atAvecArret2 = at("at2", LocalDate.of(2026, 2, 3), 5);
        Incident atSansArret = at("at3", LocalDate.of(2026, 3, 1), 0);
        Incident presquAccident = incident("pa1", LocalDate.of(2026, 4, 1), Incident.TYPE_PRESQU_ACCIDENT);

        when(incidentRepository.findByTenantIdAndDateIncidentBetweenOrderByDateIncidentAsc(eq(tenantId), eq(from), eq(to)))
                .thenReturn(List.of(atAvecArret1, atAvecArret2, atSansArret, presquAccident));

        HseKpiDto kpis = service.compute(from, to, null);

        assertThat(kpis.getHeuresTravaillees()).isEqualTo(HseKpiService.STUB_HEURES_TRAVAILLEES);
        assertThat(kpis.getTf1()).isEqualTo(2.0);
        assertThat(kpis.getTf2()).isEqualTo(3.0);
        assertThat(kpis.getTg()).isEqualTo(0.015);
        assertThat(kpis.getPyramideBird().getAt()).isEqualTo(3);
        assertThat(kpis.getPyramideBird().getAtAvecArret()).isEqualTo(2);
        assertThat(kpis.getPyramideBird().getPresquAccidents()).isEqualTo(1);
        assertThat(kpis.getJoursSansAccident()).isEqualTo((int) java.time.temporal.ChronoUnit.DAYS.between(
                LocalDate.of(2026, 3, 1), to));
        assertThat(kpis.getEvolutionMensuelle()).hasSize(12);
    }

    @Test
    void compute_scale3AndRatioHelpers() {
        assertThat(HseKpiService.scale3(1.23456)).isEqualTo(1.235);
        assertThat(HseKpiService.ratio(4, 2)).isEqualTo(2.0);
        assertThat(HseKpiService.ratio(1, 0)).isEqualTo(0.0);
        assertThat(HseKpiService.computeJoursSansAccident(LocalDate.of(2026, 5, 1), null)).isZero();
    }

    private static Incident at(String id, LocalDate date, int joursArret) {
        return Incident.builder()
                .id(id)
                .tenantId(UUID.randomUUID())
                .numero("INC-TEST")
                .dateIncident(date)
                .lieu("Test")
                .typeIncident(Incident.TYPE_AT)
                .gravite(Incident.GRAVITE_MODERE)
                .description("Test")
                .status(Incident.STATUS_OUVERT)
                .cnssDatDeclare(false)
                .joursArret(joursArret)
                .build();
    }

    private static Incident incident(String id, LocalDate date, String type) {
        return Incident.builder()
                .id(id)
                .tenantId(UUID.randomUUID())
                .numero("INC-TEST")
                .dateIncident(date)
                .lieu("Test")
                .typeIncident(type)
                .gravite(Incident.GRAVITE_MODERE)
                .description("Test")
                .status(Incident.STATUS_OUVERT)
                .cnssDatDeclare(false)
                .build();
    }
}
