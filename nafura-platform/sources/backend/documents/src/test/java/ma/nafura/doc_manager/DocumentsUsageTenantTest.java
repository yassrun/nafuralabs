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
import ma.nafura.platform.collaboration.docmanager.attachment.AttachmentServiceImpl;
import ma.nafura.platform.collaboration.docmanager.attachment.LocalFileStorageService;
import ma.nafura.platform.collaboration.docmanager.domain.model.RecordAttachment;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentRepository;
import ma.nafura.platform.collaboration.docmanager.repository.RecordAttachmentRepository;
import ma.nafura.platform.collaboration.docmanager.service.DocumentUsageService;
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
class DocumentsUsageTenantTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final byte[] BYTES = "usage-bytes".getBytes(StandardCharsets.UTF_8);

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
        attachments = new AttachmentServiceImpl(
                attachmentRepository, new LocalFileStorageService(tmp.toString()));
        usage = new DocumentUsageService(attachmentRepository, documentRepository);
        stubPieces();
        when(documentRepository.findByTenantId(any())).thenAnswer(inv -> java.util.List.of());
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        UserContext.clear();
        store.clear();
    }

    @Test
    void usageUnePiece() {
        attachments.attach("record", "rec-1", file());
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
    }

    @Test
    void usageDeuxPiecesMemeEmpreinte() {
        attachments.attach("record", "rec-1", file());
        attachments.attach("record", "rec-2", file());
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
    }

    @Test
    void usageDeuxTenants() {
        attachments.attach("record", "rec-1", file());
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
        TenantContext.setTenantId(TENANT_B);
        assertThat(usage.usageBytesOfCurrentTenant()).isZero();
    }

    @Test
    void usageApresRetrait() {
        RecordAttachment first = attachments.attach("record", "rec-1", file());
        RecordAttachment second = attachments.attach("record", "rec-2", file());
        attachments.delete(first.getId());
        assertThat(usage.usageBytesOfCurrentTenant()).isEqualTo(BYTES.length);
        attachments.delete(second.getId());
        assertThat(usage.usageBytesOfCurrentTenant()).isZero();
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
            store.put(a.getId(), a);
            return a;
        });
        when(attachmentRepository.findByIdAndTenantId(any(), any())).thenAnswer(inv -> {
            RecordAttachment a = store.get(inv.getArgument(0));
            UUID tenant = inv.getArgument(1);
            if (a == null || !tenant.equals(a.getTenantId())) {
                return Optional.empty();
            }
            return Optional.of(a);
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
