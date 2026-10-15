package com.ghanim.pos.service;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.ghanim.pos.dto.request.ProductRequest;
import com.ghanim.pos.entity.Product;
import com.ghanim.pos.entity.ProductEditRequest;
import com.ghanim.pos.exception.ResourceNotFoundException;
import com.ghanim.pos.repository.ProductEditRequestRepository;
import com.ghanim.pos.repository.ProductRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProductEditRequestService {
    private final ProductEditRequestRepository requestRepository;
    private final ProductRepository productRepository;
    private final ProductService productService;
    private final ObjectMapper objectMapper;

    @Transactional
    public ProductEditRequest submit(Long productId, ProductRequest proposed, String requestedBy) {
        Product product = productRepository.findById(productId)
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + productId));
        if (requestRepository.existsByProductIdAndStatus(productId, "PENDING")) {
            throw new IllegalArgumentException("There is already a pending edit request for this product");
        }
        return requestRepository.save(ProductEditRequest.builder()
                .productId(productId)
                .productName(product.getName())
                .currentData(write(currentSnapshot(product)))
                .proposedData(write(proposed))
                .requestedBy(requestedBy)
                .status("PENDING")
                .build());
    }

    @Transactional(readOnly = true)
    public List<ProductEditRequest> getPending() {
        return requestRepository.findByStatusOrderByRequestedAtDesc("PENDING");
    }

    @Transactional
    public ProductEditRequest approve(Long id, String reviewedBy) {
        ProductEditRequest request = getPendingRequest(id);
        Product product = productRepository.findById(request.getProductId())
                .orElseThrow(() -> new ResourceNotFoundException("Product not found: " + request.getProductId()));
        if (!request.getCurrentData().equals(write(currentSnapshot(product)))) {
            throw new IllegalArgumentException("This product changed after the request was submitted. Ask the cashier to submit it again.");
        }
        try {
            ProductRequest proposed = objectMapper.readValue(request.getProposedData(), ProductRequest.class);
            productService.update(request.getProductId(), proposed);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not read the proposed product changes", e);
        }
        request.setStatus("APPROVED");
        request.setReviewedBy(reviewedBy);
        request.setReviewedAt(LocalDateTime.now());
        return requestRepository.save(request);
    }

    @Transactional
    public ProductEditRequest reject(Long id, String reviewedBy, String note) {
        ProductEditRequest request = getPendingRequest(id);
        request.setStatus("REJECTED");
        request.setReviewedBy(reviewedBy);
        request.setReviewNote(note);
        request.setReviewedAt(LocalDateTime.now());
        return requestRepository.save(request);
    }

    private ProductEditRequest getPendingRequest(Long id) {
        ProductEditRequest request = requestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("Product edit request not found: " + id));
        if (!"PENDING".equals(request.getStatus())) {
            throw new IllegalArgumentException("This product edit request has already been reviewed");
        }
        return request;
    }

    private Map<String, Object> currentSnapshot(Product product) {
        Map<String, Object> current = new LinkedHashMap<>();
        current.put("name", product.getName());
        current.put("description", product.getDescription());
        current.put("retailPrice", product.getRetailPrice());
        current.put("wholesalePrice", product.getWholesalePrice());
        current.put("costPrice", product.getCostPrice());
        current.put("shopCode", product.getShopCode());
        current.put("labelName", product.getLabelName());
        current.put("barcode", product.getBarcode());
        current.put("unit", product.getUnit());
        current.put("minWholesaleQty", product.getMinWholesaleQty());
        current.put("minStockAlert", product.getMinStockAlert());
        current.put("categoryId", product.getCategory() == null ? null : product.getCategory().getId());
        current.put("supplierId", product.getSupplier() == null ? null : product.getSupplier().getId());
        current.put("productSource", product.getProductSource());
        current.put("fulfillmentSource", product.getFulfillmentSource());
        current.put("showOnline", product.isShowOnline());
        current.put("showInPos", product.isShowInPos());
        current.put("onlinePrice", product.getOnlinePrice());
        current.put("imageUrl", product.getImageUrl());
        return current;
    }

    private String write(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Could not store product edit request", e);
        }
    }
}
