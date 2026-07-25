package ma.nafura.item.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.item.domain.model.Item;
import ma.nafura.item.mapper.ItemMapper;
import ma.nafura.item.repository.ItemRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class ItemServiceTest {

    @Mock
    private ItemRepository repository;

    @Mock
    private ItemMapper mapper;

    @InjectMocks
    private ItemService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(UUID.randomUUID());
        TenantContext.setTenantEnabled(true);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void recalcPmpUsesPrixUnitaireWhenPmpMissing() {
        UUID id = UUID.randomUUID();
        Item item = Item.builder()
                .id(id)
                .prixUnitaire(new BigDecimal("125.50"))
                .build();
        when(repository.findByIdAndTenantId(eq(id), any())).thenReturn(Optional.of(item));
        when(repository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        Item result = service.recalcPmp(id);

        assertEquals(new BigDecimal("125.50"), result.getPmp());
    }
}
