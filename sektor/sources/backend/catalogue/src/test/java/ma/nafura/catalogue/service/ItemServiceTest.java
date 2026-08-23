package ma.nafura.catalogue.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.List;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.catalogue.api.request.ItemCreateDto;
import ma.nafura.catalogue.domain.article.Item;
import ma.nafura.catalogue.domain.article.ItemUsageLot;
import ma.nafura.catalogue.mapper.ItemMapper;
import ma.nafura.catalogue.repository.ItemRepository;
import ma.nafura.catalogue.repository.ItemUsageLotRepository;
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
    private ma.nafura.catalogue.repository.UnitOfMeasureRepository unitOfMeasureRepository;

    @Mock
    private ma.nafura.catalogue.repository.ItemCategoryRepository itemCategoryRepository;

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
        when(repository.existsByTenantIdAndCleStable(eq(TENANT_ID), anyString())).thenReturn(false);
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

    @Test
    void createRefusesDuplicateCleStableOnTenant() {
        ItemCreateDto dto = new ItemCreateDto();
        dto.setName("Peinture acrylique intérieure");
        dto.setCleStable("peinture-acrylique-interieure");
        dto.setNature("MATIERE");

        Item mapped = Item.builder().name(dto.getName()).nature("MATIERE").build();
        when(mapper.toEntity(dto)).thenReturn(mapped);
        when(repository.existsByTenantIdAndCleStable(TENANT_ID, "peinture-acrylique-interieure"))
                .thenReturn(true);

        IllegalStateException ex = assertThrows(IllegalStateException.class, () -> service.create(dto));
        assertEquals("item.cle_stable.duplicate", ex.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void createWithoutCodeDerivesUniqueTenantCodeFromCleStable() {
        ItemCreateDto dto = new ItemCreateDto();
        dto.setName("Peinture acrylique intérieure");
        dto.setCleStable("peinture-acrylique-interieure");
        dto.setNature("MATIERE");

        Item mapped = Item.builder().name(dto.getName()).nature("MATIERE").build();
        when(mapper.toEntity(dto)).thenReturn(mapped);
        when(repository.existsByTenantIdAndCleStable(TENANT_ID, "peinture-acrylique-interieure"))
                .thenReturn(false);
        when(repository.existsByTenantIdAndCode(TENANT_ID, "PEINTURE-ACRYLIQUE-I")).thenReturn(false);
        when(repository.save(any(Item.class))).thenAnswer(inv -> {
            Item saved = inv.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(UUID.randomUUID());
            }
            return saved;
        });
        when(usageLotRepository.findByItemId(any())).thenReturn(List.of());

        Item created = service.create(dto);

        assertEquals("PEINTURE-ACRYLIQUE-I", created.getCode());
        assertEquals("peinture-acrylique-interieure", created.getCleStable());
    }

    @Test
    void createWithoutCodeSuffixesWhenTenantCodeTaken() {
        ItemCreateDto dto = new ItemCreateDto();
        dto.setName("Peinture red");
        dto.setCleStable("peinture-red-1787250968");
        dto.setNature("MATIERE");

        Item mapped = Item.builder().name(dto.getName()).nature("MATIERE").build();
        when(mapper.toEntity(dto)).thenReturn(mapped);
        when(repository.existsByTenantIdAndCleStable(TENANT_ID, "peinture-red-1787250968"))
                .thenReturn(false);
        when(repository.existsByTenantIdAndCode(TENANT_ID, "PEINTURE-RED-1787250")).thenReturn(true);
        when(repository.existsByTenantIdAndCode(TENANT_ID, "PEINTURE-RED-17872-2")).thenReturn(false);
        when(repository.save(any(Item.class))).thenAnswer(inv -> {
            Item saved = inv.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(UUID.randomUUID());
            }
            return saved;
        });
        when(usageLotRepository.findByItemId(any())).thenReturn(List.of());

        Item created = service.create(dto);

        assertEquals("PEINTURE-RED-17872-2", created.getCode());
    }

    @Test
    void createWithoutCodeDoesNotEmitDoubleHyphenOnCollision() {
        ItemCreateDto dto = new ItemCreateDto();
        dto.setName("Peinture Extraire");
        dto.setCleStable("peinture-extraire-132-aaaa");
        dto.setNature("MATIERE");

        Item mapped = Item.builder().name(dto.getName()).nature("MATIERE").build();
        when(mapper.toEntity(dto)).thenReturn(mapped);
        when(repository.existsByTenantIdAndCleStable(TENANT_ID, "peinture-extraire-132-aaaa"))
                .thenReturn(false);
        when(repository.existsByTenantIdAndCode(TENANT_ID, "PEINTURE-EXTRAIRE-13")).thenReturn(true);
        when(repository.existsByTenantIdAndCode(TENANT_ID, "PEINTURE-EXTRAIRE-2")).thenReturn(false);
        when(repository.save(any(Item.class))).thenAnswer(inv -> {
            Item saved = inv.getArgument(0);
            if (saved.getId() == null) {
                saved.setId(UUID.randomUUID());
            }
            return saved;
        });
        when(usageLotRepository.findByItemId(any())).thenReturn(List.of());

        Item created = service.create(dto);

        assertEquals("PEINTURE-EXTRAIRE-2", created.getCode());
        assertFalse(created.getCode().contains("--"));
    }

    @Test
    void bindFournisseurRefDoesNotCreateItem() {
        Item existing = Item.builder()
                .id(UUID.randomUUID())
                .cleStable("ciment-cpj-45")
                .name("Ciment CPJ 45")
                .build();
        when(repository.findByTenantIdAndCleStable(TENANT_ID, "ciment-cpj-45"))
                .thenReturn(Optional.of(existing));
        when(usageLotRepository.findByItemId(existing.getId())).thenReturn(List.of());

        Item bound = service.bindFournisseurRef("ciment-cpj-45", "SKU-CIM-45");

        assertEquals(existing.getId(), bound.getId());
        verify(repository, never()).save(any());
    }

    @Test
    void bindFournisseurRefUnknownIdentiteDoesNotCreateItem() {
        when(repository.findByTenantIdAndCleStable(TENANT_ID, "inconnu")).thenReturn(Optional.empty());

        IllegalArgumentException ex =
                assertThrows(IllegalArgumentException.class, () -> service.bindFournisseurRef("inconnu", "SKU-X"));
        assertEquals("item.identite.introuvable", ex.getMessage());
        verify(repository, never()).save(any());
    }

    @Test
    void searchPickerWithoutQueryOrFilterReturnsEmptyWithoutScan() {
        var page = service.searchPicker(null, null, null, null, null, 0, 20);
        assertTrue(page.isEmpty());
        assertEquals(0, page.getTotalElements());
        verify(repository, never()).findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class));
    }

    @Test
    void searchPickerSingleCharWithoutFilterReturnsEmpty() {
        var page = service.searchPicker("x", "  ", null, "", null, 0, 20);
        assertTrue(page.isEmpty());
        verify(repository, never()).findAll(any(org.springframework.data.jpa.domain.Specification.class), any(org.springframework.data.domain.Pageable.class));
    }
}
