package ma.nafura.platform.documents.docextractor.api.controller;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.documents.docextractor.api.response.StatelessExtractionResponse;
import ma.nafura.platform.documents.docextractor.service.StatelessExtractionService;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import java.util.Locale;
import java.util.Map;
import java.util.Set;

/**
 * Stateless document extraction API. It stores neither source files nor results.
 */
@RestController
@RequestMapping("/api/stateless-extractions")
@RequiredArgsConstructor
public class StatelessExtractionController {

    private static final long MAX_FILE_SIZE_BYTES = 15L * 1024L * 1024L;
    private static final Map<String, Set<String>> MIME_EXTENSIONS = Map.of(
            "application/pdf", Set.of("pdf"),
            "text/csv", Set.of("csv"),
            "application/csv", Set.of("csv"),
            "text/plain", Set.of("csv"),
            "application/vnd.ms-excel", Set.of("xls"),
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", Set.of("xlsx"),
            "image/png", Set.of("png"),
            "image/jpeg", Set.of("jpg", "jpeg"),
            "image/webp", Set.of("webp"),
            "image/tiff", Set.of("tif", "tiff")
    );

    private final StatelessExtractionService extractionService;

    @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public StatelessExtractionResponse extract(
            @RequestParam("file") MultipartFile file,
            @RequestParam("inlineSchema") String inlineSchema,
            @RequestParam(value = "presentationSchema", required = false) String presentationSchema,
            @RequestParam(value = "instructions", required = false) String instructions
    ) throws Exception {
        validateFile(file);
        return extractionService.process(
                file.getBytes(),
                file.getOriginalFilename(),
                file.getContentType(),
                inlineSchema,
                presentationSchema,
                instructions,
                currentTenantId()
        );
    }

    private String currentTenantId() {
        return TenantContext.getTenantId() == null
                ? null
                : TenantContext.getTenantId().toString();
    }

    private void validateFile(MultipartFile file) {
        if (file.isEmpty() || file.getSize() == 0) {
            throw new IllegalArgumentException("FILE_EMPTY");
        }
        if (file.getSize() > MAX_FILE_SIZE_BYTES) {
            throw new IllegalArgumentException("FILE_TOO_LARGE");
        }

        String mimeType = file.getContentType();
        String normalizedMime = mimeType == null ? "" : mimeType.toLowerCase(Locale.ROOT);
        Set<String> allowedExtensions = MIME_EXTENSIONS.get(normalizedMime);
        if (allowedExtensions == null) {
            throw new IllegalArgumentException("FILE_TYPE_NOT_ALLOWED");
        }

        String extension = extensionOf(file.getOriginalFilename());
        if (!allowedExtensions.contains(extension)) {
            throw new IllegalArgumentException("FILE_EXTENSION_MIME_MISMATCH");
        }
    }

    private String extensionOf(String fileName) {
        if (fileName == null) {
            return "";
        }
        int dot = fileName.lastIndexOf('.');
        return dot < 0 || dot == fileName.length() - 1
                ? ""
                : fileName.substring(dot + 1).toLowerCase(Locale.ROOT);
    }
}
