package ma.nafura.platform.collaboration.docmanager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.doAnswer;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.nio.file.Path;
import java.time.OffsetDateTime;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.collaboration.docmanager.attachment.AttachmentController;
import ma.nafura.platform.collaboration.docmanager.attachment.AttachmentServiceImpl;
import ma.nafura.platform.collaboration.docmanager.attachment.LocalFileStorageService;
import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
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
import org.springframework.core.io.Resource;
import org.springframework.data.domain.PageImpl;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.mock.web.MockMultipartFile;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentsDownloadTenantTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final byte[] BYTES = "hello-docs".getBytes(StandardCharsets.UTF_8);

    @TempDir
    Path tmp;

    @Mock
    private RecordAttachmentRepository attachmentRepository;

    private final Map<UUID, RecordAttachment> store = new LinkedHashMap<>();
    private AttachmentController controller;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_A);
        UserContext.setUserEmail("a@example.com");
        LocalFileStorageService fileStorage = new LocalFileStorageService(tmp.toString());
        AttachmentServiceImpl attachments = new AttachmentServiceImpl(attachmentRepository, fileStorage);
        stubAttachmentRepo();
        controller = new AttachmentController(attachments, fileStorage);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        store.clear();
    }

    @Test
    void downloadProprietaire() throws Exception {
        RecordAttachment saved = attachAsA();

        ResponseEntity<?> response = controller.download(saved.getFileUrl());

        assertThat(response.getStatusCode()).isEqualTo(HttpStatus.OK);
        assertThat(((Resource) response.getBody()).getContentAsByteArray()).isEqualTo(BYTES);
    }

    @Test
    void downloadAutreTenant() {
        RecordAttachment ofA = attachAsA();

        TenantContext.setTenantId(TENANT_B);
        ResponseEntity<?> other = controller.download(ofA.getFileUrl());
        ResponseEntity<?> unknown = controller.download("local:" + TENANT_B + "/record/rec-1/missing.txt");

        assertThat(other.getStatusCode()).isEqualTo(unknown.getStatusCode());
        assertThat(other.getStatusCode()).isEqualTo(HttpStatus.NOT_FOUND);
        assertThat(other.getBody()).isNull();
    }

    private RecordAttachment attachAsA() {
        TenantContext.setTenantId(TENANT_A);
        return new AttachmentServiceImpl(
                attachmentRepository,
                new LocalFileStorageService(tmp.toString())
        ).attach("record", "rec-1", new MockMultipartFile("file", "note.txt", "text/plain", BYTES));
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
