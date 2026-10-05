package ma.nafura.bc.demo.purchasing;

import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.RequirePermission;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.context.TenantContext;
import ma.nafura.platform.framework.record.PublicRecordController;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;

/** The purchasing API: each record is its entity, its repository and these few lines. Permissions: demo.purchasing.{resource}.{read,create,update,delete}. */
@RestController
@RequestMapping("/api/v1/demo/categories")
@SecuredResource(domain = "demo", feature = "purchasing", resource = "category")
@RequiredArgsConstructor
class CategoryController extends RecordController<Category> {
    private final CategoryRepository repository;

    @Override protected RecordRepository<Category> repository() { return repository; }
    @Override protected String recordResource() { return "records/category.json"; }
    @Override protected String labelField() { return "name"; }
    @Override protected Sort defaultSort() { return Sort.by("name"); }
}

@RestController
@RequestMapping("/api/v1/demo/suppliers")
@SecuredResource(domain = "demo", feature = "purchasing", resource = "supplier")
@RequiredArgsConstructor
class SupplierController extends RecordController<Supplier> {
    private final SupplierRepository repository;
    private final PurchaseRequestRepository requests;

    @Override protected RecordRepository<Supplier> repository() { return repository; }
    @Override protected String recordResource() { return "records/supplier.json"; }
    @Override protected String labelField() { return "name"; }

    /** Counts and amounts of the supplier's purchase requests. Read permission of the supplier. */
    @GetMapping("/{id}/overview")
    public SupplierOverview overview(@PathVariable UUID id) {
        if (find(id).isEmpty()) {
            throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Supplier not found");
        }
        Map<String, Long> byStatus = new LinkedHashMap<>();
        BigDecimal amount = BigDecimal.ZERO;
        long total = 0;
        for (PurchaseRequest request : requests.findByTenantIdAndSupplierId(TenantContext.getTenantId(), id)) {
            total++;
            byStatus.merge(request.getStatus() == null ? "" : request.getStatus(), 1L, Long::sum);
            if (request.getAmount() != null) amount = amount.add(request.getAmount());
        }
        return new SupplierOverview(total, amount, byStatus);
    }

    /** Deterministic card reader for the create screen. No model, no second document format. */
    @PostMapping(value = "/extract", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @RequirePermission("create")
    public Map<String, Object> extract(@RequestParam("file") MultipartFile file) throws java.io.IOException {
        String text = new String(file.getBytes(), StandardCharsets.ISO_8859_1);
        Map<String, Object> fields = new LinkedHashMap<>();
        fields.put("name", extracted(text, "NAME", 0.95));
        fields.put("city", extracted(text, "CITY", 0.9));
        fields.put("email", extracted(text, "EMAIL", 0.55));
        return Map.of("fields", fields);
    }

    private static Map<String, Object> extracted(String text, String label, double confidence) {
        Matcher matcher = Pattern.compile("(?m)^" + label + ":\\s*(.+)$").matcher(text);
        String value = matcher.find() ? matcher.group(1).trim() : "";
        Map<String, Object> field = new LinkedHashMap<>();
        field.put("value", value);
        field.put("confidence", value.isEmpty() ? 0 : confidence);
        return field;
    }
}

record SupplierOverview(long total, BigDecimal amount, Map<String, Long> byStatus) {
}

@RestController
@RequestMapping("/api/v1/demo/supplier-contacts")
@SecuredResource(domain = "demo", feature = "purchasing", resource = "contact")
@RequiredArgsConstructor
class SupplierContactController extends RecordController<SupplierContact> {
    private final SupplierContactRepository repository;

    @Override protected RecordRepository<SupplierContact> repository() { return repository; }
    @Override protected String recordResource() { return "records/supplier-contact.json"; }
    @Override protected String labelField() { return "name"; }
    @Override protected Sort defaultSort() { return Sort.by("name"); }
}

@RestController
@RequestMapping("/api/v1/demo/items")
@SecuredResource(domain = "demo", feature = "purchasing", resource = "item")
@RequiredArgsConstructor
class ItemController extends RecordController<Item> {
    private final ItemRepository repository;

    @Override protected RecordRepository<Item> repository() { return repository; }
    @Override protected String recordResource() { return "records/item.json"; }
    @Override protected String labelField() { return "name"; }
}

@RestController
@RequestMapping("/api/public/demo/items")
@RequiredArgsConstructor
class PublicItemController extends PublicRecordController<Item> {
    private final ItemRepository repository;

    @Override protected RecordRepository<Item> repository() { return repository; }
    @Override protected boolean published(Item record) { return record.isPublished(); }
}

@RestController
@RequestMapping("/api/v1/demo/purchase-requests")
@SecuredResource(domain = "demo", feature = "purchasing", resource = "request")
@RequiredArgsConstructor
class PurchaseRequestController extends RecordController<PurchaseRequest> {
    private final PurchaseRequestRepository repository;

    @Override protected RecordRepository<PurchaseRequest> repository() { return repository; }
    @Override protected String labelField() { return "subject"; }
    @Override protected String recordResource() { return "records/purchase-request.json"; }

    /** A new draft with the same commercial fields. The screen opens that copy (`result: record`). */
    @PostMapping("/{id}/duplicate")
    @RequirePermission("duplicate")
    public ResponseEntity<PurchaseRequest> duplicate(@PathVariable UUID id) {
        PurchaseRequest source = find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        PurchaseRequest copy = new PurchaseRequest();
        String subject = source.getSubject() == null ? "Copie" : source.getSubject();
        copy.setSubject(subject.length() > 190 ? subject.substring(0, 190) : subject + " (copie)");
        copy.setSupplierId(source.getSupplierId());
        copy.setAmount(source.getAmount());
        copy.setNeededBy(source.getNeededBy());
        copy.setJustification(source.getJustification());
        copy.setStatus("DRAFT");
        copy.setTenantId(TenantContext.getTenantId());
        return ResponseEntity.status(HttpStatus.CREATED).body(repository().save(copy));
    }

    /** Purchase order of an ordered request. A minimal PDF: lab has no Gotenberg. */
    @PostMapping(value = "/{id}/pdf", produces = MediaType.APPLICATION_PDF_VALUE)
    @RequirePermission("print")
    public ResponseEntity<byte[]> pdf(@PathVariable UUID id) {
        PurchaseRequest request = find(id).orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Request not found"));
        if (!"ORDERED".equals(request.getStatus())) {
            throw new ResponseStatusException(HttpStatus.CONFLICT, "A purchase order exists only once the request is ordered");
        }
        String filename = filename(request.getSubject());
        return ResponseEntity.ok()
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"")
                .contentType(MediaType.APPLICATION_PDF)
                .body(purchaseOrder(request));
    }

    private static String filename(String subject) {
        String safe = subject == null ? "" : subject.replaceAll("[^\\p{L}\\p{N} ._-]", "").trim();
        if (safe.isBlank()) safe = "bon-de-commande";
        if (safe.length() > 80) safe = safe.substring(0, 80).trim();
        return safe + ".pdf";
    }

    private static byte[] purchaseOrder(PurchaseRequest request) {
        String line = escape(request.getSubject() == null ? "Bon de commande" : request.getSubject());
        String stream = "BT /F1 16 Tf 72 720 Td (" + line + ") Tj ET";
        String body = "%PDF-1.4\n"
                + "1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n"
                + "2 0 obj<</Type/Pages/Count 1/Kids[3 0 R]>>endobj\n"
                + "3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 612 792]/Contents 4 0 R/Resources<</Font<</F1 5 0 R>>>>>>endobj\n"
                + "4 0 obj<</Length " + stream.length() + ">>stream\n"
                + stream + "\nendstream\nendobj\n"
                + "5 0 obj<</Type/Font/Subtype/Type1/BaseFont/Helvetica>>endobj\n"
                + "trailer<</Root 1 0 R>>\n%%EOF\n";
        return body.getBytes(StandardCharsets.US_ASCII);
    }

    private static String escape(String value) {
        String ascii = value.replaceAll("[^\\x20-\\x7E]", " ");
        return ascii.replace("\\", "\\\\").replace("(", "\\(").replace(")", "\\)");
    }
}
