package com.ghanim.pos.controller;

import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.SupplierDelivery;
import com.ghanim.pos.service.SupplierDeliveryService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/supplier-deliveries")
@RequiredArgsConstructor
public class SupplierDeliveryController {

    private final SupplierDeliveryService service;

    @PostMapping
    public ResponseEntity<ApiResponse<SupplierDelivery>> create(@RequestBody Map<String, Object> body) {
        return ResponseEntity.ok(ApiResponse.ok(service.create(body), "Delivery recorded"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<SupplierDelivery>>> getBySupplier(
            @RequestParam Long supplierId) {
        return ResponseEntity.ok(ApiResponse.ok(service.getBySupplier(supplierId)));
    }

    @GetMapping("/price-comparison")
    public ResponseEntity<ApiResponse<List<Map<String, Object>>>> priceComparison() {
        return ResponseEntity.ok(ApiResponse.ok(service.getPriceComparison()));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<ApiResponse<Void>> delete(@PathVariable Long id) {
        service.delete(id);
        return ResponseEntity.ok(ApiResponse.ok(null, "Delivery deleted and balance reversed"));
    }
}
