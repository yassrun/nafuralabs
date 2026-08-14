package ma.nafura.finance.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.UUID;
import ma.nafura.finance.api.request.PaymentModeCreateDto;
import ma.nafura.finance.domain.model.PaymentMode;
import ma.nafura.finance.mapper.PaymentModeMapper;
import ma.nafura.finance.repository.PaymentModeRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PaymentModeServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");

    @Mock
    private PaymentModeRepository repository;

    @Mock
    private PaymentModeMapper mapper;

    @InjectMocks
    private PaymentModeService service;

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
    void createRejectsDuplicateCode() {
        PaymentModeCreateDto dto = new PaymentModeCreateDto();
        dto.setCode("VIREMENT");
        dto.setName("Virement bancaire");

        when(repository.existsByTenantIdAndCode(TENANT_ID, "VIREMENT")).thenReturn(true);

        assertThrows(IllegalArgumentException.class, () -> service.create(dto));
    }

    @Test
    void createPersistsPaymentMode() {
        PaymentModeCreateDto dto = new PaymentModeCreateDto();
        dto.setCode("CHEQUE");
        dto.setName("Chèque");

        PaymentMode entity =
                PaymentMode.builder().code("CHEQUE").name("Chèque").isActive(true).build();

        when(repository.existsByTenantIdAndCode(TENANT_ID, "CHEQUE")).thenReturn(false);
        when(mapper.toEntity(dto)).thenReturn(entity);
        when(repository.save(any(PaymentMode.class))).thenAnswer(inv -> {
            PaymentMode saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            saved.setTenantId(TENANT_ID);
            return saved;
        });

        PaymentMode created = service.create(dto);

        assertEquals(TENANT_ID, created.getTenantId());
        assertEquals("CHEQUE", created.getCode());
    }
}
