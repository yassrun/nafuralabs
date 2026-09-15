package ma.nafura.platform.showroom.api;

import static ma.nafura.platform.showroom.api.ShowroomApiModels.CreateProductRequest;
import static ma.nafura.platform.showroom.api.ShowroomApiModels.ProductResponse;
import static ma.nafura.platform.showroom.api.ShowroomApiModels.UpdateProductRequest;

import java.util.List;

import jakarta.validation.Valid;

import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/showroom")
@CrossOrigin(origins = {"http://127.0.0.1:4300", "http://localhost:4300"})
public class ShowroomController {

    private final ShowroomCatalogService catalogService;

    public ShowroomController(ShowroomCatalogService catalogService) {
        this.catalogService = catalogService;
    }

    @GetMapping("/catalog")
    public ShowroomApiModels.CatalogResponse catalog() {
        return catalogService.catalog();
    }

    @GetMapping("/products")
    public List<ProductResponse> products() {
        return catalogService.listProducts();
    }

    @GetMapping("/products/{id}")
    public ProductResponse product(@PathVariable String id) {
        return catalogService.getProduct(id);
    }

    @PostMapping("/products")
    @ResponseStatus(HttpStatus.CREATED)
    public ProductResponse createProduct(@Valid @RequestBody CreateProductRequest request) {
        return catalogService.createProduct(request);
    }

    @PutMapping("/products/{id}")
    public ProductResponse updateProduct(@PathVariable String id, @RequestBody UpdateProductRequest request) {
        return catalogService.updateProduct(id, request);
    }

    @DeleteMapping("/products/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deleteProduct(@PathVariable String id) {
        catalogService.deleteProduct(id);
    }
}
