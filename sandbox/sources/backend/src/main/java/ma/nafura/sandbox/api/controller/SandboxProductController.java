package ma.nafura.sandbox.api.controller;

import java.util.Set;

import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.sandbox.api.request.CreateProductRequest;
import ma.nafura.sandbox.api.request.UpdateProductRequest;
import ma.nafura.sandbox.domain.SandboxProduct;
import ma.nafura.sandbox.service.SandboxProductService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/sandbox/products")
@CrossOrigin(origins = {"http://127.0.0.1:4300", "http://localhost:4300"})
public class SandboxProductController extends CrudController<String, SandboxProduct, CreateProductRequest, UpdateProductRequest> {

    private final SandboxProductService productService;

    public SandboxProductController(SandboxProductService productService) {
        this.productService = productService;
    }

    @Override
    protected CrudService<String, SandboxProduct, CreateProductRequest, UpdateProductRequest> getService() {
        return productService;
    }

    @Override
    protected Set<String> getFilterableFields() {
        return Set.of("code", "name", "status", "category", "description", "createdAt");
    }
}
