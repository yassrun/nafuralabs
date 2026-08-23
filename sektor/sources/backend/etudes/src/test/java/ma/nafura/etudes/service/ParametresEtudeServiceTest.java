package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.consultation.ConsultationParametres;
import ma.nafura.etudes.repository.ConsultationParametresRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

class ParametresEtudeServiceTest {

    private static final UUID TENANT = UUID.fromString("11111111-1111-1111-1111-111111111111");

    private ConsultationParametresRepository consultationParametres;
    private ParametresEtudeService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        consultationParametres = mock(ConsultationParametresRepository.class);
        service = new ParametresEtudeService(mock(TenantSettingReader.class), consultationParametres);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void defaut_optionnelle_min_1_sans_ligne() {
        when(consultationParametres.findById(TENANT)).thenReturn(Optional.empty());

        assertThat(service.consultationMode()).isEqualTo(ParametresEtudeService.CONSULTATION_OPTIONNELLE);
        assertThat(service.consultationObligatoire()).isFalse();
        assertThat(service.consultationMinimum()).isEqualTo(1);
    }

    @Test
    void setConsultation_persiste_mode_et_minimum_sur_table_etudes() {
        when(consultationParametres.findById(TENANT)).thenReturn(Optional.empty());
        when(consultationParametres.save(any(ConsultationParametres.class))).thenAnswer(inv -> inv.getArgument(0));

        service.setConsultation("obligatoire", 2);

        verify(consultationParametres).save(org.mockito.ArgumentMatchers.argThat(row ->
                TENANT.equals(row.getTenantId())
                        && ParametresEtudeService.CONSULTATION_OBLIGATOIRE.equals(row.getMode())
                        && row.getMinimum() == 2));
    }

    @Test
    void setConsultation_refuse_minimum_inferieur_a_1() {
        assertThatThrownBy(() -> service.setConsultation("OPTIONNELLE", 0))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.consultation.minimum_invalide");
    }
}
