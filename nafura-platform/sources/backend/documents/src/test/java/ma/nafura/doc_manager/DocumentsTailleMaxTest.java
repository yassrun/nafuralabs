package ma.nafura.platform.collaboration.docmanager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

import io.minio.MinioClient;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.collaboration.docmanager.attachment.AttachmentServiceImpl;
import ma.nafura.platform.collaboration.docmanager.attachment.LocalFileStorageService;
import ma.nafura.platform.collaboration.docmanager.config.MinioProperties;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentType;
import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentRepository;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
import ma.nafura.platform.collaboration.docmanager.service.DocumentService;
import ma.nafura.platform.collaboration.docmanager.storage.MinioDocumentStorage;
import ma.nafura.platform.framework.api.error.PayloadTooLargeException;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.api.io.TempDir;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.web.multipart.MultipartFile;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentsTailleMaxTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final String ENTITY_TYPE = "record";
    private static final String ENTITY_ID = "rec-1";
    private static final byte[] SMALL = "petit".getBytes(StandardCharsets.UTF_8);

    @TempDir
    Path tmp;

    @Mock
    private RecordAttachmentRepository attachmentRepository;

    @Mock
    private DocumentRepository documentRepository;

    @Mock
    private MinioClient minioClient;

    private final Map<UUID, RecordAttachment> store = new LinkedHashMap<>();
    private LocalFileStorageService fileStorage;
    private AttachmentServiceImpl attachments;
    private DocumentService originals;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_A);
        UserContext.setUserEmail("a@example.com");
        fileStorage = new LocalFileStorageService(tmp.toString());
        attachments = new AttachmentServiceImpl(attachmentRepository, fileStorage);
        stubPieces();
        when(documentRepository.findFirstByTenantIdAndChecksumSha256AndStatus(any(), any(), any()))
                .thenReturn(Optional.empty());
        MinioProperties props = new MinioProperties();
        props.setBucket("documents");
        originals = new DocumentService(documentRepository, new MinioDocumentStorage(minioClient, props));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        store.clear();
    }

    @Test
    void tailleMaxAccepte() {
        RecordAttachment saved = attachments.attach(ENTITY_TYPE, ENTITY_ID, smallFile());
        Page<RecordAttachment> listed = attachments.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));
        assertThat(listed.getContent()).extracting(RecordAttachment::getId).contains(saved.getId());
    }

    @Test
    void tailleMaxRefusePiece() {
        assertThatThrownBy(() -> attachments.attach(ENTITY_TYPE, ENTITY_ID, oversized()))
                .isInstanceOf(PayloadTooLargeException.class);
        Page<RecordAttachment> listed = attachments.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));
        assertThat(listed.getContent()).isEmpty();
        assertThat(tmp.toFile().list()).isNullOrEmpty();
    }

    @Test
    void tailleMaxRefuseOriginal() {
        assertThatThrownBy(() -> originals.uploadDocument(
                TENANT_A,
                oversized(),
                DocumentType.OTHER,
                OffsetDateTime.now(),
                UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc")))
                .isInstanceOf(PayloadTooLargeException.class);
        verify(documentRepository, never()).save(any(Document.class));
        try {
            verify(minioClient, never()).putObject(any());
        } catch (Exception e) {
            throw new AssertionError(e);
        }
    }

    private static MockMultipartFile smallFile() {
        return new MockMultipartFile("file", "note.txt", "text/plain", SMALL);
    }

    private static MultipartFile oversized() {
        return new MockMultipartFile("file", "gros.bin", "application/octet-stream", new byte[0]) {
            @Override
            public long getSize() {
                return 50L * 1024 * 1024 + 1;
            }

            @Override
            public boolean isEmpty() {
                return false;
            }
        };
    }

    private void stubPieces() {
        when(attachmentRepository.save(any(RecordAttachment.class))).thenAnswer(inv -> {
            RecordAttachment a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(UUID.randomUUID());
            }
            if (a.getCreatedAt() == null) {
                a.setCreatedAt(OffsetDateTime.now());
            }
            store.put(a.getId(), a);
            return a;
        });
        when(attachmentRepository.findByTenantIdAndEntityTypeAndEntityIdOrderByCreatedAtDesc(
                any(), any(), any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            String type = inv.getArgument(1);
            String id = inv.getArgument(2);
            var pageable = inv.getArgument(3, org.springframework.data.domain.Pageable.class);
            var items = store.values().stream()
                    .filter(a -> tenant.equals(a.getTenantId())
                            && type.equals(a.getEntityType())
                            && id.equals(a.getEntityId()))
                    .sorted(Comparator.comparing(RecordAttachment::getCreatedAt).reversed())
                    .toList();
            return new PageImpl<>(items, pageable, items.size());
        });
    }
}
