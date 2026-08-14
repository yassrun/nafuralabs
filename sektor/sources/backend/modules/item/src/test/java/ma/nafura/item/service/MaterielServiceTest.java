package ma.nafura.item.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.item.api.request.ItemCreateDto;
import ma.nafura.item.api.request.MaterielCreateDto;
import ma.nafura.item.domain.Nature;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.domain.model.Materiel;
import ma.nafura.item.repository.MaterielRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;

@ExtendWith(MockitoExtension.class)
class MaterielServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CATEGORY_ID = UUID.fromString("00000000-0000-4000-8000-0000000000aa");
    private static final UUID ITEM_ID = UUID.fromString("00000000-0000-4000-8000-0000000000bb");

    @Mock
    private MaterielRepository repository;

    @Mock
    private ItemService itemService;

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
    void createPersistsMaterielLinkedToMaterielItem() {
        MaterielCreateDto dto = new MaterielCreateDto();
        dto.setCode("ENG-001");
        dto.setName("Pelle");
        dto.setNumeroSerie("SN-001");
        dto.setItemCategoryId(CATEGORY_ID);
        dto.setIsActive(true);

        Item linked = Item.builder()
                .id(ITEM_ID)
                .tenantId(TENANT_ID)
                .code("ENG-001")
                .name("Pelle")
                .nature(Nature.MATERIEL.name())
                .itemCategoryId(CATEGORY_ID)
                .build();

        when(repository.existsByTenantIdAndCode(TENANT_ID, "ENG-001")).thenReturn(false);
        when(itemService.create(any(ItemCreateDto.class))).thenReturn(linked);
        when(repository.save(any(Materiel.class))).thenAnswer(inv -> inv.getArgument(0));

        Materiel created = service.create(dto);

        assertEquals(TENANT_ID, created.getTenantId());
        assertEquals("ENG-001", created.getCode());
        assertEquals(ITEM_ID, created.getItemId());
        assertEquals(CATEGORY_ID, created.getItemCategoryId());
        assertEquals("DISPONIBLE", created.getStatus());

        ArgumentCaptor<ItemCreateDto> itemCaptor = ArgumentCaptor.forClass(ItemCreateDto.class);
        verify(itemService).create(itemCaptor.capture());
        assertEquals(Nature.MATERIEL.name(), itemCaptor.getValue().getNature());
        assertEquals("ENG-001", itemCaptor.getValue().getCode());
        assertEquals(CATEGORY_ID, itemCaptor.getValue().getItemCategoryId());
    }

    @Test
    void createReusesExistingMaterielItem() {
        MaterielCreateDto dto = new MaterielCreateDto();
        dto.setCode("ENG-002");
        dto.setName("Grue");
        dto.setNumeroSerie("SN-002");
        dto.setItemId(ITEM_ID);
        dto.setIsActive(true);

        Item existing = Item.builder()
                .id(ITEM_ID)
                .nature(Nature.MATERIEL.name())
                .itemCategoryId(CATEGORY_ID)
                .build();

        when(repository.existsByTenantIdAndCode(TENANT_ID, "ENG-002")).thenReturn(false);
        when(itemService.getById(ITEM_ID)).thenReturn(Optional.of(existing));
        when(repository.save(any(Materiel.class))).thenAnswer(inv -> inv.getArgument(0));

        Materiel created = service.create(dto);

        assertEquals(ITEM_ID, created.getItemId());
        assertEquals(CATEGORY_ID, created.getItemCategoryId());
        verify(itemService, never()).create(any());
    }

    @Test
    void createRejectsNonMaterielLinkedItem() {
        MaterielCreateDto dto = new MaterielCreateDto();
        dto.setCode("ENG-003");
        dto.setName("Bad");
        dto.setNumeroSerie("SN-003");
        dto.setItemId(ITEM_ID);
        dto.setIsActive(true);

        Item wrong = Item.builder().id(ITEM_ID).nature(Nature.MATIERE.name()).build();
        when(repository.existsByTenantIdAndCode(TENANT_ID, "ENG-003")).thenReturn(false);
        when(itemService.getById(ITEM_ID)).thenReturn(Optional.of(wrong));

        assertThrows(IllegalArgumentException.class, () -> service.create(dto));
        verify(repository, never()).save(any());
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
