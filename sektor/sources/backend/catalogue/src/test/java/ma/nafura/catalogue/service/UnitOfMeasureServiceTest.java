package ma.nafura.catalogue.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.api.request.UnitOfMeasureCreateDto;
import ma.nafura.catalogue.api.request.UnitOfMeasureUpdateDto;
import ma.nafura.catalogue.domain.model.UnitOfMeasure;
import ma.nafura.catalogue.mapper.UnitOfMeasureMapper;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class UnitOfMeasureServiceTest {

    private static final UUID TENANT_ID = UUID.fromString("00000000-0000-4000-8000-000000000001");
    private static final UUID CATEGORY_ID = UUID.fromString("00000000-0000-4000-8000-0000000000aa");
    private static final UUID BASE_ID = UUID.fromString("00000000-0000-4000-8000-0000000000b1");

    @Mock
    private UnitOfMeasureRepository repository;

    @Mock
    private UnitOfMeasureMapper mapper;

    private UnitOfMeasureService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_ID);
        TenantContext.setTenantEnabled(true);
        service = new UnitOfMeasureService(repository, mapper);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void createNonBaseSansBaseExistanteRefuse() {
        UnitOfMeasureCreateDto dto = new UnitOfMeasureCreateDto();
        dto.setCode("M3");
        dto.setName("Mètre cube");
        dto.setUomCategoryId(CATEGORY_ID);
        dto.setFacteurVersBase(new BigDecimal("1000"));
        dto.setEstBase(false);

        when(repository.findByTenantIdAndUomCategoryIdAndEstBaseTrue(TENANT_ID, CATEGORY_ID))
                .thenReturn(Optional.empty());

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> service.create(dto));

        assertEquals("item.uom.base.category_without_base", ex.getMessage());
        verify(mapper, never()).toEntity(any());
    }

    @Test
    void createBaseDansCategorieVideOk() {
        UnitOfMeasureCreateDto dto = new UnitOfMeasureCreateDto();
        dto.setCode("L");
        dto.setName("Litre");
        dto.setUomCategoryId(CATEGORY_ID);
        dto.setFacteurVersBase(new BigDecimal("5"));
        dto.setEstBase(true);

        UnitOfMeasure entity = UnitOfMeasure.builder()
                .code("L")
                .name("Litre")
                .uomCategoryId(CATEGORY_ID)
                .build();
        UnitOfMeasure saved = UnitOfMeasure.builder()
                .id(BASE_ID)
                .tenantId(TENANT_ID)
                .code("L")
                .name("Litre")
                .uomCategoryId(CATEGORY_ID)
                .facteurVersBase(BigDecimal.ONE)
                .estBase(true)
                .build();

        when(repository.findByTenantIdAndUomCategoryId(TENANT_ID, CATEGORY_ID)).thenReturn(List.of());
        when(mapper.toEntity(dto)).thenReturn(entity);
        when(repository.save(any(UnitOfMeasure.class))).thenReturn(saved);

        UnitOfMeasure result = service.create(dto);

        assertEquals(BASE_ID, result.getId());
        assertEquals(0, BigDecimal.ONE.compareTo(dto.getFacteurVersBase()));
        ArgumentCaptor<UnitOfMeasure> captor = ArgumentCaptor.forClass(UnitOfMeasure.class);
        verify(repository).save(captor.capture());
        assertEquals(TENANT_ID, captor.getValue().getTenantId());
    }

    @Test
    void createSecondBaseClearPrevious() {
        UnitOfMeasureCreateDto dto = new UnitOfMeasureCreateDto();
        dto.setCode("M3");
        dto.setName("Mètre cube");
        dto.setUomCategoryId(CATEGORY_ID);
        dto.setEstBase(true);
        dto.setFacteurVersBase(BigDecimal.ONE);

        UnitOfMeasure oldBase = UnitOfMeasure.builder()
                .id(BASE_ID)
                .tenantId(TENANT_ID)
                .code("L")
                .uomCategoryId(CATEGORY_ID)
                .estBase(true)
                .facteurVersBase(BigDecimal.ONE)
                .build();

        UnitOfMeasure entity = UnitOfMeasure.builder().code("M3").build();
        UnitOfMeasure saved = UnitOfMeasure.builder()
                .id(UUID.randomUUID())
                .tenantId(TENANT_ID)
                .code("M3")
                .estBase(true)
                .build();

        when(repository.findByTenantIdAndUomCategoryId(TENANT_ID, CATEGORY_ID))
                .thenReturn(List.of(oldBase));
        when(mapper.toEntity(dto)).thenReturn(entity);
        when(repository.save(any(UnitOfMeasure.class))).thenAnswer(inv -> {
            UnitOfMeasure u = inv.getArgument(0);
            if (u.getId() == null) {
                return saved;
            }
            return u;
        });

        service.create(dto);

        assertEquals(false, oldBase.getEstBase());
        verify(repository).save(oldBase);
    }

    @Test
    void updateRetireBaseAvecFreresRefuse() {
        UnitOfMeasure existing = UnitOfMeasure.builder()
                .id(BASE_ID)
                .tenantId(TENANT_ID)
                .code("L")
                .uomCategoryId(CATEGORY_ID)
                .estBase(true)
                .facteurVersBase(BigDecimal.ONE)
                .build();

        when(repository.findByIdAndTenantId(BASE_ID, TENANT_ID)).thenReturn(Optional.of(existing));
        when(repository.countByTenantIdAndUomCategoryId(TENANT_ID, CATEGORY_ID)).thenReturn(2L);

        UnitOfMeasureUpdateDto update = new UnitOfMeasureUpdateDto();
        update.setEstBase(false);

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> service.update(BASE_ID, update));

        assertEquals("item.uom.base.required_in_category", ex.getMessage());
    }

    @Test
    void createBaseSansCategorieRefuse() {
        UnitOfMeasureCreateDto dto = new UnitOfMeasureCreateDto();
        dto.setCode("X");
        dto.setName("X");
        dto.setEstBase(true);
        dto.setFacteurVersBase(BigDecimal.ONE);

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> service.create(dto));

        assertEquals("item.uom.base.category_required", ex.getMessage());
    }

    @Test
    void createAvecFacteurNegatifRefuse() {
        UnitOfMeasureCreateDto dto = new UnitOfMeasureCreateDto();
        dto.setCode("X");
        dto.setName("X");
        dto.setUomCategoryId(CATEGORY_ID);
        dto.setEstBase(true);
        dto.setFacteurVersBase(new BigDecimal("-1"));

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> service.create(dto));

        assertTrue(ex.getMessage().contains("facteur"));
    }
}
