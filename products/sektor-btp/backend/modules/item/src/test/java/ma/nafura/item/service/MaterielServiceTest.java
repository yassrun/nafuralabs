package ma.nafura.item.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.item.api.request.MaterielCreateDto;
import ma.nafura.item.domain.model.Materiel;
import ma.nafura.item.repository.MaterielRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class MaterielServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");

    @Mock
    private MaterielRepository repository;

    @InjectMocks
    private MaterielService service;

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
    void createPersistsMaterielWithTenant() {
        MaterielCreateDto dto = new MaterielCreateDto();
        dto.setCode("ENG-001");
        dto.setName("Pelle");
        dto.setNumeroSerie("SN-001");
        dto.setIsActive(true);

        when(repository.existsByTenantIdAndCode(TENANT_ID, "ENG-001")).thenReturn(false);
        when(repository.save(any(Materiel.class))).thenAnswer(inv -> inv.getArgument(0));

        Materiel created = service.create(dto);

        assertEquals(TENANT_ID, created.getTenantId());
        assertEquals("ENG-001", created.getCode());
        assertEquals("DISPONIBLE", created.getStatus());
    }

    @Test
    void listUsesTenantScopedSpecification() {
        Materiel row = Materiel.builder().id(UUID.randomUUID()).tenantId(TENANT_ID).code("ENG-001").build();
        when(repository.findAll(any(Specification.class), any(Pageable.class)))
                .thenReturn(new PageImpl<>(List.of(row)));

        var page = service.list(0, 20, "pelle", "DISPONIBLE", null, null);

        assertEquals(1, page.getTotalElements());
        verify(repository).findAll(any(Specification.class), any(Pageable.class));
    }

    @Test
    void getByIdThrowsWhenMissing() {
        UUID id = UUID.randomUUID();
        when(repository.findByIdAndTenantId(id, TENANT_ID)).thenReturn(Optional.empty());
        assertThrows(IllegalArgumentException.class, () -> service.getById(id));
    }
}
