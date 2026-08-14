package ma.nafura.chantiers.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.chantiers.api.request.PosteBudgetaireCreateDto;
import ma.nafura.chantiers.domain.chantier.ChantierLot;
import ma.nafura.chantiers.domain.budget.PosteBudgetaire;
import ma.nafura.chantiers.repository.ChantierLotRepository;
import ma.nafura.chantiers.repository.PosteBudgetaireRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import ma.nafura.chantiers.seeders.PosteBudgetaireSeedService;

@ExtendWith(MockitoExtension.class)
class PosteBudgetaireServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final String LOT_ID = "ch-001-lot-01";

    @Mock private PosteBudgetaireRepository repository;
    @Mock private ChantierLotRepository lotRepository;
    @Mock private PosteBudgetaireSeedService seedService;

    @InjectMocks private PosteBudgetaireService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        TenantContext.setTenantEnabled(true);
        when(lotRepository.findByIdAndTenantId(LOT_ID, TENANT_ID))
                .thenReturn(Optional.of(ChantierLot.builder().id(LOT_ID).tenantId(TENANT_ID).build()));
        when(repository.findByTenantIdAndLotIdAndCode(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(repository.findByIdAndTenantId(any(), any())).thenReturn(Optional.empty());
        when(repository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void generatesSequentialCodeWithinLotWhenCodeIsMissing() {
        when(repository.findByTenantIdAndLotIdOrderByOrdreAscCodeAsc(TENANT_ID, LOT_ID))
                .thenReturn(List.of(poste("01", 1), poste("02", 2)));

        PosteBudgetaireCreateDto request = request("Béton", null);

        PosteBudgetaire created = service.create(LOT_ID, request);

        assertEquals("03", created.getCode());
        assertEquals("ch-001-lot-01-poste-03", created.getId());
    }

    @Test
    void preservesExplicitCode() {
        PosteBudgetaireCreateDto request = request("Poste manuel", "P-MANUEL");

        PosteBudgetaire created = service.create(LOT_ID, request);

        assertEquals("P-MANUEL", created.getCode());
    }

    private static PosteBudgetaireCreateDto request(String designation, String code) {
        PosteBudgetaireCreateDto request = new PosteBudgetaireCreateDto();
        request.setDesignation(designation);
        request.setCode(code);
        return request;
    }

    private static PosteBudgetaire poste(String code, int ordre) {
        return PosteBudgetaire.builder()
                .id(LOT_ID + "-poste-" + code)
                .tenantId(TENANT_ID)
                .lotId(LOT_ID)
                .code(code)
                .designation(code)
                .ordre(ordre)
                .build();
    }
}
