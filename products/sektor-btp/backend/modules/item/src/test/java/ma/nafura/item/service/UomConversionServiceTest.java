package ma.nafura.item.service;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;

import java.math.BigDecimal;
import java.util.UUID;
import ma.nafura.item.api.dto.UomConversionResultDto;
import ma.nafura.item.domain.model.UnitOfMeasure;
import org.junit.jupiter.api.Test;

class UomConversionServiceTest {

    private final UomConversionService service = new UomConversionService(null);

    private static final UUID VOLUME = UUID.fromString("00000000-0000-4000-8000-0000000000v1");
    private static final UUID TEMPS = UUID.fromString("00000000-0000-4000-8000-0000000000t1");

    @Test
    void litresVersMetresCubes() {
        UnitOfMeasure litre = uom("L", VOLUME, "1", true);
        UnitOfMeasure m3 = uom("M3", VOLUME, "1000", false);

        UomConversionResultDto result =
                service.convert(litre, m3, new BigDecimal("1000"));

        assertEquals(0, new BigDecimal("1").compareTo(result.getQuantityTo()));
        assertEquals("L", result.getFromCode());
        assertEquals("M3", result.getToCode());
    }

    @Test
    void metresCubesVersLitres() {
        UnitOfMeasure litre = uom("L", VOLUME, "1", true);
        UnitOfMeasure m3 = uom("M3", VOLUME, "1000", false);

        UomConversionResultDto result =
                service.convert(m3, litre, BigDecimal.ONE);

        assertEquals(0, new BigDecimal("1000").compareTo(result.getQuantityTo()));
    }

    @Test
    void litresVersHeuresEchoue() {
        UnitOfMeasure litre = uom("L", VOLUME, "1", true);
        UnitOfMeasure heure = uom("H", TEMPS, "1", true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.convert(litre, heure, new BigDecimal("15")));

        assertEquals("item.uom.conversion.cross_category", ex.getMessage());
    }

    @Test
    void categorieManquanteEchoue() {
        UnitOfMeasure a = uom("X", null, "1", false);
        UnitOfMeasure b = uom("Y", VOLUME, "1", true);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.convert(a, b, BigDecimal.ONE));

        assertEquals("item.uom.conversion.category_required", ex.getMessage());
    }

    @Test
    void facteurInvalideEchoue() {
        UnitOfMeasure a = uom("L", VOLUME, "0", true);
        UnitOfMeasure b = uom("M3", VOLUME, "1000", false);

        IllegalArgumentException ex = assertThrows(
                IllegalArgumentException.class,
                () -> service.convert(a, b, BigDecimal.ONE));

        assertTrue(ex.getMessage().startsWith("item.uom."));
    }

    private static UnitOfMeasure uom(String code, UUID categoryId, String facteur, boolean estBase) {
        return UnitOfMeasure.builder()
                .id(UUID.randomUUID())
                .code(code)
                .name(code)
                .uomCategoryId(categoryId)
                .facteurVersBase(new BigDecimal(facteur))
                .estBase(estBase)
                .build();
    }
}
