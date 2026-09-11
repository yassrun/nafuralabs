package ma.nafura.etudes.service;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.Mockito.when;

import java.io.ByteArrayInputStream;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.etudes.domain.dossier.DossierDocument;
import ma.nafura.etudes.repository.DossierDocumentRepository;
import ma.nafura.platform.collaboration.docmanager.domain.model.Document;
import ma.nafura.platform.collaboration.docmanager.service.DocumentService;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

@ExtendWith(MockitoExtension.class)
class DossierDocumentServiceTest {

    private static final UUID TENANT = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID DOSSIER = UUID.fromString("dddddddd-dddd-dddd-dddd-dddddddddddd");
    private static final UUID PIECE = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID STORED = UUID.fromString("11111111-1111-1111-1111-111111111111");

    @Mock
    private DossierDocumentRepository repository;

    @Mock
    private DocumentService documentService;

    @Mock
    private DossierPieceAttendueService pieceAttendueService;

    private DossierDocumentService service;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT);
        service = new DossierDocumentService(repository, documentService, pieceAttendueService);
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
    }

    @Test
    void consulter_retourneLesOctetsEtLeMimePdf() {
        DossierDocument piece = DossierDocument.builder()
                .id(PIECE)
                .tenantId(TENANT)
                .dossierEtudeId(DOSSIER)
                .documentId(STORED.toString())
                .nomFichier("CPS-AO.pdf")
                .type(DossierDocument.TYPE_CPS)
                .ordre(0)
                .build();
        when(repository.findByIdAndTenantIdAndDossierEtudeId(PIECE, TENANT, DOSSIER))
                .thenReturn(Optional.of(piece));
        when(documentService.downloadDocument(STORED, TENANT))
                .thenReturn(new ByteArrayInputStream("%PDF-1.4".getBytes()));
        when(documentService.getDocument(STORED, TENANT))
                .thenReturn(Document.builder().id(STORED).mimeType("application/pdf").fileName("CPS-AO.pdf").build());

        DossierDocumentService.DocumentContenu contenu = service.consulter(DOSSIER, PIECE);

        assertThat(contenu.nomFichier()).isEqualTo("CPS-AO.pdf");
        assertThat(contenu.mimeType()).isEqualTo("application/pdf");
        assertThat(contenu.octets()).isEqualTo("%PDF-1.4".getBytes());
    }

    @Test
    void trouver_refuseUnePieceDUnAutreDossier() {
        when(repository.findByIdAndTenantIdAndDossierEtudeId(PIECE, TENANT, DOSSIER))
                .thenReturn(Optional.empty());

        assertThatThrownBy(() -> service.trouver(DOSSIER, PIECE))
                .isInstanceOf(IllegalArgumentException.class)
                .hasMessage("etudes.document.introuvable");
    }
}
