package ma.nafura.achats.service;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

import java.math.BigDecimal;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.achats.domain.model.CatalogueFournisseurLigne;
import ma.nafura.catalogue.api.dto.UomConversionResultDto;
import ma.nafura.catalogue.domain.model.UnitOfMeasure;
import ma.nafura.catalogue.repository.UnitOfMeasureRepository;
import ma.nafura.catalogue.service.UomConversionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class PrixNormaliseCatalogueServiceTest {

    @Mock
    private UnitOfMeasureRepository uomRepository;

    @Mock
    private UomConversionService uomConversionService;

    private PrixNormaliseCatalogueService service;
    private UUID tenantId;
    private UUID categoryId;
    private UUID litreId;
    private UUID baseId;

    @BeforeEach
    void setUp() {
        service = new PrixNormaliseCatalogueService(uomRepository, uomConversionService);
        tenantId = UUID.randomUUID();
        categoryId = UUID.randomUUID();
        litreId = UUID.randomUUID();
        baseId = litreId; // L est la base
    }

    @Test
    void pot15L_a450_donne_30_par_litre() {
        UnitOfMeasure litre = UnitOfMeasure.builder()
                .id(litreId)
                .tenantId(tenantId)
                .code("L")
                .name("Litre")
                .uomCategoryId(categoryId)
                .facteurVersBase(BigDecimal.ONE)
                .estBase(true)
                .build();
        when(uomRepository.findByIdAndTenantId(litreId, tenantId)).thenReturn(Optional.of(litre));
        when(uomRepository.findByTenantIdAndUomCategoryIdAndEstBaseTrue(tenantId, categoryId))
                .thenReturn(Optional.of(litre));
        when(uomConversionService.convert(eq(litre), eq(litre), eq(new BigDecimal("15"))))
                .thenReturn(UomConversionResultDto.builder()
                        .quantityFrom(new BigDecimal("15"))
                        .quantityTo(new BigDecimal("15"))
                        .build());

        CatalogueFournisseurLigne ligne = CatalogueFournisseurLigne.builder()
                .tenantId(tenantId)
                .prixUnitaireHt(new BigDecimal("450"))
                .remisePercent(BigDecimal.ZERO)
                .conditionnementQuantite(new BigDecimal("15"))
                .conditionnementUomId(litreId)
                .build();

        service.apply(ligne);

        assertEquals(0, new BigDecimal("30.00000000").compareTo(ligne.getPrixNormalise()));
        assertEquals(baseId, ligne.getUomNormaliseId());
        assertEquals(0, new BigDecimal("450").compareTo(ligne.getPrixUnitaireHt()));
    }

    @Test
    void pot20L_a560_donne_28_par_litre() {
        UnitOfMeasure litre = UnitOfMeasure.builder()
                .id(litreId)
                .tenantId(tenantId)
                .code("L")
                .name("Litre")
                .uomCategoryId(categoryId)
                .facteurVersBase(BigDecimal.ONE)
                .estBase(true)
                .build();
        when(uomRepository.findByIdAndTenantId(litreId, tenantId)).thenReturn(Optional.of(litre));
        when(uomRepository.findByTenantIdAndUomCategoryIdAndEstBaseTrue(tenantId, categoryId))
                .thenReturn(Optional.of(litre));
        when(uomConversionService.convert(eq(litre), eq(litre), eq(new BigDecimal("20"))))
                .thenReturn(UomConversionResultDto.builder()
                        .quantityFrom(new BigDecimal("20"))
                        .quantityTo(new BigDecimal("20"))
                        .build());

        CatalogueFournisseurLigne ligne = CatalogueFournisseurLigne.builder()
                .tenantId(tenantId)
                .prixUnitaireHt(new BigDecimal("560"))
                .remisePercent(BigDecimal.ZERO)
                .conditionnementQuantite(new BigDecimal("20"))
                .conditionnementUomId(litreId)
                .build();

        service.apply(ligne);

        assertEquals(0, new BigDecimal("28.00000000").compareTo(ligne.getPrixNormalise()));
    }

    @Test
    void sansConditionnement_neCalculePas() {
        CatalogueFournisseurLigne ligne = CatalogueFournisseurLigne.builder()
                .tenantId(tenantId)
                .prixUnitaireHt(new BigDecimal("450"))
                .remisePercent(BigDecimal.ZERO)
                .build();

        service.apply(ligne);

        assertNull(ligne.getPrixNormalise());
        assertNull(ligne.getUomNormaliseId());
        verifyNoInteractions(uomRepository, uomConversionService);
    }
}
