package com.ghanim.pos.controller;

import com.ghanim.pos.dto.request.ProductRequest;
import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.dto.response.ProductResponse;
import com.ghanim.pos.service.ProductService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/products")
@RequiredArgsConstructor
public class ProductController {

    private final ProductService productService;

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductResponse>>> getProducts(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) Long categoryId,
            @RequestParam(required = false, defaultValue = "false") boolean includeInactive) {
        if (includeInactive) {
            return ResponseEntity.ok(ApiResponse.ok(productService.getAllIncludingInactive(search)));
        }
        return ResponseEntity.ok(ApiResponse.ok(productService.getPosProducts(search, categoryId)));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> getById(@PathVariable Long id) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getById(id)));
    }

    @GetMapping("/barcode/{barcode}")
    public ResponseEntity<ApiResponse<ProductResponse>> getByBarcode(@PathVariable String barcode) {
        return ResponseEntity.ok(ApiResponse.ok(productService.getByBarcode(barcode)));
    }

    @PostMapping
    public ResponseEntity<ApiResponse<ProductResponse>> create(@Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(productService.create(request), "Product created"));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ApiResponse<ProductResponse>> update(
            @PathVariable Long id, @Valid @RequestBody ProductRequest request) {
        return ResponseEntity.ok(ApiResponse.ok(productService.update(id, request)));
    }

    @GetMapping("/next-barcode")
    public ResponseEntity<ApiResponse<String>> nextBarcode(@RequestParam String prefix) {
        return ResponseEntity.ok(ApiResponse.ok(productService.nextBarcode(prefix)));
    }

    @PatchMapping("/{id}/reactivate")
    public ResponseEntity<ApiResponse<Void>> reactivate(@PathVariable Long id) {
        productService.reactivate(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Product reactivated"));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        productService.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Product deactivated"));
    }

    @DeleteMapping("/{id}/permanent")
    public ResponseEntity<ApiResponse<Void>> hardDelete(@PathVariable Long id) {
        productService.hardDelete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Product permanently deleted"));
    }
}
