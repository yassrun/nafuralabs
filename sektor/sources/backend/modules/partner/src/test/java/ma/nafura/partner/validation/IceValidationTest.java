package ma.nafura.partner.validation;

import static org.junit.jupiter.api.Assertions.*;

import org.junit.jupiter.api.Test;

class IceValidationTest {

    @Test
    void acceptsNullOrBlank() {
        assertTrue(IceValidation.isValid(null));
        assertTrue(IceValidation.isValid(""));
    }

    @Test
    void acceptsFifteenDigits() {
        assertTrue(IceValidation.isValid("001234567890123"));
    }

    @Test
    void rejectsInvalidLength() {
        assertFalse(IceValidation.isValid("1234"));
    }

    @Test
    void requireValidThrowsOnInvalid() {
        assertThrows(IllegalArgumentException.class, () -> IceValidation.requireValid("123"));
    }
}
