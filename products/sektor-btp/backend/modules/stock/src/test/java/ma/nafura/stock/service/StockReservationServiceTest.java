package ma.nafura.stock.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.stock.domain.model.StockReservation;
import ma.nafura.stock.domain.model.StockReservationStatus;
import ma.nafura.stock.repository.StockReservationRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.quality.Strictness;
import org.mockito.junit.jupiter.MockitoSettings;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class StockReservationServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID ITEM_ID = UUID.fromString("bbbbbbbb-bbbb-4bbb-8bbb-bbbbbbbbbbbb");
    private static final String CHANTIER = "ch-001";

    @Mock
    private StockReservationRepository repository;

    @InjectMocks
    private StockReservationService service;

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
    void consumeFifoReducesOldestReservationFirst() {
        UUID r1 = UUID.randomUUID();
        UUID r2 = UUID.randomUUID();
        StockReservation first = reservation(r1, new BigDecimal("5"), LocalDate.of(2026, 1, 1));
        StockReservation second = reservation(r2, new BigDecimal("10"), LocalDate.of(2026, 2, 1));

        when(repository.findByTenantIdAndStatusAndDateExpirationBefore(
                        eq(TENANT_ID), eq(StockReservationStatus.ACTIVE), any(LocalDate.class)))
                .thenReturn(List.of());
        when(repository.findByTenantIdAndItemIdAndChantierIdAndStatusOrderByDateCreationAsc(
                        TENANT_ID, ITEM_ID, CHANTIER, StockReservationStatus.ACTIVE))
                .thenReturn(new ArrayList<>(List.of(first, second)));
        when(repository.save(any(StockReservation.class))).thenAnswer(inv -> inv.getArgument(0));

        service.consumeFifo(CHANTIER, List.of(new StockReservationService.ItemQuantity(ITEM_ID, new BigDecimal("7"))));

        ArgumentCaptor<StockReservation> captor = ArgumentCaptor.forClass(StockReservation.class);
        verify(repository, atLeast(2)).save(captor.capture());
        boolean consumedFirst = captor.getAllValues().stream()
                .anyMatch(r -> r1.equals(r.getId()) && StockReservationStatus.CONSOMMEE.equals(r.getStatus()));
        assertTrue(consumedFirst);
    }

    @Test
    void releaseSetsAnnuleeStatus() {
        UUID id = UUID.randomUUID();
        StockReservation row = reservation(id, new BigDecimal("3"), LocalDate.of(2026, 1, 1));
        when(repository.findByIdAndTenantId(id, TENANT_ID)).thenReturn(Optional.of(row));
        when(repository.save(any(StockReservation.class))).thenAnswer(inv -> inv.getArgument(0));

        StockReservation released = service.release(id);

        assertEquals(StockReservationStatus.ANNULEE, released.getStatus());
    }

    private static StockReservation reservation(UUID id, BigDecimal qty, LocalDate dateCreation) {
        return StockReservation.builder()
                .id(id)
                .tenantId(TENANT_ID)
                .itemId(ITEM_ID)
                .quantity(qty)
                .chantierId(CHANTIER)
                .dateBesoin(LocalDate.now())
                .dateExpiration(LocalDate.now().plusDays(30))
                .dateCreation(dateCreation)
                .status(StockReservationStatus.ACTIVE)
                .build();
    }
}
