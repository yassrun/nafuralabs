package ma.nafura.item.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.item.api.request.ItemCreateDto;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.domain.model.ItemUsageLot;
import ma.nafura.item.mapper.ItemMapper;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.item.repository.ItemUsageLotRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");

    @Mock
    private ItemRepository repository;

    @Mock
    private ItemMapper mapper;

    @Mock
    private ItemUsageLotRepository usageLotRepository;

    @Mock
    private ma.nafura.item.repository.UnitOfMeasureRepository unitOfMeasureRepository;

    @InjectMocks
    private ItemService service;

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
    void createPersistsUsageLotCodes() {
        ItemCreateDto dto = new ItemCreateDto();
        dto.setName("Sable");
        dto.setNature("MATIERE");
        dto.setUsageLotCodes(List.of("VRD", "gros_oeuvre", "FINITIONS"));

        Item mapped = Item.builder().name("Sable").nature("MATIERE").build();
        when(mapper.toEntity(dto)).thenReturn(mapped);
        when(repository.save(any(Item.class))).thenAnswer(inv -> {
            Item saved = inv.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(UUID.randomUUID());
            }
            return saved;
        });
        when(usageLotRepository.findByItemId(any())).thenReturn(List.of());

        Item created = service.create(dto);

        ArgumentCaptor<List<ItemUsageLot>> captor = ArgumentCaptor.forClass(List.class);
        verify(usageLotRepository).deleteByItemId(created.getId());
        verify(usageLotRepository).saveAll(captor.capture());
        assertEquals(3, captor.getValue().size());
        assertTrue(
                captor.getValue().stream().map(ItemUsageLot::getLotCode).toList()
                        .containsAll(List.of("VRD", "GROS_OEUVRE", "FINITIONS")));
    }

    @Test
    void createRejectsUnknownUsageLot() {
        ItemCreateDto dto = new ItemCreateDto();
        dto.setName("Bad");
        dto.setUsageLotCodes(List.of("UNKNOWN_LOT"));

        Item mapped = Item.builder().name("Bad").build();
        when(mapper.toEntity(dto)).thenReturn(mapped);
        when(repository.save(any(Item.class))).thenAnswer(inv -> {
            Item saved = inv.getArgument(0);
            saved.setId(UUID.randomUUID());
            return saved;
        });

        assertThrows(IllegalArgumentException.class, () -> service.create(dto));
    }
}
