package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.api.request.DevisUpdateDto;
import ma.nafura.etudes.domain.devis.Devis;
import ma.nafura.etudes.repository.AppelOffreClientRepository;
import ma.nafura.etudes.repository.DevisRepository;
import ma.nafura.etudes.repository.DevisVersionRepository;
import ma.nafura.etudes.seeders.DevisSeedService;
import ma.nafura.etudes.service.port.bc.EtudeClientPort;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.jdbc.core.RowMapper;

/**
 * AC-5 (continuite-etude-devis-chantier) — un devis approuvé est figé : aucune mutation,
 * annulation, suppression, négociation ou nouvelle version concurrente. A fortiori quand il
 * est lié à une étude GAGNE ou CONVERTIE.
 */
@ExtendWith(MockitoExtension.class)
class DevisFigeTest {

    private static final UUID TENANT = UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc");
    private static final UUID DEVIS_ID = UUID.fromString("aaaa1111-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOSSIER_ID = UUID.fromString("bbbb2222-bbbb-bbbb-bbbb-bbbbbbbbbbbb");

    @Mock
    private DevisRepository repository;

    @Mock
    private DevisVersionRepository versionRepository;

    @Mock
    private DevisSeedService seedService;

    @Mock
    private DpgfService dpgfService;

    @Mock
    private DevisGenerationService generationService;

    @Mock
    private EtudeClientPort clientPort;

    @Mock
    private AppelOffreClientRepository aocRepository;

    @Mock
    private JdbcTemplate jdbcTemplate;

    private DevisService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DevisService(
                repository,
                versionRepository,
                seedService,
                dpgfService,
                generationService,
                clientPort,
                aocRepository,
                jdbcTemplate);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    private Devis devisApprouve() {
        return Devis.builder()
                .id(DEVIS_ID)
                .tenantId(TENANT)
                .numero("DV-2026-0002")
                .version(3)
                .clientId("cli-001")
                .clientName("MOA")
                .objet("Affaire")
                .dateEmission(LocalDate.of(2026, 7, 1))
                .dateValidite(LocalDate.of(2026, 10, 1))
                .conditionsPaiement("30/60/10")
                .totalHt(new BigDecimal("737106.00"))
                .tvaTaux(new BigDecimal("20"))
                .totalTva(new BigDecimal("147421.20"))
                .totalTtc(new BigDecimal("884527.20"))
                .status(Devis.STATUS_APPROUVE)
                .dossierEtudeId(DOSSIER_ID)
                .build();
    }

    @Test
    void update_devisApprouve_refuse() {
        when(repository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devisApprouve()));
        assertThatThrownBy(() -> service.update(DEVIS_ID, new DevisUpdateDto()))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.devis.non_modifiable");
        verify(repository, never()).save(any());
    }

    @Test
    void delete_devisApprouve_refuse() {
        when(repository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devisApprouve()));
        assertThatThrownBy(() -> service.delete(DEVIS_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.devis.non_modifiable");
        verify(repository, never()).delete((Devis) any());
    }

    @Test
    void createVersion_devisApprouve_refuse() {
        when(repository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devisApprouve()));
        assertThatThrownBy(() -> service.createVersion(DEVIS_ID, "reprise"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.devis.fige_approuve");
        verify(repository, never()).save(any());
    }

    @Test
    void submit_devisApprouve_refuse() {
        when(repository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devisApprouve()));
        assertThatThrownBy(() -> service.submit(DEVIS_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.devis.fige_approuve");
    }

    @Test
    void negotiate_devisApprouve_refuse() {
        when(repository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devisApprouve()));
        assertThatThrownBy(() -> service.negotiate(DEVIS_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.devis.fige_approuve");
    }

    @Test
    void approve_devisApprouve_refuse() {
        when(repository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devisApprouve()));
        assertThatThrownBy(() -> service.approve(DEVIS_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.devis.fige_approuve");
    }

    @Test
    void lose_devisApprouve_refuse() {
        when(repository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devisApprouve()));
        assertThatThrownBy(() -> service.lose(DEVIS_ID, "concurrent"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.devis.fige_approuve");
    }

    @Test
    void cancel_devisApprouve_refuse() {
        when(repository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devisApprouve()));
        assertThatThrownBy(() -> service.cancel(DEVIS_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.devis.fige_approuve");
    }

    /** AC-5 — un devis non approuvé mais lié à une étude GAGNE est figé aussi. */
    @Test
    void createVersion_devisLieAEtudeGagnee_refuse() {
        Devis devis = devisApprouve();
        devis.setStatus(Devis.STATUS_NEGOCIATION);
        when(repository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(), any()))
                .thenReturn(List.of("GAGNE"));

        assertThatThrownBy(() -> service.createVersion(DEVIS_ID, "reprise"))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.devis.fige_etude_gagnee");
        verify(repository, never()).save(any());
    }

    /** AC-5 — une étude CONVERTIE fige aussi le devis lié. */
    @Test
    void cancel_devisLieAEtudeConvertie_refuse() {
        Devis devis = devisApprouve();
        devis.setStatus(Devis.STATUS_EMIS);
        when(repository.findByIdAndTenantId(DEVIS_ID, TENANT)).thenReturn(Optional.of(devis));
        when(jdbcTemplate.query(anyString(), any(RowMapper.class), any(), any()))
                .thenReturn(List.of("CONVERTIE"));

        assertThatThrownBy(() -> service.cancel(DEVIS_ID))
                .isInstanceOf(IllegalStateException.class)
                .hasMessage("etudes.devis.fige_etude_gagnee");
        verify(repository, never()).save(any());
    }
}
