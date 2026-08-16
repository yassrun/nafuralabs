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
import ma.nafura.platform.collaboration.docmanager.service.DocumentUsageService;
import ma.nafura.platform.collaboration.docmanager.service.TenantObjectIndex;
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
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentsUnifierTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final byte[] BYTES = "unifier-bytes".getBytes(StandardCharsets.UTF_8);

    @TempDir
    Path tmp;

    @Mock
    private RecordAttachmentRepository attachmentRepository;

    @Mock
    private DocumentRepository documentRepository;

    private final Map<UUID, RecordAttachment> pieces = new LinkedHashMap<>();
    private final Map<UUID, Document> tenus = new LinkedHashMap<>();
    private LocalFileStorageService files;
    private AttachmentServiceImpl attachments;
    private DocumentService documents;
    private DocumentUsageService usage;
    private AtomicInteger uploads;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_A);
        UserContext.setUserEmail("a@example.com");
        files = new LocalFileStorageService(tmp.toString());
        uploads = new AtomicInteger();
        DocumentStorage storage = new DocumentStorage() {
            @Override
            public String upload(UUID tenantId, UUID documentId, String fileName,
                    InputStream inputStream, String contentType) {
                uploads.incrementAndGet();
                return files.store(tenantId, "tenu", documentId.toString(), fileName, contentType,
                        inputStream, BYTES.length);
            }

            @Override
            public InputStream download(String storageKey) {
                try {
                    return files.getResource(storageKey).orElseThrow().getInputStream();
                } catch (Exception e) {
                    throw new IllegalStateException(e);
                }
            }

            @Override
            public void delete(String storageKey) {
                files.delete(storageKey);
            }

            @Override
            public boolean exists(String storageKey) {
                return files.getResource(storageKey).isPresent();
            }
        };
        TenantObjectIndex index = new TenantObjectIndex(attachmentRepository, documentRepository);
        attachments = new AttachmentServiceImpl(
                attachmentRepository, files, null, index);
        documents = new DocumentService(documentRepository, storage, null, index);
        usage = new DocumentUsageService(attachmentRepository, documentRepository);
        stubPieces();
        stubTenus();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        pieces.clear();
        tenus.clear();
    }

    @Test
    void tenuPuisPiece() {
        Document tenu = deposit(TENANT_A);
        RecordAttachment piece = attachments.attach("record", "rec-1", file());
        assertThat(piece.getFileUrl()).isEqualTo(tenu.getStorageKey());
        assertThat(uploads.get()).isEqualTo(1);
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
    }

    @Test
    void piecePuisTenu() {
        RecordAttachment piece = attachments.attach("record", "rec-1", file());
        Document tenu = deposit(TENANT_A);
        assertThat(tenu.getStorageKey()).isEqualTo(piece.getFileUrl());
        assertThat(uploads.get()).isZero();
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
    }

    @Test
    void unifierDeuxTenants() {
        Document ofA = deposit(TENANT_A);
        attachments.attach("record", "rec-1", file());
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
        TenantContext.setTenantId(TENANT_B);
        Document ofB = deposit(TENANT_B);
        assertThat(ofB.getStorageKey()).isNotEqualTo(ofA.getStorageKey());
        TenantContext.setTenantId(TENANT_A);
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
    }

    @Test
    void unifierDerniereReference() {
        Document tenu = deposit(TENANT_A);
        RecordAttachment piece = attachments.attach("record", "rec-1", file());
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
        String key = tenu.getStorageKey();
        attachments.delete(piece.getId());
        assertThat(files.getResource(key)).isPresent();
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
        documents.deleteDocument(tenu.getId(), TENANT_A);
        assertThat(files.getResource(key)).isEmpty();
        assertThat(usage.usageBytesOfCurrentTenant()).isZero();
    }

    @Test
    void tenuRetrait() {
        Document tenu = deposit(TENANT_A);
        String key = tenu.getStorageKey();
        assertThat(files.getResource(key)).isPresent();
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);

        documents.deleteDocument(tenu.getId(), TENANT_A);

        assertThat(tenus.get(tenu.getId()).getStatus()).isEqualTo(DocumentStatus.DELETED);
        assertThat(files.getResource(key)).isEmpty();
        assertThat(usage.usageBytesOfCurrentTenant()).isZero();
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

    private static MockMultipartFile file() {
        return new MockMultipartFile("file", "note.txt", "text/plain", BYTES);
    }

    private void stubPieces() {
        when(attachmentRepository.save(any(RecordAttachment.class))).thenAnswer(inv -> {
            RecordAttachment a = inv.getArgument(0);
            if (a.getId() == null) {
                a.setId(UUID.randomUUID());
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
        when(attachmentRepository.findByTenantId(any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            return pieces.values().stream().filter(a -> tenant.equals(a.getTenantId())).toList();
        });
        doAnswer(inv -> {
            RecordAttachment a = inv.getArgument(0);
            pieces.remove(a.getId());
            return null;
        }).when(attachmentRepository).delete(any(RecordAttachment.class));
    }

    private void stubTenus() {
        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> {
            Document d = inv.getArgument(0);
            tenus.put(d.getId(), d);
            return d;
        });
        when(documentRepository.findByIdAndTenantId(any(), any())).thenAnswer(inv -> {
            Document d = tenus.get(inv.getArgument(0));
            UUID tenant = inv.getArgument(1);
            if (d == null || !tenant.equals(d.getTenantId())) {
                return Optional.empty();
            }
            return Optional.of(d);
        });
        when(documentRepository.findFirstByTenantIdAndChecksumSha256AndStatus(any(), any(), any()))
                .thenAnswer(inv -> {
                    UUID tenant = inv.getArgument(0);
                    String checksum = inv.getArgument(1);
                    DocumentStatus status = inv.getArgument(2);
                    return tenus.values().stream()
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
                    return tenus.values().stream()
                            .filter(d -> tenant.equals(d.getTenantId())
                                    && key.equals(d.getStorageKey())
                                    && status == d.getStatus())
                            .count();
                });
        when(documentRepository.findByTenantId(any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            return tenus.values().stream().filter(d -> tenant.equals(d.getTenantId())).toList();
        });
    }
}
