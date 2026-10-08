package ma.nafura.platform.framework.validation;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

import org.junit.jupiter.api.Test;

class MaFormatValidatorsTest {

    private final IceValidator ice = new IceValidator();
    private final RibValidator rib = new RibValidator();
    private final PhoneMaValidator phone = new PhoneMaValidator();

    @Test
    void iceAcceptsFifteenDigits() {
        assertTrue(ice.isValid(null, null));
        assertTrue(ice.isValid("", null));
        assertTrue(ice.isValid("001234567890123", null));
        assertTrue(ice.isValid("00123 45678 90123", null));
        assertFalse(ice.isValid("123", null));
        assertFalse(ice.isValid("00123456789012", null));
    }

    @Test
    void ribAcceptsValidKey() {
        rib.initialize(annotation(true));
        assertTrue(rib.isValid(null, null));
        assertTrue(rib.isValid("007780000000123456789057", null));
        assertFalse(rib.isValid("007780000000123456789000", null));
        assertFalse(rib.isValid("123", null));
    }

    @Test
    void ribCanSkipKeyWhenNotStrict() {
        rib.initialize(annotation(false));
        assertTrue(rib.isValid("007780000000123456789000", null));
    }

    @Test
    void phoneMaAcceptsE164AndLocalForms() {
        assertTrue(phone.isValid(null, null));
        assertTrue(phone.isValid("+212612345678", null));
        assertTrue(phone.isValid("0612345678", null));
        assertTrue(phone.isValid("+212 5 22 33 44 55", null));
        assertFalse(phone.isValid("+33612345678", null));
        assertFalse(phone.isValid("612345", null));
    }

    private static Rib annotation(boolean strictKey) {
        return new Rib() {
            @Override
            public Class<? extends java.lang.annotation.Annotation> annotationType() {
                return Rib.class;
            }

            @Override
            public String message() {
                return "";
            }

            @Override
            public Class<?>[] groups() {
                return new Class<?>[0];
            }

            @Override
            @SuppressWarnings("unchecked")
            public Class<? extends jakarta.validation.Payload>[] payload() {
                return new Class[0];
            }

            @Override
            public boolean strictKey() {
                return strictKey;
            }
        };
    }
}
