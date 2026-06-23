package ma.nafura.ventes.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.dto.SituationLigneDto;
import ma.nafura.chantiers.api.dto.SituationTravauxDto;
import ma.nafura.chantiers.domain.model.Chantier;
import ma.nafura.chantiers.repository.ChantierRepository;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.ventes.domain.model.FactureClient;
import ma.nafura.ventes.repository.FactureClientRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class FactureClientServiceCreateFromSituationTest {

    private static final UUID TENANT_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private FactureClientRepository repository;

    @Mock
    private FactureClientSeedService seedService;

    @Mock
    private ChantierRepository chantierRepository;

    @Mock
    private EncaissementClientService encaissementService;

    @InjectMocks
    private FactureClientService service;

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
    void createFromSituation_buildsSituationTypeFactureFromPeriodLines() {
        Chantier chantier = Chantier.builder()
                .id("CH-1")
                .tenantId(TENANT_ID)
                .code("CH001")
                .label("Chantier test")
                .clientId("CLI-1")
                .clientName("Client test")
                .build();
        when(chantierRepository.findByIdAndTenantId("CH-1", TENANT_ID)).thenReturn(Optional.of(chantier));
        when(repository.countByTenantId(TENANT_ID)).thenReturn(0L);
        when(repository.save(any(FactureClient.class))).thenAnswer(invocation -> {
            FactureClient saved = invocation.getArgument(0);
            saved.setId(UUID.fromString("22222222-2222-2222-2222-222222222222"));
            return saved;
        });

        SituationTravauxDto situation = SituationTravauxDto.builder()
                .id("SIT-1")
                .chantierId("CH-1")
                .chantierCode("CH001")
                .numero("SIT-001")
                .dateEmission(LocalDate.of(2026, 5, 1))
                .retenueGarantiePercent(new BigDecimal("7"))
                .retenueAvanceMontant(new BigDecimal("1000"))
                .tvaTaux(new BigDecimal("20"))
                .lignes(List.of(
                        SituationLigneDto.builder()
                                .designation("Lot terrassement")
                                .unite("m3")
                                .quantitePrecedente(new BigDecimal("10"))
                                .quantiteCumulee(new BigDecimal("25"))
                                .prixUnitaire(new BigDecimal("100"))
                                .montantHt(new BigDecimal("2500"))
                                .build()))
                .build();

        FactureClient facture = service.createFromSituation(situation);

        assertNotNull(facture.getId());
        assertEquals(FactureClient.TYPE_SITUATION, facture.getType());
        assertEquals("CLI-1", facture.getClientId());
        assertEquals(1, facture.getLignes().size());
        assertEquals(new BigDecimal("1500.0000"), facture.getLignes().getFirst().getTotalHt());

        ArgumentCaptor<FactureClient> captor = ArgumentCaptor.forClass(FactureClient.class);
        verify(repository).save(captor.capture());
        assertEquals(new BigDecimal("7"), captor.getValue().getRetenueGarantieTaux());
        assertEquals(new BigDecimal("1000"), captor.getValue().getResorptionAvanceMontant());
    }
}
