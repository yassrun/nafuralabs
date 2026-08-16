package ma.nafura.platform.collaboration.docmanager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import java.util.concurrent.atomic.AtomicInteger;
import ma.nafura.platform.collaboration.docmanager.attachment.AttachmentServiceImpl;
import ma.nafura.platform.collaboration.docmanager.attachment.LocalFileStorageService;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentStatus;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentType;
import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentRepository;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
import ma.nafura.platform.collaboration.docmanager.service.DocumentService;
import ma.nafura.platform.collaboration.docmanager.storage.DocumentStorage;
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
import org.springframework.data.domain.PageImpl;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentsOctetsUniquesTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final byte[] BYTES = "same-bytes".getBytes(StandardCharsets.UTF_8);

    @TempDir
    Path tmp;

    @Mock
    private RecordAttachmentRepository attachmentRepository;

    @Mock
    private DocumentRepository documentRepository;

    private final Map<UUID, RecordAttachment> pieces = new LinkedHashMap<>();
    private final Map<UUID, Document> originals = new LinkedHashMap<>();
    private LocalFileStorageService fileStorage;
    private AttachmentServiceImpl attachments;
    private AtomicInteger uploads;
    private DocumentService documents;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_A);
        UserContext.setUserEmail("a@example.com");
        fileStorage = new LocalFileStorageService(tmp.toString());
        attachments = new AttachmentServiceImpl(attachmentRepository, fileStorage);
        stubPieces();
        stubOriginals();
        uploads = new AtomicInteger();
        DocumentStorage storage = new DocumentStorage() {
            @Override
            public String upload(UUID tenantId, UUID documentId, String fileName,
                    InputStream inputStream, String contentType) {
                uploads.incrementAndGet();
                return tenantId + "/" + documentId + "/" + fileName;
            }

            @Override
            public InputStream download(String storageKey) {
                return new ByteArrayInputStream(BYTES);
            }

            @Override
            public void delete(String storageKey) {
            }

            @Override
            public boolean exists(String storageKey) {
                return true;
            }
        };
        documents = new DocumentService(documentRepository, storage);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        pieces.clear();
        originals.clear();
    }

    @Test
    void memeFichierDeuxPieces() {
        RecordAttachment first = attachments.attach("record", "rec-1", file());
        RecordAttachment second = attachments.attach("record", "rec-2", file());

        assertThat(first.getId()).isNotEqualTo(second.getId());
        assertThat(second.getFileUrl()).isEqualTo(first.getFileUrl());
    }

    @Test
    void memeFichierDeuxTenants() {
        RecordAttachment ofA = attachments.attach("record", "rec-1", file());
        TenantContext.setTenantId(TENANT_B);
        RecordAttachment ofB = attachments.attach("record", "rec-1", file());

        assertThat(ofB.getFileUrl()).isNotEqualTo(ofA.getFileUrl());
        assertThat(ofB.getFileUrl()).doesNotContain(TENANT_A.toString());
    }

    @Test
    void retraitDerniereReference() {
        RecordAttachment first = attachments.attach("record", "rec-1", file());
        RecordAttachment second = attachments.attach("record", "rec-2", file());
        String key = first.getFileUrl();

        attachments.delete(first.getId());
        assertThat(fileStorage.getResource(key)).isPresent();

        attachments.delete(second.getId());
        assertThat(fileStorage.getResource(key)).isEmpty();
    }

    @Test
    void originalReutiliseOctets() {
        Document first = deposit(TENANT_A);
        Document second = deposit(TENANT_A);

        assertThat(first.getId()).isNotEqualTo(second.getId());
        assertThat(second.getStorageKey()).isEqualTo(first.getStorageKey());
        assertThat(uploads.get()).isEqualTo(1);
    }

    private Document deposit(UUID tenant) {
        return documents.uploadDocument(
                tenant,
                BYTES,
                "note.txt",
                "text/plain",
                DocumentType.OTHER,
                OffsetDateTime.now(),
                UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc"));
    }

    private MockMultipartFile file() {
        return new MockMultipartFile("file", "note.txt", "text/plain", BYTES);
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
            pieces.put(a.getId(), a);
            return a;
        });
        when(attachmentRepository.findByIdAndTenantId(any(), any())).thenAnswer(inv -> {
            RecordAttachment a = pieces.get(inv.getArgument(0));
            UUID tenant = inv.getArgument(1);
            if (a == null || !tenant.equals(a.getTenantId())) {
                return Optional.empty();
            }
            return Optional.of(a);
        });
        when(attachmentRepository.findFirstByTenantIdAndChecksumSha256(any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            String checksum = inv.getArgument(1);
            return pieces.values().stream()
                    .filter(a -> tenant.equals(a.getTenantId()) && checksum.equals(a.getChecksumSha256()))
                    .findFirst();
        });
        when(attachmentRepository.countByTenantIdAndFileUrl(any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            String url = inv.getArgument(1);
            return pieces.values().stream()
                    .filter(a -> tenant.equals(a.getTenantId()) && url.equals(a.getFileUrl()))
                    .count();
        });
        when(attachmentRepository.findByTenantIdAndEntityTypeAndEntityIdOrderByCreatedAtDesc(
                any(), any(), any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            String type = inv.getArgument(1);
            String id = inv.getArgument(2);
            var pageable = inv.getArgument(3, org.springframework.data.domain.Pageable.class);
            var items = pieces.values().stream()
                    .filter(a -> tenant.equals(a.getTenantId())
                            && type.equals(a.getEntityType())
                            && id.equals(a.getEntityId()))
                    .sorted(Comparator.comparing(RecordAttachment::getCreatedAt).reversed())
                    .toList();
            return new PageImpl<>(items, pageable, items.size());
        });
        doAnswer(inv -> {
            RecordAttachment a = inv.getArgument(0);
            pieces.remove(a.getId());
            return null;
        }).when(attachmentRepository).delete(any(RecordAttachment.class));
    }

    private void stubOriginals() {
        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> {
            Document d = inv.getArgument(0);
            originals.put(d.getId(), d);
            return d;
        });
        when(documentRepository.findFirstByTenantIdAndChecksumSha256AndStatus(any(), any(), any()))
                .thenAnswer(inv -> {
                    UUID tenant = inv.getArgument(0);
                    String checksum = inv.getArgument(1);
                    DocumentStatus status = inv.getArgument(2);
                    return originals.values().stream()
                            .filter(d -> tenant.equals(d.getTenantId())
                                    && checksum.equals(d.getChecksumSha256())
                                    && status == d.getStatus())
                            .findFirst();
                });
        when(documentRepository.countByTenantIdAndStorageKeyAndStatus(any(), any(), any()))
                .thenAnswer(inv -> {
                    UUID tenant = inv.getArgument(0);
                    String key = inv.getArgument(1);
                    DocumentStatus status = inv.getArgument(2);
                    return originals.values().stream()
                            .filter(d -> tenant.equals(d.getTenantId())
                                    && key.equals(d.getStorageKey())
                                    && status == d.getStatus())
                            .count();
                });
    }
}
