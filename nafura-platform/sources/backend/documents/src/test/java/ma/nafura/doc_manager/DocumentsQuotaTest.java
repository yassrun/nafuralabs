package ma.nafura.platform.collaboration.docmanager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
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
import ma.nafura.platform.collaboration.docmanager.attachment.AttachmentServiceImpl;
import ma.nafura.platform.collaboration.docmanager.attachment.LocalFileStorageService;
import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentRepository;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
import ma.nafura.platform.collaboration.docmanager.service.DocumentQuotaPolicy;
import ma.nafura.platform.collaboration.docmanager.service.DocumentUsageService;
import ma.nafura.platform.framework.api.error.StorageQuotaExceededException;
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

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class DocumentsQuotaTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final byte[] BYTES = "quota-bytes".getBytes(StandardCharsets.UTF_8);

    @TempDir
    Path tmp;

    @Mock
    private RecordAttachmentRepository attachmentRepository;

    @Mock
    private DocumentRepository documentRepository;

    private final Map<UUID, RecordAttachment> store = new LinkedHashMap<>();
    private AttachmentServiceImpl attachments;
    private DocumentUsageService usage;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_A);
        UserContext.setUserEmail("a@example.com");
        usage = new DocumentUsageService(attachmentRepository, documentRepository);
        when(documentRepository.findByTenantId(any())).thenAnswer(inv -> java.util.List.of());
        stubPieces();
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        store.clear();
    }

    @Test
    void quotaSousPlafond() {
        attachments = attachmentsWithCeiling(BYTES.length + 10);
        RecordAttachment saved = attachments.attach("record", "rec-1", file());
        Page<RecordAttachment> listed = attachments.listByEntity(
                "record", "rec-1", PageRequest.of(0, 20));
        assertThat(listed.getContent()).extracting(RecordAttachment::getId).contains(saved.getId());
    }

    @Test
    void quotaDepasse() {
        attachments = attachmentsWithCeiling(BYTES.length - 1);
        assertThatThrownBy(() -> attachments.attach("record", "rec-1", file()))
                .isInstanceOf(StorageQuotaExceededException.class);
        Page<RecordAttachment> listed = attachments.listByEntity(
                "record", "rec-1", PageRequest.of(0, 20));
        assertThat(listed.getContent()).isEmpty();
        assertThat(usage.usageBytesOfCurrentTenant()).isZero();
    }

    @Test
    void quotaDedupPasse() {
        attachments = attachmentsWithCeiling(BYTES.length);
        attachments.attach("record", "rec-1", file());
        RecordAttachment second = attachments.attach("record", "rec-2", file());
        assertThat(second.getId()).isNotNull();
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
    }

    private AttachmentServiceImpl attachmentsWithCeiling(long ceiling) {
        return new AttachmentServiceImpl(
                attachmentRepository,
                new LocalFileStorageService(tmp.toString()),
                new DocumentQuotaPolicy(ceiling, usage));
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
        when(attachmentRepository.findByTenantId(any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            return store.values().stream().filter(a -> tenant.equals(a.getTenantId())).toList();
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
