package ma.nafura.sandbox.showroom.api.controller;

import java.util.Set;

import ma.nafura.platform.framework.api.controller.CrudController;
import ma.nafura.platform.framework.service.crud.CrudService;
import ma.nafura.sandbox.showroom.api.request.CreateProductRequest;
import ma.nafura.sandbox.showroom.api.request.UpdateProductRequest;
import ma.nafura.sandbox.showroom.domain.ShowroomProduct;
import ma.nafura.sandbox.showroom.service.ShowroomProductService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/showroom/products")
@CrossOrigin(origins = {"http://127.0.0.1:4300", "http://localhost:4300"})
public class ShowroomProductController extends CrudController<String, ShowroomProduct, CreateProductRequest, UpdateProductRequest> {

    private final ShowroomProductService productService;

    public ShowroomProductController(ShowroomProductService productService) {
        this.productService = productService;
    }

    @Override
    protected CrudService<String, ShowroomProduct, CreateProductRequest, UpdateProductRequest> getService() {
        return productService;
    }

    @Override
    protected Set<String> getFilterableFields() {
        return Set.of("code", "name", "status", "category", "description", "createdAt");
    }
}
