package ma.nafura.platform.documents.docextractor.api.controller;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class StatelessExtractionControllerFileValidationTest {

    private final StatelessExtractionController controller =
            new StatelessExtractionController(null);

    @Test
    void acceptsMatchingSpreadsheetExtensionAndMime() throws Exception {
        validationMethod().invoke(
                controller,
                new MockMultipartFile(
                        "file",
                        "invoices.xlsx",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        new byte[]{1}
                )
        );
    }

    @Test
    void rejectsExtensionAndMimeMismatchBeforeCallingLlm() {
        assertThatThrownBy(() -> validationMethod().invoke(
                controller,
                new MockMultipartFile("file", "invoice.exe", "application/pdf", new byte[]{1})
        ))
                .isInstanceOf(InvocationTargetException.class)
                .satisfies(error -> assertThat(((InvocationTargetException) error).getCause())
                        .isInstanceOf(IllegalArgumentException.class)
                        .hasMessage("FILE_EXTENSION_MIME_MISMATCH"));
    }

    private Method validationMethod() throws NoSuchMethodException {
        Method method = StatelessExtractionController.class.getDeclaredMethod(
                "validateFile",
                org.springframework.web.multipart.MultipartFile.class
        );
        method.setAccessible(true);
        return method;
    }
}
