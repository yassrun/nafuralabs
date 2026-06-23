package ma.nafura.hse.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.hse.api.dto.AuditClotureResultDto;
import ma.nafura.hse.domain.model.AuditHse;
import ma.nafura.hse.domain.model.AuditHseLigne;
import ma.nafura.hse.repository.AuditHseLigneRepository;
import ma.nafura.hse.repository.AuditHseRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class AuditClotureGenerateNcTest {

    @Mock
    private AuditHseRepository auditRepository;

    @Mock
    private AuditHseLigneRepository ligneRepository;

    @Mock
    private AuditHseSeedService seedService;

    private AuditHseService service;

    private final UUID tenantId = UUID.randomUUID();

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(tenantId);
        service = new AuditHseService(auditRepository, ligneRepository, seedService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void cloturer_generatesNcStubsForNonResponses() {
        AuditHse audit = baseAudit(AuditHse.STATUS_EN_COURS);
        AuditHseLigne conforme = ligne("aud001-l001", "ECH-01", AuditHseLigne.REPONSE_OUI);
        AuditHseLigne non1 = ligne("aud001-l002", "ECH-02", AuditHseLigne.REPONSE_NON);
        non1.setCommentaire("Garde-corps absent");
        AuditHseLigne non2 = ligne("aud001-l003", "ECH-03", AuditHseLigne.REPONSE_NON);

        when(auditRepository.findByIdAndTenantId("aud001", tenantId)).thenReturn(Optional.of(audit));
        when(ligneRepository.findByTenantIdAndAuditIdOrderByOrdreAsc(tenantId, "aud001"))
                .thenReturn(List.of(conforme, non1, non2));
        when(ligneRepository.findByTenantId(tenantId)).thenReturn(List.of());
        when(ligneRepository.save(any(AuditHseLigne.class))).thenAnswer(inv -> inv.getArgument(0));
        when(auditRepository.save(any(AuditHse.class))).thenAnswer(inv -> inv.getArgument(0));

        AuditClotureResultDto result = service.cloturer("aud001");

        assertThat(result.getNbNonConformitesGenerees()).isEqualTo(2);
        assertThat(result.getNonConformitesGenerees()).hasSize(2);
        assertThat(result.getAudit().getStatus()).isEqualTo(AuditHse.STATUS_CLOTURE);
        assertThat(non1.getNcId()).startsWith("nc-stub-");
        assertThat(non1.getNcNumero()).matches("NC-\\d{4}-\\d{4}");
        assertThat(non2.getNcId()).isNotNull();
        assertThat(conforme.getNcId()).isNull();
    }

    @Test
    void cloturer_withoutNonResponses_closesWithoutNc() {
        AuditHse audit = baseAudit(AuditHse.STATUS_EN_COURS);
        AuditHseLigne oui = ligne("aud001-l001", "ECH-01", AuditHseLigne.REPONSE_OUI);

        when(auditRepository.findByIdAndTenantId("aud001", tenantId)).thenReturn(Optional.of(audit));
        when(ligneRepository.findByTenantIdAndAuditIdOrderByOrdreAsc(tenantId, "aud001"))
                .thenReturn(List.of(oui));
        when(auditRepository.save(any(AuditHse.class))).thenAnswer(inv -> inv.getArgument(0));

        AuditClotureResultDto result = service.cloturer("aud001");

        assertThat(result.getNbNonConformitesGenerees()).isZero();
        assertThat(result.getAudit().getStatus()).isEqualTo(AuditHse.STATUS_CLOTURE);
        assertThat(result.getMessage()).contains("sans non-conformité");
    }

    private AuditHse baseAudit(String status) {
        return AuditHse.builder()
                .id("aud001")
                .tenantId(tenantId)
                .numero("AUD-2026-0001")
                .chantierId("ch-001")
                .chantierCode("CH-2025-001")
                .titre("Audit échafaudages")
                .auditeurNom("Test Auditeur")
                .dateAudit(LocalDate.of(2026, 5, 15))
                .status(status)
                .build();
    }

    private AuditHseLigne ligne(String id, String code, String reponse) {
        return AuditHseLigne.builder()
                .id(id)
                .tenantId(tenantId)
                .auditId("aud001")
                .ordre(0)
                .code(code)
                .libelle("Point " + code)
                .reponse(reponse)
                .build();
    }
}
