package ma.nafura.platform.documents.docextractor.api.controller;

import org.junit.jupiter.api.Test;
import org.springframework.mock.web.MockMultipartFile;

import java.lang.reflect.InvocationTargetException;
import java.lang.reflect.Method;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

class ExtractionControllerFileValidationTest {

    private final ExtractionController controller =
            new ExtractionController(null, null, null, null);

    @Test
    void rejectsEmptyFilesBeforeCallingProvider() {
        assertValidationFailure(
                new MockMultipartFile("file", "empty.csv", "text/csv", new byte[0]),
                "FILE_EMPTY"
        );
    }

    @Test
    void rejectsUnsupportedMimeTypesBeforeCallingProvider() {
        assertValidationFailure(
                new MockMultipartFile("file", "payload.exe", "application/octet-stream", new byte[]{1}),
                "FILE_TYPE_NOT_ALLOWED"
        );
    }

    @Test
    void acceptsSupportedSpreadsheetFiles() throws Exception {
        Method method = validationMethod();
        method.invoke(
                controller,
                new MockMultipartFile(
                        "file",
                        "suppliers.xlsx",
                        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                        new byte[]{1}
                )
        );
    }

    private void assertValidationFailure(MockMultipartFile file, String expectedCode) {
        assertThatThrownBy(() -> validationMethod().invoke(controller, file))
                .isInstanceOf(InvocationTargetException.class)
                .satisfies(error -> {
                    Throwable cause = ((InvocationTargetException) error).getCause();
                    assertThat(cause)
                            .isInstanceOf(IllegalArgumentException.class)
                            .hasMessage(expectedCode);
                });
    }

    private Method validationMethod() throws NoSuchMethodException {
        Method method = ExtractionController.class.getDeclaredMethod(
                "validateFile",
                org.springframework.web.multipart.MultipartFile.class
        );
        method.setAccessible(true);
        return method;
    }
}

