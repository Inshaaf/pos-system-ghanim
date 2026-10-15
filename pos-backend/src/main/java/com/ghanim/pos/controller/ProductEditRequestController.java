package com.ghanim.pos.controller;

import com.ghanim.pos.dto.request.ProductRequest;
import com.ghanim.pos.dto.response.ApiResponse;
import com.ghanim.pos.entity.ProductEditRequest;
import com.ghanim.pos.service.ProductEditRequestService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/product-edit-requests")
@RequiredArgsConstructor
public class ProductEditRequestController {
    private final ProductEditRequestService requestService;

    @PostMapping("/{productId}")
    public ResponseEntity<ApiResponse<ProductEditRequest>> submit(
            @PathVariable Long productId, @Valid @RequestBody ProductRequest request, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(
                requestService.submit(productId, request, auth.getName()), "Product edit request submitted"));
    }

    @GetMapping
    public ResponseEntity<ApiResponse<List<ProductEditRequest>>> pending() {
        return ResponseEntity.ok(ApiResponse.ok(requestService.getPending()));
    }

    @PatchMapping("/{id}/approve")
    public ResponseEntity<ApiResponse<ProductEditRequest>> approve(@PathVariable Long id, Authentication auth) {
        return ResponseEntity.ok(ApiResponse.ok(requestService.approve(id, auth.getName()), "Product changes applied"));
    }

    @PatchMapping("/{id}/reject")
    public ResponseEntity<ApiResponse<ProductEditRequest>> reject(
            @PathVariable Long id, @RequestBody(required = false) Map<String, String> body, Authentication auth) {
        String note = body == null ? null : body.get("reviewNote");
        return ResponseEntity.ok(ApiResponse.ok(requestService.reject(id, auth.getName(), note), "Request rejected"));
    }
}
