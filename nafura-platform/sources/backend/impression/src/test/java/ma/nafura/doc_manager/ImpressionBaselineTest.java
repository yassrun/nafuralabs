package ma.nafura.platform.collaboration.docmanager;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;
import ma.nafura.platform.collaboration.docmanager.config.ThymeleafTemplateConfig;
import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentTemplate;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentTemplateRepository;
import ma.nafura.platform.collaboration.docmanager.service.DocumentSettingsService;
import ma.nafura.platform.collaboration.docmanager.service.DocumentTemplateService;
import ma.nafura.platform.collaboration.docmanager.template.DocumentFragmentService;
import ma.nafura.platform.collaboration.docmanager.template.PdfGenerationService;
import ma.nafura.platform.collaboration.docmanager.template.TemplateRenderException;
import ma.nafura.platform.collaboration.docmanager.template.TemplateRenderService;
import ma.nafura.platform.collaboration.docmanager.template.TemplateVariableResolver;
import ma.nafura.platform.framework.context.TenantContext;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageImpl;
import org.springframework.data.domain.PageRequest;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class ImpressionBaselineTest {

    private static final UUID TENANT_A = UUID.fromString("aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
    private static final UUID TENANT_B = UUID.fromString("bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb");
    private static final UUID TEMPLATE_ID = UUID.fromString("11111111-1111-1111-1111-111111111111");
    private static final UUID ENTITY_ID = UUID.fromString("22222222-2222-2222-2222-222222222222");
    private static final byte[] PDF = "%PDF-1.4\n%impression\n".getBytes(StandardCharsets.US_ASCII);

    @Mock
    private DocumentTemplateRepository templateRepository;

    @Mock
    private TemplateVariableResolver variableResolver;

    @Mock
    private DocumentFragmentService fragmentService;

    @Mock
    private DocumentSettingsService settingsService;

    @Mock
    private PdfGenerationService pdfService;

    private final Map<UUID, DocumentTemplate> store = new LinkedHashMap<>();
    private TemplateRenderService render;
    private DocumentTemplateService templates;

    @BeforeEach
    void setUp() {
        TenantContext.setTenantId(TENANT_A);
        stubRepo();
        when(fragmentService.bodiesForCurrentTenant()).thenReturn(Map.of());
        when(settingsService.get(anyString())).thenThrow(new RuntimeException("no settings"));
        when(variableResolver.resolve(any(), any())).thenAnswer(inv -> {
            Map<String, Object> vars = new LinkedHashMap<>();
            vars.put("titre", "Bonjour");
            return vars;
        });
        when(pdfService.htmlToPdf(any(), any(), any(), any(), any(), any())).thenReturn(PDF);

        render = new TemplateRenderService(
                templateRepository,
                variableResolver,
                fragmentService,
                settingsService,
                pdfService,
                new ThymeleafTemplateConfig().stringTemplateEngine());
        templates = new DocumentTemplateService(templateRepository, List.of(), fragmentService);
        store.put(TEMPLATE_ID, modele(TENANT_A));
    }

    @AfterEach
    void tearDown() {
        TenantContext.clear();
        store.clear();
    }

    @Test
    void rendrePdf() {
        byte[] pdf = render.render(TEMPLATE_ID, "fiche", ENTITY_ID);

        assertThat(new String(pdf, StandardCharsets.US_ASCII)).startsWith("%PDF");
    }

    @Test
    void typeOpaque() {
        Map<String, Object> bag = new LinkedHashMap<>();
        bag.put("titre", "Sac opaque");
        byte[] pdf = render.renderOpaque(TEMPLATE_ID, bag);

        assertThat(new String(pdf, StandardCharsets.US_ASCII)).startsWith("%PDF");
        assertThat(bag.keySet()).doesNotContain("tva", "lignes", "totaux", "client");
    }

    @Test
    void deuxTenants() {
        TenantContext.setTenantId(TENANT_B);
        Page<DocumentTemplate> listedB = templates.list(null, PageRequest.of(0, 20));

        assertThat(listedB.getContent()).isEmpty();
        assertThatThrownBy(() -> render.render(TEMPLATE_ID, "fiche", ENTITY_ID))
                .isInstanceOf(TemplateRenderException.class);
    }

    private DocumentTemplate modele(UUID tenant) {
        return DocumentTemplate.builder()
                .id(TEMPLATE_ID)
                .tenantId(tenant)
                .code("fiche-a")
                .name("Fiche A")
                .entityType("fiche")
                .format("pdf")
                .templateBody("<p th:text=\"${titre}\">x</p>")
                .isSystem(false)
                .paperSize("A4")
                .orientation("portrait")
                .isActive(true)
                .build();
    }

    private void stubRepo() {
        when(templateRepository.findByIdAndTenantId(any(), any())).thenAnswer(inv -> {
            DocumentTemplate t = store.get(inv.getArgument(0));
            UUID tenant = inv.getArgument(1);
            if (t == null || !tenant.equals(t.getTenantId())) {
                return Optional.empty();
            }
            return Optional.of(t);
        });
        when(templateRepository.findByTenantId(any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            var pageable = inv.getArgument(1, org.springframework.data.domain.Pageable.class);
            var items = store.values().stream().filter(t -> tenant.equals(t.getTenantId())).toList();
            return new PageImpl<>(items, pageable, items.size());
        });
        when(templateRepository.findByTenantIdAndEntityType(any(), any(), any())).thenAnswer(inv -> {
            UUID tenant = inv.getArgument(0);
            String type = inv.getArgument(1);
            var pageable = inv.getArgument(2, org.springframework.data.domain.Pageable.class);
            var items = store.values().stream()
                    .filter(t -> tenant.equals(t.getTenantId()) && type.equals(t.getEntityType()))
                    .toList();
            return new PageImpl<>(items, pageable, items.size());
        });
    }
}
