package ma.nafura.bc.demo.purchasing;

import java.util.List;
import java.util.Set;

import lombok.RequiredArgsConstructor;
import ma.nafura.platform.authorization.security.authorization.SecuredResource;
import ma.nafura.platform.framework.record.RecordController;
import ma.nafura.platform.framework.record.RecordRepository;
import org.springframework.data.domain.Sort;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

/** The purchasing API: each record is its entity, its repository and these few lines. Permissions: demo.purchasing.{resource}.{read,create,update,delete}. */
@RestController
@RequestMapping("/api/v1/demo/categories")
@SecuredResource(domain = "demo", feature = "purchasing", resource = "category")
@RequiredArgsConstructor
class CategoryController extends RecordController<Category> {
    private final CategoryRepository repository;

    @Override protected RecordRepository<Category> repository() { return repository; }
    @Override protected List<String> searchFields() { return List.of("code", "name"); }
    @Override protected Set<String> filterFields() { return Set.of("parentId"); }
    @Override protected String labelField() { return "name"; }
    @Override protected Sort defaultSort() { return Sort.by("name"); }
}

@RestController
@RequestMapping("/api/v1/demo/suppliers")
@SecuredResource(domain = "demo", feature = "purchasing", resource = "supplier")
@RequiredArgsConstructor
class SupplierController extends RecordController<Supplier> {
    private final SupplierRepository repository;

    @Override protected RecordRepository<Supplier> repository() { return repository; }
    @Override protected List<String> searchFields() { return List.of("code", "name", "city", "email"); }
    @Override protected Set<String> filterFields() { return Set.of("active", "categoryId", "city"); }
    @Override protected String labelField() { return "name"; }
}

@RestController
@RequestMapping("/api/v1/demo/supplier-contacts")
@SecuredResource(domain = "demo", feature = "purchasing", resource = "contact")
@RequiredArgsConstructor
class SupplierContactController extends RecordController<SupplierContact> {
    private final SupplierContactRepository repository;

    @Override protected RecordRepository<SupplierContact> repository() { return repository; }
    @Override protected List<String> searchFields() { return List.of("name", "email", "jobTitle"); }
    @Override protected Set<String> filterFields() { return Set.of("supplierId"); }
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
    @Override protected List<String> searchFields() { return List.of("code", "name"); }
    @Override protected Set<String> filterFields() { return Set.of("active", "categoryId", "unit"); }
    @Override protected String labelField() { return "name"; }
}

@RestController
@RequestMapping("/api/v1/demo/purchase-requests")
@SecuredResource(domain = "demo", feature = "purchasing", resource = "request")
@RequiredArgsConstructor
class PurchaseRequestController extends RecordController<PurchaseRequest> {
    private final PurchaseRequestRepository repository;

    @Override protected RecordRepository<PurchaseRequest> repository() { return repository; }
    @Override protected List<String> searchFields() { return List.of("subject"); }
    @Override protected Set<String> filterFields() { return Set.of("status", "supplierId"); }
    @Override protected String labelField() { return "subject"; }
    @Override protected String lifecycleResource() { return "lifecycle/purchase-request.json"; }
}
