package com.ghanim.pos.service;

import com.ghanim.pos.entity.Product;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.*;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.math.BigDecimal;
import java.util.*;

@Service
@RequiredArgsConstructor
@Slf4j
public class EcommerceSyncService {

    private final RestTemplate restTemplate;

    @Value("${ecommerce.sync.url}")
    private String syncUrl;

    @Value("${ecommerce.sync.api-key}")
    private String apiKey;

    private static final Set<String> VALID_SLUGS = Set.of(
            "kitchenware", "aluminium", "plastic", "gift-items", "umbrellas", "lighting", "general"
    );

    public void sync(Product product, BigDecimal shopStock) {
        try {
            Map<String, Object> payload = buildPayload(product, shopStock);
            if (payload == null) return;

            HttpHeaders headers = new HttpHeaders();
            headers.set("X-Sync-Api-Key", apiKey);
            headers.setContentType(MediaType.APPLICATION_JSON);

            ResponseEntity<Map> response = restTemplate.postForEntity(
                    syncUrl, new HttpEntity<>(payload, headers), Map.class);

            log.info("Ecommerce sync product {}: action={}",
                    product.getId(),
                    response.getBody() != null ? response.getBody().get("action") : "unknown");

        } catch (Exception e) {
            log.error("Ecommerce sync failed for product {}: {}", product.getId(), e.getMessage());
        }
    }

    private Map<String, Object> buildPayload(Product product, BigDecimal shopStock) {
        String posProductId = String.valueOf(product.getId());

        if (!product.isShowOnline()) {
            return Map.of("posProductId", posProductId, "showOnline", false);
        }

        if (product.getCategory() == null || product.getCategory().getEcommerceSlug() == null) {
            log.warn("Skipping sync for product {} — category '{}' has no ecommerceSlug set",
                    posProductId,
                    product.getCategory() != null ? product.getCategory().getName() : "none");
            return null;
        }

        String slug = product.getCategory().getEcommerceSlug();
        if (!VALID_SLUGS.contains(slug)) {
            log.warn("Skipping sync for product {} — ecommerceSlug '{}' is not a known slug",
                    posProductId, slug);
            return null;
        }

        Map<String, Object> payload = new LinkedHashMap<>();
        payload.put("posProductId", posProductId);
        payload.put("name", product.getName());
        payload.put("description", product.getDescription());
        payload.put("specifications", product.getSpecifications());
        payload.put("retailPrice", product.getRetailPrice());
        payload.put("wholesalePrice", product.getWholesalePrice());
        payload.put("costPrice", product.getCostPrice());
        payload.put("stock", shopStock);
        payload.put("emoji", product.getEmoji());
        payload.put("categorySlug", slug);
        payload.put("imageUrls", product.getImageUrl() != null
                ? List.of(product.getImageUrl()) : List.of());
        payload.put("badge", product.getBadge() != null ? product.getBadge().name() : null);
        payload.put("showOnline", true);
        return payload;
    }
}
