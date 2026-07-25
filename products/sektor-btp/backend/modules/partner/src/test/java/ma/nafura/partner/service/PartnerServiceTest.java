package ma.nafura.partner.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.Optional;
import java.util.UUID;
import ma.nafura.partner.api.request.PartnerCreateDto;
import ma.nafura.partner.domain.model.Partner;
import ma.nafura.partner.domain.model.PartnerRoleType;
import ma.nafura.partner.mapper.PartnerMapper;
import ma.nafura.partner.repository.PartnerRepository;
import ma.nafura.partner.repository.PartnerRoleRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PartnerServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private PartnerMapper partnerMapper;

    @Mock
    private PartnerRoleRepository roleRepository;

    @InjectMocks
    private PartnerService service;

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
    void createRejectsInvalidIce() {
        PartnerCreateDto dto = new PartnerCreateDto();
        dto.setCode("X-001");
        dto.setRaisonSociale("Test");
        dto.setIce("123");

        assertThrows(IllegalArgumentException.class, () -> service.create(dto));
    }

    @Test
    void addRoleFailsWhenPartnerMissing() {
        UUID partnerId = UUID.randomUUID();
        when(partnerRepository.findByIdAndTenantId(partnerId, TENANT_ID)).thenReturn(Optional.empty());

        assertThrows(
                IllegalArgumentException.class,
                () -> service.addRole(partnerId, PartnerRoleType.CLIENT));
    }
}
