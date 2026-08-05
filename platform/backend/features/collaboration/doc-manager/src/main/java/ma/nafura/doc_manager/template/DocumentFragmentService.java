package ma.nafura.platform.collaboration.docmanager.template;

import ma.nafura.platform.collaboration.docmanager.domain.model.DocumentFragment;
import ma.nafura.platform.collaboration.docmanager.repository.DocumentFragmentRepository;
import ma.nafura.platform.framework.context.TenantContext;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.UUID;

/**
 * Reads and seeds the reusable blocks shared by every document template.
 *
 * <p>Rendering is two-pass rather than Thymeleaf fragment resolution: fragments are rendered on
 * their own with the same variable context, then injected into the main template through
 * {@code th:utext}. It keeps the engine configuration standard, and the fragments are
 * server-generated from document settings — never free-form HTML typed by a tenant.
 */
@Service
public class DocumentFragmentService {

    public static final String HEADER_DEFAULT = "HEADER_DEFAULT";
    public static final String FOOTER_DEFAULT = "FOOTER_DEFAULT";

    public static final String SCOPE_HEADER = "HEADER";
    public static final String SCOPE_FOOTER = "FOOTER";

    private final DocumentFragmentRepository repository;

    public DocumentFragmentService(DocumentFragmentRepository repository) {
        this.repository = repository;
    }

    public List<DocumentFragment> listForCurrentTenant() {
        UUID tenantId = TenantContext.getTenantId();
        return tenantId == null ? List.of() : repository.findAllByTenantId(tenantId);
    }

    public Optional<DocumentFragment> find(String code) {
        UUID tenantId = TenantContext.getTenantId();
        return tenantId == null ? Optional.empty() : repository.findByTenantIdAndCode(tenantId, code);
    }

    /** Raw bodies keyed by code, for the render pipeline. */
    public Map<String, String> bodiesForCurrentTenant() {
        Map<String, String> bodies = new LinkedHashMap<>();
        for (DocumentFragment fragment : listForCurrentTenant()) {
            bodies.put(fragment.getCode(), fragment.getBody() != null ? fragment.getBody() : "");
        }
        return bodies;
    }

    /** Create or replace a fragment body for the current tenant. */
    @Transactional
    public DocumentFragment upsert(String code, String name, String scope, String body) {
        UUID tenantId = TenantContext.getTenantId();
        if (tenantId == null) {
            throw new IllegalStateException("No tenant in context");
        }
        DocumentFragment fragment = repository
                .findByTenantIdAndCode(tenantId, code)
                .orElseGet(() -> DocumentFragment.builder()
                        .tenantId(tenantId)
                        .code(code)
                        .isSystem(true)
                        .build());
        fragment.setName(name);
        fragment.setScope(scope);
        fragment.setBody(body);
        return repository.save(fragment);
    }

    /** Seed the default header and footer for a tenant that has none yet. */
    @Transactional
    public void ensureDefaults(UUID tenantId) {
        if (tenantId == null) {
            return;
        }
        seedIfAbsent(tenantId, HEADER_DEFAULT, "En-tête standard", SCOPE_HEADER, defaultHeaderBody());
        seedIfAbsent(tenantId, FOOTER_DEFAULT, "Pied de page standard", SCOPE_FOOTER, defaultFooterBody());
    }

    private void seedIfAbsent(UUID tenantId, String code, String name, String scope, String body) {
        if (repository.findByTenantIdAndCode(tenantId, code).isPresent()) {
            return;
        }
        repository.save(DocumentFragment.builder()
                .tenantId(tenantId)
                .code(code)
                .name(name)
                .scope(scope)
                .body(body)
                .isSystem(true)
                .build());
    }

    /**
     * Default letterhead: logo, legal name and the Moroccan registration numbers, each shown only
     * when the identity provides it, so an incomplete company profile degrades instead of
     * printing empty labels.
     */
    private static String defaultHeaderBody() {
        return """
            <div class="nf-doc-header">
              <div class="nf-doc-header__brand">
                <img th:if="${tenant.logo}" th:src="${tenant.logo}" alt=""
                     style="max-height:48px;max-width:170px;display:block;margin-bottom:6px"/>
                <div class="nf-doc-header__name" th:text="${tenant.raisonSociale}">Société</div>
                <div class="nf-doc-header__legal">
                  <span th:if="${tenant.formeJuridique}" th:text="${tenant.formeJuridique}"></span>
                  <span th:if="${tenant.capital}" th:text="'— Capital ' + ${tenant.capital}"></span>
                </div>
              </div>
              <div class="nf-doc-header__contact">
                <div th:if="${tenant.adresse}" th:text="${tenant.adresse}"></div>
                <div th:if="${tenant.ville}" th:text="${tenant.ville}"></div>
                <div th:if="${tenant.telephone}" th:text="'Tél. ' + ${tenant.telephone}"></div>
                <div th:if="${tenant.email}" th:text="${tenant.email}"></div>
              </div>
            </div>
            """;
    }

    /** Legal identifiers belong in the footer on Moroccan documents. */
    private static String defaultFooterBody() {
        return """
            <div class="nf-doc-footer">
              <span th:if="${tenant.raisonSociale}" th:text="${tenant.raisonSociale}"></span>
              <span th:if="${tenant.ice}" th:text="' — ICE ' + ${tenant.ice}"></span>
              <span th:if="${tenant.rc}" th:text="' — RC ' + ${tenant.rc}"></span>
              <span th:if="${tenant.identifiantFiscal}"
                    th:text="' — IF ' + ${tenant.identifiantFiscal}"></span>
              <span th:if="${tenant.patente}" th:text="' — Patente ' + ${tenant.patente}"></span>
              <span th:if="${tenant.cnss}" th:text="' — CNSS ' + ${tenant.cnss}"></span>
            </div>
            """;
    }
}
