package ma.nafura.platform.collaboration.docmanager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import io.minio.MinioClient;
import io.minio.ObjectWriteResponse;
import java.lang.reflect.Field;
import java.lang.reflect.Method;
import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.collaboration.docmanager.api.response.DocumentResponse;
import ma.nafura.platform.collaboration.docmanager.attachment.AttachmentServiceImpl;
import ma.nafura.platform.collaboration.docmanager.attachment.LocalFileStorageService;
import ma.nafura.platform.collaboration.docmanager.config.MinioProperties;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentStatus;
import ma.nafura.platform.collaboration.docmanager.domain.enums.DocumentType;
import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentRepository;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
import ma.nafura.platform.collaboration.docmanager.service.DocumentService;
import ma.nafura.platform.collaboration.docmanager.storage.MinioDocumentStorage;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.context.UserContext;
import ma.nafura.platform.framework.service.crud.CrudNotFoundException;
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

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentsBaselineTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final String ENTITY_TYPE = "record";
    private static final String ENTITY_ID = "rec-1";
    private static final byte[] BYTES = "hello-docs".getBytes(StandardCharsets.UTF_8);

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

    @BeforeEach
    void setUp() throws Exception {
        TenantContext.setTenantId(TENANT_A);
        UserContext.setUserEmail("a@example.com");
        fileStorage = new LocalFileStorageService(tmp.toString());
        attachments = new AttachmentServiceImpl(attachmentRepository, fileStorage);
        stubAttachmentRepo();
        when(documentRepository.save(any(Document.class))).thenAnswer(inv -> inv.getArgument(0));
        when(documentRepository.findFirstByTenantIdAndChecksumSha256AndStatus(any(), any(), any()))
                .thenReturn(Optional.empty());
        when(minioClient.putObject(any())).thenReturn((ObjectWriteResponse) null);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        store.clear();
    }

    @Test
    void joindreEtRendre() throws Exception {
        RecordAttachment saved = attachments.attach(ENTITY_TYPE, ENTITY_ID, file());
        Page<RecordAttachment> listed = attachments.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));
        byte[] downloaded = fileStorage.getResource(saved.getFileUrl()).orElseThrow()
                .getContentAsByteArray();

        assertThat(listed.getContent()).extracting(RecordAttachment::getId).contains(saved.getId());
        assertThat(downloaded).isEqualTo(BYTES);
    }

    @Test
    void deuxTenants() {
        RecordAttachment ofA = attachments.attach(ENTITY_TYPE, ENTITY_ID, file());

        TenantContext.setTenantId(TENANT_B);
        Page<RecordAttachment> listedB = attachments.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));

        assertThat(listedB.getContent()).isEmpty();
        assertThatThrownBy(() -> attachments.delete(ofA.getId()))
                .isInstanceOf(CrudNotFoundException.class);
    }

    @Test
    void retirerPiece() {
        RecordAttachment saved = attachments.attach(ENTITY_TYPE, ENTITY_ID, file());
        String key = saved.getFileUrl();
        attachments.delete(saved.getId());

        Page<RecordAttachment> listed = attachments.listByEntity(
                ENTITY_TYPE, ENTITY_ID, PageRequest.of(0, 20));
        assertThat(listed.getContent()).isEmpty();
        assertThat(fileStorage.getResource(key)).isEmpty();
    }

    @Test
    void originalCleTenant() {
        MinioProperties props = new MinioProperties();
        props.setBucket("documents");
        DocumentService originals = new DocumentService(
                documentRepository, new MinioDocumentStorage(minioClient, props));

        Document deposited = originals.uploadDocument(
                TENANT_A,
                BYTES,
                "note.txt",
                "text/plain",
                DocumentType.OTHER,
                OffsetDateTime.now(),
                UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc"));

        assertThat(deposited.getStorageKey()).startsWith(TENANT_A + "/");
    }

    @Test
    void archiveAbsent() {
        MinioProperties props = new MinioProperties();
        props.setBucket("documents");
        DocumentService originals = new DocumentService(
                documentRepository, new MinioDocumentStorage(minioClient, props));

        Document deposited = originals.uploadDocument(
                TENANT_A,
                BYTES,
                "note.txt",
                "text/plain",
                DocumentType.OTHER,
                OffsetDateTime.now(),
                UUID.fromString("cccccccc-cccc-cccc-cccc-cccccccccccc"));

        assertThat(deposited.getStatus()).isEqualTo(DocumentStatus.UPLOADED);
        assertThat(DocumentStatus.values())
                .extracting(Enum::name)
                .containsExactlyInAnyOrder("UPLOADED", "DELETED");
        assertThatThrownBy(() -> DocumentStatus.valueOf("ARCHIVED"))
                .isInstanceOf(IllegalArgumentException.class);

        assertThat(DocumentResponse.class.getDeclaredFields())
                .extracting(Field::getName)
                .noneMatch(n -> n.toLowerCase().contains("archiv"));
        assertThat(DocumentService.class.getDeclaredMethods())
                .extracting(Method::getName)
                .noneMatch(n -> n.toLowerCase().contains("archiv"));
    }

    private MockMultipartFile file() {
        return new MockMultipartFile("file", "note.txt", "text/plain", BYTES);
    }

    private void stubAttachmentRepo() {
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
        when(attachmentRepository.findFirstByTenantIdAndChecksumSha256(any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            String checksum = inv.getArgument(1);
            return store.values().stream()
                    .filter(a -> tenant.equals(a.getTenantId()) && checksum.equals(a.getChecksumSha256()))
                    .findFirst();
        });
        when(attachmentRepository.countByTenantIdAndFileUrl(any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            String url = inv.getArgument(1);
            return store.values().stream()
                    .filter(a -> tenant.equals(a.getTenantId()) && url.equals(a.getFileUrl()))
                    .count();
        });
        when(attachmentRepository.findByIdAndTenantId(any(), any())).thenAnswer(inv -> {
            RecordAttachment a = store.get(inv.getArgument(0));
            UUID tenant = inv.getArgument(1);
            if (a == null || !tenant.equals(a.getTenantId())) {
                return Optional.empty();
            }
            return Optional.of(a);
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
        doAnswer(inv -> {
            RecordAttachment a = inv.getArgument(0);
            store.remove(a.getId());
            return null;
        }).when(attachmentRepository).delete(any(RecordAttachment.class));
    }
}
